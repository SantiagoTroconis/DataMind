import os


class TestDatabaseConfig:
    """SEC-03: DATABASE_URL read from env — no hardcoded credentials."""

    def test_database_url_from_env(self):
        """database.py reads DATABASE_URL from environment variable."""
        # The conftest sets os.environ['DATABASE_URL'] = 'sqlite:///:memory:'
        # before any import. If database.py hardcodes the URL,
        # the engine would point to MySQL regardless of this env var.
        from config import database as db_config
        # The engine's URL must contain 'sqlite' (our test env value),
        # NOT 'mysql' (the old hardcoded value)
        engine_url = str(db_config.engine.url)
        assert 'mysql' not in engine_url, (
            f"DATABASE_URL is still hardcoded — engine points to: {engine_url}"
        )
        assert 'sqlite' in engine_url or os.getenv('DATABASE_URL') is not None
