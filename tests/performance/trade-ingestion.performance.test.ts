/**
 * Trade Ingestion Performance Tests
 * 
 * Tests the performance of the trade ingestion process with different batch sizes.
 */

import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { TradeGeneratorService, createTradeGeneratorService } from '../../src/services/trade-generator.service';
import { InfluxDBRepository, createInfluxDBRepository } from '../../src/repositories/influxdb.repository';
import { TradeIngestionService, createTradeIngestionService, ProgressData } from '../../src/services/trade-ingestion.service';
import { InfluxDBConfig, TradeGenerationConfig } from '../../src/config/config';

describe('Trade Ingestion Performance Tests', () => {
  let container: StartedTestContainer;
  let influxDBRepository: InfluxDBRepository;
  let tradeGenerator: TradeGeneratorService;
  let tradeIngestionService: TradeIngestionService;
  let influxDBConfig: InfluxDBConfig;
  
  // These tests can take some time
  jest.setTimeout(300000); // 5 minutes
  
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
    
    // Configure InfluxDB connection
    const mappedPort = container.getMappedPort(8086);
    influxDBConfig = {
      url: `http://localhost:${mappedPort}`,
      token: 'test-token',
      org: 'test-org',
      bucket: 'test-bucket',
    };
  });
  
  afterAll(async () => {
    // Close repository connection
    if (influxDBRepository) {
      await influxDBRepository.close();
    }
    
    // Stop container
    if (container) {
      await container.stop();
    }
  });
  
  beforeEach(() => {
    // Reset services before each test
    if (influxDBRepository) {
      influxDBRepository.close().catch(console.error);
    }
    
    // Create new repository for each test
    influxDBRepository = createInfluxDBRepository(influxDBConfig);
  });
  
  /**
   * Helper function to run a performance test with a specific batch size
   */
  async function runPerformanceTest(totalTrades: number, batchSize: number): Promise<PerformanceResult> {
    // Configure trade generator
    const tradeGenerationConfig: TradeGenerationConfig = {
      totalTrades,
      batchSize,
      startDate: new Date('2024-01-01T00:00:00Z'),
      endDate: new Date('2024-12-31T23:59:59Z'),
      symbols: ['AAPL', 'MSFT', 'AMZN', 'GOOGL', 'META'],
    };
    
    tradeGenerator = createTradeGeneratorService(tradeGenerationConfig);
    tradeIngestionService = createTradeIngestionService(tradeGenerator, influxDBRepository);
    
    // Track performance metrics
    let finalProgress: ProgressData | null = null;
    
    // Set up event listeners
    tradeIngestionService.events.on('complete', (progress: ProgressData) => {
      finalProgress = progress;
    });
    
    // Start ingestion and wait for completion
    const startTime = Date.now();
    await tradeIngestionService.startIngestion();
    const endTime = Date.now();
    
    // Calculate performance metrics
    const elapsedMs = endTime - startTime;
    const tradesPerSecond = totalTrades / (elapsedMs / 1000);
    
    // Use a separate variable with explicit type annotation
    const reportedTradesPerSecond: number = finalProgress ? 
      (finalProgress as any).tradesPerSecond || 0 : 0;
    
    return {
      batchSize,
      totalTrades,
      elapsedMs,
      tradesPerSecond,
      reportedTradesPerSecond,
    };
  }
  
  /**
   * Performance result interface
   */
  interface PerformanceResult {
    batchSize: number;
    totalTrades: number;
    elapsedMs: number;
    tradesPerSecond: number;
    reportedTradesPerSecond: number;
  }
  
  /**
   * Test different batch sizes to find the optimal one
   * 
   * Note: This is marked as 'skip' by default because it's a long-running test
   * that's meant to be run manually when needed.
   */
  it.skip('should measure performance with different batch sizes', async () => {
    // Define test parameters
    const totalTrades = 100000; // Use 100k trades for faster testing
    const batchSizes = [100, 500, 1000, 5000, 10000];
    const results = new Array<PerformanceResult>();
    
    // Run tests for each batch size
    for (const batchSize of batchSizes) {
      console.log(`Testing batch size: ${batchSize}`);
      const result = await runPerformanceTest(totalTrades, batchSize);
      results.push(result);
      console.log(`Completed in ${result.elapsedMs}ms (${result.tradesPerSecond.toFixed(2)} trades/sec)`);
      
      // Wait a bit between tests to let the system cool down
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Log results
    console.table(results);
    
    // Find the optimal batch size
    if (results.length === 0) {
      console.log('No results to analyze');
      return;
    }
    
    let optimalResult = results[0];
    for (const result of results) {
      if (result.tradesPerSecond > optimalResult.tradesPerSecond) {
        optimalResult = result;
      }
    }
    
    console.log(`Optimal batch size: ${optimalResult.batchSize} (${optimalResult.tradesPerSecond.toFixed(2)} trades/sec)`);
    
    // This test doesn't have assertions, it's for performance measurement
  });
  
  /**
   * Test a single batch size for regular testing
   */
  it('should achieve reasonable performance with default batch size', async () => {
    // Use a smaller number of trades for regular testing
    const totalTrades = 10000;
    const batchSize = 1000;
    
    const result = await runPerformanceTest(totalTrades, batchSize);
    
    console.log(`Performance test results:
      - Batch size: ${result.batchSize}
      - Total trades: ${result.totalTrades}
      - Elapsed time: ${result.elapsedMs}ms
      - Throughput: ${result.tradesPerSecond.toFixed(2)} trades/sec
    `);
    
    // Assert that performance is reasonable
    // This is a very conservative threshold that should pass on most systems
    expect(result.tradesPerSecond).toBeGreaterThan(100);
  });
});
