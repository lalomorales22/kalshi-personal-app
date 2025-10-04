import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { api } from '../utils/api';
import type { AIMessage } from '../types';

interface AIAssistantProps {
  compact?: boolean;
}

export default function AIAssistant({ compact = false }: AIAssistantProps) {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: AIMessage = {
      role: 'user',
      content: input,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.chat(input);
      const assistantMessage: AIMessage = {
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: AIMessage = {
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please make sure the API server is running and ANTHROPIC_API_KEY is set.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`h-full flex flex-col ${compact ? '' : 'max-w-4xl mx-auto'}`}>
      <div className="widget flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-obsidian-50/20">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🤖</div>
            <div>
              <h3 className="font-bold text-lg">AI Assistant</h3>
              <p className="text-xs text-gray-400">Powered by Claude</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 ? (
            <div className="text-center text-gray-500 mt-12">
              <div className="text-6xl mb-4">🤖</div>
              <p className="text-lg">Ask me anything about markets!</p>
              <p className="text-sm mt-2">
                I can help analyze trades, find opportunities, and answer questions.
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-3 ${
                    msg.role === 'user'
                      ? 'bg-neon-cyan text-obsidian-300'
                      : 'bg-obsidian-100 text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                  <div className={`text-xs mt-1 ${
                    msg.role === 'user' ? 'text-obsidian-200' : 'text-gray-500'
                  }`}>
                    {msg.timestamp.toLocaleTimeString()}
                  </div>
                </div>
              </motion.div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-obsidian-100 rounded-lg p-3">
                <div className="flex gap-2">
                  <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-neon-cyan rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-obsidian-50/20">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything... 💬"
              className="input-obsidian flex-1"
              disabled={loading}
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '⏳' : '📤'}
            </button>
          </div>

          {/* Quick Actions */}
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => setInput('What are the top trending markets right now?')}
              className="text-xs px-3 py-1 bg-obsidian-100 rounded-full hover:bg-obsidian-50 transition-all"
            >
              🔥 Trending markets
            </button>
            <button
              onClick={() => setInput('Analyze my portfolio and suggest improvements')}
              className="text-xs px-3 py-1 bg-obsidian-100 rounded-full hover:bg-obsidian-50 transition-all"
            >
              📊 Portfolio analysis
            </button>
            <button
              onClick={() => setInput('Find markets with high volume and good spreads')}
              className="text-xs px-3 py-1 bg-obsidian-100 rounded-full hover:bg-obsidian-50 transition-all"
            >
              💎 Find opportunities
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
