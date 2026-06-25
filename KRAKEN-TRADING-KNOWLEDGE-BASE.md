# Kraken Trading Bot - Complete Knowledge Base

## API Authentication

### Signature Format
```
API-Sign = Base64Encode(HMAC-SHA512 of (URI path + SHA256(nonce + POST data)) using Base64Decode(secret))
```

### Implementation Steps
1. Decode API secret from base64
2. Create nonce (timestamp in milliseconds)
3. SHA256 hash of (nonce + POST data)
4. HMAC-SHA512 of (path + SHA256 hash) using decoded secret as key
5. Base64 encode the result

## Trading Requirements

### Minimum Order Sizes
- **BTC/USD**: 0.0001 BTC minimum volume
- **Cost minimum**: 0.5 USD minimum order value
- **Quote currency**: USD (right side of pair)

### Leverage Availability
- **BTC/USD**: Up to 5x leverage (international clients)
- **US clients**: Up to 10x leverage (if ECP certified)
- **Conservative recommendation**: 2x leverage

### Margin Requirements
- **Initial margin**: Minimum collateral to open position
- **Maintenance margin**: 80% of initial margin for margin call
- **Liquidation**: 40% of initial margin triggers auto-liquidation
- **Collateral**: Must hold at least one collateral currency

## Order Types

### Market Orders
- Executes immediately at best available price
- Guaranteed fill, no price guarantee
- Higher slippage in volatile markets

### Limit Orders
- Executes only at specified price or better
- No guarantee of fill
- Lower slippage, better price control

### Conditional Close Orders
- **Stop-loss**: Automatically sell if price drops
- **Take-profit**: Automatically sell if price rises
- Attached to position on fill
- Reduces manual monitoring

### Advanced Order Types
- **Post-only**: Never takes liquidity (cancelled if would match)
- **Reduce-only**: Only decreases position size
- **Iceberg**: Display small portion of total size
- **IOC (Immediate or Cancel)**: Cancel if not filled immediately
- **GTD (Good Till Date)**: Cancel at specific time

## Rate Limits

### Per-Pair Limits
- Rate limits are per currency pair
- Activity on BTC/USD doesn't affect ETH/USD
- Allows multi-pair strategies to operate independently

### Decay-Based Model
- Limit counter increases when placing/canceling orders
- Decays back to zero over time
- Canceling immediately after placing costs more
- Letting orders rest costs nearly nothing
- Rewards genuine liquidity provision

### Best Practices
- Avoid rapid order cancellation
- Let orders rest in the book
- Use conditional closes instead of separate orders
- Implement exponential backoff on rate limit errors

## Trading Strategies

### Momentum Trading
- Use WebSocket v2 ticker feeds for real-time signals
- Historical OHLCV data back to 2013 for major pairs
- Simple signals work better than complex ones
- Infrastructure quality > signal complexity
- Trade-off: market orders (guaranteed fill) vs limit orders (better price)

### RSI Strategy (Example)
- 80/20 overbought/oversold RSI
- 1-minute slope change for trading decisions
- Long when slope turns up from bottom
- Short when slope turns down from top

### SMA Strategy (Example)
- 20-period Simple Moving Average
- Trade on slope changes
- Long when SMA slope turns up
- Short when SMA slope turns up

## Risk Management

### Position Sizing
- Never risk more than 1-2% per trade
- Use stop-loss on every position
- Use take-profit on every position
- Maximum 1-2 positions at a time
- Start small, scale up gradually

### Stop-Loss Strategy
- 2-5% stop-loss for conservative trading
- Place stop-loss immediately on position open
- Use conditional close orders for automation
- Adjust stop-loss as position moves in favor (trailing stop)

### Take-Profit Strategy
- 5-10% take-profit for conservative trading
- Risk-reward ratio of 1:2 or better
- Use conditional close orders for automation
- Scale out of positions at multiple levels

### Leverage Management
- Start with 2x leverage maximum
- Increase only after consistent profitability
- Never use maximum leverage
- Understand liquidation risks
- Monitor margin levels continuously

## API Endpoints

### Trading Endpoints
- `/0/private/AddOrder` - Place new order
- `/0/private/AddOrderBatch` - Place 2-15 orders at once
- `/0/private/CancelOrder` - Cancel open order
- `/0/private/CancelAll` - Cancel all open orders
- `/0/private/OpenOrders` - Get all open orders
- `/0/private/ClosedOrders` - Get historical orders
- `/0/private/QueryOrders` - Get specific order details
- `/0/private/OpenPositions` - Get open margin positions
- `/0/private/TradeBalance` - Get account balance

### Market Data Endpoints
- `/0/public/Ticker` - Get current ticker
- `/0/public/OHLC` - Get OHLCV data
- `/0/public/Depth` - Get order book
- `/0/public/Trades` - Get recent trades
- `/0/public/Spread` - Get current spread

### Account Endpoints
- `/0/private/Balance` - Get account balance
- `/0/private/TradeBalance` - Get trade balance
- `/0/private/Ledgers` - Get account ledger
- `/0/private/TradeHistory` - Get trade history

## Order Lifecycle

### Order States
- **New**: Order accepted but not yet in book
- **Open**: Order live in order book
- **Partially filled**: Some volume filled, remainder open
- **Filled**: Order fully matched
- **Canceled**: Order cancelled by user or system
- **Expired**: Order expired (GTD orders)
- **Rejected**: Order rejected by system

### State Transitions
- New → Open (accepted by engine)
- Open → Partially filled (partial match)
- Partially filled → Filled (full match)
- Open/Partial → Canceled (user/system cancel)
- Open → Expired (time-based)
- New → Rejected (validation failure)

### Observing State
- REST: `OpenOrders` for live, `ClosedOrders`/`QueryOrders` for history
- WebSocket v2: Subscribe to `executions` channel
- WebSocket v1: Subscribe to `openOrders` channel
- FIX: ExecutionReport (MsgType=8)

## Best Practices

### Infrastructure
- Use WebSocket for real-time data
- Use REST for order execution
- Implement proper error handling
- Use exponential backoff on failures
- Log all API calls and responses
- Monitor rate limits continuously

### Order Management
- Use conditional close orders for stop-loss/take-profit
- Avoid rapid order cancellation
- Let orders rest in the book
- Use post-only orders for liquidity provision
- Use reduce-only for position reduction
- Implement order validation before submission

### Risk Management
- Never risk more than 1-2% per trade
- Always use stop-loss orders
- Always use take-profit orders
- Monitor margin levels continuously
- Understand liquidation risks
- Start with small position sizes
- Scale up gradually after profitability

### Testing
- Use Kraken UAT environment for testing
- Test with small amounts first
- Validate order logic thoroughly
- Test error handling paths
- Monitor rate limit behavior
- Backtest strategies on historical data

### Security
- Never commit API credentials
- Use read-only keys for testing
- Rotate API keys regularly
- Use IP whitelisting if available
- Monitor for unauthorized access
- Use separate keys for different environments

## Common Errors

### EOrder:Invalid price
- Price not within valid range
- Too many decimal places
- Check AssetPairs endpoint for precision

### EOrder:Invalid volume
- Volume below minimum
- Too many decimal places
- Check minimum order sizes

### EOrder:Cost minimum not met
- Order value below minimum
- Minimum is 0.5 USD for USD pairs
- Increase order size

### EOrder:Margin position size exceeded
- Position exceeds limit for pair
- Check margin position limits
- Reduce position size

### EOrder:Margin allowance exceeded
- Exceeded margin allowance for currency
- Check margin allowance limits
- Use different quote pair or reduce size

### EOrder:Insufficient funds
- Not enough balance for order
- Check account balance
- Deposit more funds

### EGeneral:Invalid arguments
- Invalid parameters
- Check API documentation
- Validate parameters before submission

### EService:Unavailable
- Service temporarily unavailable
- Implement retry logic
- Wait and retry

## Success Metrics

### Key Metrics to Track
- Win rate (percentage of profitable trades)
- Average profit per trade
- Average loss per trade
- Risk-reward ratio
- Maximum drawdown
- Sharpe ratio
- Total return
- Monthly return
- Volatility

### Optimization Goals
- Win rate > 50%
- Risk-reward ratio > 1.5
- Maximum drawdown < 20%
- Positive Sharpe ratio
- Consistent monthly returns

## Next Steps for Implementation

1. **Check Balance**: Use `/api/trading/balance` to see current funds
2. **Convert Assets**: If no USD, convert available assets to USD
3. **Start Small**: Begin with $10-50 position size
4. **Use Conservative Settings**: 2x leverage, 2% stop-loss, 5% take-profit
5. **Monitor Closely**: Watch first few trades carefully
6. **Scale Gradually**: Increase size only after consistent profitability
7. **Implement Advanced Features**: Add more sophisticated strategies over time

## Risk Warning

**Trading with leverage involves significant risk. You can lose more than your initial investment. Only trade with money you can afford to lose. Past performance does not guarantee future results.**

**This knowledge base is for educational purposes only. Always do your own research and understand the risks before trading.**
