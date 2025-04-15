/**
 * Trade Generator Service
 * 
 * Responsible for generating synthetic trade data for testing and demonstration purposes.
 */

import { Trade, TradeSide, createTrade } from '../models/trade.model';
import { TradeGenerationConfig } from '../config/config';

/**
 * Interface for the trade generator service
 */
export interface TradeGeneratorService {
  /**
   * Generates a batch of trades
   * 
   * @param batchSize - The number of trades to generate
   * @returns An array of generated trades
   */
  generateBatch(batchSize: number): Trade[];

  /**
   * Gets the total number of trades to generate
   * 
   * @returns The total number of trades
   */
  getTotalTrades(): number;

  /**
   * Gets the recommended batch size for optimal performance
   * 
   * @returns The recommended batch size
   */
  getRecommendedBatchSize(): number;
}

/**
 * Implementation of the trade generator service
 */
export class TradeGeneratorServiceImpl implements TradeGeneratorService {
  private readonly config: TradeGenerationConfig;
  private readonly startTimestamp: number;
  private readonly endTimestamp: number;
  private readonly timeRange: number;
  private readonly baselinePrices: Map<string, number>;

  /**
   * Creates a new instance of the trade generator service
   * 
   * @param config - The trade generation configuration
   */
  constructor(config: TradeGenerationConfig) {
    this.config = config;
    this.startTimestamp = config.startDate.getTime();
    this.endTimestamp = config.endDate.getTime();
    this.timeRange = this.endTimestamp - this.startTimestamp;
    this.baselinePrices = this.initializeBaselinePrices();
  }

  /**
   * Initializes baseline prices for each symbol
   * 
   * @returns A map of symbols to baseline prices
   */
  private initializeBaselinePrices(): Map<string, number> {
    const prices = new Map<string, number>();
    
    // Set realistic baseline prices for common stocks
    this.config.symbols.forEach(symbol => {
      // Generate a random price between $50 and $500
      const basePrice = 50 + Math.random() * 450;
      prices.set(symbol, basePrice);
    });
    
    return prices;
  }

  /**
   * Generates a random timestamp within the configured date range
   * 
   * @returns A random timestamp as a Date object
   */
  private generateRandomTimestamp(): Date {
    // Generate a random offset within the time range
    const randomOffset = Math.floor(Math.random() * this.timeRange);
    const timestamp = this.startTimestamp + randomOffset;
    
    // Create a new Date object from the timestamp
    const date = new Date(timestamp);
    
    // Adjust to trading hours (9:30 AM - 4:00 PM ET)
    // Note: This is a simplified approach
    date.setUTCHours(14 + Math.floor(Math.random() * 7)); // 9:30 AM - 4:00 PM ET (14:30 - 21:00 UTC)
    date.setUTCMinutes(Math.floor(Math.random() * 60));
    date.setUTCSeconds(Math.floor(Math.random() * 60));
    date.setUTCMilliseconds(Math.floor(Math.random() * 1000));
    
    return date;
  }

  /**
   * Generates a random price for a symbol based on its baseline price
   * 
   * @param symbol - The stock symbol
   * @returns A random price
   */
  private generateRandomPrice(symbol: string): number {
    const basePrice = this.baselinePrices.get(symbol) || 100;
    
    // Generate a price within ±5% of the baseline price
    const variation = (Math.random() - 0.5) * 0.1; // -5% to +5%
    const price = basePrice * (1 + variation);
    
    // Update the baseline price with a slight random walk
    // This creates more realistic price movements over time
    const drift = (Math.random() - 0.5) * 0.01; // -0.5% to +0.5%
    this.baselinePrices.set(symbol, basePrice * (1 + drift));
    
    return parseFloat(price.toFixed(2));
  }

  /**
   * Generates a random trade amount/volume
   * 
   * @returns A random trade amount
   */
  private generateRandomAmount(): number {
    // Generate a random amount between 1 and 1000
    // Use a power distribution to make smaller trades more common
    const amount = Math.floor(Math.pow(Math.random(), 2) * 1000) + 1;
    return amount;
  }

  /**
   * Generates a batch of trades
   * 
   * @param batchSize - The number of trades to generate
   * @returns An array of generated trades
   */
  public generateBatch(batchSize: number): Trade[] {
    const trades: Trade[] = [];
    
    for (let i = 0; i < batchSize; i++) {
      // Select a random symbol
      const symbolIndex = Math.floor(Math.random() * this.config.symbols.length);
      const symbol = this.config.symbols[symbolIndex];
      
      // Generate random trade data
      const side = Math.random() < 0.5 ? TradeSide.BUY : TradeSide.SELL;
      const price = this.generateRandomPrice(symbol);
      const amount = this.generateRandomAmount();
      const timestamp = this.generateRandomTimestamp();
      
      // Create and add the trade
      const trade = createTrade(symbol, side, price, amount, timestamp);
      trades.push(trade);
    }
    
    return trades;
  }

  /**
   * Gets the total number of trades to generate
   * 
   * @returns The total number of trades
   */
  public getTotalTrades(): number {
    return this.config.totalTrades;
  }

  /**
   * Gets the recommended batch size for optimal performance
   * 
   * @returns The recommended batch size
   */
  public getRecommendedBatchSize(): number {
    return this.config.batchSize;
  }
}

/**
 * Creates a new trade generator service
 * 
 * @param config - The trade generation configuration
 * @returns A new trade generator service
 */
export function createTradeGeneratorService(config: TradeGenerationConfig): TradeGeneratorService {
  return new TradeGeneratorServiceImpl(config);
}
