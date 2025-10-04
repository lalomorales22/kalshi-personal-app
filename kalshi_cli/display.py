"""Rich formatting utilities for beautiful terminal output."""

from typing import List, Dict, Any, Optional
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.text import Text
from rich import box
from datetime import datetime


console = Console()


def print_error(message: str):
    """Print an error message.

    Args:
        message: Error message to display
    """
    console.print(f"[bold red]Error:[/bold red] {message}")


def print_success(message: str):
    """Print a success message.

    Args:
        message: Success message to display
    """
    console.print(f"[bold green]✓[/bold green] {message}")


def print_warning(message: str):
    """Print a warning message.

    Args:
        message: Warning message to display
    """
    console.print(f"[bold yellow]Warning:[/bold yellow] {message}")


def print_info(message: str):
    """Print an info message.

    Args:
        message: Info message to display
    """
    console.print(f"[bold cyan]ℹ[/bold cyan] {message}")


def format_price(price) -> str:
    """Format price to dollars.

    Args:
        price: Price in cents (int) or dollars (float)

    Returns:
        Formatted price string
    """
    if price is None:
        return "N/A"

    # Handle float prices (already in dollars)
    if isinstance(price, float):
        return f"${price:.2f}"

    # Handle int prices (in cents)
    return f"${price / 100:.2f}"


def format_timestamp(ts) -> str:
    """Format timestamp to readable date.

    Args:
        ts: Unix timestamp (int) or datetime object

    Returns:
        Formatted date string
    """
    if not ts:
        return "N/A"

    # Handle datetime objects directly
    if isinstance(ts, datetime):
        return ts.strftime("%Y-%m-%d %H:%M:%S")

    # Handle Unix timestamps
    return datetime.fromtimestamp(ts).strftime("%Y-%m-%d %H:%M:%S")


def display_balance(balance_data: Dict[str, Any]):
    """Display account balance.

    Args:
        balance_data: Balance information from API
    """
    table = Table(title="Account Balance", box=box.ROUNDED)
    table.add_column("Metric", style="cyan")
    table.add_column("Value", style="green", justify="right")

    # Balance response is simple: {'balance': 60}
    balance_cents = balance_data.get('balance', 0)
    table.add_row("Total Balance", format_price(balance_cents))

    console.print(table)


def display_positions(positions: List[Dict[str, Any]]):
    """Display positions.

    Args:
        positions: List of position data
    """
    if not positions:
        print_info("No positions found.")
        return

    table = Table(title="Positions", box=box.ROUNDED)
    table.add_column("Ticker", style="cyan")
    table.add_column("Side", style="magenta")
    table.add_column("Contracts", justify="right", style="yellow")
    table.add_column("Avg Price", justify="right")
    table.add_column("Current", justify="right")
    table.add_column("P&L", justify="right")

    for pos in positions:
        ticker = pos.get('market_ticker', 'N/A')
        # Position data may vary - adjust based on actual response structure
        contracts = str(pos.get('position', 0))
        avg_price = format_price(pos.get('average_price'))

        table.add_row(ticker, "Position", contracts, avg_price, "-", "-")

    console.print(table)


def display_orders(orders: List[Dict[str, Any]]):
    """Display orders.

    Args:
        orders: List of order data
    """
    if not orders:
        print_info("No orders found.")
        return

    table = Table(title="Orders", box=box.ROUNDED)
    table.add_column("Order ID", style="cyan")
    table.add_column("Ticker", style="magenta")
    table.add_column("Side", style="yellow")
    table.add_column("Action")
    table.add_column("Quantity", justify="right")
    table.add_column("Price", justify="right")
    table.add_column("Status", style="green")

    for order in orders:
        order_id = order.get('order_id', 'N/A')[:8] + "..."
        ticker = order.get('ticker', 'N/A')
        side = order.get('side', 'N/A')
        action = order.get('action', 'N/A')
        quantity = str(order.get('remaining_count', order.get('count', 0)))
        price = format_price(order.get('yes_price') or order.get('no_price'))
        status = order.get('status', 'N/A')

        # Color status
        status_color = "green" if status == "resting" else "yellow"
        status_text = f"[{status_color}]{status}[/{status_color}]"

        table.add_row(order_id, ticker, side, action, quantity, price, status_text)

    console.print(table)


def display_markets(markets: List[Dict[str, Any]]):
    """Display markets.

    Args:
        markets: List of market data
    """
    if not markets:
        print_info("No markets found.")
        return

    table = Table(title="Markets", box=box.ROUNDED)
    table.add_column("Ticker", style="cyan")
    table.add_column("Title", style="white", max_width=40)
    table.add_column("Yes", justify="right", style="green")
    table.add_column("No", justify="right", style="red")
    table.add_column("Volume", justify="right", style="yellow")
    table.add_column("Status", style="magenta")

    for market in markets:
        ticker = market.get('ticker', 'N/A')
        title = market.get('title', 'N/A')
        yes_price = format_price(market.get('yes_bid') or market.get('last_price'))
        no_price = format_price(market.get('no_bid'))
        volume = str(market.get('volume', 0))
        status = market.get('status', 'N/A')

        table.add_row(ticker, title, yes_price, no_price, volume, status)

    console.print(table)


def display_market_detail(market: Dict[str, Any]):
    """Display detailed market information.

    Args:
        market: Market data
    """
    ticker = market.get('ticker', 'N/A')
    title = market.get('title', 'N/A')

    # Create panel with title
    panel = Panel(
        f"[bold]{title}[/bold]\n\n"
        f"Ticker: [cyan]{ticker}[/cyan]\n"
        f"Status: [magenta]{market.get('status', 'N/A')}[/magenta]\n"
        f"Event: {market.get('event_ticker', 'N/A')}\n"
        f"Close Date: {format_timestamp(market.get('close_ts'))}\n\n"
        f"Yes Price: [green]{format_price(market.get('yes_bid'))}[/green]\n"
        f"No Price: [red]{format_price(market.get('no_bid'))}[/red]\n"
        f"Volume: [yellow]{market.get('volume', 0)}[/yellow]",
        title="Market Details",
        box=box.ROUNDED
    )

    console.print(panel)


def display_orderbook(orderbook: Dict[str, Any], ticker: str):
    """Display market orderbook.

    Args:
        orderbook: Orderbook data
        ticker: Market ticker
    """
    table = Table(title=f"Orderbook - {ticker}", box=box.ROUNDED)
    table.add_column("Yes Price", justify="right", style="green")
    table.add_column("Yes Size", justify="right")
    table.add_column("No Price", justify="right", style="red")
    table.add_column("No Size", justify="right")

    yes_orders = orderbook.get('yes', [])
    no_orders = orderbook.get('no', [])

    max_len = max(len(yes_orders), len(no_orders))

    for i in range(max_len):
        yes_price = format_price(yes_orders[i][0]) if i < len(yes_orders) else ""
        yes_size = str(yes_orders[i][1]) if i < len(yes_orders) else ""
        no_price = format_price(no_orders[i][0]) if i < len(no_orders) else ""
        no_size = str(no_orders[i][1]) if i < len(no_orders) else ""

        table.add_row(yes_price, yes_size, no_price, no_size)

    console.print(table)


def display_fills(fills: List[Dict[str, Any]]):
    """Display trade fills.

    Args:
        fills: List of fill data
    """
    if not fills:
        print_info("No fills found.")
        return

    table = Table(title="Fills", box=box.ROUNDED)
    table.add_column("Ticker", style="cyan")
    table.add_column("Side", style="magenta")
    table.add_column("Action")
    table.add_column("Count", justify="right", style="yellow")
    table.add_column("Price", justify="right")
    table.add_column("Time")

    for fill in fills:
        ticker = fill.get('ticker', 'N/A')
        side = fill.get('side', 'N/A')
        action = fill.get('action', 'N/A')
        count = str(fill.get('count', 0))
        # Fills have a 'price' field (not yes_price/no_price)
        price = format_price(fill.get('price'))
        created = format_timestamp(fill.get('created_time'))

        table.add_row(ticker, side, action, count, price, created)

    console.print(table)
