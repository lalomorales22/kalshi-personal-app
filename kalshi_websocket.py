"""
WebSocket manager for Kalshi real-time data streaming.
Handles connection, authentication, subscriptions, and message broadcasting.
"""

import asyncio
import json
import time
import hmac
import hashlib
import base64
import os
from typing import Set, Dict, Callable, Optional
from dotenv import load_dotenv

try:
    import websockets
    from websockets.exceptions import ConnectionClosed
except ImportError:
    print("⚠️ websockets library not found. Install with: pip install websockets")
    raise

# Load environment variables
load_dotenv()


class KalshiWebSocketManager:
    """Manages WebSocket connections to Kalshi API for real-time updates."""

    def __init__(self):
        self.api_key_id = os.getenv('KALSHI_API_KEY_ID')
        self.private_key = os.getenv('KALSHI_PRIVATE_KEY')

        if not self.api_key_id or not self.private_key:
            raise ValueError("KALSHI_API_KEY_ID and KALSHI_PRIVATE_KEY must be set in .env file")

        self.ws_url = "wss://api.elections.kalshi.com/trade-api/ws/v2"
        self.connection = None
        self.is_connected = False
        self.subscriptions: Set[str] = set()
        self.callbacks: Dict[str, list] = {}
        self.reconnect_delay = 1  # Start with 1 second
        self.max_reconnect_delay = 60  # Max 60 seconds
        self.message_id = 0

    def _generate_signature(self, timestamp: str) -> str:
        """Generate HMAC signature for WebSocket authentication."""
        # For WebSocket, we sign the timestamp
        message = timestamp.encode('utf-8')
        private_key = self.private_key.encode('utf-8')
        signature = hmac.new(private_key, message, hashlib.sha256).digest()
        return base64.b64encode(signature).decode('utf-8')

    async def connect(self):
        """Establish WebSocket connection with authentication."""
        try:
            # Generate authentication headers
            timestamp = str(int(time.time() * 1000))
            signature = self._generate_signature(timestamp)

            headers = {
                'KALSHI-ACCESS-KEY': self.api_key_id,
                'KALSHI-ACCESS-SIGNATURE': signature,
                'KALSHI-ACCESS-TIMESTAMP': timestamp
            }

            print(f"🔌 Connecting to Kalshi WebSocket...")
            self.connection = await websockets.connect(
                self.ws_url,
                extra_headers=headers,
                ping_interval=20,
                ping_timeout=10
            )

            self.is_connected = True
            self.reconnect_delay = 1  # Reset reconnect delay on success
            print(f"✅ WebSocket connected!")

            # Start message receiver
            asyncio.create_task(self._receive_messages())

            # Resubscribe to previous subscriptions if any
            if self.subscriptions:
                await self._resubscribe()

        except Exception as e:
            print(f"❌ WebSocket connection failed: {e}")
            self.is_connected = False
            await self._schedule_reconnect()

    async def _receive_messages(self):
        """Receive and process messages from WebSocket."""
        try:
            async for message in self.connection:
                await self._process_message(message)
        except ConnectionClosed:
            print("⚠️ WebSocket connection closed")
            self.is_connected = False
            await self._schedule_reconnect()
        except Exception as e:
            print(f"❌ Error receiving messages: {e}")
            self.is_connected = False
            await self._schedule_reconnect()

    async def _process_message(self, message: str):
        """Process incoming WebSocket message."""
        try:
            data = json.loads(message)
            msg_type = data.get('type') or data.get('msg')

            # Handle different message types
            if msg_type == 'error':
                print(f"⚠️ WebSocket error: {data.get('msg', 'Unknown error')}")
                return

            # Trigger callbacks for this message type
            if msg_type in self.callbacks:
                for callback in self.callbacks[msg_type]:
                    try:
                        if asyncio.iscoroutinefunction(callback):
                            await callback(data)
                        else:
                            callback(data)
                    except Exception as e:
                        print(f"❌ Error in callback for {msg_type}: {e}")

        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse WebSocket message: {e}")

    async def subscribe(self, channels: list, market_tickers: Optional[list] = None):
        """Subscribe to WebSocket channels."""
        if not self.is_connected:
            print("⚠️ Not connected. Attempting to connect...")
            await self.connect()

        self.message_id += 1

        params = {"channels": channels}
        if market_tickers:
            params["market_tickers"] = market_tickers

        message = {
            "id": self.message_id,
            "cmd": "subscribe",
            "params": params
        }

        try:
            await self.connection.send(json.dumps(message))

            # Track subscriptions
            for channel in channels:
                self.subscriptions.add(channel)

            print(f"📡 Subscribed to channels: {channels}")
            if market_tickers:
                print(f"   Markets: {market_tickers}")

        except Exception as e:
            print(f"❌ Failed to subscribe: {e}")

    async def unsubscribe(self, channels: list, market_tickers: Optional[list] = None):
        """Unsubscribe from WebSocket channels."""
        if not self.is_connected:
            return

        self.message_id += 1

        params = {"channels": channels}
        if market_tickers:
            params["market_tickers"] = market_tickers

        message = {
            "id": self.message_id,
            "cmd": "unsubscribe",
            "params": params
        }

        try:
            await self.connection.send(json.dumps(message))

            # Remove from tracked subscriptions
            for channel in channels:
                self.subscriptions.discard(channel)

            print(f"🔕 Unsubscribed from channels: {channels}")

        except Exception as e:
            print(f"❌ Failed to unsubscribe: {e}")

    async def _resubscribe(self):
        """Resubscribe to all previous subscriptions after reconnect."""
        if self.subscriptions:
            channels = list(self.subscriptions)
            self.subscriptions.clear()  # Clear to avoid duplicates
            await self.subscribe(channels)

    async def _schedule_reconnect(self):
        """Schedule reconnection with exponential backoff."""
        print(f"🔄 Reconnecting in {self.reconnect_delay} seconds...")
        await asyncio.sleep(self.reconnect_delay)

        # Increase delay for next time (exponential backoff)
        self.reconnect_delay = min(self.reconnect_delay * 2, self.max_reconnect_delay)

        await self.connect()

    def on_message(self, msg_type: str, callback: Callable):
        """Register a callback for specific message type."""
        if msg_type not in self.callbacks:
            self.callbacks[msg_type] = []
        self.callbacks[msg_type].append(callback)

    async def close(self):
        """Close WebSocket connection."""
        if self.connection:
            await self.connection.close()
            self.is_connected = False
            print("🔌 WebSocket disconnected")


# Singleton instance
_ws_manager = None

def get_ws_manager() -> KalshiWebSocketManager:
    """Get or create the global WebSocket manager instance."""
    global _ws_manager
    if _ws_manager is None:
        _ws_manager = KalshiWebSocketManager()
    return _ws_manager
