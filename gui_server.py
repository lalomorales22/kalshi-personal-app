#!/usr/bin/env python3
"""FastAPI server for Kalshi GUI - bridges the CLI with the Electron app."""

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Set
import anthropic
import os
import asyncio
import json
from kalshi_cli.api import api
from kalshi_cli.config import config
from kalshi_websocket import get_ws_manager

app = FastAPI(title="Kalshi GUI Server")

# CORS middleware for Electron app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "file://"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Anthropic client for AI features
claude_client = None
if os.getenv("ANTHROPIC_API_KEY"):
    claude_client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections to GUI clients."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.kalshi_ws = get_ws_manager()
        self._setup_kalshi_callbacks()

    def _setup_kalshi_callbacks(self):
        """Set up callbacks to forward Kalshi WebSocket messages to GUI clients."""
        # Forward ticker updates
        self.kalshi_ws.on_message('ticker', self._broadcast_ticker)
        # Forward orderbook updates
        self.kalshi_ws.on_message('orderbook_snapshot', self._broadcast_orderbook)
        self.kalshi_ws.on_message('orderbook_delta', self._broadcast_orderbook)
        # Forward trade updates
        self.kalshi_ws.on_message('trade', self._broadcast_trade)
        # Forward fill updates
        self.kalshi_ws.on_message('fill', self._broadcast_fill)

    async def connect(self, websocket: WebSocket):
        """Accept a new WebSocket connection."""
        await websocket.accept()
        self.active_connections.add(websocket)
        print(f"✅ GUI client connected. Total: {len(self.active_connections)}")

    def disconnect(self, websocket: WebSocket):
        """Remove a WebSocket connection."""
        self.active_connections.discard(websocket)
        print(f"❌ GUI client disconnected. Total: {len(self.active_connections)}")

    async def broadcast(self, message: dict):
        """Broadcast message to all connected GUI clients."""
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)

        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

    async def _broadcast_ticker(self, data: dict):
        """Broadcast ticker updates."""
        await self.broadcast({"type": "ticker", "data": data})

    async def _broadcast_orderbook(self, data: dict):
        """Broadcast orderbook updates."""
        await self.broadcast({"type": "orderbook", "data": data})

    async def _broadcast_trade(self, data: dict):
        """Broadcast trade updates."""
        await self.broadcast({"type": "trade", "data": data})

    async def _broadcast_fill(self, data: dict):
        """Broadcast fill updates."""
        await self.broadcast({"type": "fill", "data": data})

connection_manager = ConnectionManager()


# Request/Response Models
class OrderRequest(BaseModel):
    ticker: str
    action: str  # 'buy' or 'sell'
    side: str  # 'yes' or 'no'
    count: int
    price: Optional[int] = None
    type: str = 'market'


class AIAnalyzeRequest(BaseModel):
    ticker: str
    question: Optional[str] = None


class AIChatRequest(BaseModel):
    message: str
    context: Optional[str] = None


# Health check
@app.get("/")
async def root():
    return {"status": "ok", "service": "Kalshi GUI Server"}


# Markets endpoints
@app.get("/markets")
async def get_markets(
    limit: int = 100,
    status: Optional[str] = None,
    event_ticker: Optional[str] = None,
    series_ticker: Optional[str] = None
):
    try:
        result = api.get_markets(
            limit=limit,
            status=status,
            event_ticker=event_ticker,
            series_ticker=series_ticker
        )
        # Handle both dict and list responses
        if isinstance(result, dict):
            return {"markets": result.get('markets', [])}
        return {"markets": result if isinstance(result, list) else []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/markets/{ticker}")
async def get_market(ticker: str):
    try:
        market = api.get_market(ticker)
        return {"market": market}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/markets/{ticker}/orderbook")
async def get_orderbook(ticker: str, depth: int = 10):
    try:
        orderbook = api.get_market_orderbook(ticker, depth=depth)
        return {"orderbook": orderbook}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/markets/search")
async def search_markets(q: str, limit: int = 50):
    try:
        # Search by keyword in title
        markets = api.get_markets(limit=limit)
        if isinstance(markets, dict):
            markets = markets.get('markets', [])

        # Filter markets by search query
        filtered = [
            m for m in markets
            if q.lower() in m.get('title', '').lower() or q.lower() in m.get('ticker', '').lower()
        ]
        return {"markets": filtered}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Portfolio endpoints
@app.get("/portfolio/balance")
async def get_balance():
    try:
        balance_data = api.get_balance()
        # Handle both dict with 'balance' key and direct value
        if isinstance(balance_data, dict):
            balance_cents = balance_data.get('balance', 0)
        else:
            balance_cents = balance_data

        return {"balance": balance_cents / 100}  # Convert cents to dollars
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/portfolio/positions")
async def get_positions():
    try:
        positions = api.get_positions()
        return {"positions": positions if isinstance(positions, list) else []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/portfolio/orders")
async def get_orders(status: Optional[str] = None):
    try:
        orders = api.get_orders(status=status)
        return {"orders": orders if isinstance(orders, list) else []}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# Trading endpoints
@app.post("/trade/order")
async def create_order(order: OrderRequest):
    try:
        result = api.create_order(
            ticker=order.ticker,
            action=order.action,
            side=order.side,
            count=order.count,
            type=order.type,
            yes_price=order.price if order.side == 'yes' else None,
            no_price=order.price if order.side == 'no' else None
        )
        return {"success": True, "order": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.delete("/trade/order/{order_id}")
async def cancel_order(order_id: str):
    try:
        result = api.cancel_order(order_id)
        return {"success": True, "result": result}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# AI endpoints
@app.post("/ai/analyze")
async def analyze_market(request: AIAnalyzeRequest):
    if not claude_client:
        raise HTTPException(status_code=503, detail="Claude API not configured. Set ANTHROPIC_API_KEY in .env")

    try:
        # Get market data
        market = api.get_market(request.ticker)
        orderbook = api.get_market_orderbook(request.ticker)

        # Build context for Claude
        context = f"""
Market: {market.get('title', request.ticker)}
Ticker: {request.ticker}
Status: {market.get('status', 'unknown')}
Yes Bid: {market.get('yes_bid', 'N/A')}¢ | Yes Ask: {market.get('yes_ask', 'N/A')}¢
No Bid: {market.get('no_bid', 'N/A')}¢ | No Ask: {market.get('no_ask', 'N/A')}¢
Volume: {market.get('volume', 0):,}
        """

        prompt = request.question or "Analyze this market and provide insights on potential trading opportunities."

        message = claude_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": f"{context}\n\nQuestion: {prompt}"
            }]
        )

        return {"response": message.content[0].text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/ai/chat")
async def chat(request: AIChatRequest):
    if not claude_client:
        raise HTTPException(status_code=503, detail="Claude API not configured. Set ANTHROPIC_API_KEY in .env")

    try:
        context_prefix = f"Context: {request.context}\n\n" if request.context else ""

        message = claude_client.messages.create(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=[{
                "role": "user",
                "content": f"{context_prefix}{request.message}"
            }]
        )

        return {"response": message.content[0].text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# WebSocket endpoints
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates to GUI."""
    await connection_manager.connect(websocket)

    try:
        while True:
            # Receive messages from GUI client
            data = await websocket.receive_text()
            message = json.loads(data)

            command = message.get('command')

            if command == 'subscribe':
                # Subscribe to Kalshi WebSocket channels
                channels = message.get('channels', [])
                market_tickers = message.get('market_tickers')

                # Connect to Kalshi WebSocket if not already connected
                if not connection_manager.kalshi_ws.is_connected:
                    await connection_manager.kalshi_ws.connect()

                # Subscribe to requested channels
                await connection_manager.kalshi_ws.subscribe(
                    channels=channels,
                    market_tickers=market_tickers
                )

                await websocket.send_json({
                    "type": "subscribed",
                    "channels": channels,
                    "market_tickers": market_tickers
                })

            elif command == 'unsubscribe':
                # Unsubscribe from channels
                channels = message.get('channels', [])
                market_tickers = message.get('market_tickers')

                await connection_manager.kalshi_ws.unsubscribe(
                    channels=channels,
                    market_tickers=market_tickers
                )

                await websocket.send_json({
                    "type": "unsubscribed",
                    "channels": channels,
                    "market_tickers": market_tickers
                })

    except WebSocketDisconnect:
        connection_manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        connection_manager.disconnect(websocket)


@app.on_event("startup")
async def startup_event():
    """Initialize Kalshi WebSocket connection on server startup."""
    print("🚀 Server starting...")
    # Don't block startup on WebSocket connection
    # Connection will be established when first GUI client subscribes
    print("   WebSocket will connect on first subscription.")


@app.on_event("shutdown")
async def shutdown_event():
    """Close Kalshi WebSocket connection on server shutdown."""
    print("🛑 Shutting down Kalshi WebSocket connection...")
    await connection_manager.kalshi_ws.close()


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
