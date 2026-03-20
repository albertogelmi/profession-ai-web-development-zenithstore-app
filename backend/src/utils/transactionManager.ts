import { DataSource, EntityManager } from "typeorm";
import { AppDataSource } from "../config/database";

/**
 * Utility class for managing shared transactions across multiple repositories
 * This ensures that operations spanning multiple repositories (OrderRepository + ProductRepository)
 * are executed atomically - either all succeed or all are rolled back
 */
export class TransactionManager {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = AppDataSource;
  }

  /**
   * Execute operations within a single shared transaction
   * All repositories that receive the EntityManager will participate in the same transaction
   * @param operation Function that receives EntityManager and returns a Promise
   * @returns Promise with the result of the operation
   * @throws Error if any operation fails, triggering automatic rollback
   */
  async withTransaction<T>(
    operation: (manager: EntityManager) => Promise<T>
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();

    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Execute all operations within the same transaction
      const result = await operation(queryRunner.manager);

      // If we reach here, all operations succeeded - commit the transaction
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      // Any error triggers rollback of ALL operations across ALL repositories
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Always cleanup the query runner
      await queryRunner.release();
    }
  }
}
