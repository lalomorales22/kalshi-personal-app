import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import { websocket } from '../utils/websocket';
import type { Position, Order, Balance } from '../types';

export default function Portfolio() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [view, setView] = useState<'positions' | 'orders'>('positions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPortfolio();
  }, []);

  useEffect(() => {
    // Subscribe to fill updates for portfolio changes
    const unsubscribeFill = websocket.on('fill', (data) => {
      console.log('Order filled, refreshing portfolio:', data);
      // Refresh portfolio when an order is filled
      loadPortfolio();
    });

    // Subscribe to fills channel (requires authentication)
    websocket.subscribe(['fill']);

    return () => {
      unsubscribeFill();
      websocket.unsubscribe(['fill']);
    };
  }, []);

  const loadPortfolio = async () => {
    try {
      setLoading(true);
      const [balanceData, positionsData, ordersData] = await Promise.all([
        api.getBalance(),
        api.getPositions(),
        api.getOrders()
      ]);
      setBalance(balanceData);
      setPositions(positionsData);
      setOrders(ordersData);
    } catch (error) {
      console.error('Failed to load portfolio:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Balance Card */}
      <div className="widget p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <div className="text-sm text-gray-400 mb-1 flex items-center gap-2">
              💰 Total Balance
              {websocket.isConnected() && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-green-500/10 border border-green-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-xs text-green-400">Live</span>
                </div>
              )}
            </div>
            <div className="text-3xl font-bold text-neon-cyan">
              ${balance ? balance.balance.toFixed(2) : '0.00'}
            </div>
          </div>
          <button onClick={loadPortfolio} className="btn-secondary">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('positions')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            view === 'positions'
              ? 'bg-neon-cyan text-obsidian-300 font-semibold'
              : 'bg-obsidian-200 text-gray-400 hover:text-white'
          }`}
        >
          📊 Positions
        </button>
        <button
          onClick={() => setView('orders')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            view === 'orders'
              ? 'bg-neon-cyan text-obsidian-300 font-semibold'
              : 'bg-obsidian-200 text-gray-400 hover:text-white'
          }`}
        >
          📋 Orders
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-neon-cyan text-xl">Loading... ⏳</div>
          </div>
        ) : view === 'positions' ? (
          <div className="space-y-3">
            {positions.length === 0 ? (
              <div className="widget p-8 text-center text-gray-500">
                No positions yet 📭
              </div>
            ) : (
              positions.map((pos, idx) => (
                <motion.div
                  key={idx}
                  className="widget p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{pos.ticker}</h3>
                      <p className="text-sm text-gray-400">
                        {pos.position} contracts
                      </p>
                    </div>
                    {pos.pnl !== undefined && (
                      <div className={`text-right ${pos.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                        <div className="font-semibold">
                          {pos.pnl >= 0 ? '+' : ''}${pos.pnl.toFixed(2)}
                        </div>
                        {pos.pnl_percent !== undefined && (
                          <div className="text-sm">
                            {pos.pnl_percent >= 0 ? '+' : ''}{pos.pnl_percent.toFixed(1)}%
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Cost: </span>
                      <span className="font-semibold">${(pos.total_cost / 100).toFixed(2)}</span>
                    </div>
                    {pos.market_value !== undefined && (
                      <div>
                        <span className="text-gray-400">Value: </span>
                        <span className="font-semibold">${(pos.market_value / 100).toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="widget p-8 text-center text-gray-500">
                No active orders 📭
              </div>
            ) : (
              orders.map((order, idx) => (
                <motion.div
                  key={order.order_id}
                  className="widget p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold">{order.ticker}</h3>
                      <p className="text-sm text-gray-400">
                        {order.action.toUpperCase()} {order.count} @ {order.side.toUpperCase()}
                        {order.price && ` - ${order.price}¢`}
                      </p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs ${
                      order.status === 'executed' ? 'bg-green-500/20 text-green-400' :
                      order.status === 'canceled' ? 'bg-red-500/20 text-red-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
