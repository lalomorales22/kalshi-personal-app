import axios from 'axios';
import type { Market, Position, Order, Balance, Orderbook } from '../types';

const API_BASE = 'http://localhost:8000';

export const api = {
  // Markets
  getMarkets: async (params?: {
    limit?: number;
    status?: string;
    event_ticker?: string;
    series_ticker?: string;
  }) => {
    const { data } = await axios.get<{ markets: Market[] }>(`${API_BASE}/markets`, { params });
    return data.markets;
  },

  getMarket: async (ticker: string) => {
    const { data } = await axios.get<{ market: Market }>(`${API_BASE}/markets/${ticker}`);
    return data.market;
  },

  getOrderbook: async (ticker: string) => {
    const { data } = await axios.get<{ orderbook: Orderbook }>(`${API_BASE}/markets/${ticker}/orderbook`);
    return data.orderbook;
  },

  searchMarkets: async (query: string) => {
    const { data } = await axios.get<{ markets: Market[] }>(`${API_BASE}/markets/search`, {
      params: { q: query }
    });
    return data.markets;
  },

  // Events
  getEvents: async (params?: {
    limit?: number;
    cursor?: string;
    status?: string;
    series_ticker?: string;
    with_nested_markets?: boolean;
  }) => {
    const { data } = await axios.get<{ events: any[]; cursor?: string }>(`${API_BASE}/events`, { params });
    return data;
  },

  getEvent: async (eventTicker: string, withNestedMarkets: boolean = true) => {
    const { data } = await axios.get(`${API_BASE}/events/${eventTicker}`, {
      params: { with_nested_markets: withNestedMarkets }
    });
    return data;
  },

  // Categories
  getCategories: async () => {
    const { data } = await axios.get<{ categories: string[] }>(`${API_BASE}/categories`);
    return data.categories;
  },

  // Series
  getSeriesList: async (params?: {
    status?: string;
  }) => {
    const { data } = await axios.get(`${API_BASE}/series`, { params });
    return data;
  },

  getSeries: async (seriesTicker: string) => {
    const { data } = await axios.get(`${API_BASE}/series/${seriesTicker}`);
    return data;
  },

  // Trades
  getTrades: async (params?: {
    ticker?: string;
    limit?: number;
    cursor?: string;
    min_ts?: number;
    max_ts?: number;
  }) => {
    const { data } = await axios.get<{ trades: any[]; cursor?: string }>(`${API_BASE}/markets/trades`, { params });
    return data;
  },

  // Portfolio
  getBalance: async () => {
    const { data } = await axios.get<Balance>(`${API_BASE}/portfolio/balance`);
    return data;
  },

  getPositions: async (params?: {
    ticker?: string;
    event_ticker?: string;
    limit?: number;
    cursor?: string;
  }) => {
    const { data } = await axios.get<{
      positions: Position[];
      event_positions?: any[];
      market_positions?: Position[];
      cursor?: string;
    }>(`${API_BASE}/portfolio/positions`, { params });
    return data.positions;
  },

  getOrders: async (status?: string) => {
    const { data } = await axios.get<{ orders: Order[] }>(`${API_BASE}/portfolio/orders`, {
      params: { status }
    });
    return data.orders;
  },

  getFills: async (params?: {
    ticker?: string;
    limit?: number;
    cursor?: string;
  }) => {
    const { data } = await axios.get<{ fills: any[]; cursor?: string }>(`${API_BASE}/portfolio/fills`, { params });
    return data;
  },

  getSettlements: async (params?: {
    limit?: number;
    cursor?: string;
  }) => {
    const { data } = await axios.get<{ settlements: any[]; cursor?: string }>(`${API_BASE}/portfolio/settlements`, { params });
    return data;
  },

  // Trading
  createOrder: async (order: {
    ticker: string;
    action: 'buy' | 'sell';
    side: 'yes' | 'no';
    count: number;
    price?: number;
    type?: 'market' | 'limit';
  }) => {
    const { data } = await axios.post(`${API_BASE}/trade/order`, order);
    return data;
  },

  cancelOrder: async (orderId: string) => {
    const { data } = await axios.delete(`${API_BASE}/trade/order/${orderId}`);
    return data;
  },

  // AI Assistant
  analyzeMarket: async (ticker: string, question?: string) => {
    const { data } = await axios.post<{ response: string }>(`${API_BASE}/ai/analyze`, {
      ticker,
      question
    });
    return data.response;
  },

  chat: async (message: string, context?: string) => {
    const { data } = await axios.post<{ response: string }>(`${API_BASE}/ai/chat`, {
      message,
      context
    });
    return data.response;
  },
};
