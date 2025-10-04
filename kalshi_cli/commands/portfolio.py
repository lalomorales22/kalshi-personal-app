"""Portfolio commands."""

import click
from ..api import api
from ..display import (
    display_balance, display_positions, display_orders, display_fills,
    print_error, print_info
)


@click.group()
def portfolio():
    """Portfolio management."""
    pass


@portfolio.command()
def balance():
    """Show account balance."""
    try:
        print_info("Fetching balance...")
        balance_data = api.get_balance()
        display_balance(balance_data)
    except Exception as e:
        print_error(f"Error fetching balance: {str(e)}")


@portfolio.command()
@click.option('--ticker', help='Filter by market ticker')
@click.option('--event', help='Filter by event ticker')
@click.option('--limit', default=50, help='Number of positions to show')
def positions(ticker, event, limit):
    """Show current positions."""
    try:
        print_info("Fetching positions...")
        positions_list = api.get_positions(
            ticker=ticker,
            event_ticker=event,
            limit=limit
        )

        # Handle both dict and list responses
        if isinstance(positions_list, dict):
            positions_list = positions_list.get('positions', [])

        display_positions(positions_list)
    except Exception as e:
        print_error(f"Error fetching positions: {str(e)}")


@portfolio.command()
@click.option('--ticker', help='Filter by market ticker')
@click.option('--status', help='Filter by status (resting, canceled, executed)')
@click.option('--limit', default=50, help='Number of orders to show')
def orders(ticker, status, limit):
    """Show orders."""
    try:
        print_info("Fetching orders...")
        orders_list = api.get_orders(
            ticker=ticker,
            status=status,
            limit=limit
        )

        # Handle both dict and list responses
        if isinstance(orders_list, dict):
            orders_list = orders_list.get('orders', [])

        display_orders(orders_list)
    except Exception as e:
        print_error(f"Error fetching orders: {str(e)}")


@portfolio.command()
@click.option('--ticker', help='Filter by market ticker')
@click.option('--limit', default=50, help='Number of fills to show')
def fills(ticker, limit):
    """Show trade fills."""
    try:
        print_info("Fetching fills...")
        fills_list = api.get_fills(ticker=ticker, limit=limit)

        # Handle both dict and list responses
        if isinstance(fills_list, dict):
            fills_list = fills_list.get('fills', [])

        display_fills(fills_list)
    except Exception as e:
        print_error(f"Error fetching fills: {str(e)}")
