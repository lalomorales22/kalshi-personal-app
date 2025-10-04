"""Trading commands."""

import click
from ..api import api
from ..display import print_success, print_error, print_info
from ..db import Database
from ..config import config


@click.group()
def trade():
    """Trading operations."""
    pass


@trade.command()
@click.argument('ticker')
@click.option('--side', type=click.Choice(['yes', 'no']), required=True, help='Side to buy')
@click.option('--quantity', type=int, required=True, help='Number of contracts')
@click.option('--price', type=int, help='Limit price in cents (omit for market order)')
@click.option('--confirm/--no-confirm', default=True, help='Confirm before placing order')
def buy(ticker, side, quantity, price, confirm):
    """Place a buy order."""
    try:
        # Determine order type
        order_type = "limit" if price else "market"

        # Show order summary
        print_info(f"Order Summary:")
        print_info(f"  Ticker: {ticker}")
        print_info(f"  Action: BUY")
        print_info(f"  Side: {side.upper()}")
        print_info(f"  Quantity: {quantity}")
        print_info(f"  Type: {order_type.upper()}")
        if price:
            print_info(f"  Price: ${price / 100:.2f}")

        # Confirm
        if confirm and not click.confirm("Place this order?"):
            print_info("Order cancelled.")
            return

        # Place order
        print_info("Placing order...")

        order_params = {
            'ticker': ticker,
            'action': 'buy',
            'side': side,
            'count': quantity,
            'type': order_type
        }

        if price:
            if side == 'yes':
                order_params['yes_price'] = price
            else:
                order_params['no_price'] = price

        response = api.create_order(**order_params)

        order = response.get('order', response)
        order_id = order.get('order_id', 'N/A')

        print_success(f"Order placed! Order ID: {order_id}")

        # Log to database
        with Database(config.db_path) as db:
            db.log_trade(
                order_id=order_id,
                ticker=ticker,
                side=side,
                action='buy',
                quantity=quantity,
                price=price or 0,
                status=order.get('status', 'unknown')
            )

    except Exception as e:
        print_error(f"Error placing order: {str(e)}")


@trade.command()
@click.argument('ticker')
@click.option('--side', type=click.Choice(['yes', 'no']), required=True, help='Side to sell')
@click.option('--quantity', type=int, required=True, help='Number of contracts')
@click.option('--price', type=int, help='Limit price in cents (omit for market order)')
@click.option('--confirm/--no-confirm', default=True, help='Confirm before placing order')
def sell(ticker, side, quantity, price, confirm):
    """Place a sell order."""
    try:
        # Determine order type
        order_type = "limit" if price else "market"

        # Show order summary
        print_info(f"Order Summary:")
        print_info(f"  Ticker: {ticker}")
        print_info(f"  Action: SELL")
        print_info(f"  Side: {side.upper()}")
        print_info(f"  Quantity: {quantity}")
        print_info(f"  Type: {order_type.upper()}")
        if price:
            print_info(f"  Price: ${price / 100:.2f}")

        # Confirm
        if confirm and not click.confirm("Place this order?"):
            print_info("Order cancelled.")
            return

        # Place order
        print_info("Placing order...")

        order_params = {
            'ticker': ticker,
            'action': 'sell',
            'side': side,
            'count': quantity,
            'type': order_type
        }

        if price:
            if side == 'yes':
                order_params['yes_price'] = price
            else:
                order_params['no_price'] = price

        response = api.create_order(**order_params)

        order = response.get('order', response)
        order_id = order.get('order_id', 'N/A')

        print_success(f"Order placed! Order ID: {order_id}")

        # Log to database
        with Database(config.db_path) as db:
            db.log_trade(
                order_id=order_id,
                ticker=ticker,
                side=side,
                action='sell',
                quantity=quantity,
                price=price or 0,
                status=order.get('status', 'unknown')
            )

    except Exception as e:
        print_error(f"Error placing order: {str(e)}")


@trade.command()
@click.argument('order_id')
@click.option('--confirm/--no-confirm', default=True, help='Confirm before canceling')
def cancel(order_id, confirm):
    """Cancel an order."""
    try:
        if confirm and not click.confirm(f"Cancel order {order_id}?"):
            print_info("Cancellation aborted.")
            return

        print_info(f"Canceling order {order_id}...")
        response = api.cancel_order(order_id)

        print_success(f"Order {order_id} cancelled successfully!")

    except Exception as e:
        print_error(f"Error canceling order: {str(e)}")


@trade.command()
@click.argument('order_ids', nargs=-1)
@click.option('--confirm/--no-confirm', default=True, help='Confirm before canceling')
def cancel_batch(order_ids, confirm):
    """Cancel multiple orders at once."""
    try:
        if not order_ids:
            print_error("Please provide at least one order ID")
            return

        order_ids_list = list(order_ids)

        if confirm and not click.confirm(f"Cancel {len(order_ids_list)} orders?"):
            print_info("Cancellation aborted.")
            return

        print_info(f"Canceling {len(order_ids_list)} orders...")
        response = api.batch_cancel_orders(order_ids_list)

        print_success(f"Batch cancellation completed!")

    except Exception as e:
        print_error(f"Error canceling orders: {str(e)}")
