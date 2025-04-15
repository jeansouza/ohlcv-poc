/**
 * InfluxDB Repository
 * 
 * Responsible for writing trade data to InfluxDB.
 */

import {
  InfluxDB,
  Point,
  WriteApi,
  ClientOptions,
  WriteOptions,
} from '@influxdata/influxdb-client';
import { Trade } from '../models/trade.model';
import { InfluxDBConfig } from '../config/config';

/**
 * Interface for the InfluxDB repository
 */
export interface InfluxDBRepository {
  /**
   * Writes a batch of trades to InfluxDB
   * 
   * @param trades - The trades to write
   * @returns A promise that resolves when the write is complete
   */
  writeTrades(trades: Trade[]): Promise<void>;

  /**
   * Closes the connection to InfluxDB
   * 
   * @returns A promise that resolves when the connection is closed
   */
  close(): Promise<void>;
}

/**
 * Implementation of the InfluxDB repository
 */
export class InfluxDBRepositoryImpl implements InfluxDBRepository {
  private readonly client: InfluxDB;
  private readonly writeApi: WriteApi;
  private readonly org: string;
  private readonly bucket: string;

  /**
   * Creates a new instance of the InfluxDB repository
   * 
   * @param config - The InfluxDB configuration
   */
  constructor(config: InfluxDBConfig) {
    const clientOptions: ClientOptions = {
      url: config.url,
      token: config.token,
    };

    // Configure write options with default values
    const writeOptions: Partial<WriteOptions> = {
      batchSize: 5000, // Points to send at once
      flushInterval: 5000, // Flush interval in ms
      maxBufferLines: 10000, // Max buffer size
      maxRetries: 3, // Max retries on write failure
      maxRetryDelay: 15000, // Max retry delay in ms
      minRetryDelay: 1000, // Min retry delay in ms
      retryJitter: 1000, // Retry jitter in ms
    };

    this.client = new InfluxDB(clientOptions);
    this.org = config.org;
    this.bucket = config.bucket;
    this.writeApi = this.client.getWriteApi(this.org, this.bucket, 'ms', writeOptions);
  }

  /**
   * Converts a trade to an InfluxDB point
   * 
   * @param trade - The trade to convert
   * @returns An InfluxDB point
   */
  private tradeToPoint(trade: Trade): Point {
    const point = new Point('trade')
      .tag('symbol', trade.symbol)
      .tag('side', trade.side)
      .floatField('price', trade.price)
      .intField('amount', trade.amount)
      .timestamp(trade.timestamp);

    return point;
  }

  /**
   * Writes a batch of trades to InfluxDB
   * 
   * @param trades - The trades to write
   * @returns A promise that resolves when the write is complete
   */
  public async writeTrades(trades: Trade[]): Promise<void> {
    // Convert trades to points
    const points = trades.map(trade => this.tradeToPoint(trade));

    // Write points to InfluxDB
    points.forEach(point => this.writeApi.writePoint(point));

    // Flush the buffer
    await this.writeApi.flush();
  }

  /**
   * Closes the connection to InfluxDB
   * 
   * @returns A promise that resolves when the connection is closed
   */
  public async close(): Promise<void> {
    await this.writeApi.close();
  }
}

/**
 * Creates a new InfluxDB repository
 * 
 * @param config - The InfluxDB configuration
 * @returns A new InfluxDB repository
 */
export function createInfluxDBRepository(config: InfluxDBConfig): InfluxDBRepository {
  return new InfluxDBRepositoryImpl(config);
}
