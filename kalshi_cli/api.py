"""Kalshi API wrapper for simplified interactions."""

import kalshi_python
from typing import Optional, List, Dict, Any
from .config import config


class KalshiAPI:
    """Wrapper for Kalshi Python SDK."""

    def __init__(self):
        """Initialize Kalshi API client."""
        self.client: Optional[kalshi_python.KalshiClient] = None
        self._initialize_client()

    def _initialize_client(self):
        """Initialize the Kalshi client with credentials from config."""
        if not config.is_configured():
            return

        configuration = kalshi_python.Configuration(host=config.api_host)
        configuration.api_key_id = config.api_key_id
        configuration.private_key_pem = config.private_key

        self.client = kalshi_python.KalshiClient(configuration)

    def test_auth(self) -> bool:
        """Test API authentication.

        Returns:
            True if authentication successful
        """
        try:
            self.client.get_balance()
            return True
        except Exception:
            return False

    # Balance & Portfolio
    def get_balance(self) -> Dict[str, Any]:
        """Get account balance.

        Returns:
            Balance information
        """
        response = self.client.get_balance()
        return response.to_dict() if hasattr(response, 'to_dict') else response

    def get_positions(self, ticker: Optional[str] = None,
                     event_ticker: Optional[str] = None,
                     count_down: Optional[int] = None,
                     count_up: Optional[int] = None,
                     limit: int = 100,
                     cursor: Optional[str] = None) -> Dict[str, Any]:
        """Get positions.

        Args:
            ticker: Filter by market ticker
            event_ticker: Filter by event ticker
            count_down: Filter positions with count down
            count_up: Filter positions with count up
            limit: Maximum number of results
            cursor: Pagination cursor

        Returns:
            Positions data with market_positions and event_positions
        """
        response = self.client.get_positions(
            ticker=ticker,
            event_ticker=event_ticker,
            count_down=count_down,
            count_up=count_up,
            limit=limit,
            cursor=cursor
        )
        return self._parse_response(response)

    def get_orders(self, ticker: Optional[str] = None,
                   status: Optional[str] = None,
                   limit: int = 100) -> List[Dict[str, Any]]:
        """Get orders.

        Args:
            ticker: Filter by market ticker
            status: Filter by status
            limit: Maximum number of results

        Returns:
            List of orders
        """
        response = self.client.get_orders(
            ticker=ticker,
            status=status,
            limit=limit
        )
        return self._parse_response(response)

    def get_fills(self, ticker: Optional[str] = None,
                  limit: int = 100,
                  cursor: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get fills.

        Args:
            ticker: Filter by market ticker
            limit: Maximum number of results
            cursor: Pagination cursor

        Returns:
            List of fills
        """
        response = self.client.get_fills(ticker=ticker, limit=limit, cursor=cursor)
        return self._parse_response(response)

    def get_settlements(self, limit: int = 100,
                       cursor: Optional[str] = None) -> Dict[str, Any]:
        """Get settlements.

        Args:
            limit: Maximum number of results
            cursor: Pagination cursor

        Returns:
            Settlements data with cursor
        """
        response = self.client.get_settlements(
            limit=limit,
            cursor=cursor
        )
        return self._parse_response(response)

    # Markets
    def get_markets(self, limit: int = 100,
                    cursor: Optional[str] = None,
                    event_ticker: Optional[str] = None,
                    series_ticker: Optional[str] = None,
                    status: Optional[str] = None,
                    tickers: Optional[str] = None) -> Dict[str, Any]:
        """Get markets.

        Args:
            limit: Maximum number of results
            cursor: Pagination cursor
            event_ticker: Filter by event ticker
            series_ticker: Filter by series ticker
            status: Filter by status
            tickers: Comma-separated list of tickers

        Returns:
            Markets response with data and cursor
        """
        response = self.client.get_markets(
            limit=limit,
            cursor=cursor,
            event_ticker=event_ticker,
            series_ticker=series_ticker,
            status=status,
            tickers=tickers
        )
        return self._parse_response(response)

    def get_market(self, ticker: str) -> Dict[str, Any]:
        """Get a single market.

        Args:
            ticker: Market ticker

        Returns:
            Market data
        """
        response = self.client.get_market(ticker)
        return self._parse_response(response)

    def get_market_orderbook(self, ticker: str, depth: int = 10) -> Dict[str, Any]:
        """Get market orderbook.

        Args:
            ticker: Market ticker
            depth: Orderbook depth

        Returns:
            Orderbook data
        """
        response = self.client.get_market_orderbook(ticker, depth=depth)
        return self._parse_response(response)

    # Events
    def get_events(self, limit: int = 100,
                   cursor: Optional[str] = None,
                   status: Optional[str] = None,
                   series_ticker: Optional[str] = None,
                   with_nested_markets: bool = False) -> Dict[str, Any]:
        """Get events.

        Args:
            limit: Maximum number of results
            cursor: Pagination cursor
            status: Filter by status
            series_ticker: Filter by series ticker
            with_nested_markets: Include markets within event objects

        Returns:
            Events data with cursor
        """
        response = self.client.get_events(
            limit=limit,
            cursor=cursor,
            status=status,
            series_ticker=series_ticker,
            with_nested_markets=with_nested_markets
        )
        return self._parse_response(response)

    def get_event(self, event_ticker: str, with_nested_markets: bool = False) -> Dict[str, Any]:
        """Get a single event.

        Args:
            event_ticker: Event ticker
            with_nested_markets: Include markets within event object

        Returns:
            Event data
        """
        response = self.client.get_event(event_ticker, with_nested_markets=with_nested_markets)
        return self._parse_response(response)

    # Series
    def get_series_list(self, status: Optional[str] = None) -> Dict[str, Any]:
        """Get series list.

        Args:
            status: Filter by status

        Returns:
            Series list data
        """
        response = self.client._series_api.get_series(status=status)
        return self._parse_response(response)

    def get_series(self, series_ticker: str) -> Dict[str, Any]:
        """Get a single series.

        Args:
            series_ticker: Series ticker

        Returns:
            Series data
        """
        response = self.client._series_api.get_series_by_ticker(series_ticker)
        return self._parse_response(response)

    def get_trades(self, ticker: Optional[str] = None,
                   limit: int = 100,
                   cursor: Optional[str] = None,
                   min_ts: Optional[int] = None,
                   max_ts: Optional[int] = None) -> Dict[str, Any]:
        """Get market trades.

        Args:
            ticker: Filter by market ticker
            limit: Maximum number of results
            cursor: Pagination cursor
            min_ts: Minimum timestamp
            max_ts: Maximum timestamp

        Returns:
            Trades data with cursor
        """
        response = self.client._markets_api.get_trades(
            ticker=ticker,
            limit=limit,
            cursor=cursor,
            min_ts=min_ts,
            max_ts=max_ts
        )
        return self._parse_response(response)

    # Trading
    def create_order(self, ticker: str, action: str, side: str,
                    count: int, client_order_id: Optional[str] = None,
                    type: str = "market", yes_price: Optional[int] = None,
                    no_price: Optional[int] = None,
                    expiration_ts: Optional[int] = None) -> Dict[str, Any]:
        """Create an order.

        Args:
            ticker: Market ticker
            action: 'buy' or 'sell'
            side: 'yes' or 'no'
            count: Number of contracts
            client_order_id: Optional client order ID
            type: 'market' or 'limit'
            yes_price: Yes price in cents (for limit orders)
            no_price: No price in cents (for limit orders)
            expiration_ts: Order expiration timestamp

        Returns:
            Order response
        """
        from kalshi_python.models.create_order_request import CreateOrderRequest

        order_request = CreateOrderRequest(
            ticker=ticker,
            action=action,
            side=side,
            count=count,
            client_order_id=client_order_id,
            type=type,
            yes_price=yes_price,
            no_price=no_price,
            expiration_ts=expiration_ts
        )

        response = self.client.create_order(order_request)
        return self._parse_response(response)

    def cancel_order(self, order_id: str) -> Dict[str, Any]:
        """Cancel an order.

        Args:
            order_id: Order ID

        Returns:
            Cancellation response
        """
        response = self.client.cancel_order(order_id)
        return self._parse_response(response)

    def batch_cancel_orders(self, order_ids: List[str]) -> Dict[str, Any]:
        """Batch cancel orders.

        Args:
            order_ids: List of order IDs

        Returns:
            Batch cancellation response
        """
        from kalshi_python.models.batch_cancel_orders_request import BatchCancelOrdersRequest

        request = BatchCancelOrdersRequest(order_ids=order_ids)
        response = self.client.batch_cancel_orders(request)
        return self._parse_response(response)

    # Helpers
    def _parse_response(self, response) -> Any:
        """Parse API response to dict.

        Args:
            response: API response object

        Returns:
            Parsed response data
        """
        if hasattr(response, 'to_dict'):
            return response.to_dict()
        return response


# Global API instance
api = KalshiAPI()
