import unittest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import models
from backend.app.auth import create_access_token, get_password_hash, verify_password
from backend.app.config import settings
from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.rate_limit import RateLimitMiddleware
from backend.app.seed import seed_initial_data


class AuthSecurityTests(unittest.TestCase):
    def setUp(self):
        RateLimitMiddleware.reset_all()
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        self.session_factory = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        Base.metadata.create_all(bind=self.engine)

        def override_get_db():
            db = self.session_factory()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)
        self.client.__enter__()

    def tearDown(self):
        self.client.__exit__(None, None, None)
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()
        RateLimitMiddleware.reset_all()

    def create_user(self, email: str, raw_password: str = "CorrectSecret123!", role: str = "student") -> models.User:
        with self.session_factory() as db:
            user = models.User(
                email=email,
                hashed_password=get_password_hash(raw_password),
                full_name="Test User",
                role=role,
                onboarding_completed=True,
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return user

    # ── 1. Authentication Bypass Tests ─────────────────────────────────────────

    def test_login_with_incorrect_password_is_rejected(self):
        self.create_user("alice@mentoros.dev", raw_password="MyStrongPassword!1")
        resp = self.client.post("/api/v1/auth/login", json={
            "email": "alice@mentoros.dev",
            "password": "WrongPassword999",
        })
        self.assertEqual(resp.status_code, 401)
        self.assertIn("Incorrect email or password", resp.json().get("detail", ""))

    def test_shared_passwords_do_not_bypass_authentication(self):
        self.create_user("bob@mentoros.dev", raw_password="BobsUniquePassword#9")
        bypass_passwords = ["12345678", "password123", "Password123!"]
        for pwd in bypass_passwords:
            resp = self.client.post("/api/v1/auth/login", json={
                "email": "bob@mentoros.dev",
                "password": pwd,
            })
            self.assertEqual(resp.status_code, 401, f"Bypass succeeded with password: {pwd}")

    def test_login_nonexistent_user_rejected_and_not_autoprovisioned(self):
        resp = self.client.post("/api/v1/auth/login", json={
            "email": "nonexistent@mentoros.dev",
            "password": "anyPassword123",
        })
        self.assertEqual(resp.status_code, 401)
        with self.session_factory() as db:
            user = db.query(models.User).filter(models.User.email == "nonexistent@mentoros.dev").first()
            self.assertIsNone(user, "Nonexistent user was auto-provisioned upon login attempt")

    def test_login_with_correct_password_succeeds(self):
        self.create_user("charlie@mentoros.dev", raw_password="SecretPassword456!")
        resp = self.client.post("/api/v1/auth/login", json={
            "email": "charlie@mentoros.dev",
            "password": "SecretPassword456!",
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "charlie@mentoros.dev")

    # ── 2. Registration Hijack Tests ───────────────────────────────────────────

    def test_register_duplicate_email_rejected_without_overwriting(self):
        original_user = self.create_user("david@mentoros.dev", raw_password="OriginalPassword#1")
        resp = self.client.post("/api/v1/auth/register", json={
            "email": "david@mentoros.dev",
            "password": "AttackerOverwrittenPassword#9",
            "full_name": "Attacker Name",
            "role": "developer",
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn("already exists", resp.json().get("detail", ""))

        # Verify password and details were NOT overwritten
        with self.session_factory() as db:
            user = db.query(models.User).filter(models.User.email == "david@mentoros.dev").first()
            self.assertTrue(verify_password("OriginalPassword#1", user.hashed_password))
            self.assertFalse(verify_password("AttackerOverwrittenPassword#9", user.hashed_password))
            self.assertEqual(user.full_name, "Test User")

    def test_register_new_user_success(self):
        resp = self.client.post("/api/v1/auth/register", json={
            "email": "newbie@mentoros.dev",
            "password": "NewUserPassword#1",
            "full_name": "Newbie User",
            "role": "student",
        })
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertIn("access_token", data)
        self.assertEqual(data["user"]["email"], "newbie@mentoros.dev")

    # ── 3. Logout and Token Revocation Tests ───────────────────────────────────

    def test_logout_revokes_jwt_token(self):
        user = self.create_user("eva@mentoros.dev", raw_password="EvaPassword#123")
        login_resp = self.client.post("/api/v1/auth/login", json={
            "email": "eva@mentoros.dev",
            "password": "EvaPassword#123",
        })
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}

        # User is authenticated
        me_resp = self.client.get("/api/v1/auth/me", headers=headers)
        self.assertEqual(me_resp.status_code, 200)
        self.assertEqual(me_resp.json()["email"], "eva@mentoros.dev")

        # Logout
        logout_resp = self.client.post("/api/v1/auth/logout", headers=headers)
        self.assertEqual(logout_resp.status_code, 200)

        # Token should now be revoked and cannot be used
        me_after_logout = self.client.get("/api/v1/auth/me", headers=headers)
        self.assertEqual(me_after_logout.status_code, 401)
        self.assertIn("revoked", me_after_logout.json().get("detail", "").lower())

    # ── 4. Google Login Verification Tests ────────────────────────────────────

    @patch("httpx.AsyncClient.get")
    def test_google_login_rejects_unverified_email(self, mock_get):
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "aud": settings.GOOGLE_CLIENT_ID or "test-client-id",
            "email": "unverified@gmail.com",
            "email_verified": False,
            "name": "Unverified User",
            "sub": "google-uid-12345",
        }
        mock_get.return_value = mock_response

        resp = self.client.post("/api/v1/auth/google", json={
            "credential": "fake_unverified_google_token",
            "role": "student",
        })
        self.assertEqual(resp.status_code, 400)
        self.assertIn("not verified", resp.json().get("detail", "").lower())

    # ── 5. Calendar Date Filtering Tests ──────────────────────────────────────

    def test_calendar_date_filters_applied(self):
        user = self.create_user("frank@mentoros.dev")
        token = create_access_token({"sub": str(user.id)})
        headers = {"Authorization": f"Bearer {token}"}

        # Create 3 events across different dates
        e1 = self.client.post("/api/v1/calendar/events", headers=headers, json={
            "title": "Early Event",
            "start_at": "2026-11-01T10:00:00",
            "end_at": "2026-11-01T11:00:00",
            "role": "student",
        }).json()

        e2 = self.client.post("/api/v1/calendar/events", headers=headers, json={
            "title": "Target Event",
            "start_at": "2026-11-15T14:00:00",
            "end_at": "2026-11-15T15:00:00",
            "role": "student",
        }).json()

        e3 = self.client.post("/api/v1/calendar/events", headers=headers, json={
            "title": "Late Event",
            "start_at": "2026-12-01T09:00:00",
            "end_at": "2026-12-01T10:00:00",
            "role": "student",
        }).json()

        # Query with start & end covering only mid-November
        resp = self.client.get(
            "/api/v1/calendar/events?start=2026-11-10T00:00:00&end=2026-11-20T23:59:59",
            headers=headers,
        )
        self.assertEqual(resp.status_code, 200)
        items = resp.json()
        ids = [item["id"] for item in items]
        self.assertIn(e2["id"], ids, "Target mid-November event should be included")
        self.assertNotIn(e1["id"], ids, "Early event should be excluded by start filter")
        self.assertNotIn(e3["id"], ids, "Late event should be excluded by end filter")

    # ── 6. Task Pagination Clamping Tests ─────────────────────────────────────

    def test_task_page_size_clamping(self):
        user = self.create_user("grace@mentoros.dev")
        token = create_access_token({"sub": str(user.id)})
        headers = {"Authorization": f"Bearer {token}"}

        # Create tasks
        for i in range(5):
            self.client.post("/api/v1/tasks", headers=headers, json={
                "title": f"Task {i}",
                "role": "student",
            })

        # Request with absurd page_size
        resp = self.client.get("/api/v1/tasks?page=1&page_size=9999", headers=headers)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.headers.get("X-Total-Count"), "5")

    # ── 7. Seeder Safety Tests ────────────────────────────────────────────────

    def test_seeder_disabled_in_production(self):
        with self.session_factory() as db:
            with patch("backend.app.seed.settings.APP_ENV", "production"):
                seed_initial_data(db)
            self.assertEqual(db.query(models.User).count(), 0)

    def test_seeder_does_not_modify_existing_database(self):
        with self.session_factory() as db:
            initial_user = models.User(
                id=99,
                email="custom@mentoros.dev",
                hashed_password=get_password_hash("custom123"),
                full_name="Custom User",
                role="developer",
            )
            db.add(initial_user)
            db.commit()

            # Calling seeder when user_count > 0 should do nothing
            seed_initial_data(db)
            self.assertEqual(db.query(models.User).count(), 1)
            self.assertIsNone(db.query(models.User).filter(models.User.email == "student@mentoros.dev").first())
