import { TradeGenerationConfig } from '../../../src/config/config';
import { TradeGeneratorService, createTradeGeneratorService } from '../../../src/services/trade-generator.service';
import { Trade, TradeSide } from '../../../src/models/trade.model';

describe('TradeGeneratorService', () => {
  let service: TradeGeneratorService;
  let config: TradeGenerationConfig;

  beforeEach(() => {
    // Arrange
    config = {
      totalTrades: 1000,
      batchSize: 100,
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-12-31T23:59:59Z'),
      symbols: ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META'],
    };
    service = createTradeGeneratorService(config);
  });

  describe('generateBatch', () => {
    it('should generate the specified number of trades', () => {
      // Act
      const batchSize = 50;
      const trades = service.generateBatch(batchSize);

      // Assert
      expect(trades).toHaveLength(batchSize);
    });

    it('should generate trades with valid properties', () => {
      // Act
      const trades = service.generateBatch(10);

      // Assert
      trades.forEach((trade: Trade) => {
        // Symbol should be one of the configured symbols
        expect(config.symbols).toContain(trade.symbol);

        // Side should be either BUY or SELL
        expect([TradeSide.BUY, TradeSide.SELL]).toContain(trade.side);

        // Price should be a positive number
        expect(trade.price).toBeGreaterThan(0);

        // Amount should be a positive integer
        expect(trade.amount).toBeGreaterThan(0);
        expect(Number.isInteger(trade.amount)).toBe(true);

        // Timestamp should be a valid date within the configured range
        expect(trade.timestamp).toBeInstanceOf(Date);
        expect(trade.timestamp.getTime()).toBeGreaterThanOrEqual(config.startDate.getTime());
        expect(trade.timestamp.getTime()).toBeLessThanOrEqual(config.endDate.getTime());
      });
    });

    it('should generate different trades on each call', () => {
      // Act
      const firstBatch = service.generateBatch(10);
      const secondBatch = service.generateBatch(10);

      // Assert
      // Check if at least some trades are different
      // Note: There's a tiny chance this could fail randomly, but it's very unlikely
      let hasDifference = false;
      for (let i = 0; i < 10; i++) {
        if (
          firstBatch[i].symbol !== secondBatch[i].symbol ||
          firstBatch[i].price !== secondBatch[i].price ||
          firstBatch[i].amount !== secondBatch[i].amount ||
          firstBatch[i].timestamp.getTime() !== secondBatch[i].timestamp.getTime()
        ) {
          hasDifference = true;
          break;
        }
      }
      expect(hasDifference).toBe(true);
    });
  });

  describe('getTotalTrades', () => {
    it('should return the configured total trades', () => {
      // Act
      const totalTrades = service.getTotalTrades();

      // Assert
      expect(totalTrades).toBe(config.totalTrades);
    });
  });

  describe('getRecommendedBatchSize', () => {
    it('should return the configured batch size', () => {
      // Act
      const batchSize = service.getRecommendedBatchSize();

      // Assert
      expect(batchSize).toBe(config.batchSize);
    });
  });
});
