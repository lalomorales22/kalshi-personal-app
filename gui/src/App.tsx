import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import MarketBrowser from './components/MarketBrowser'
import Portfolio from './components/Portfolio'
import AIAssistant from './components/AIAssistant'
import TradingPanel from './components/TradingPanel'
import Settings from './components/Settings'
import Sidebar from './components/Sidebar'
import { api } from './utils/api'
import type { Balance } from './types'

type View = 'markets' | 'portfolio' | 'trade' | 'ai' | 'settings';

function App() {
  const [currentView, setCurrentView] = useState<View>('markets');
  const [selectedMarket, setSelectedMarket] = useState<string | null>(null);
  const [balance, setBalance] = useState<Balance | null>(null);

  useEffect(() => {
    loadBalance();
    // Refresh balance every 30 seconds
    const interval = setInterval(loadBalance, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadBalance = async () => {
    try {
      const data = await api.getBalance();
      setBalance(data);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const handleMarketSelect = (ticker: string) => {
    setSelectedMarket(ticker);
    setCurrentView('trade'); // Auto-navigate to trade view
  };

  return (
    <div className="h-screen w-screen bg-obsidian-300 overflow-hidden flex">
      {/* Sidebar */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Bar */}
        <div className="h-16 glass border-b border-obsidian-50/20 flex items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="text-2xl">📊</div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-neon-cyan to-neon-blue bg-clip-text text-transparent">
              Kalshi Trading
            </h1>
            <span className="text-xs text-gray-500 ml-2">Obsidian Edition</span>
          </div>

          <div className="flex items-center gap-4">
            <div className="widget px-4 py-2">
              <span className="text-sm text-gray-400">Balance:</span>
              <span className="ml-2 font-semibold text-neon-cyan">
                ${balance ? (balance.balance / 100).toFixed(2) : '0.00'}
              </span>
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden p-4 flex gap-4">
          {/* Main Panel */}
          <motion.div
            className="flex-1 overflow-hidden"
            key={currentView}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            {currentView === 'markets' && (
              <MarketBrowser onSelectMarket={handleMarketSelect} />
            )}
            {currentView === 'portfolio' && <Portfolio />}
            {currentView === 'trade' && (
              <TradingPanel selectedMarket={selectedMarket} />
            )}
            {currentView === 'ai' && <AIAssistant />}
            {currentView === 'settings' && <Settings />}
          </motion.div>

          {/* AI Side Panel - Always visible except on AI and Settings pages */}
          {currentView !== 'ai' && currentView !== 'settings' && (
            <motion.div
              className="w-80"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
            >
              <AIAssistant compact />
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

export default App
