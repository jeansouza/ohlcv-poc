/**
 * API Routes
 * 
 * Defines the API endpoints for the application.
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TradeIngestionService } from '../services/trade-ingestion.service';
import { TradeGeneratorService } from '../services/trade-generator.service';
import { InfluxDBRepository } from '../repositories/influxdb.repository';

/**
 * Status response
 */
interface StatusResponse {
  status: 'idle' | 'running' | 'completed' | 'error';
  progress?: {
    processed: number;
    total: number;
    percentage: number;
    elapsedMs: number;
    estimatedRemainingMs: number;
    tradesPerSecond: number;
  };
  error?: string;
}

/**
 * Registers the API routes
 * 
 * @param fastify - The Fastify instance
 * @param tradeIngestionService - The trade ingestion service
 * @param tradeGeneratorService - The trade generator service
 * @param influxDBRepository - The InfluxDB repository
 */
export function registerRoutes(
  fastify: FastifyInstance,
  tradeIngestionService: TradeIngestionService,
  tradeGeneratorService: TradeGeneratorService,
  influxDBRepository: InfluxDBRepository,
): void {
  // Track the current status
  let currentStatus: StatusResponse = { status: 'idle' };
  
  // Set up event listeners
  tradeIngestionService.events.on('progress', (progress) => {
    currentStatus = {
      status: 'running',
      progress: {
        processed: progress.processed,
        total: progress.total,
        percentage: progress.percentage,
        elapsedMs: progress.elapsedMs,
        estimatedRemainingMs: progress.estimatedRemainingMs,
        tradesPerSecond: progress.tradesPerSecond,
      },
    };
  });
  
  tradeIngestionService.events.on('complete', (progress) => {
    currentStatus = {
      status: 'completed',
      progress: {
        processed: progress.processed,
        total: progress.total,
        percentage: 100,
        elapsedMs: progress.elapsedMs,
        estimatedRemainingMs: 0,
        tradesPerSecond: progress.tradesPerSecond,
      },
    };
  });
  
  tradeIngestionService.events.on('error', (error) => {
    currentStatus = {
      status: 'error',
      error: error.message,
    };
  });
  
  // Define routes
  
  /**
   * GET /api/status
   * 
   * Returns the current status of the trade ingestion process
   */
  fastify.get('/api/status', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send(currentStatus);
  });
  
  /**
   * POST /api/start
   * 
   * Starts the trade ingestion process
   */
  fastify.post('/api/start', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Check if already running
    if (currentStatus.status === 'running') {
      return reply.status(409).send({
        error: 'Trade ingestion is already running',
      });
    }
    
    // Reset status
    currentStatus = { status: 'running' };
    
    // Start ingestion in the background
    tradeIngestionService.startIngestion().catch((error) => {
      fastify.log.error(error);
    });
    
    return reply.status(202).send({
      message: 'Trade ingestion started',
    });
  });
  
  /**
   * POST /api/stop
   * 
   * Stops the trade ingestion process
   */
  fastify.post('/api/stop', async (_request: FastifyRequest, reply: FastifyReply) => {
    // Check if running
    if (currentStatus.status !== 'running') {
      return reply.status(409).send({
        error: 'Trade ingestion is not running',
      });
    }
    
    // Stop ingestion
    await tradeIngestionService.stopIngestion();
    
    return reply.send({
      message: 'Trade ingestion stopped',
    });
  });
  
  /**
   * GET /api/config
   * 
   * Returns the current configuration
   */
  fastify.get('/api/config', async (_request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({
      totalTrades: tradeGeneratorService.getTotalTrades(),
      batchSize: tradeGeneratorService.getRecommendedBatchSize(),
    });
  });
}
