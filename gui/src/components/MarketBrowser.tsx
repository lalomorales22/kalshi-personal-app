import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import { websocket } from '../utils/websocket';
import type { Market } from '../types';

interface MarketBrowserProps {
  onSelectMarket: (ticker: string) => void;
}

export default function MarketBrowser({ onSelectMarket }: MarketBrowserProps) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'open' | 'closed'>('open');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadMarkets();
  }, [filter]);

  useEffect(() => {
    // Subscribe to real-time ticker updates
    const unsubscribe = websocket.on('ticker', (data) => {
      // Update market prices in real-time
      setMarkets(prevMarkets =>
        prevMarkets.map(market => {
          if (market.ticker === data.ticker) {
            return {
              ...market,
              yes_bid: data.yes_bid,
              yes_ask: data.yes_ask,
              no_bid: data.no_bid,
              no_ask: data.no_ask,
              volume: data.volume || market.volume,
            };
          }
          return market;
        })
      );
    });

    // Subscribe to ticker channel for all markets
    if (markets.length > 0) {
      websocket.subscribe(['ticker'], markets.map(m => m.ticker));
    }

    return () => {
      unsubscribe();
      if (markets.length > 0) {
        websocket.unsubscribe(['ticker'], markets.map(m => m.ticker));
      }
    };
  }, [markets.length]);

  const loadMarkets = async () => {
    try {
      setLoading(true);
      const data = await api.getMarkets({
        limit: 100,
        status: filter === 'all' ? undefined : filter
      });
      setMarkets(data);

      // Extract unique categories
      const cats = Array.from(new Set(
        data.map(m => m.category || m.series_ticker || 'Other').filter(Boolean)
      )).sort();
      setCategories(cats);
    } catch (error) {
      console.error('Failed to load markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!search.trim()) {
      loadMarkets();
      setSelectedCategory('all');
      return;
    }
    try {
      setLoading(true);
      const data = await api.searchMarkets(search);
      setMarkets(data);
      setSelectedCategory('all');
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredMarkets = selectedCategory === 'all'
    ? markets
    : markets.filter(m =>
        (m.category || m.series_ticker || 'Other') === selectedCategory
      );

  return (
    <div className="h-full flex flex-col gap-4">
      {/* Search and Filters */}
      <div className="widget p-4">
        <div className="flex gap-3 mb-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="🔍 Search markets..."
            className="input-obsidian flex-1"
          />
          <button onClick={handleSearch} className="btn-primary">
            Search
          </button>
        </div>

        {/* Status Filters */}
        <div className="flex gap-2 mb-3">
          {(['all', 'open', 'closed'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1 rounded-lg transition-all ${
                filter === f
                  ? 'bg-neon-cyan text-obsidian-300 font-semibold'
                  : 'bg-obsidian-100 text-gray-400 hover:text-white'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        {/* Category Filters */}
        {categories.length > 0 && (
          <div className="border-t border-obsidian-50/20 pt-3">
            <div className="text-xs text-gray-400 mb-2">📁 Categories</div>
            <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1 rounded-lg text-xs transition-all ${
                  selectedCategory === 'all'
                    ? 'bg-neon-blue text-white font-semibold'
                    : 'bg-obsidian-50 text-gray-400 hover:text-white'
                }`}
              >
                All
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs transition-all ${
                    selectedCategory === cat
                      ? 'bg-neon-blue text-white font-semibold'
                      : 'bg-obsidian-50 text-gray-400 hover:text-white'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Markets List */}
      <div className="flex-1 overflow-auto space-y-3">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-neon-cyan text-xl">Loading markets... ⏳</div>
          </div>
        ) : filteredMarkets.length === 0 ? (
          <div className="widget p-8 text-center text-gray-500">
            No markets found 🤷
          </div>
        ) : (
          filteredMarkets.map((market) => (
            <motion.div
              key={market.ticker}
              className="widget p-4 hover:border-neon-cyan/50 cursor-pointer transition-all"
              onClick={() => onSelectMarket(market.ticker)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h3 className="font-semibold text-white mb-1">{market.title}</h3>
                  <p className="text-sm text-gray-400">{market.ticker}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                  market.status === 'open'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {market.status}
                </span>
              </div>

              <div className="grid grid-cols-4 gap-4 mt-3">
                <div>
                  <div className="text-xs text-gray-500 flex items-center gap-1">
                    Yes
                    {websocket.isConnected() && <span className="text-green-500">●</span>}
                  </div>
                  <div className="text-sm font-semibold text-green-400">
                    {market.yes_ask ? `${market.yes_ask}¢` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">No</div>
                  <div className="text-sm font-semibold text-red-400">
                    {market.no_ask ? `${market.no_ask}¢` : 'N/A'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Volume</div>
                  <div className="text-sm font-semibold">
                    {market.volume ? market.volume.toLocaleString() : '0'}
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Category</div>
                  <div className="text-sm font-semibold truncate">
                    {market.category || market.series_ticker || 'Other'}
                  </div>
                </div>
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
