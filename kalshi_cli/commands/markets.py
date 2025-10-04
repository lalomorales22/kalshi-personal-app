"""Market commands."""

import click
from ..api import api
from ..display import (
    display_markets, display_market_detail, display_orderbook,
    print_error, print_success, print_info
)
from ..db import Database
from ..config import config


@click.group()
def markets():
    """Market discovery and management."""
    pass


@markets.command()
@click.option('--status', help='Filter by status (open, closed, settled)')
@click.option('--event', help='Filter by event ticker')
@click.option('--series', help='Filter by series ticker')
@click.option('--limit', default=20, help='Number of markets to show')
def list(status, event, series, limit):
    """List markets with filters."""
    try:
        print_info("Fetching markets...")
        response = api.get_markets(
            status=status,
            event_ticker=event,
            series_ticker=series,
            limit=limit
        )

        markets_list = response.get('markets', [])
        display_markets(markets_list)

        # Show pagination info if available
        cursor = response.get('cursor')
        if cursor:
            print_info("More markets available. Use pagination in future version.")

    except Exception as e:
        print_error(f"Error fetching markets: {str(e)}")


@markets.command()
@click.argument('query')
@click.option('--limit', default=20, help='Number of results')
def search(query, limit):
    """Search markets by keyword."""
    try:
        print_info(f"Searching markets for '{query}'...")

        # Get all markets and filter by title/ticker
        response = api.get_markets(limit=100)
        all_markets = response.get('markets', [])

        # Simple search by title or ticker
        query_lower = query.lower()
        filtered = [
            m for m in all_markets
            if query_lower in m.get('title', '').lower()
            or query_lower in m.get('ticker', '').lower()
        ]

        display_markets(filtered[:limit])

    except Exception as e:
        print_error(f"Error searching markets: {str(e)}")


@markets.command()
@click.argument('ticker')
@click.option('--orderbook', is_flag=True, help='Show orderbook')
def view(ticker, orderbook):
    """View market details."""
    try:
        print_info(f"Fetching market {ticker}...")
        market = api.get_market(ticker)

        market_data = market.get('market', market)
        display_market_detail(market_data)

        if orderbook:
            print_info("Fetching orderbook...")
            ob = api.get_market_orderbook(ticker)
            orderbook_data = ob.get('orderbook', ob)
            display_orderbook(orderbook_data, ticker)

    except Exception as e:
        print_error(f"Error fetching market: {str(e)}")


@markets.command()
@click.argument('ticker')
def fav(ticker):
    """Add market to favorites."""
    try:
        with Database(config.db_path) as db:
            db.add_favorite(ticker)
            print_success(f"Added {ticker} to favorites")
    except Exception as e:
        print_error(f"Error adding favorite: {str(e)}")


@markets.command()
@click.argument('ticker')
def unfav(ticker):
    """Remove market from favorites."""
    try:
        with Database(config.db_path) as db:
            db.remove_favorite(ticker)
            print_success(f"Removed {ticker} from favorites")
    except Exception as e:
        print_error(f"Error removing favorite: {str(e)}")


@markets.command()
def favorites():
    """List favorite markets."""
    try:
        with Database(config.db_path) as db:
            favs = db.get_favorites()

        if not favs:
            print_info("No favorites yet. Use 'markets fav <ticker>' to add some!")
            return

        print_info(f"Fetching {len(favs)} favorite markets...")

        # Fetch market data for favorites
        markets_to_display = []
        for ticker in favs:
            try:
                market = api.get_market(ticker)
                markets_to_display.append(market.get('market', market))
            except Exception:
                continue

        display_markets(markets_to_display)

    except Exception as e:
        print_error(f"Error fetching favorites: {str(e)}")
