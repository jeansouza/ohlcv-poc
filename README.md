# OHLCV-POC

High-performance time series database solution for financial market OHLCV data processing and storage.

## Overview

This project is a proof of concept (POC) for writing large volumes of trade data to a time series database (InfluxDB). The system generates and stores 300 million trade records spread across the year 2024.

## Features

- High-performance data ingestion pipeline for trade data
- Efficient batch writing to InfluxDB
- Configurable trade data generation
- Comprehensive test coverage (unit, integration, e2e, performance)
- Detailed performance metrics and benchmarks

## Prerequisites

- Node.js (v18 or later)
- npm (v8 or later)
- Docker and Docker Compose (for running InfluxDB locally)
- Git

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/jeansouza/ohlcv-poc.git
   cd ohlcv-poc
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start InfluxDB using Docker Compose:
   ```bash
   npm run docker:up
   ```

## Usage

### Development

Run the application in development mode:

```bash
npm run dev
```

### Testing

Run all tests:

```bash
npm test
```

Run specific test suites:

```bash
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e         # End-to-end tests
npm run test:performance # Performance tests
```

Check test coverage:

```bash
npm run test:cov
```

### Building

Build the application:

```bash
npm run build
```

Run the built application:

```bash
npm start
```

## Project Structure

- `/src` - Source code
  - `/src/models` - Data models and interfaces
  - `/src/services` - Business logic and services
  - `/src/repositories` - Data access layer
  - `/src/api` - API endpoints and controllers
  - `/src/utils` - Utility functions and helpers
- `/tests` - Test files
  - `/tests/unit` - Unit tests
  - `/tests/integration` - Integration tests
  - `/tests/e2e` - End-to-end tests
  - `/tests/performance` - Performance tests
- `/docs` - Documentation
- `/scripts` - Utility scripts

## Documentation

Detailed documentation is available in the `/docs` directory.

## License

ISC
