import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { InfluxDBRepository, createInfluxDBRepository } from '../../../src/repositories/influxdb.repository';
import { Trade, TradeSide } from '../../../src/models/trade.model';
import { InfluxDBConfig } from '../../../src/config/config';

describe('InfluxDB Repository Integration Tests', () => {
  let container: StartedTestContainer;
  let repository: InfluxDBRepository;
  let config: InfluxDBConfig;
  
  // These tests can take some time to start the container
  jest.setTimeout(60000);

  beforeAll(async () => {
    // Start InfluxDB container
    container = await new GenericContainer('influxdb:2.7')
      .withExposedPorts(8086)
      .withEnvironment({
        DOCKER_INFLUXDB_INIT_MODE: 'setup',
        DOCKER_INFLUXDB_INIT_USERNAME: 'admin',
        DOCKER_INFLUXDB_INIT_PASSWORD: 'password123',
        DOCKER_INFLUXDB_INIT_ORG: 'test-org',
        DOCKER_INFLUXDB_INIT_BUCKET: 'test-bucket',
        DOCKER_INFLUXDB_INIT_ADMIN_TOKEN: 'test-token',
      })
      .withWaitStrategy(Wait.forLogMessage('Listening'))
      .start();

    // Configure repository with container connection details
    const mappedPort = container.getMappedPort(8086);
    config = {
      url: `http://localhost:${mappedPort}`,
      token: 'test-token',
      org: 'test-org',
      bucket: 'test-bucket',
    };

    // Create repository
    repository = createInfluxDBRepository(config);
  });

  afterAll(async () => {
    // Close repository connection
    await repository.close();
    
    // Stop container
    if (container) {
      await container.stop();
    }
  });

  it('should write trades to InfluxDB', async () => {
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

    // Act & Assert
    // If this doesn't throw an error, we consider it a success
    // In a real-world scenario, we would query the data back and verify it
    await expect(repository.writeTrades(trades)).resolves.not.toThrow();
  });

  it('should handle writing a large batch of trades', async () => {
    // Arrange
    const trades: Trade[] = [];
    const batchSize = 1000;
    
    // Generate a batch of trades
    for (let i = 0; i < batchSize; i++) {
      trades.push({
        symbol: i % 2 === 0 ? 'AAPL' : 'MSFT',
        side: i % 2 === 0 ? TradeSide.BUY : TradeSide.SELL,
        price: 100 + (i % 100),
        amount: 10 + (i % 90),
        timestamp: new Date(Date.now() - i * 1000), // Spread over the last batchSize seconds
      });
    }

    // Act & Assert
    // If this doesn't throw an error, we consider it a success
    await expect(repository.writeTrades(trades)).resolves.not.toThrow();
  });
});
