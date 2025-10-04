import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import { websocket } from '../utils/websocket';
import type { Market, Orderbook } from '../types';

interface TradingPanelProps {
  selectedMarket: string | null;
}

export default function TradingPanel({ selectedMarket }: TradingPanelProps) {
  const [market, setMarket] = useState<Market | null>(null);
  const [orderbook, setOrderbook] = useState<Orderbook | null>(null);
  const [side, setSide] = useState<'yes' | 'no'>('yes');
  const [action, setAction] = useState<'buy' | 'sell'>('buy');
  const [quantity, setQuantity] = useState(1);
  const [price, setPrice] = useState<number | ''>('');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (selectedMarket) {
      loadMarketData(selectedMarket);
    }
  }, [selectedMarket]);

  useEffect(() => {
    if (!selectedMarket) return;

    // Subscribe to real-time updates for this market
    const unsubscribeTicker = websocket.on('ticker', (data) => {
      if (data.ticker === selectedMarket) {
        setMarket(prev => prev ? {
          ...prev,
          yes_bid: data.yes_bid,
          yes_ask: data.yes_ask,
          no_bid: data.no_bid,
          no_ask: data.no_ask,
          volume: data.volume || prev.volume,
        } : null);

        // Update default price when ticker updates
        if (side === 'yes' && data.yes_ask) {
          setPrice(data.yes_ask);
        } else if (side === 'no' && data.no_ask) {
          setPrice(data.no_ask);
        }
      }
    });

    const unsubscribeOrderbook = websocket.on('orderbook', (data) => {
      if (data.ticker === selectedMarket) {
        setOrderbook({
          yes: data.yes || [],
          no: data.no || []
        });
      }
    });

    const unsubscribeTrade = websocket.on('trade', (data) => {
      if (data.ticker === selectedMarket) {
        console.log('Trade executed:', data);
        // Could show a toast notification here
      }
    });

    const unsubscribeFill = websocket.on('fill', (data) => {
      if (data.ticker === selectedMarket) {
        console.log('Order filled:', data);
        // Could show a toast notification or update portfolio
      }
    });

    // Subscribe to channels
    websocket.subscribe(['ticker', 'orderbook_delta', 'trade', 'fill'], [selectedMarket]);

    return () => {
      unsubscribeTicker();
      unsubscribeOrderbook();
      unsubscribeTrade();
      unsubscribeFill();
      websocket.unsubscribe(['ticker', 'orderbook_delta', 'trade', 'fill'], [selectedMarket]);
    };
  }, [selectedMarket, side]);

  const loadMarketData = async (ticker: string) => {
    try {
      const [marketData, orderbookData] = await Promise.all([
        api.getMarket(ticker),
        api.getOrderbook(ticker)
      ]);
      setMarket(marketData);
      setOrderbook(orderbookData);

      // Set default price to best ask
      if (side === 'yes' && marketData.yes_ask) {
        setPrice(marketData.yes_ask);
      } else if (side === 'no' && marketData.no_ask) {
        setPrice(marketData.no_ask);
      }
    } catch (error) {
      console.error('Failed to load market:', error);
    }
  };

  const handleTrade = async () => {
    if (!market) return;

    try {
      setLoading(true);
      await api.createOrder({
        ticker: market.ticker,
        action,
        side,
        count: quantity,
        price: orderType === 'limit' && price ? Number(price) : undefined,
        type: orderType
      });
      alert(`✅ Order placed successfully!`);
      setQuantity(1);
      setPrice('');
    } catch (error) {
      alert(`❌ Order failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  if (!selectedMarket || !market) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center text-gray-500">
          <div className="text-6xl mb-4">📊</div>
          <div className="text-xl">Select a market to start trading</div>
        </div>
      </div>
    );
  }

  const estimatedCost = orderType === 'market'
    ? (side === 'yes' ? market.yes_ask || 0 : market.no_ask || 0) * quantity
    : (price as number) * quantity;

  return (
    <div className="h-full flex gap-4">
      {/* Market Info */}
      <div className="flex-1 flex flex-col gap-4">
        <div className="widget p-6">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{market.title}</h2>
            </div>
            {websocket.isConnected() && (
              <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/10 border border-green-500/30">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                <span className="text-xs text-green-400 font-semibold">LIVE</span>
              </div>
            )}
          </div>
          <p className="text-gray-400 mb-4">{market.ticker}</p>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">YES Price</div>
              <div className="text-2xl font-bold text-green-400">
                {market.yes_ask || 'N/A'}¢
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Bid: {market.yes_bid || 'N/A'}¢
              </div>
            </div>
            <div className="bg-red-500/10 rounded-lg p-4">
              <div className="text-sm text-gray-400 mb-1">NO Price</div>
              <div className="text-2xl font-bold text-red-400">
                {market.no_ask || 'N/A'}¢
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Bid: {market.no_bid || 'N/A'}¢
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
            <div>
              <div className="text-gray-400">Volume</div>
              <div className="font-semibold">{market.volume?.toLocaleString() || '0'}</div>
            </div>
            <div>
              <div className="text-gray-400">Status</div>
              <div className="font-semibold capitalize">{market.status}</div>
            </div>
            <div>
              <div className="text-gray-400">Close Time</div>
              <div className="font-semibold text-xs">
                {market.close_time ? new Date(market.close_time).toLocaleDateString() : 'N/A'}
              </div>
            </div>
          </div>
        </div>

        {/* Orderbook */}
        {orderbook && (
          <div className="widget p-4 flex-1 overflow-auto">
            <h3 className="font-semibold mb-3">📖 Order Book</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="font-semibold text-green-400 mb-2">YES</div>
                {orderbook.yes?.slice(0, 5).map((level, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{level.price}¢</span>
                    <span className="text-gray-400">{level.quantity}</span>
                  </div>
                ))}
              </div>
              <div>
                <div className="font-semibold text-red-400 mb-2">NO</div>
                {orderbook.no?.slice(0, 5).map((level, idx) => (
                  <div key={idx} className="flex justify-between py-1">
                    <span>{level.price}¢</span>
                    <span className="text-gray-400">{level.quantity}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Trading Form */}
      <div className="w-96 widget p-6">
        <h3 className="text-xl font-bold mb-6">⚡ Quick Trade</h3>

        {/* Buy/Sell Toggle */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setAction('buy')}
            className={`py-3 rounded-lg font-semibold transition-all ${
              action === 'buy'
                ? 'bg-green-500 text-white'
                : 'bg-obsidian-100 text-gray-400'
            }`}
          >
            🟢 BUY
          </button>
          <button
            onClick={() => setAction('sell')}
            className={`py-3 rounded-lg font-semibold transition-all ${
              action === 'sell'
                ? 'bg-red-500 text-white'
                : 'bg-obsidian-100 text-gray-400'
            }`}
          >
            🔴 SELL
          </button>
        </div>

        {/* Yes/No Toggle */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setSide('yes')}
            className={`py-2 rounded-lg font-semibold transition-all ${
              side === 'yes'
                ? 'bg-neon-cyan text-obsidian-300'
                : 'bg-obsidian-100 text-gray-400'
            }`}
          >
            YES
          </button>
          <button
            onClick={() => setSide('no')}
            className={`py-2 rounded-lg font-semibold transition-all ${
              side === 'no'
                ? 'bg-neon-cyan text-obsidian-300'
                : 'bg-obsidian-100 text-gray-400'
            }`}
          >
            NO
          </button>
        </div>

        {/* Order Type */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={() => setOrderType('market')}
            className={`py-2 rounded-lg font-semibold transition-all ${
              orderType === 'market'
                ? 'bg-obsidian-50 text-white'
                : 'bg-obsidian-100 text-gray-400'
            }`}
          >
            Market
          </button>
          <button
            onClick={() => setOrderType('limit')}
            className={`py-2 rounded-lg font-semibold transition-all ${
              orderType === 'limit'
                ? 'bg-obsidian-50 text-white'
                : 'bg-obsidian-100 text-gray-400'
            }`}
          >
            Limit
          </button>
        </div>

        {/* Quantity */}
        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Quantity</label>
          <input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            min="1"
            className="input-obsidian w-full"
          />
        </div>

        {/* Price (for limit orders) */}
        {orderType === 'limit' && (
          <div className="mb-4">
            <label className="block text-sm text-gray-400 mb-2">Price (cents)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              min="1"
              max="99"
              className="input-obsidian w-full"
            />
          </div>
        )}

        {/* Estimated Cost */}
        <div className="bg-obsidian-100 rounded-lg p-4 mb-6">
          <div className="text-sm text-gray-400 mb-1">Estimated {action === 'buy' ? 'Cost' : 'Proceeds'}</div>
          <div className="text-2xl font-bold text-neon-cyan">
            ${(estimatedCost / 100).toFixed(2)}
          </div>
        </div>

        {/* Submit Button */}
        <motion.button
          onClick={handleTrade}
          disabled={loading || market.status !== 'open'}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            action === 'buy'
              ? 'bg-green-500 hover:bg-green-600'
              : 'bg-red-500 hover:bg-red-600'
          } disabled:opacity-50 disabled:cursor-not-allowed`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? '⏳ Placing Order...' : `${action === 'buy' ? '🟢' : '🔴'} ${action.toUpperCase()} ${quantity} Contracts`}
        </motion.button>
      </div>
    </div>
  );
}
