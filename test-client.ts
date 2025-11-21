import WebSocket from 'ws';

const ORDER_PAYLOAD = {
  type: 'limit',
  tokenIn: 'SOL',
  tokenOut: 'USDC',
  amountIn: 100,
  limitPrice: 0.85,
};

function testWebSocketOrder() {
  const ws = new WebSocket('ws://localhost:3000/api/orders/execute');

  ws.on('open', () => {
    console.log('✓ WebSocket connected');
    console.log('Sending order:', ORDER_PAYLOAD);
    ws.send(JSON.stringify(ORDER_PAYLOAD));
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

testWebSocketOrder();
