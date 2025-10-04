"""Authentication commands."""

import click
from ..api import api
from ..display import print_success, print_error, print_info


@click.command()
def auth():
    """Test API authentication."""
    print_info("Testing Kalshi API authentication...")

    try:
        if api.test_auth():
            print_success("Authentication successful!")
            balance = api.get_balance()
            bal_cents = balance.get('balance', 0)
            print_info(f"Account balance: ${bal_cents / 100:.2f}")
        else:
            print_error("Authentication failed. Please check your API credentials.")
    except Exception as e:
        print_error(f"Authentication error: {str(e)}")
