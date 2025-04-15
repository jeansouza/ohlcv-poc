/**
 * Trade Model
 * 
 * Represents a financial trade with symbol, side, price, amount, and timestamp.
 */

/**
 * Enum representing the side of a trade (buy or sell)
 */
export enum TradeSide {
  BUY = 'buy',
  SELL = 'sell',
}

/**
 * Interface representing a trade
 */
export interface Trade {
  /**
   * The stock symbol (e.g., AAPL, MSFT)
   */
  symbol: string;

  /**
   * The side of the trade (buy or sell)
   */
  side: TradeSide;

  /**
   * The price of the trade
   */
  price: number;

  /**
   * The amount/volume of the trade
   */
  amount: number;

  /**
   * The timestamp of when the trade occurred
   */
  timestamp: Date;
}

/**
 * Factory function to create a new Trade object
 * 
 * @param symbol - The stock symbol
 * @param side - The side of the trade (buy or sell)
 * @param price - The price of the trade
 * @param amount - The amount/volume of the trade
 * @param timestamp - The timestamp of when the trade occurred
 * @returns A new Trade object
 */
export function createTrade(
  symbol: string,
  side: TradeSide,
  price: number,
  amount: number,
  timestamp: Date,
): Trade {
  // Validate inputs
  if (!symbol || symbol.trim() === '') {
    throw new Error('Symbol is required');
  }

  if (price <= 0) {
    throw new Error('Price must be greater than zero');
  }

  if (amount <= 0) {
    throw new Error('Amount must be greater than zero');
  }

  if (!(timestamp instanceof Date) || isNaN(timestamp.getTime())) {
    throw new Error('Valid timestamp is required');
  }

  return {
    symbol,
    side,
    price,
    amount,
    timestamp,
  };
}

/**
 * Converts a Trade object to a string representation
 * 
 * @param trade - The trade to convert
 * @returns A string representation of the trade
 */
export function tradeToString(trade: Trade): string {
  return `${trade.timestamp.toISOString()} | ${trade.symbol} | ${trade.side} | ${trade.price} | ${trade.amount}`;
}
