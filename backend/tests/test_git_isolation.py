import unittest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.models import User
from backend.app.auth import create_access_token, get_password_hash
from backend.app.routers.git import CONNECTED_REPOS

class GitIsolationTests(unittest.TestCase):
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

        with self.session_factory() as db:
            self.u1 = User(
                email="alice@mentoros.dev",
                hashed_password=get_password_hash("SecretPassword123!"),
                full_name="Alice Dev",
                role="developer"
            )
            self.u2 = User(
                email="bob@mentoros.dev",
                hashed_password=get_password_hash("SecretPassword123!"),
                full_name="Bob Dev",
                role="developer"
            )
            db.add_all([self.u1, self.u2])
            db.commit()
            db.refresh(self.u1)
            db.refresh(self.u2)

        # Populate Alice's repo in CONNECTED_REPOS
        self.repo_id = 9991
        CONNECTED_REPOS[self.repo_id] = {
            "id": self.repo_id,
            "user_id": self.u1.id,
            "provider": "github",
            "name": "alice-secret-repo",
            "full_name": "alice/alice-secret-repo",
            "description": "Confidential repository",
            "private": True,
            "url": "https://github.com/alice/alice-secret-repo",
            "sync_status": "synced"
        }

    def tearDown(self):
        CONNECTED_REPOS.pop(self.repo_id, None)
        self.client.__exit__(None, None, None)
        app.dependency_overrides.clear()
        Base.metadata.drop_all(bind=self.engine)
        self.engine.dispose()

    def test_unauthenticated_git_endpoints_rejected(self):
        resp = self.client.get("/api/v1/git/repositories")
        self.assertEqual(resp.status_code, 401)

    def test_git_repo_owner_access(self):
        token = create_access_token(data={"sub": str(self.u1.id)})
        headers = {"Authorization": f"Bearer {token}"}
        resp = self.client.get(f"/api/v1/git/repositories/{self.repo_id}", headers=headers)
        self.assertEqual(resp.status_code, 200)
        self.assertEqual(resp.json()["name"], "alice-secret-repo")

    def test_git_repo_idor_protection(self):
        token = create_access_token(data={"sub": str(self.u2.id)})
        headers = {"Authorization": f"Bearer {token}"}
        
        # Bob cannot view Alice's repo
        resp = self.client.get(f"/api/v1/git/repositories/{self.repo_id}", headers=headers)
        self.assertEqual(resp.status_code, 404)

        # Bob cannot delete/disconnect Alice's repo
        del_resp = self.client.delete(f"/api/v1/git/repositories/{self.repo_id}", headers=headers)
        self.assertEqual(del_resp.status_code, 404)

        # Bob cannot trigger sync on Alice's repo
        sync_resp = self.client.post(f"/api/v1/git/repositories/{self.repo_id}/sync", headers=headers)
        self.assertEqual(sync_resp.status_code, 404)
