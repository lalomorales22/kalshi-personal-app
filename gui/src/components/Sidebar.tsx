import { motion } from 'framer-motion';

interface SidebarProps {
  currentView: string;
  onViewChange: (view: 'markets' | 'portfolio' | 'trade' | 'ai' | 'settings') => void;
}

const navItems = [
  { id: 'markets', icon: '📊', label: 'Markets' },
  { id: 'portfolio', icon: '💼', label: 'Portfolio' },
  { id: 'trade', icon: '⚡', label: 'Trade' },
  { id: 'ai', icon: '🤖', label: 'AI Assistant' },
];

export default function Sidebar({ currentView, onViewChange }: SidebarProps) {
  return (
    <div className="w-20 glass border-r border-obsidian-50/20 flex flex-col items-center py-6 gap-6">
      {/* Logo */}
      <div className="text-3xl mb-4">🎯</div>

      {/* Navigation */}
      {navItems.map((item) => (
        <motion.button
          key={item.id}
          onClick={() => onViewChange(item.id as any)}
          className={`
            w-14 h-14 rounded-widget flex items-center justify-center
            transition-all duration-200 relative group
            ${currentView === item.id
              ? 'bg-neon-cyan/20 border border-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.3)]'
              : 'bg-obsidian-200 hover:bg-obsidian-100 border border-obsidian-50/20'
            }
          `}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="text-2xl">{item.icon}</span>

          {/* Tooltip */}
          <div className="absolute left-full ml-4 px-3 py-1 bg-obsidian-100 rounded-lg
                        opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap
                        pointer-events-none text-sm">
            {item.label}
          </div>
        </motion.button>
      ))}

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings */}
      <motion.button
        onClick={() => onViewChange('settings')}
        className={`
          w-14 h-14 rounded-widget flex items-center justify-center
          transition-all duration-200 relative group
          ${currentView === 'settings'
            ? 'bg-neon-cyan/20 border border-neon-cyan shadow-[0_0_15px_rgba(0,255,255,0.3)]'
            : 'bg-obsidian-200 hover:bg-obsidian-100 border border-obsidian-50/20'
          }
        `}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-2xl">⚙️</span>

        {/* Tooltip */}
        <div className="absolute left-full ml-4 px-3 py-1 bg-obsidian-100 rounded-lg
                      opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap
                      pointer-events-none text-sm">
          Settings
        </div>
      </motion.button>
    </div>
  );
}
