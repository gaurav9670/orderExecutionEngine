#!/bin/bash

echo "🚀 Starting Order Execution Engine..."
echo ""

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d

echo "⏳ Waiting for databases to be ready..."
sleep 5

echo "📥 Installing dependencies..."
npm install

echo "🏗️  Building project..."
npm run build

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the development server, run:"
echo "  npm run dev"
echo ""
echo "To run tests:"
echo "  npm test"
echo ""
echo "To test WebSocket connection:"
echo "  npm run test:client"
echo ""
