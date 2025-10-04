import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import { websocket } from '../utils/websocket';
import type { Position, Order, Balance } from '../types';

export default function Portfolio() {
  const [balance, setBalance] = useState<Balance | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [fills, setFills] = useState<any[]>([]);
  const [settlements, setSettlements] = useState<any[]>([]);
  const [view, setView] = useState<'positions' | 'orders' | 'fills' | 'settlements'>('positions');
  const [settlementFilter, setSettlementFilter] = useState<'all' | 'unsettled' | 'settled'>('unsettled');
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
      const [balanceData, positionsData, ordersData, fillsData, settlementsData] = await Promise.all([
        api.getBalance(),
        api.getPositions({ limit: 100 }),
        api.getOrders(),
        api.getFills({ limit: 50 }),
        api.getSettlements({ limit: 50 })
      ]);
      setBalance(balanceData);

      // Filter positions by settlement status on the frontend
      let filteredPositions = positionsData;
      // Note: SDK doesn't provide settlement_status field in positions
      // We'll show all positions for now
      setPositions(filteredPositions);

      setOrders(ordersData);
      setFills(fillsData.fills || []);
      setSettlements(settlementsData.settlements || []);
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
              ${balance ? (balance.balance / 100).toFixed(2) : '0.00'}
            </div>
          </div>
          <button onClick={loadPortfolio} className="btn-secondary">
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* View Toggle */}
      <div className="grid grid-cols-4 gap-2">
        <button
          onClick={() => setView('positions')}
          className={`py-2 rounded-lg transition-all ${
            view === 'positions'
              ? 'bg-neon-cyan text-obsidian-300 font-semibold'
              : 'bg-obsidian-200 text-gray-400 hover:text-white'
          }`}
        >
          📊 Positions
        </button>
        <button
          onClick={() => setView('orders')}
          className={`py-2 rounded-lg transition-all ${
            view === 'orders'
              ? 'bg-neon-cyan text-obsidian-300 font-semibold'
              : 'bg-obsidian-200 text-gray-400 hover:text-white'
          }`}
        >
          📋 Orders
        </button>
        <button
          onClick={() => setView('fills')}
          className={`py-2 rounded-lg transition-all ${
            view === 'fills'
              ? 'bg-neon-cyan text-obsidian-300 font-semibold'
              : 'bg-obsidian-200 text-gray-400 hover:text-white'
          }`}
        >
          ✅ Fills
        </button>
        <button
          onClick={() => setView('settlements')}
          className={`py-2 rounded-lg transition-all ${
            view === 'settlements'
              ? 'bg-neon-cyan text-obsidian-300 font-semibold'
              : 'bg-obsidian-200 text-gray-400 hover:text-white'
          }`}
        >
          💵 Settled
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
        ) : view === 'orders' ? (
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
        ) : view === 'fills' ? (
          <div className="space-y-3">
            {fills.length === 0 ? (
              <div className="widget p-8 text-center text-gray-500">
                No fills yet 📭
              </div>
            ) : (
              fills.map((fill, idx) => (
                <motion.div
                  key={fill.trade_id || idx}
                  className="widget p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-semibold">{fill.ticker}</h3>
                      <p className="text-sm text-gray-400">
                        {fill.action?.toUpperCase()} {fill.count} @ {fill.side?.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-neon-cyan">
                        {fill.side === 'yes' ? fill.yes_price : fill.no_price}¢
                      </div>
                      <div className="text-xs text-gray-500">
                        {fill.is_taker ? 'Taker' : 'Maker'}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(fill.created_time).toLocaleString()}
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {settlements.length === 0 ? (
              <div className="widget p-8 text-center text-gray-500">
                No settlements yet 📭
              </div>
            ) : (
              settlements.map((settlement, idx) => (
                <motion.div
                  key={settlement.ticker + idx}
                  className="widget p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold">{settlement.ticker}</h3>
                      <p className="text-sm text-gray-400">
                        Result: <span className={`font-semibold ${
                          settlement.market_result === 'yes' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {settlement.market_result?.toUpperCase()}
                        </span>
                      </p>
                    </div>
                    <div className={`text-right ${
                      settlement.revenue >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      <div className="font-semibold text-lg">
                        {settlement.revenue >= 0 ? '+' : ''}${(settlement.revenue / 100).toFixed(2)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-400">Yes Contracts: </span>
                      <span className="font-semibold">{settlement.yes_count || 0}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">No Contracts: </span>
                      <span className="font-semibold">{settlement.no_count || 0}</span>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    Settled: {new Date(settlement.settled_time).toLocaleString()}
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
