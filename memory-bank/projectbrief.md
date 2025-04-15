# Project Brief: OHLCV-POC

## Overview
This project is a proof of concept (POC) for writing large volumes of trade data to a time series database (InfluxDB). The system will generate and store 300 million trade records spread across the year 2024.

## Core Requirements

1. **Technology Stack**:
   - Node.js with TypeScript
   - Fastify for API framework
   - InfluxDB for time series data storage

2. **Data Requirements**:
   - Generate 300 million trade records
   - Each trade record contains: symbol, side, price, amount, timestamp
   - Data should be distributed across the year 2024
   - Use common stock symbols for the data

3. **Quality Requirements**:
   - 100% test coverage
   - Unit tests for all components
   - Integration tests for database interactions
   - End-to-end tests for the complete workflow

4. **Documentation Requirements**:
   - Comprehensive documentation of all components
   - Setup and installation instructions
   - API documentation
   - Performance metrics and benchmarks

## Project Goals
- Create a simple, concise implementation without over-engineering
- Demonstrate efficient bulk writing to InfluxDB
- Establish patterns for time series data management
- Provide a foundation for future time series data applications

## Non-Goals
- Complex trading logic or algorithms
- Real-time data processing
- User interface or visualization
- Multiple data sources or data types
