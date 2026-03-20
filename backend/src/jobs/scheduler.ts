import { CartCleanupJob } from "./CartCleanupJob";

/**
 * Job Scheduler
 * Manages periodic execution of background jobs
 */
export class JobScheduler {
  private cartCleanupJob: CartCleanupJob;
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor() {
    this.cartCleanupJob = new CartCleanupJob();
  }

  /**
   * Start the scheduler
   * Executes cart cleanup at configured interval
   */
  start(): void {
    if (this.isRunning) {
      console.warn("[JobScheduler] Already running");
      return;
    }

    const intervalMinutes = Number(
      process.env.CART_CLEANUP_INTERVAL_MINUTES || 10
    );
    const intervalMs = intervalMinutes * 60 * 1000;

    console.log(
      `[JobScheduler] Starting with interval: ${intervalMinutes} minutes`
    );

    // Execute immediately on start
    this.executeCartCleanup();

    // Schedule periodic execution
    this.intervalId = setInterval(() => {
      this.executeCartCleanup();
    }, intervalMs);

    this.isRunning = true;
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.isRunning) {
      console.warn("[JobScheduler] Not running");
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    console.log("[JobScheduler] Stopped");
  }

  /**
   * Execute cart cleanup job
   */
  private async executeCartCleanup(): Promise<void> {
    try {
      await this.cartCleanupJob.execute();
    } catch (error) {
      console.error("[JobScheduler] Cart cleanup failed:", error);
      // Continue running - don't stop scheduler on error
    }
  }

  /**
   * Check if scheduler is running
   */
  isActive(): boolean {
    return this.isRunning;
  }
}

// Singleton instance
let schedulerInstance: JobScheduler | null = null;

/**
 * Get or create scheduler instance
 */
export function getScheduler(): JobScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new JobScheduler();
  }
  return schedulerInstance;
}
