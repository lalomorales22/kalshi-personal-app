# Kalshi Trading Platform

**Fast CLI and beautiful GUI for trading on Kalshi prediction markets.**

## 🚀 Quick Start

### Launch the GUI (Recommended)
```bash
./kalshi gui
```

### Or use the CLI
```bash
./kalshi markets list
./kalshi portfolio balance
./kalshi trade buy TICKER --side yes --quantity 10
```

---

## 📖 Table of Contents
- [Installation](#installation)
- [GUI Mode](#-gui-mode)
- [CLI Mode](#-cli-mode)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)
- [Development](#development)

---

## Installation

### Prerequisites
- Python 3.9+
- Node.js 20+ (for GUI)
- Kalshi API credentials ([Get them here](https://kalshi.com/account/api))
- Anthropic API key (optional, for AI features - [Get it here](https://console.anthropic.com/))

### 1. Install Dependencies

```bash
# Python dependencies
pip install -r requirements.txt
pip install -r requirements-gui.txt

# Node.js dependencies (for GUI)
cd gui && npm install && cd ..
```

### 2. Configure API Keys

Edit `.env` file:
```bash
# Required - Kalshi API
KALSHI_API_KEY_ID=your_api_key_id_here
KALSHI_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYour_Key_Here\n-----END RSA PRIVATE KEY-----"

# Optional - Claude AI for GUI
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### 3. Initialize Database
```bash
./kalshi init
```

---

## 🎨 GUI Mode

### Launch
```bash
./kalshi gui
```

This starts:
- FastAPI backend server (port 8000)
- Electron desktop application
- Automatic connection between components

### Features

#### 📊 Markets
- Search across all Kalshi markets
- Filter by status (open/closed/all)
- Real-time price updates
- Category browsing
- Volume and liquidity metrics

#### 💼 Portfolio
- Current balance display
- Active positions with P&L
- Order history and status
- Real-time updates

#### ⚡ Trading
- Quick buy/sell buttons
- Market and limit orders
- Live orderbook visualization
- Estimated cost calculator
- One-click execution

#### 🤖 AI Assistant (Claude)
- Natural language queries
- Market analysis
- Trading opportunities
- Portfolio insights
- Quick action buttons

**Example queries:**
- "What are the top trending markets?"
- "Find high-volume trading opportunities"
- "Analyze this market for me"
- "What's the best strategy for this market?"

### Design

**Black Obsidian Theme**
- Deep black background (#0a0a0a)
- Neon cyan accents (#00ffff)
- Glassmorphism effects
- Rounded widgets (12px radius)
- Smooth animations
- Emoji-based navigation

**Navigation Icons:**
- 📊 Markets
- 💼 Portfolio
- ⚡ Trade
- 🤖 AI Assistant
- ⚙️ Settings

### Architecture

```
./kalshi gui
     ↓
┌─────────────────────────────────────┐
│  Electron Desktop App               │
│  ┌───────────────────────────────┐  │
│  │  React + TypeScript Frontend  │  │
│  │  • Tailwind CSS               │  │
│  │  • Framer Motion              │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
                 ↕ HTTP
┌─────────────────────────────────────┐
│  FastAPI Server (Port 8000)         │
│  ┌───────────────────────────────┐  │
│  │  • Kalshi Python SDK          │  │
│  │  • Anthropic Claude API       │  │
│  │  • SQLite Database            │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## 💻 CLI Mode

The CLI provides fast command-line access to all trading functions.

### Authentication

Test your API connection:
```bash
./kalshi auth
```

### Portfolio Commands

```bash
# View balance
./kalshi portfolio balance

# View positions
./kalshi portfolio positions

# View orders
./kalshi portfolio orders
./kalshi portfolio orders --status resting

# View fills
./kalshi portfolio fills
```

### Market Commands

```bash
# List markets
./kalshi markets list
./kalshi markets list --status open --limit 50

# Search markets
./kalshi markets search "election"
./kalshi markets search "bitcoin"

# View market details
./kalshi markets view TICKER
./kalshi markets view TICKER --orderbook

# Manage favorites
./kalshi markets fav TICKER
./kalshi markets favorites
./kalshi markets unfav TICKER
```

### Trading Commands

```bash
# Buy orders
./kalshi trade buy TICKER --side yes --quantity 10
./kalshi trade buy TICKER --side yes --quantity 10 --price 55

# Sell orders
./kalshi trade sell TICKER --side yes --quantity 10
./kalshi trade sell TICKER --side yes --quantity 10 --price 65

# Cancel orders
./kalshi trade cancel ORDER_ID
./kalshi trade cancel-batch ORDER_ID_1 ORDER_ID_2 ORDER_ID_3
```

### Database Commands

```bash
# View trade history
./kalshi db history

# View watchlist
./kalshi db watchlist

# Reset database
./kalshi db reset
```

### Example Workflow

```bash
# Find a market
./kalshi markets search "trump"

# View details
./kalshi markets view KXPRES-2024-TRUMP

# Check balance
./kalshi portfolio balance

# Place a buy order
./kalshi trade buy KXPRES-2024-TRUMP --side yes --quantity 10 --price 52

# Check orders
./kalshi portfolio orders --status resting
```

---

## Configuration

### Environment Variables

Create/edit `.env`:

```bash
# Kalshi API (Required)
KALSHI_API_KEY_ID=your_api_key_id_here
KALSHI_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nYour_Key_Here\n-----END RSA PRIVATE KEY-----"

# Claude API (Optional - for AI features)
ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
```

### Database

The app uses SQLite (`kalshi.db`) to store:
- **markets** - Cached market data
- **favorites** - Your favorite markets
- **trade_history** - Local record of all trades
- **watchlist** - Markets to monitor
- **price_alerts** - Price alert thresholds

---

## Troubleshooting

### GUI won't start
```bash
# Reinstall dependencies
cd gui && npm install && cd ..
pip install -r requirements-gui.txt

# Check Node.js version
node --version  # Should be v20+
```

### Can't see markets
- Verify Kalshi API credentials in `.env`
- Check internet connection
- Look for errors in console (View > Developer Tools)

### AI not working
- Add `ANTHROPIC_API_KEY` to `.env`
- Restart GUI after adding key
- Verify key at https://console.anthropic.com/

### CLI authentication fails
- Verify `.env` file is in project directory
- Check API key ID and private key are correct
- Ensure private key includes BEGIN/END markers

### Database errors
```bash
# Initialize database
./kalshi init

# If corrupt, reset it
./kalshi db reset
```

---

## Development

### Tech Stack

**GUI:**
- React 18, TypeScript, Tailwind CSS
- Framer Motion (animations)
- Electron 33 (desktop wrapper)
- Vite (build tool)

**Backend:**
- FastAPI (REST API)
- Kalshi Python SDK
- Anthropic Claude API
- SQLite

**CLI:**
- Click (Python CLI framework)
- Rich (terminal formatting)

### Project Structure

```
kalshi/
├── gui/                          # Electron GUI app
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── MarketBrowser.tsx
│   │   │   ├── Portfolio.tsx
│   │   │   ├── TradingPanel.tsx
│   │   │   └── AIAssistant.tsx
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── electron/
│   │   ├── main.js
│   │   └── preload.js
│   └── package.json
├── kalshi_cli/                   # Python CLI
│   ├── cli.py
│   ├── api.py
│   ├── db.py
│   └── commands/
├── gui_server.py                 # FastAPI backend
├── kalshi                        # Launcher script
├── .env                          # API credentials
└── BUILD.md                      # Development history
```

### Development Mode

**GUI Development:**
```bash
# Terminal 1: Start backend
source kalshi_cli/venv/bin/activate
python3 gui_server.py

# Terminal 2: Start frontend
cd gui && npm run electron:dev
```

**Build for Production:**
```bash
cd gui
npm run build
npm run electron:build
```

### API Endpoints

**Markets:**
- `GET /markets` - List markets
- `GET /markets/{ticker}` - Market details
- `GET /markets/{ticker}/orderbook` - Orderbook
- `GET /markets/search?q={query}` - Search

**Portfolio:**
- `GET /portfolio/balance` - Balance
- `GET /portfolio/positions` - Positions
- `GET /portfolio/orders` - Orders

**Trading:**
- `POST /trade/order` - Create order
- `DELETE /trade/order/{id}` - Cancel order

**AI:**
- `POST /ai/analyze` - Market analysis
- `POST /ai/chat` - Chat with Claude

---

## Tips

### CLI Tips
1. Use favorites for markets you trade frequently
2. Check orderbook before placing limit orders
3. Use `--no-confirm` for rapid trading (be careful!)
4. Monitor fills to track execution
5. Check trade history in database for local records

### GUI Tips
1. Use AI Assistant for market insights
2. Quick action buttons in AI chat for common queries
3. Click markets in browser to open trading panel
4. View orderbook before placing orders
5. Monitor positions in Portfolio tab

---

## Features

**Completed:**
- ✅ CLI with full trading functionality
- ✅ Beautiful black obsidian GUI
- ✅ Market browsing and search
- ✅ Portfolio tracking
- ✅ Quick trading interface
- ✅ AI-powered insights (Claude)
- ✅ SQLite database
- ✅ One-command launch (`./kalshi gui`)

**Coming Soon:**
- Keyboard shortcuts
- Price charts/graphs
- Real-time WebSocket updates
- Price alerts with notifications
- Multiple windows
- Analytics dashboard
- Trade history export

---

## License

MIT License - See BUILD.md for development history.

---

**Built with ❤️ using Claude Code**

For detailed build information, see [BUILD.md](BUILD.md)
