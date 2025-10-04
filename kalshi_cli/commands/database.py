"""Database commands."""

import click
from ..db import Database
from ..config import config
from ..display import print_success, print_error, print_info


@click.group()
def db():
    """Database management."""
    pass


@db.command()
def init():
    """Initialize the database."""
    try:
        database = Database(config.db_path)
        database.init_db()
        print_success(f"Database initialized at {config.db_path}")
    except Exception as e:
        print_error(f"Error initializing database: {str(e)}")


@db.command()
@click.option('--confirm/--no-confirm', default=True, help='Confirm before resetting')
def reset(confirm):
    """Reset the database (WARNING: deletes all local data)."""
    if confirm and not click.confirm(
        "This will delete ALL local data. Continue?"
    ):
        print_info("Reset cancelled.")
        return

    try:
        import os
        db_path = config.db_path

        if os.path.exists(db_path):
            os.remove(db_path)
            print_info(f"Deleted {db_path}")

        database = Database(db_path)
        database.init_db()
        print_success("Database reset successfully!")

    except Exception as e:
        print_error(f"Error resetting database: {str(e)}")


@db.command()
def history():
    """Show trade history from database."""
    try:
        with Database(config.db_path) as database:
            trades = database.get_trade_history(limit=50)

        if not trades:
            print_info("No trade history found.")
            return

        from rich.table import Table
        from rich import box
        from ..display import console, format_timestamp, format_price

        table = Table(title="Trade History", box=box.ROUNDED)
        table.add_column("Time", style="cyan")
        table.add_column("Ticker", style="magenta")
        table.add_column("Action", style="yellow")
        table.add_column("Side")
        table.add_column("Qty", justify="right")
        table.add_column("Price", justify="right")
        table.add_column("Status", style="green")

        for trade in trades:
            table.add_row(
                format_timestamp(trade['created_ts']),
                trade['ticker'],
                trade['action'].upper(),
                trade['side'].upper(),
                str(trade['quantity']),
                format_price(trade['price']),
                trade['status']
            )

        console.print(table)

    except Exception as e:
        print_error(f"Error fetching trade history: {str(e)}")


@db.command()
def watchlist():
    """Show watchlist."""
    try:
        with Database(config.db_path) as database:
            items = database.get_watchlist()

        if not items:
            print_info("Watchlist is empty.")
            return

        from rich.table import Table
        from rich import box
        from ..display import console

        table = Table(title="Watchlist", box=box.ROUNDED)
        table.add_column("Ticker", style="cyan")
        table.add_column("Note", style="white")

        for item in items:
            table.add_row(item['ticker'], item['note'] or '')

        console.print(table)

    except Exception as e:
        print_error(f"Error fetching watchlist: {str(e)}")
