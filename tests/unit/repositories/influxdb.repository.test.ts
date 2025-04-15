import { InfluxDBRepository, InfluxDBRepositoryImpl } from '../../../src/repositories/influxdb.repository';
import { Trade, TradeSide } from '../../../src/models/trade.model';
import { InfluxDBConfig } from '../../../src/config/config';
import { InfluxDB, Point, WriteApi } from '@influxdata/influxdb-client';

// Mock the InfluxDB client
jest.mock('@influxdata/influxdb-client', () => {
  // Create mock classes
  const MockPoint = jest.fn().mockImplementation(() => ({
    tag: jest.fn().mockReturnThis(),
    floatField: jest.fn().mockReturnThis(),
    intField: jest.fn().mockReturnThis(),
    timestamp: jest.fn().mockReturnThis(),
  }));

  const MockWriteApi = jest.fn().mockImplementation(() => ({
    writePoint: jest.fn(),
    flush: jest.fn().mockResolvedValue(undefined),
    close: jest.fn().mockResolvedValue(undefined),
  }));

  const MockInfluxDB = jest.fn().mockImplementation(() => ({
    getWriteApi: jest.fn().mockReturnValue(new MockWriteApi()),
  }));

  return {
    InfluxDB: MockInfluxDB,
    Point: MockPoint,
    WriteApi: MockWriteApi,
  };
});

describe('InfluxDBRepository', () => {
  let repository: InfluxDBRepository;
  let mockInfluxDB: jest.Mocked<InfluxDB>;
  let mockWriteApi: jest.Mocked<WriteApi>;
  let config: InfluxDBConfig;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock config
    config = {
      url: 'http://localhost:8086',
      token: 'test-token',
      org: 'test-org',
      bucket: 'test-bucket',
    };

    // Create repository
    repository = new InfluxDBRepositoryImpl(config);

    // Get mock instances
    mockInfluxDB = new InfluxDB({} as any) as jest.Mocked<InfluxDB>;
    mockWriteApi = mockInfluxDB.getWriteApi('', '', 'ms') as jest.Mocked<WriteApi>;
  });

  describe('writeTrades', () => {
    it('should convert trades to points and write them to InfluxDB', async () => {
      // Arrange
      const trades: Trade[] = [
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

      // Act
      await repository.writeTrades(trades);

      // Assert
      // Verify Point constructor was called for each trade
      expect(Point).toHaveBeenCalledTimes(trades.length);

      // Verify writePoint was called for each trade
      expect(mockWriteApi.writePoint).toHaveBeenCalledTimes(trades.length);

      // Verify flush was called
      expect(mockWriteApi.flush).toHaveBeenCalledTimes(1);
    });

    it('should handle empty trades array', async () => {
      // Arrange
      const trades: Trade[] = [];

      // Act
      await repository.writeTrades(trades);

      // Assert
      // Verify Point constructor was not called
      expect(Point).not.toHaveBeenCalled();

      // Verify writePoint was not called
      expect(mockWriteApi.writePoint).not.toHaveBeenCalled();

      // Verify flush was still called
      expect(mockWriteApi.flush).toHaveBeenCalledTimes(1);
    });
  });

  describe('close', () => {
    it('should close the WriteApi', async () => {
      // Act
      await repository.close();

      // Assert
      expect(mockWriteApi.close).toHaveBeenCalledTimes(1);
    });
  });
});
