import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import models
from backend.app.auth import create_access_token, get_password_hash
from backend.app.database import Base, get_db
from backend.app.main import app


class AIAskChatbotTests(unittest.TestCase):
    def setUp(self):
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

        db = self.session_factory()
        self.user = models.User(
            email="ask_tester@example.com",
            full_name="Ask Tester",
            hashed_password=get_password_hash("Secret123!"),
            role="developer",
        )
        db.add(self.user)
        db.commit()
        db.refresh(self.user)
        db.close()

        token = create_access_token({"sub": str(self.user.id)})
        self.headers = {"Authorization": f"Bearer {token}"}

    def tearDown(self):
        app.dependency_overrides.clear()
        self.client.__exit__(None, None, None)
        Base.metadata.drop_all(bind=self.engine)

    def test_ask_requires_authentication(self):
        res = self.client.post("/api/v1/ai/ask", json={"message": "Hello AI!"})
        self.assertEqual(res.status_code, 401)

    def test_ask_returns_conversational_reply(self):
        res = self.client.post(
            "/api/v1/ai/ask",
            headers=self.headers,
            json={"message": "What is the difference between useMemo and useCallback?", "role": "developer"},
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertIn("reply", data)
        self.assertIn("provider", data)
        self.assertIn("model", data)
        self.assertIn("useMemo", data["reply"])
        # Ensure it is NOT a roadmap generator
        self.assertNotIn('"projects":', data["reply"])
        self.assertNotIn('"milestones":', data["reply"])

    def test_ask_with_conversation_history(self):
        history = [
            {"role": "user", "content": "Hi, who are you?"},
            {"role": "assistant", "content": "I am Ask, your conversational AI mentor in MentorOS."},
        ]
        res = self.client.post(
            "/api/v1/ai/ask",
            headers=self.headers,
            json={
                "message": "Can you give me tips for handling freelance client scope creep?",
                "role": "freelancer",
                "history": history,
            },
        )
        self.assertEqual(res.status_code, 200)
        data = res.json()
        print("REPLY WAS:", data.get("reply"))
        self.assertTrue(len(data.get("reply", "")) > 0)
        self.assertIn("provider", data)

    def test_ask_rejects_empty_message(self):
        res = self.client.post(
            "/api/v1/ai/ask",
            headers=self.headers,
            json={"message": "   "},
        )
        self.assertEqual(res.status_code, 422)
