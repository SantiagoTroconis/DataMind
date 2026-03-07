import pytest
from datetime import timezone
from flask_jwt_extended import decode_token


class TestRegister:
    """AUTH-01: User can register with email and password."""

    def test_register_returns_jwt(self, client):
        """POST /auth/register returns token + user on valid input."""
        resp = client.post('/auth/register', json={
            'email': 'newuser@example.com',
            'password': 'password123'
        })
        assert resp.status_code == 201
        data = resp.get_json()
        assert 'token' in data
        assert 'user' in data
        assert data['user']['email'] == 'newuser@example.com'

    def test_register_duplicate_email(self, client):
        """POST /auth/register returns 400 when email already registered."""
        payload = {'email': 'duplicate@example.com', 'password': 'password123'}
        client.post('/auth/register', json=payload)  # first registration
        resp = client.post('/auth/register', json=payload)  # duplicate
        assert resp.status_code == 400
        data = resp.get_json()
        assert 'error' in data

    def test_register_short_password(self, client):
        """POST /auth/register returns 400 when password < 8 characters."""
        resp = client.post('/auth/register', json={
            'email': 'short@example.com',
            'password': '1234567'  # 7 chars — too short
        })
        assert resp.status_code == 400
        data = resp.get_json()
        assert 'error' in data


class TestLogin:
    """AUTH-02: User can log in and maintain session across reloads."""

    def test_login_token_expiry(self, client, app):
        """POST /auth/login returns JWT with 7-day expiry."""
        # Register first
        client.post('/auth/register', json={
            'email': 'logintest@example.com',
            'password': 'password123'
        })
        resp = client.post('/auth/login', json={
            'email': 'logintest@example.com',
            'password': 'password123'
        })
        assert resp.status_code == 200
        data = resp.get_json()
        assert 'token' in data
        # Decode and check expiry is approximately 7 days
        with app.app_context():
            decoded = decode_token(data['token'])
        exp = decoded['exp']
        iat = decoded['iat']
        duration_seconds = exp - iat
        # Should be 7 days = 604800 seconds (allow ±60s tolerance)
        assert abs(duration_seconds - 604800) < 60, (
            f"Token duration {duration_seconds}s is not ~7 days (604800s)"
        )

    def test_login_invalid_credentials(self, client):
        """POST /auth/login returns 400 for wrong credentials."""
        resp = client.post('/auth/login', json={
            'email': 'nobody@example.com',
            'password': 'wrongpassword'
        })
        assert resp.status_code == 400
        data = resp.get_json()
        assert 'error' in data
