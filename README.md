# Order Execution Engine

A limit order execution engine with DEX routing and real-time WebSocket status updates. Routes orders between Raydium and Meteora to find the best execution price.

## Why Limit Orders?

Limit orders were chosen because they demonstrate more complex order matching logic compared to market orders. A limit order only executes when the market price reaches or exceeds the target price, requiring continuous price monitoring and retry logic. This showcases:

- Price comparison and threshold checking
- Exponential backoff retry mechanisms
- State management across multiple attempts
- More realistic trading scenarios

The engine can be extended to support market orders (immediate execution at current price) by removing the price threshold check in the queue processor, and sniper orders (execution on token launch) by adding pool creation event listeners and immediate execution triggers.

## Architecture Overview

The system uses a queue-based architecture to handle concurrent order processing:

1. **API Layer**: Fastify server with WebSocket support for real-time updates
2. **Queue System**: BullMQ with Redis for job processing and concurrency control
3. **DEX Router**: Compares quotes from Raydium and Meteora, routes to best price
4. **Database**: PostgreSQL for order history, Redis for active order state

Orders flow through these stages: pending → routing → building → submitted → confirmed (or failed).

## Tech Stack

- **Node.js** with TypeScript for type safety
- **Fastify** for high-performance API and built-in WebSocket support
- **BullMQ** with Redis for reliable job queue with retry logic
- **PostgreSQL** for persistent order history and analytics
- **Zod** for runtime validation
- **Jest** for testing

## Setup Instructions

### Prerequisites

- Node.js 18 or higher
- Docker and Docker Compose
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd order-execution-engine
```

2. Install dependencies:
```bash
npm install
```

3. Copy environment variables:
```bash
cp .env.example .env
```

4. Start PostgreSQL and Redis:
```bash
docker-compose up -d
```

5. Run the development server:
```bash
npm run dev
```

The server will start on http://localhost:3000

### Quick Start Script

For a one-command setup:
```bash
chmod +x setup.sh && ./setup.sh
```

This will start Docker containers, install dependencies, and build the project.

### Environment Variables

Key configuration options in `.env`:

- `PORT`: Server port (default: 3000)
- `MAX_CONCURRENT_ORDERS`: Maximum orders processed simultaneously (default: 10)
- `MAX_RETRY_ATTEMPTS`: Number of retry attempts for failed orders (default: 3)
- `MOCK_MODE`: Use mock DEX responses (default: true)

## API Documentation

### Submit Order

**Endpoint**: `POST /api/orders`

**Request Body**:
```json
{
  "type": "limit",
  "tokenIn": "SOL",
  "tokenOut": "USDC",
  "amountIn": 100,
  "limitPrice": 25.5
}
```

**Response**:
```json
{
  "orderId": "ord_1234567890_abc123",
  "status": "pending",
  "message": "Order created successfully. Connect to WebSocket for updates.",
  "wsUrl": "/api/orders/ord_1234567890_abc123/ws"
}
```

### Connect to WebSocket for Updates

**Endpoint**: `GET /api/orders/:orderId/ws` (WebSocket)

**WebSocket Messages**:

Initial connection:
```json
{
  "type": "connected",
  "orderId": "ord_1234567890_abc123",
  "status": "pending"
}
```

Status updates:
```json
{
  "type": "status_update",
  "orderId": "ord_1234567890_abc123",
  "status": "routing",
  "timestamp": "2025-11-21T10:30:00.000Z"
}
```

Confirmation:
```json
{
  "type": "status_update",
  "orderId": "ord_1234567890_abc123",
  "status": "confirmed",
  "selectedDex": "meteora",
  "executedPrice": 25.8,
  "txHash": "3Zx8F...",
  "timestamp": "2025-11-21T10:30:05.000Z"
}
```

### Get Order Status

**Endpoint**: `GET /api/orders/:orderId`

Returns current order status and execution details.

### List Orders

**Endpoint**: `GET /api/orders?limit=100&offset=0`

Returns paginated list of all orders.

### Queue Metrics

**Endpoint**: `GET /api/queue/metrics`

Returns queue statistics:
```json
{
  "waiting": 5,
  "active": 3,
  "completed": 127,
  "failed": 2
}
```

## How It Works

### Order Execution Flow

1. **Submission**: Client submits limit order via POST to `/api/orders`
2. **Response**: Server returns orderId and WebSocket URL
3. **WebSocket Connection**: Client connects to `/api/orders/:orderId/ws`
4. **Queueing**: Order added to BullMQ queue with retry configuration
5. **Price Check**: System fetches quotes from both Raydium and Meteora
6. **Price Matching**: Compares best market price against limit price
7. **Retry Logic**: If price not met, job retries with exponential backoff
8. **Execution**: When price matches, order routes to best DEX and executes
9. **Confirmation**: Transaction hash and final price sent via WebSocket

### Limit Order Matching

The system continuously checks if market price meets the limit price:

- If current best price >= limit price: Order executes
- If current best price < limit price: Order retries after delay
- After 3 failed attempts: Order marked as failed

### DEX Routing

For each order, the router:

1. Queries both Raydium and Meteora simultaneously
2. Calculates net output after fees (Raydium: 0.3%, Meteora: 0.2%)
3. Selects DEX with higher estimated output
4. Executes swap with 2% slippage protection

### Concurrent Processing

The queue processes up to 10 orders concurrently while maintaining order isolation. Each order runs independently with its own retry counter and state.

## Testing

Run the test suite:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Tests cover:
- DEX quote fetching and comparison
- Order validation rules
- Price matching logic
- Utility functions
- Error handling

## Mock Implementation

The current implementation uses mock DEX responses with realistic delays:

- Quote fetching: 200ms per DEX
- Swap execution: 2-3 seconds
- Price variations: 2-5% difference between DEXs

This allows testing the full order flow without requiring devnet tokens or network access.

## Demo Video

[Watch the demo video here](YOUR_YOUTUBE_LINK)

The video demonstrates:
- Submitting multiple limit orders simultaneously
- Real-time WebSocket status updates
- DEX routing decisions in the logs
- Queue processing concurrent orders
- Limit order matching when price targets are met

## Production Deployment

For production deployment:

1. Set `NODE_ENV=production` in environment
2. Configure PostgreSQL and Redis connection strings
3. Deploy to Railway, Render, or similar platform
4. Ensure Redis persistence is enabled
5. Set up monitoring for queue metrics

## License

MIT
