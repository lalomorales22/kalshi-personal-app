"""Database module for SQLite operations."""

import sqlite3
from pathlib import Path
from typing import Optional, List, Dict, Any
from datetime import datetime


class Database:
    """SQLite database manager for Kalshi CLI."""

    def __init__(self, db_path: str = "kalshi.db"):
        """Initialize database connection.

        Args:
            db_path: Path to SQLite database file
        """
        self.db_path = Path(db_path)
        self.conn: Optional[sqlite3.Connection] = None

    def connect(self):
        """Establish database connection."""
        self.conn = sqlite3.connect(self.db_path)
        self.conn.row_factory = sqlite3.Row  # Enable column access by name

    def close(self):
        """Close database connection."""
        if self.conn:
            self.conn.close()

    def __enter__(self):
        """Context manager entry."""
        self.connect()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit."""
        self.close()

    def init_db(self):
        """Initialize database schema."""
        self.connect()
        cursor = self.conn.cursor()

        # Markets table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS markets (
                ticker TEXT PRIMARY KEY,
                event_ticker TEXT,
                title TEXT,
                status TEXT,
                yes_price INTEGER,
                no_price INTEGER,
                volume INTEGER,
                close_ts INTEGER,
                last_updated INTEGER
            )
        """)

        # Favorites table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS favorites (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT UNIQUE,
                added_ts INTEGER
            )
        """)

        # Trade history table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS trade_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                order_id TEXT,
                ticker TEXT,
                side TEXT,
                action TEXT,
                quantity INTEGER,
                price INTEGER,
                status TEXT,
                created_ts INTEGER
            )
        """)

        # Watchlist table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS watchlist (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT UNIQUE,
                note TEXT,
                added_ts INTEGER
            )
        """)

        # Price alerts table
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS price_alerts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ticker TEXT,
                side TEXT,
                target_price INTEGER,
                created_ts INTEGER,
                triggered INTEGER DEFAULT 0
            )
        """)

        self.conn.commit()
        self.close()

    # Market operations
    def cache_market(self, market_data: Dict[str, Any]):
        """Cache market data locally.

        Args:
            market_data: Market information from API
        """
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO markets
            (ticker, event_ticker, title, status, yes_price, no_price, volume, close_ts, last_updated)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            market_data.get('ticker'),
            market_data.get('event_ticker'),
            market_data.get('title'),
            market_data.get('status'),
            market_data.get('yes_price'),
            market_data.get('no_price'),
            market_data.get('volume'),
            market_data.get('close_ts'),
            int(datetime.now().timestamp())
        ))
        self.conn.commit()

    def get_cached_market(self, ticker: str) -> Optional[Dict[str, Any]]:
        """Get cached market data.

        Args:
            ticker: Market ticker

        Returns:
            Market data dict or None
        """
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM markets WHERE ticker = ?", (ticker,))
        row = cursor.fetchone()
        return dict(row) if row else None

    # Favorites operations
    def add_favorite(self, ticker: str):
        """Add market to favorites.

        Args:
            ticker: Market ticker
        """
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT OR IGNORE INTO favorites (ticker, added_ts)
            VALUES (?, ?)
        """, (ticker, int(datetime.now().timestamp())))
        self.conn.commit()

    def remove_favorite(self, ticker: str):
        """Remove market from favorites.

        Args:
            ticker: Market ticker
        """
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM favorites WHERE ticker = ?", (ticker,))
        self.conn.commit()

    def get_favorites(self) -> List[str]:
        """Get all favorite tickers.

        Returns:
            List of ticker strings
        """
        cursor = self.conn.cursor()
        cursor.execute("SELECT ticker FROM favorites ORDER BY added_ts DESC")
        return [row['ticker'] for row in cursor.fetchall()]

    # Trade history operations
    def log_trade(self, order_id: str, ticker: str, side: str, action: str,
                  quantity: int, price: int, status: str):
        """Log a trade to history.

        Args:
            order_id: Order ID
            ticker: Market ticker
            side: 'yes' or 'no'
            action: 'buy' or 'sell'
            quantity: Number of contracts
            price: Price in cents
            status: Order status
        """
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO trade_history
            (order_id, ticker, side, action, quantity, price, status, created_ts)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (order_id, ticker, side, action, quantity, price, status,
              int(datetime.now().timestamp())))
        self.conn.commit()

    def get_trade_history(self, limit: int = 50) -> List[Dict[str, Any]]:
        """Get trade history.

        Args:
            limit: Maximum number of trades to return

        Returns:
            List of trade dicts
        """
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT * FROM trade_history
            ORDER BY created_ts DESC
            LIMIT ?
        """, (limit,))
        return [dict(row) for row in cursor.fetchall()]

    # Watchlist operations
    def add_to_watchlist(self, ticker: str, note: str = ""):
        """Add market to watchlist.

        Args:
            ticker: Market ticker
            note: Optional note
        """
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT OR REPLACE INTO watchlist (ticker, note, added_ts)
            VALUES (?, ?, ?)
        """, (ticker, note, int(datetime.now().timestamp())))
        self.conn.commit()

    def remove_from_watchlist(self, ticker: str):
        """Remove market from watchlist.

        Args:
            ticker: Market ticker
        """
        cursor = self.conn.cursor()
        cursor.execute("DELETE FROM watchlist WHERE ticker = ?", (ticker,))
        self.conn.commit()

    def get_watchlist(self) -> List[Dict[str, Any]]:
        """Get watchlist.

        Returns:
            List of watchlist items
        """
        cursor = self.conn.cursor()
        cursor.execute("SELECT * FROM watchlist ORDER BY added_ts DESC")
        return [dict(row) for row in cursor.fetchall()]

    # Price alerts operations
    def add_price_alert(self, ticker: str, side: str, target_price: int):
        """Add a price alert.

        Args:
            ticker: Market ticker
            side: 'yes' or 'no'
            target_price: Target price in cents
        """
        cursor = self.conn.cursor()
        cursor.execute("""
            INSERT INTO price_alerts (ticker, side, target_price, created_ts)
            VALUES (?, ?, ?, ?)
        """, (ticker, side, target_price, int(datetime.now().timestamp())))
        self.conn.commit()

    def get_active_alerts(self) -> List[Dict[str, Any]]:
        """Get active price alerts.

        Returns:
            List of alert dicts
        """
        cursor = self.conn.cursor()
        cursor.execute("""
            SELECT * FROM price_alerts
            WHERE triggered = 0
            ORDER BY created_ts DESC
        """)
        return [dict(row) for row in cursor.fetchall()]

    def trigger_alert(self, alert_id: int):
        """Mark alert as triggered.

        Args:
            alert_id: Alert ID
        """
        cursor = self.conn.cursor()
        cursor.execute("""
            UPDATE price_alerts
            SET triggered = 1
            WHERE id = ?
        """, (alert_id,))
        self.conn.commit()
