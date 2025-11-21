import WebSocket from 'ws';
import fetch from 'node-fetch';

const ORDER_PAYLOAD = {
  type: 'limit',
  tokenIn: 'SOL',
  tokenOut: 'USDC',
  amountIn: 100,
  limitPrice: 0.85,
};

async function testOrder() {
  console.log('Creating order...');
  
  const response = await fetch('http://localhost:3000/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ORDER_PAYLOAD),
  });

  const data = await response.json();
  console.log('✓ Order created:', data);

  const orderId = data.orderId;
  const wsUrl = `ws://localhost:3000/api/orders/${orderId}/ws`;
  
  console.log(`\nConnecting to WebSocket: ${wsUrl}`);
  const ws = new WebSocket(wsUrl);

  ws.on('open', () => {
    console.log('✓ WebSocket connected');
  });

  ws.on('message', (data) => {
    const message = JSON.parse(data.toString());
    console.log('\n📨 Received:', JSON.stringify(message, null, 2));

    if (message.status === 'confirmed' || message.status === 'failed') {
      console.log('\n✓ Order completed');
      ws.close();
    }
  });

  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });

  ws.on('close', () => {
    console.log('\n✓ Connection closed');
  });
}

testOrder().catch(console.error);
