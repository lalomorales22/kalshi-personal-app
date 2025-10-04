#!/usr/bin/env python3
"""Main entry point for Kalshi CLI."""

from kalshi_cli.cli import cli, register_commands

if __name__ == "__main__":
    register_commands()
    cli()
