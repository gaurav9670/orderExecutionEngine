# Testing Guide

## Running the Application

### Start Dependencies
```bash
docker-compose up -d
```

Wait a few seconds for PostgreSQL and Redis to be ready.

### Start the Server
```bash
npm run dev
```

Server will start on http://localhost:3000

## Testing with WebSocket Client

### Using the included test client:
```bash
npm run test:client
```

This will:
1. Connect to the WebSocket endpoint
2. Submit a limit order
3. Stream all status updates in real-time
4. Close when order completes

### Expected output:
```
✓ WebSocket connected
Sending order: { type: 'limit', tokenIn: 'SOL', tokenOut: 'USDC', ... }

📨 Received: {
  "type": "order_created",
  "orderId": "ord_1732196400123_abc123",
  "status": "pending"
}

📨 Received: {
  "type": "status_update",
  "orderId": "ord_1732196400123_abc123",
  "status": "routing",
  "timestamp": "2025-11-21T10:30:00.000Z"
}

📨 Received: {
  "type": "status_update",
  "orderId": "ord_1732196400123_abc123",
  "status": "building",
  "selectedDex": "meteora",
  "timestamp": "2025-11-21T10:30:01.000Z"
}

📨 Received: {
  "type": "status_update",
  "orderId": "ord_1732196400123_abc123",
  "status": "submitted",
  "timestamp": "2025-11-21T10:30:02.000Z"
}

📨 Received: {
  "type": "status_update",
  "orderId": "ord_1732196400123_abc123",
  "status": "confirmed",
  "selectedDex": "meteora",
  "executedPrice": 0.87,
  "txHash": "3Zx8F7YnQ...",
  "timestamp": "2025-11-21T10:30:05.000Z"
}

✓ Order completed
✓ Connection closed
```

## Testing with Postman

1. Import `postman_collection.json` into Postman
2. Ensure server is running
3. Test the endpoints:
   - Health Check
   - Submit Order (Note: Postman WebSocket support is limited)
   - Get Order Status
   - List Orders
   - Queue Metrics

## Testing Multiple Concurrent Orders

Create a test script to submit multiple orders:

```bash
# In separate terminals, run:
npm run test:client  # Terminal 1
npm run test:client  # Terminal 2
npm run test:client  # Terminal 3
```

Watch the logs to see concurrent processing.

## Testing with cURL

### Submit an order:
```bash
# Note: cURL doesn't support WebSocket upgrade well
# Use the test client or a WebSocket library instead
```

### Get order status:
```bash
curl http://localhost:3000/api/orders/ord_1234567890_abc123
```

### List all orders:
```bash
curl http://localhost:3000/api/orders?limit=10
```

### Check queue metrics:
```bash
curl http://localhost:3000/api/queue/metrics
```

## Running Tests

### All tests:
```bash
npm test
```

### Watch mode:
```bash
npm run test:watch
```

### Specific test file:
```bash
npm test -- dex-router.service.test.ts
```

## Testing Limit Order Behavior

### Test Case 1: Order executes immediately
Submit order with limit price below market:
```json
{
  "type": "limit",
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 100,
  "limitPrice": 0.50
}
```
Expected: Executes on first attempt

### Test Case 2: Order retries then executes
Submit order with limit price near market:
```json
{
  "type": "limit",
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 100,
  "limitPrice": 0.95
}
```
Expected: May retry 1-2 times before execution

### Test Case 3: Order fails after retries
Submit order with limit price above market:
```json
{
  "type": "limit",
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 100,
  "limitPrice": 1.50
}
```
Expected: Fails after 3 retry attempts

## Monitoring Logs

Server logs show:
- Order creation
- DEX routing decisions
- Price comparisons
- Retry attempts
- Transaction confirmations

Example log output:
```
[INFO] Order created, WebSocket connected {"orderId":"ord_123..."}
[INFO] Processing order {"orderId":"ord_123...","attempt":1}
[DEBUG] Raydium quote fetched {"price":0.87,"estimatedOutput":86.74}
[DEBUG] Meteora quote fetched {"price":0.88,"estimatedOutput":87.82}
[INFO] DEX routing decision made {"raydiumOutput":86.74,"meteoraOutput":87.82,"selectedDex":"meteora"}
[INFO] Swap executed successfully {"dex":"meteora","txHash":"3Zx8F..."}
[INFO] Order executed successfully {"orderId":"ord_123...","txHash":"3Zx8F..."}
```

## Troubleshooting

### Database connection errors
- Ensure Docker containers are running: `docker-compose ps`
- Check logs: `docker-compose logs postgres`

### Redis connection errors
- Verify Redis is running: `docker-compose logs redis`
- Test connection: `redis-cli ping`

### Orders stuck in pending
- Check worker is running (should start with server)
- Check queue metrics: `curl http://localhost:3000/api/queue/metrics`

### WebSocket connection fails
- Ensure you're using WebSocket client, not HTTP client
- Check server logs for errors
- Verify endpoint is `/api/orders/execute`

## Clean Up

### Stop the server:
```
Ctrl+C in the terminal running `npm run dev`
```

### Stop Docker containers:
```bash
docker-compose down
```

### Remove all data:
```bash
docker-compose down -v
```

This removes all database and Redis data.
