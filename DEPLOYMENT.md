# Deployment Guide

## Railway Deployment

1. Create a new project on Railway
2. Add PostgreSQL and Redis services
3. Connect your GitHub repository
4. Set environment variables:
   - `NODE_ENV=production`
   - `PORT=3000`
   - Connect DATABASE_URL to PostgreSQL
   - Connect REDIS_URL to Redis

## Render Deployment

1. Create new Web Service
2. Connect GitHub repository
3. Configure build settings:
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
4. Add PostgreSQL and Redis instances
5. Set environment variables from `.env.example`

## Environment Variables for Production

```
NODE_ENV=production
PORT=3000
POSTGRES_HOST=<database-host>
POSTGRES_PORT=5432
POSTGRES_DB=order_engine
POSTGRES_USER=<username>
POSTGRES_PASSWORD=<password>
REDIS_HOST=<redis-host>
REDIS_PORT=6379
MAX_CONCURRENT_ORDERS=10
MAX_RETRY_ATTEMPTS=3
MOCK_MODE=true
```

## Health Check Endpoint

Use `/health` for container health checks and uptime monitoring.
