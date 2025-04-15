/**
 * Server
 * 
 * Sets up the Fastify server with plugins and routes.
 */

import fastify, { FastifyInstance } from 'fastify';
import fastifySwagger from '@fastify/swagger';
import fastifySwaggerUi from '@fastify/swagger-ui';
import { registerRoutes } from './api/routes';
import { config } from './config/config';
import { createTradeGeneratorService } from './services/trade-generator.service';
import { createInfluxDBRepository } from './repositories/influxdb.repository';
import { createTradeIngestionService } from './services/trade-ingestion.service';

/**
 * Creates and configures the Fastify server
 * 
 * @returns A configured Fastify instance
 */
export async function createServer(): Promise<FastifyInstance> {
  // Create Fastify instance
  const server = fastify({
    logger: {
      level: config.logLevel,
      transport: {
        target: 'pino-pretty',
      },
    },
  });

  // Register Swagger
  await server.register(fastifySwagger, {
    swagger: {
      info: {
        title: 'OHLCV-POC API',
        description: 'API for generating and writing trade data to InfluxDB',
        version: '1.0.0',
      },
      host: `localhost:${config.port}`,
      schemes: ['http'],
      consumes: ['application/json'],
      produces: ['application/json'],
      tags: [
        { name: 'status', description: 'Status endpoints' },
        { name: 'ingestion', description: 'Trade ingestion endpoints' },
        { name: 'config', description: 'Configuration endpoints' },
      ],
    },
  });

  // Register Swagger UI
  await server.register(fastifySwaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  });

  // Create services
  const tradeGenerator = createTradeGeneratorService(config.tradeGeneration);
  const influxDBRepository = createInfluxDBRepository(config.influxDB);
  const tradeIngestionService = createTradeIngestionService(
    tradeGenerator,
    influxDBRepository,
  );

  // Register routes
  registerRoutes(server, tradeIngestionService, tradeGenerator, influxDBRepository);

  // Add shutdown hook
  server.addHook('onClose', async () => {
    await influxDBRepository.close();
  });

  return server;
}

/**
 * Starts the server
 * 
 * @returns A promise that resolves when the server is started
 */
export async function startServer(): Promise<void> {
  const server = await createServer();

  try {
    await server.listen({ port: config.port, host: '0.0.0.0' });
    server.log.info(`Server listening on port ${config.port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}
