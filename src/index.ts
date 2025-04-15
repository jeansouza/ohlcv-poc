/**
 * Application Entry Point
 * 
 * Starts the server and handles process signals.
 */

import { startServer } from './server';

/**
 * Main function
 */
async function main(): Promise<void> {
  try {
    // Start the server
    await startServer();
    
    // Handle process signals
    process.on('SIGTERM', () => {
      console.log('SIGTERM signal received: closing HTTP server');
      process.exit(0);
    });
    
    process.on('SIGINT', () => {
      console.log('SIGINT signal received: closing HTTP server');
      process.exit(0);
    });
  } catch (error) {
    console.error('Error starting server:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
