import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT!) || 3306,
  username: process.env.DB_USERNAME || 'root',
  password: process.env.DB_PASSWORD || 'password',
  database: process.env.DB_DATABASE || 'mydb',
  synchronize: process.env.SYNC === 'true',
  logging: process.env.LOGGING === 'true',
  entities: process.env.NODE_ENV !== 'development'
    ? ['dist/entities/**/*.js']
    : ['src/entities/**/*.ts'],
  
  // Additional MySQL options
  extra: {
    charset: 'utf8mb4_unicode_ci',
  },
  
  // Connection pool settings
  poolSize: 10,
  
  // Enable BigNumber support for BIGINT columns
  supportBigNumbers: true,
  bigNumberStrings: false,
});