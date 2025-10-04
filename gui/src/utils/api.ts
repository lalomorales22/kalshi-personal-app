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

  // Portfolio
  getBalance: async () => {
    const { data } = await axios.get<Balance>(`${API_BASE}/portfolio/balance`);
    return data;
  },

  getPositions: async () => {
    const { data } = await axios.get<{ positions: Position[] }>(`${API_BASE}/portfolio/positions`);
    return data.positions;
  },

  getOrders: async (status?: string) => {
    const { data } = await axios.get<{ orders: Order[] }>(`${API_BASE}/portfolio/orders`, {
      params: { status }
    });
    return data.orders;
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
