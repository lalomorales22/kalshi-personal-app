import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../utils/api';

export default function Settings() {
  const [apiKeyId, setApiKeyId] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [testStatus, setTestStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadBalance();
  }, []);

  const loadBalance = async () => {
    try {
      const data = await api.getBalance();
      setBalance(data.balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
    }
  };

  const testConnection = async () => {
    try {
      setLoading(true);
      setTestStatus('idle');
      await api.getBalance();
      setTestStatus('success');
      setTimeout(() => setTestStatus('idle'), 3000);
    } catch (error) {
      setTestStatus('error');
      setTimeout(() => setTestStatus('idle'), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="widget p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="text-3xl">⚙️</div>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
          <p className="text-gray-400">Configure your Kalshi trading platform</p>
        </div>

        {/* Account Information */}
        <div className="widget p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>👤</span> Account Information
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-obsidian-100 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">Current Balance</div>
                <div className="text-2xl font-bold text-neon-cyan">
                  {balance !== null ? `$${(balance / 100).toFixed(2)}` : 'Loading...'}
                </div>
              </div>
              <div className="bg-obsidian-100 rounded-lg p-4">
                <div className="text-sm text-gray-400 mb-1">API Status</div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    testStatus === 'success' ? 'bg-green-500' :
                    testStatus === 'error' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}></div>
                  <span className="font-semibold">
                    {testStatus === 'success' ? 'Connected' :
                     testStatus === 'error' ? 'Error' :
                     'Ready'}
                  </span>
                </div>
              </div>
            </div>

            <button
              onClick={testConnection}
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? '⏳ Testing...' : '🔌 Test API Connection'}
            </button>
          </div>
        </div>

        {/* API Configuration */}
        <div className="widget p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>🔑</span> API Configuration
          </h2>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div className="text-sm text-yellow-200">
                <strong>Note:</strong> API credentials are configured in your <code className="bg-obsidian-100 px-2 py-1 rounded">.env</code> file.
                Restart the application after making changes.
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Environment File Location</label>
              <div className="input-obsidian bg-obsidian-50 cursor-not-allowed">
                ~/Desktop/kalshi/.env
              </div>
            </div>

            <div className="bg-obsidian-100 rounded-lg p-4">
              <div className="text-sm font-semibold mb-2">Required Variables:</div>
              <ul className="text-sm text-gray-400 space-y-1 font-mono">
                <li>• KALSHI_API_KEY_ID</li>
                <li>• KALSHI_PRIVATE_KEY</li>
                <li>• ANTHROPIC_API_KEY (optional, for AI features)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Trading Preferences */}
        <div className="widget p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>📊</span> Trading Preferences
          </h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Confirmation Prompts</div>
                <div className="text-sm text-gray-400">Show confirmation before placing orders</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-obsidian-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Auto-Refresh Markets</div>
                <div className="text-sm text-gray-400">Automatically refresh market data every 30s</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-obsidian-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
              </label>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">Sound Notifications</div>
                <div className="text-sm text-gray-400">Play sound when orders are filled</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-obsidian-100 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-neon-cyan"></div>
              </label>
            </div>
          </div>
        </div>

        {/* App Information */}
        <div className="widget p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <span>ℹ️</span> About
          </h2>

          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">App Version</span>
              <span className="font-semibold">1.0.0 (Phase 14)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Electron</span>
              <span className="font-semibold">v33</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">React</span>
              <span className="font-semibold">v18</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Theme</span>
              <span className="font-semibold">Black Obsidian</span>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-obsidian-50/20">
            <div className="text-center text-gray-500 text-sm">
              Built with ❤️ using Claude Code
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
