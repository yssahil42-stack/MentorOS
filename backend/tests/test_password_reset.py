import pytest
from fastapi.testclient import TestClient
from backend.app.main import app
from backend.app.routers.auth import create_access_token

client = TestClient(app)

def test_forgot_password_and_reset_flow():
    # 1. Register a test user
    email = "forgot_test_user@mentoros.dev"
    client.post(
        "/api/v1/auth/register",
        json={
            "email": email,
            "full_name": "Forgot Tester",
            "password": "OldPassword123!",
            "role": "student",
        },
    )

    # 2. Call forgot password
    resp = client.post(
        "/api/v1/auth/forgot-password",
        json={"email": email},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "reset_token" in data
    token = data["reset_token"]

    # 3. Verify reset token
    verify_resp = client.post(
        "/api/v1/auth/verify-reset-token",
        json={"token": token},
    )
    assert verify_resp.status_code == 200
    assert verify_resp.json()["valid"] is True
    assert verify_resp.json()["email"] == email

    # 4. Attempt reset with short password (should fail validation)
    fail_resp = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "short"},
    )
    assert fail_resp.status_code == 422

    # 5. Reset with valid password
    reset_resp = client.post(
        "/api/v1/auth/reset-password",
        json={"token": token, "new_password": "NewSecretPassword123!"},
    )
    assert reset_resp.status_code == 200

    # 6. Verify old password fails
    old_login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "OldPassword123!"},
    )
    assert old_login.status_code == 401

    # 7. Verify new password succeeds
    new_login = client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "NewSecretPassword123!"},
    )
    assert new_login.status_code == 200
    assert "access_token" in new_login.json()

def test_reset_password_with_invalid_token():
    # Attempt reset with an invalid token
    resp = client.post(
        "/api/v1/auth/reset-password",
        json={"token": "invalid.jwt.token", "new_password": "ValidPassword123!"},
    )
    assert resp.status_code == 400

def test_reset_password_with_wrong_purpose_token():
    # An access token has purpose not equal to password_reset
    access_tok = create_access_token(data={"sub": "1"})
    resp = client.post(
        "/api/v1/auth/reset-password",
        json={"token": access_tok, "new_password": "ValidPassword123!"},
    )
    assert resp.status_code == 400
