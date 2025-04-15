import { Trade, TradeSide, createTrade, tradeToString } from '../../../src/models/trade.model';

describe('Trade Model', () => {
  describe('createTrade', () => {
    it('should create a valid trade object', () => {
      // Arrange
      const symbol = 'AAPL';
      const side = TradeSide.BUY;
      const price = 150.25;
      const amount = 100;
      const timestamp = new Date('2024-01-15T12:30:45Z');

      // Act
      const trade = createTrade(symbol, side, price, amount, timestamp);

      // Assert
      expect(trade).toEqual({
        symbol,
        side,
        price,
        amount,
        timestamp,
      });
    });

    it('should throw an error if symbol is empty', () => {
      // Arrange
      const symbol = '';
      const side = TradeSide.BUY;
      const price = 150.25;
      const amount = 100;
      const timestamp = new Date('2024-01-15T12:30:45Z');

      // Act & Assert
      expect(() => createTrade(symbol, side, price, amount, timestamp)).toThrow('Symbol is required');
    });

    it('should throw an error if price is zero or negative', () => {
      // Arrange
      const symbol = 'AAPL';
      const side = TradeSide.BUY;
      const price = 0;
      const amount = 100;
      const timestamp = new Date('2024-01-15T12:30:45Z');

      // Act & Assert
      expect(() => createTrade(symbol, side, price, amount, timestamp)).toThrow(
        'Price must be greater than zero'
      );
      expect(() => createTrade(symbol, side, -10, amount, timestamp)).toThrow(
        'Price must be greater than zero'
      );
    });

    it('should throw an error if amount is zero or negative', () => {
      // Arrange
      const symbol = 'AAPL';
      const side = TradeSide.BUY;
      const price = 150.25;
      const amount = 0;
      const timestamp = new Date('2024-01-15T12:30:45Z');

      // Act & Assert
      expect(() => createTrade(symbol, side, price, amount, timestamp)).toThrow(
        'Amount must be greater than zero'
      );
      expect(() => createTrade(symbol, side, price, -10, timestamp)).toThrow(
        'Amount must be greater than zero'
      );
    });

    it('should throw an error if timestamp is invalid', () => {
      // Arrange
      const symbol = 'AAPL';
      const side = TradeSide.BUY;
      const price = 150.25;
      const amount = 100;
      const invalidDate = new Date('invalid-date');

      // Act & Assert
      expect(() => createTrade(symbol, side, price, amount, invalidDate)).toThrow(
        'Valid timestamp is required'
      );
    });
  });

  describe('tradeToString', () => {
    it('should convert a trade to a string representation', () => {
      // Arrange
      const trade: Trade = {
        symbol: 'AAPL',
        side: TradeSide.BUY,
        price: 150.25,
        amount: 100,
        timestamp: new Date('2024-01-15T12:30:45Z'),
      };

      // Act
      const result = tradeToString(trade);

      // Assert
      expect(result).toBe('2024-01-15T12:30:45.000Z | AAPL | buy | 150.25 | 100');
    });
  });
});
