CREATE TABLE IF NOT EXISTS orders (
    id VARCHAR(100) PRIMARY KEY,
    type VARCHAR(20) NOT NULL,
    token_in VARCHAR(100) NOT NULL,
    token_out VARCHAR(100) NOT NULL,
    amount_in DECIMAL(20, 8) NOT NULL,
    limit_price DECIMAL(20, 8) NOT NULL,
    status VARCHAR(20) NOT NULL,
    selected_dex VARCHAR(20),
    executed_price DECIMAL(20, 8),
    tx_hash VARCHAR(200),
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_orders_token_pair ON orders(token_in, token_out);

CREATE TABLE IF NOT EXISTS order_status_history (
    id SERIAL PRIMARY KEY,
    order_id VARCHAR(100) NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    selected_dex VARCHAR(20),
    executed_price DECIMAL(20, 8),
    tx_hash VARCHAR(200),
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_status_history_order_id ON order_status_history(order_id);
CREATE INDEX idx_status_history_created_at ON order_status_history(created_at DESC);
