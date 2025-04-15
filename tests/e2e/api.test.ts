import { FastifyInstance } from 'fastify';
import { createServer } from '../../src/server';
import { config } from '../../src/config/config';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';

describe('API End-to-End Tests', () => {
  let server: FastifyInstance;
  let container: StartedTestContainer;
  
  // These tests can take some time to start the container
  jest.setTimeout(60000);
  
  beforeAll(async () => {
    // Override config for testing
    // Use a smaller number of trades for faster testing
    config.tradeGeneration.totalTrades = 100;
    config.tradeGeneration.batchSize = 10;
    
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
    config.influxDB.url = `http://localhost:${mappedPort}`;
    config.influxDB.token = 'test-token';
    config.influxDB.org = 'test-org';
    config.influxDB.bucket = 'test-bucket';
    
    // Create server
    server = await createServer();
  });
  
  afterAll(async () => {
    // Close server
    await server.close();
    
    // Stop container
    if (container) {
      await container.stop();
    }
  });
  
  describe('GET /api/config', () => {
    it('should return the configuration', async () => {
      // Act
      const response = await server.inject({
        method: 'GET',
        url: '/api/config',
      });
      
      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('totalTrades', 100);
      expect(body).toHaveProperty('batchSize', 10);
    });
  });
  
  describe('GET /api/status', () => {
    it('should return idle status initially', async () => {
      // Act
      const response = await server.inject({
        method: 'GET',
        url: '/api/status',
      });
      
      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('status', 'idle');
    });
  });
  
  describe('POST /api/start', () => {
    it('should start the ingestion process', async () => {
      // Act
      const response = await server.inject({
        method: 'POST',
        url: '/api/start',
      });
      
      // Assert
      expect(response.statusCode).toBe(202);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('message', 'Trade ingestion started');
      
      // Check status
      const statusResponse = await server.inject({
        method: 'GET',
        url: '/api/status',
      });
      
      const statusBody = JSON.parse(statusResponse.body);
      expect(statusBody).toHaveProperty('status', 'running');
      
      // Wait for completion or progress
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedStatusResponse = await server.inject({
        method: 'GET',
        url: '/api/status',
      });
      
      const updatedStatusBody = JSON.parse(updatedStatusResponse.body);
      
      // It might be completed or still running, both are valid
      expect(['running', 'completed']).toContain(updatedStatusBody.status);
      expect(updatedStatusBody).toHaveProperty('progress');
      expect(updatedStatusBody.progress).toHaveProperty('processed');
      expect(updatedStatusBody.progress).toHaveProperty('total');
      expect(updatedStatusBody.progress).toHaveProperty('percentage');
    });
    
    it('should return 409 if already running', async () => {
      // Arrange - ensure it's running
      const statusResponse = await server.inject({
        method: 'GET',
        url: '/api/status',
      });
      
      const statusBody = JSON.parse(statusResponse.body);
      
      // Skip test if not running
      if (statusBody.status !== 'running') {
        return;
      }
      
      // Act
      const response = await server.inject({
        method: 'POST',
        url: '/api/start',
      });
      
      // Assert
      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error', 'Trade ingestion is already running');
    });
  });
  
  describe('POST /api/stop', () => {
    it('should stop the ingestion process if running', async () => {
      // Arrange - check if running
      const statusResponse = await server.inject({
        method: 'GET',
        url: '/api/status',
      });
      
      const statusBody = JSON.parse(statusResponse.body);
      
      // Skip test if not running
      if (statusBody.status !== 'running') {
        return;
      }
      
      // Act
      const response = await server.inject({
        method: 'POST',
        url: '/api/stop',
      });
      
      // Assert
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('message', 'Trade ingestion stopped');
    });
    
    it('should return 409 if not running', async () => {
      // Arrange - ensure it's not running
      // First stop it if it's running
      const statusResponse = await server.inject({
        method: 'GET',
        url: '/api/status',
      });
      
      const statusBody = JSON.parse(statusResponse.body);
      
      if (statusBody.status === 'running') {
        await server.inject({
          method: 'POST',
          url: '/api/stop',
        });
      }
      
      // Act
      const response = await server.inject({
        method: 'POST',
        url: '/api/stop',
      });
      
      // Assert
      expect(response.statusCode).toBe(409);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('error', 'Trade ingestion is not running');
    });
  });
});
