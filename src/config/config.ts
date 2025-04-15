/**
 * Application configuration
 * 
 * This module provides configuration settings for the application,
 * including InfluxDB connection details and trade generation parameters.
 */

export interface InfluxDBConfig {
  url: string;
  token: string;
  org: string;
  bucket: string;
}

export interface TradeGenerationConfig {
  totalTrades: number;
  batchSize: number;
  startDate: Date;
  endDate: Date;
  symbols: string[];
}

export interface AppConfig {
  port: number;
  influxDB: InfluxDBConfig;
  tradeGeneration: TradeGenerationConfig;
  logLevel: string;
}

/**
 * Default configuration values
 * 
 * These values can be overridden by environment variables
 */
export const config: AppConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
  influxDB: {
    url: process.env.INFLUXDB_URL || 'http://localhost:8086',
    token: process.env.INFLUXDB_TOKEN || 'my-super-secret-auth-token',
    org: process.env.INFLUXDB_ORG || 'ohlcv-poc',
    bucket: process.env.INFLUXDB_BUCKET || 'trades',
  },
  tradeGeneration: {
    totalTrades: parseInt(process.env.TOTAL_TRADES || '300000000', 10),
    batchSize: parseInt(process.env.BATCH_SIZE || '10000', 10),
    startDate: new Date(process.env.START_DATE || '2024-01-01T00:00:00Z'),
    endDate: new Date(process.env.END_DATE || '2024-12-31T23:59:59Z'),
    symbols: (process.env.SYMBOLS || 'AAPL,MSFT,AMZN,GOOGL,META').split(','),
  },
  logLevel: process.env.LOG_LEVEL || 'info',
};

export default config;
