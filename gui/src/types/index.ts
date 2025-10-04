export interface Market {
  ticker: string;
  title: string;
  subtitle?: string;
  status: 'open' | 'closed' | 'settled';
  yes_bid?: number;
  yes_ask?: number;
  no_bid?: number;
  no_ask?: number;
  volume?: number;
  volume_24h?: number;
  open_interest?: number;
  close_time?: string;
  event_ticker?: string;
  category?: string;
  series_ticker?: string;
}

export interface Position {
  ticker: string;
  position: number;
  total_cost: number;
  market_value?: number;
  pnl?: number;
  pnl_percent?: number;
}

export interface Order {
  order_id: string;
  ticker: string;
  side: 'yes' | 'no';
  action: 'buy' | 'sell';
  count: number;
  price?: number;
  status: 'pending' | 'resting' | 'canceled' | 'executed';
  created_time?: string;
}

export interface Balance {
  balance: number;
}

export interface AIMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface OrderbookLevel {
  price: number;
  quantity: number;
}

export interface Orderbook {
  yes: OrderbookLevel[];
  no: OrderbookLevel[];
}
