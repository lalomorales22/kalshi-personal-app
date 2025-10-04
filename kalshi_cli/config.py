"""Configuration management for Kalshi CLI."""

import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv


class Config:
    """Configuration manager for Kalshi CLI."""

    def __init__(self):
        """Initialize configuration."""
        # Load .env file from current directory or parent
        env_path = Path.cwd() / '.env'
        if not env_path.exists():
            # Try parent directory
            env_path = Path.cwd().parent / '.env'

        if env_path.exists():
            load_dotenv(env_path)

        # API Configuration
        self.api_key_id: Optional[str] = os.getenv('KALSHI_API_KEY_ID')
        self.private_key: Optional[str] = os.getenv('KALSHI_PRIVATE_KEY')
        self.api_host: str = os.getenv(
            'KALSHI_API_HOST',
            'https://api.elections.kalshi.com/trade-api/v2'
        )

        # Database Configuration
        self.db_path: str = os.getenv('KALSHI_DB_PATH', 'kalshi.db')

        # CLI Configuration
        self.default_limit: int = int(os.getenv('KALSHI_DEFAULT_LIMIT', '20'))
        self.cache_ttl: int = int(os.getenv('KALSHI_CACHE_TTL', '300'))  # 5 minutes

    def is_configured(self) -> bool:
        """Check if API credentials are configured.

        Returns:
            True if both API key ID and private key are set
        """
        return bool(self.api_key_id and self.private_key)

    def get_missing_config(self) -> list[str]:
        """Get list of missing configuration items.

        Returns:
            List of missing config variable names
        """
        missing = []
        if not self.api_key_id:
            missing.append('KALSHI_API_KEY_ID')
        if not self.private_key:
            missing.append('KALSHI_PRIVATE_KEY')
        return missing


# Global config instance
config = Config()
