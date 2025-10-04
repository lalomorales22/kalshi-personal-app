"""Main CLI entry point for Kalshi trading app."""

import click
from .config import config
from .display import print_error, print_info


@click.group()
@click.version_option(version="0.1.0")
def cli():
    """Kalshi CLI - Fast trading terminal for prediction markets."""
    # Check if API is configured
    if not config.is_configured():
        missing = config.get_missing_config()
        print_error(
            f"Missing configuration: {', '.join(missing)}\n"
            "Please create a .env file with your Kalshi API credentials.\n"
            "See .env.example for the required format."
        )


@cli.command()
def init():
    """Initialize the database."""
    from .db import Database

    db = Database(config.db_path)
    db.init_db()
    print_info(f"Database initialized at {config.db_path}")


# Import and register command groups
def register_commands():
    """Register all command groups."""
    from .commands import auth, markets, portfolio, trade, database

    cli.add_command(auth.auth)
    cli.add_command(markets.markets)
    cli.add_command(portfolio.portfolio)
    cli.add_command(trade.trade)
    cli.add_command(database.db)


if __name__ == "__main__":
    register_commands()
    cli()
