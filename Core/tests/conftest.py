import pytest
import os
import sys

# Point to SQLite BEFORE importing any app module so database.py picks it up
os.environ['DATABASE_URL'] = 'sqlite:///:memory:'

# Add Core/ to sys.path so that 'from app import ...' and 'from config import ...' work
_core_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if _core_dir not in sys.path:
    sys.path.insert(0, _core_dir)

from app import create_app
from config.database import engine, Base

@pytest.fixture(scope='session')
def app():
    """Create Flask app configured for testing."""
    app = create_app()
    app.config.update({
        'TESTING': True,
        'JWT_SECRET_KEY': 'test-secret-key-not-for-production',
    })
    # Create all tables in in-memory SQLite
    Base.metadata.create_all(bind=engine)
    yield app
    Base.metadata.drop_all(bind=engine)

@pytest.fixture()
def client(app):
    """Flask test client."""
    return app.test_client()
