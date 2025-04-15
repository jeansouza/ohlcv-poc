/**
 * Trade Ingestion Service
 * 
 * Responsible for generating and writing trade data to InfluxDB.
 */

import { TradeGeneratorService } from './trade-generator.service';
import { InfluxDBRepository } from '../repositories/influxdb.repository';
import { EventEmitter } from 'events';

/**
 * Progress event data
 */
export interface ProgressData {
  /**
   * The number of trades processed so far
   */
  processed: number;
  
  /**
   * The total number of trades to process
   */
  total: number;
  
  /**
   * The percentage of trades processed (0-100)
   */
  percentage: number;
  
  /**
   * The time elapsed in milliseconds
   */
  elapsedMs: number;
  
  /**
   * The estimated time remaining in milliseconds
   */
  estimatedRemainingMs: number;
  
  /**
   * The number of trades processed per second
   */
  tradesPerSecond: number;
}

/**
 * Interface for the trade ingestion service
 */
export interface TradeIngestionService {
  /**
   * Event emitter for progress updates
   */
  readonly events: EventEmitter;
  
  /**
   * Starts the ingestion process
   * 
   * @returns A promise that resolves when the ingestion is complete
   */
  startIngestion(): Promise<void>;
  
  /**
   * Stops the ingestion process
   * 
   * @returns A promise that resolves when the ingestion is stopped
   */
  stopIngestion(): Promise<void>;
}

/**
 * Implementation of the trade ingestion service
 */
export class TradeIngestionServiceImpl implements TradeIngestionService {
  public readonly events: EventEmitter;
  private readonly tradeGenerator: TradeGeneratorService;
  private readonly influxDBRepository: InfluxDBRepository;
  private isStopped: boolean = false;
  
  /**
   * Creates a new instance of the trade ingestion service
   * 
   * @param tradeGenerator - The trade generator service
   * @param influxDBRepository - The InfluxDB repository
   */
  constructor(
    tradeGenerator: TradeGeneratorService,
    influxDBRepository: InfluxDBRepository,
  ) {
    this.tradeGenerator = tradeGenerator;
    this.influxDBRepository = influxDBRepository;
    this.events = new EventEmitter();
  }
  
  /**
   * Starts the ingestion process
   * 
   * @returns A promise that resolves when the ingestion is complete
   */
  public async startIngestion(): Promise<void> {
    this.isStopped = false;
    
    const totalTrades = this.tradeGenerator.getTotalTrades();
    const batchSize = this.tradeGenerator.getRecommendedBatchSize();
    let processedTrades = 0;
    const startTime = Date.now();
    
    try {
      while (processedTrades < totalTrades && !this.isStopped) {
        // Calculate remaining trades
        const remainingTrades = totalTrades - processedTrades;
        const currentBatchSize = Math.min(batchSize, remainingTrades);
        
        // Generate and write batch
        const trades = this.tradeGenerator.generateBatch(currentBatchSize);
        await this.influxDBRepository.writeTrades(trades);
        
        // Update progress
        processedTrades += currentBatchSize;
        
        // Calculate progress metrics
        const elapsedMs = Date.now() - startTime;
        const tradesPerSecond = processedTrades / (elapsedMs / 1000);
        const estimatedRemainingMs = (totalTrades - processedTrades) / tradesPerSecond * 1000;
        const percentage = (processedTrades / totalTrades) * 100;
        
        // Emit progress event
        this.events.emit('progress', {
          processed: processedTrades,
          total: totalTrades,
          percentage,
          elapsedMs,
          estimatedRemainingMs,
          tradesPerSecond,
        } as ProgressData);
      }
      
      // Emit complete event
      if (!this.isStopped) {
        this.events.emit('complete', {
          processed: processedTrades,
          total: totalTrades,
          percentage: 100,
          elapsedMs: Date.now() - startTime,
          estimatedRemainingMs: 0,
          tradesPerSecond: processedTrades / ((Date.now() - startTime) / 1000),
        } as ProgressData);
      }
    } catch (error) {
      // Emit error event
      this.events.emit('error', error);
      throw error;
    }
  }
  
  /**
   * Stops the ingestion process
   * 
   * @returns A promise that resolves when the ingestion is stopped
   */
  public async stopIngestion(): Promise<void> {
    this.isStopped = true;
    this.events.emit('stopped');
    return Promise.resolve();
  }
}

/**
 * Creates a new trade ingestion service
 * 
 * @param tradeGenerator - The trade generator service
 * @param influxDBRepository - The InfluxDB repository
 * @returns A new trade ingestion service
 */
export function createTradeIngestionService(
  tradeGenerator: TradeGeneratorService,
  influxDBRepository: InfluxDBRepository,
): TradeIngestionService {
  return new TradeIngestionServiceImpl(tradeGenerator, influxDBRepository);
}
