import { TradeIngestionService, TradeIngestionServiceImpl, ProgressData } from '../../../src/services/trade-ingestion.service';
import { TradeGeneratorService } from '../../../src/services/trade-generator.service';
import { InfluxDBRepository } from '../../../src/repositories/influxdb.repository';
import { Trade, TradeSide } from '../../../src/models/trade.model';
import { EventEmitter } from 'events';

// Mock dependencies
const mockTradeGenerator: jest.Mocked<TradeGeneratorService> = {
  generateBatch: jest.fn(),
  getTotalTrades: jest.fn(),
  getRecommendedBatchSize: jest.fn(),
};

const mockInfluxDBRepository: jest.Mocked<InfluxDBRepository> = {
  writeTrades: jest.fn(),
  close: jest.fn(),
};

describe('TradeIngestionService', () => {
  let service: TradeIngestionService;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Create sample trades for testing
    const sampleTrades: Trade[] = [
      {
        symbol: 'AAPL',
        side: TradeSide.BUY,
        price: 150.25,
        amount: 100,
        timestamp: new Date('2024-01-15T12:30:45Z'),
      },
      {
        symbol: 'MSFT',
        side: TradeSide.SELL,
        price: 350.75,
        amount: 50,
        timestamp: new Date('2024-01-15T12:31:15Z'),
      },
    ];
    
    // Configure mocks
    mockTradeGenerator.getTotalTrades.mockReturnValue(100);
    mockTradeGenerator.getRecommendedBatchSize.mockReturnValue(10);
    mockTradeGenerator.generateBatch.mockReturnValue(sampleTrades);
    mockInfluxDBRepository.writeTrades.mockResolvedValue();
    
    // Create service
    service = new TradeIngestionServiceImpl(
      mockTradeGenerator,
      mockInfluxDBRepository,
    );
  });
  
  describe('startIngestion', () => {
    it('should generate and write trades in batches', async () => {
      // Arrange
      const totalTrades = 100;
      const batchSize = 10;
      const expectedBatches = totalTrades / batchSize;
      
      // Act
      await service.startIngestion();
      
      // Assert
      expect(mockTradeGenerator.getTotalTrades).toHaveBeenCalledTimes(1);
      expect(mockTradeGenerator.getRecommendedBatchSize).toHaveBeenCalledTimes(1);
      expect(mockTradeGenerator.generateBatch).toHaveBeenCalledTimes(expectedBatches);
      expect(mockInfluxDBRepository.writeTrades).toHaveBeenCalledTimes(expectedBatches);
    });
    
    it('should emit progress events', async () => {
      // Arrange
      const progressHandler = jest.fn();
      service.events.on('progress', progressHandler);
      
      // Act
      await service.startIngestion();
      
      // Assert
      expect(progressHandler).toHaveBeenCalledTimes(10); // 10 batches = 10 progress events
      
      // Verify first progress event
      const firstProgress = progressHandler.mock.calls[0][0] as ProgressData;
      expect(firstProgress.processed).toBe(10);
      expect(firstProgress.total).toBe(100);
      expect(firstProgress.percentage).toBe(10);
    });
    
    it('should emit complete event when finished', async () => {
      // Arrange
      const completeHandler = jest.fn();
      service.events.on('complete', completeHandler);
      
      // Act
      await service.startIngestion();
      
      // Assert
      expect(completeHandler).toHaveBeenCalledTimes(1);
      
      // Verify complete event
      const completeProgress = completeHandler.mock.calls[0][0] as ProgressData;
      expect(completeProgress.processed).toBe(100);
      expect(completeProgress.total).toBe(100);
      expect(completeProgress.percentage).toBe(100);
      expect(completeProgress.estimatedRemainingMs).toBe(0);
    });
    
    it('should handle errors and emit error event', async () => {
      // Arrange
      const error = new Error('Test error');
      mockInfluxDBRepository.writeTrades.mockRejectedValueOnce(error);
      
      const errorHandler = jest.fn();
      service.events.on('error', errorHandler);
      
      // Act & Assert
      await expect(service.startIngestion()).rejects.toThrow('Test error');
      expect(errorHandler).toHaveBeenCalledWith(error);
    });
  });
  
  describe('stopIngestion', () => {
    it('should stop the ingestion process', async () => {
      // Arrange
      // Make startIngestion run indefinitely by setting a very large total
      mockTradeGenerator.getTotalTrades.mockReturnValue(1000000);
      
      const stoppedHandler = jest.fn();
      service.events.on('stopped', stoppedHandler);
      
      // Act
      // Start ingestion in the background
      const ingestionPromise = service.startIngestion();
      
      // Stop it after a short delay
      setTimeout(async () => {
        await service.stopIngestion();
      }, 10);
      
      // Wait for ingestion to complete (it should complete early due to stopping)
      await ingestionPromise;
      
      // Assert
      expect(stoppedHandler).toHaveBeenCalled();
      
      // Verify that we didn't process all trades
      const generateBatchCalls = mockTradeGenerator.generateBatch.mock.calls.length;
      expect(generateBatchCalls).toBeLessThan(1000000 / 10); // Less than total batches
    });
  });
});
