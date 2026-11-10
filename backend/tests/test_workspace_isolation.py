import unittest
from datetime import datetime, timedelta

from fastapi import FastAPI
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from backend.app import models
from backend.app.auth import create_access_token, get_password_hash
from backend.app.database import Base, get_db
from backend.app.main import app
from backend.app.rate_limit import RateLimitMiddleware


class WorkspaceIsolationTests(unittest.TestCase):
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

    def create_user(self, email: str) -> models.User:
        with self.session_factory() as db:
            user = models.User(
                email=email,
                hashed_password=get_password_hash("test-password-123"),
                full_name=email,
                role="developer",
            )
            db.add(user)
            db.commit()
            db.refresh(user)
            return user

    @staticmethod
    def auth_headers(user: models.User) -> dict[str, str]:
        token = create_access_token({"sub": str(user.id)})
        return {"Authorization": f"Bearer {token}"}

    def test_registration_rejects_weak_password_and_unknown_role(self):
        cases = [
            {"full_name": "Test User", "email": "short@example.test", "password": "short123", "role": "student"},
            {"full_name": "Test User", "email": "long@example.test", "password": "a" * 73, "role": "student"},
            {"full_name": "Test User", "email": "role@example.test", "password": "a-secure-passphrase", "role": "admin"},
        ]
        for payload in cases:
            with self.subTest(email=payload["email"]):
                response = self.client.post("/api/v1/auth/register", json=payload)
                self.assertEqual(response.status_code, 422)

    def test_project_and_task_links_cannot_cross_users(self):
        owner = self.create_user("owner@example.test")
        other_user = self.create_user("other@example.test")

        with self.session_factory() as db:
            foreign_project = models.Project(
                user_id=other_user.id,
                role="developer",
                title="Private project",
            )
            foreign_task = models.Task(
                user_id=other_user.id,
                role="developer",
                title="Private task",
            )
            db.add_all([foreign_project, foreign_task])
            db.commit()
            foreign_project_id = foreign_project.id
            foreign_task_id = foreign_task.id

        headers = self.auth_headers(owner)
        project_response = self.client.get("/api/v1/projects", headers=headers)
        self.assertEqual(project_response.status_code, 200)
        self.assertEqual(project_response.json(), [])

        task_response = self.client.post(
            "/api/v1/tasks",
            headers=headers,
            json={"title": "Cross-tenant task", "project_id": foreign_project_id},
        )
        self.assertEqual(task_response.status_code, 404)

        create_task_response = self.client.post(
            "/api/v1/tasks",
            headers=headers,
            json={"title": "Owned task"},
        )
        self.assertEqual(create_task_response.status_code, 200)
        task_id = create_task_response.json()["id"]
        link_response = self.client.patch(
            f"/api/v1/tasks/{task_id}",
            headers=headers,
            json={"project_id": foreign_project_id},
        )
        self.assertEqual(link_response.status_code, 404)

        event_response = self.client.post(
            "/api/v1/calendar/events",
            headers=headers,
            json={
                "title": "Cross-tenant event",
                "start_at": "2026-10-31T10:00:00",
                "end_at": "2026-10-31T11:00:00",
                "project_id": foreign_project_id,
                "task_id": foreign_task_id,
            },
        )
        self.assertEqual(event_response.status_code, 404)

        milestone_response = self.client.post(
            "/api/v1/milestones",
            headers=headers,
            json={"title": "Cross-tenant milestone", "project_id": foreign_project_id},
        )
        self.assertEqual(milestone_response.status_code, 404)

    def test_project_detail_is_owner_scoped_and_includes_related_records(self):
        owner = self.create_user("project-owner@example.test")
        other_user = self.create_user("project-other@example.test")
        with self.session_factory() as db:
            project = models.Project(
                user_id=owner.id,
                role="developer",
                title="Owned project",
            )
            db.add(project)
            db.flush()
            db.add_all([
                models.Milestone(
                    user_id=owner.id,
                    project_id=project.id,
                    role="developer",
                    title="Owned milestone",
                ),
                models.Task(
                    user_id=owner.id,
                    project_id=project.id,
                    role="developer",
                    title="Owned task",
                ),
            ])
            db.commit()
            project_id = project.id

        owner_response = self.client.get(
            f"/api/v1/projects/{project_id}",
            headers=self.auth_headers(owner),
        )
        self.assertEqual(owner_response.status_code, 200)
        project_data = owner_response.json()
        self.assertEqual(project_data["title"], "Owned project")
        self.assertEqual(project_data["milestone_count"], 1)
        self.assertEqual(project_data["task_count"], 1)
        self.assertEqual(project_data["milestones"][0]["title"], "Owned milestone")
        self.assertEqual(project_data["tasks"][0]["title"], "Owned task")

        other_response = self.client.get(
            f"/api/v1/projects/{project_id}",
            headers=self.auth_headers(other_user),
        )
        self.assertEqual(other_response.status_code, 404)

    def test_notes_cannot_link_to_another_users_project(self):
        owner = self.create_user("note-owner@example.test")
        other_user = self.create_user("note-other@example.test")
        with self.session_factory() as db:
            project = models.Project(
                user_id=other_user.id,
                role="developer",
                title="Private project",
            )
            db.add(project)
            db.commit()
            project_id = project.id

        response = self.client.post(
            "/api/v1/notes",
            headers=self.auth_headers(owner),
            json={
                "title": "Cross-tenant note",
                "content": "This must not link to another user's project.",
                "project_id": project_id,
            },
        )
        self.assertEqual(response.status_code, 404)

    def test_workspace_requires_auth_and_validation_is_bounded(self):
        unauthenticated = self.client.get("/api/v1/tasks")
        self.assertEqual(unauthenticated.status_code, 401)

        user = self.create_user("validation@example.test")
        invalid_task = self.client.post(
            "/api/v1/tasks",
            headers=self.auth_headers(user),
            json={"title": ""},
        )
        self.assertEqual(invalid_task.status_code, 422)
        self.assertEqual(invalid_task.json()["detail"][0]["field"], "body.title")
        self.assertNotIn("input", invalid_task.json()["detail"][0])

        invalid_event = self.client.post(
            "/api/v1/calendar/events",
            headers=self.auth_headers(user),
            json={
                "title": "Invalid date",
                "start_at": "tomorrow",
                "end_at": "next week",
            },
        )
        self.assertEqual(invalid_event.status_code, 422)
        self.assertEqual(invalid_event.json()["detail"][0]["field"], "body.start_at")

    def test_auth_rate_limit_returns_429(self):
        rate_limited_app = FastAPI()
        rate_limited_app.add_middleware(RateLimitMiddleware)
        with TestClient(rate_limited_app) as client:
            responses = [client.get("/api/v1/auth/login") for _ in range(10)]
            self.assertTrue(all(response.status_code == 404 for response in responses))
            limited = client.get("/api/v1/auth/login")
        self.assertEqual(limited.status_code, 429)
        self.assertIn("Retry-After", limited.headers)

    def test_dashboard_summary_uses_only_saved_workspace_data(self):
        owner = self.create_user("dashboard-owner@example.test")
        other_user = self.create_user("dashboard-other@example.test")
        next_day = (datetime.utcnow().date() + timedelta(days=1)).isoformat()
        with self.session_factory() as db:
            db.add_all([
                models.Task(
                    user_id=owner.id,
                    role="student",
                    title="Study assignment",
                    due_date=next_day,
                    actual_minutes=90,
                ),
                models.CalendarEvent(
                    user_id=owner.id,
                    role="student",
                    title="Saved exam",
                    start_at=f"{next_day}T10:00:00",
                    end_at=f"{next_day}T11:00:00",
                    event_type="exam",
                ),
            ])
            db.commit()

        owner_response = self.client.get(
            "/api/v1/dashboard/summary?role=student",
            headers=self.auth_headers(owner),
        )
        self.assertEqual(owner_response.status_code, 200)
        owner_summary = owner_response.json()
        self.assertEqual(owner_summary["role_summary"]["upcoming_exams"], 1)
        self.assertEqual(owner_summary["role_summary"]["due_assignments"], 1)
        self.assertEqual(owner_summary["role_summary"]["study_hours_this_week"], 1.5)
        self.assertEqual(owner_summary["role_summary"]["next_deadline_title"], "Study assignment")
        self.assertEqual(owner_summary["recent_activity"], [])

        other_response = self.client.get(
            "/api/v1/dashboard/summary?role=student",
            headers=self.auth_headers(other_user),
        )
        self.assertEqual(other_response.status_code, 200)
        self.assertEqual(other_response.json()["upcoming_events"], 0)
        self.assertEqual(other_response.json()["role_summary"]["upcoming_exams"], 0)

    def test_ai_approval_is_idempotent_and_keeps_workspace_role(self):
        user = self.create_user("learner@example.test")

        with self.session_factory() as db:
            proposal = models.AIProposal(
                user_id=user.id,
                role="student",
                request_text="Create a study roadmap",
                summary="Study plan",
                status="pending",
            )
            proposal.items.append(models.AIProposalItem(
                item_type="project",
                payload={"title": "Study roadmap", "description": "A study plan"},
            ))
            proposal.items.append(models.AIProposalItem(
                item_type="task",
                payload={"title": "Complete week one", "project_title": "Study roadmap"},
            ))
            db.add(proposal)
            db.commit()
            db.refresh(proposal)
            proposal_id = proposal.id
            project_item_id = proposal.items[0].id
            task_item_id = proposal.items[1].id

        headers = self.auth_headers(user)
        first_response = self.client.post(
            f"/api/v1/ai/proposals/{proposal_id}/approve",
            headers=headers,
            json={"approved_item_ids": [project_item_id]},
        )
        self.assertEqual(first_response.status_code, 200)
        first_result = first_response.json()
        self.assertEqual(len(first_result["created_projects"]), 1)
        self.assertEqual(first_result["created_projects"][0]["role"], "student")
        self.assertEqual(first_result["created_tasks"], [])

        second_response = self.client.post(
            f"/api/v1/ai/proposals/{proposal_id}/approve",
            headers=headers,
            json={"approved_item_ids": [project_item_id, task_item_id]},
        )
        self.assertEqual(second_response.status_code, 200)
        second_result = second_response.json()
        self.assertEqual(second_result["created_projects"], [])
        self.assertEqual(len(second_result["created_tasks"]), 1)
        self.assertEqual(
            second_result["created_tasks"][0]["project_id"],
            first_result["created_projects"][0]["id"],
        )
        self.assertEqual(second_result["created_tasks"][0]["role"], "student")

        third_response = self.client.post(
            f"/api/v1/ai/proposals/{proposal_id}/approve",
            headers=headers,
            json={"approved_item_ids": [project_item_id, task_item_id]},
        )
        self.assertEqual(third_response.status_code, 200)
        self.assertEqual(third_response.json()["created_projects"], [])
        self.assertEqual(third_response.json()["created_tasks"], [])

        with self.session_factory() as db:
            self.assertEqual(
                db.query(models.Project).filter(models.Project.user_id == user.id).count(),
                1,
            )
            self.assertEqual(
                db.query(models.Task).filter(models.Task.user_id == user.id).count(),
                1,
            )

    def test_role_isolation_for_milestones_and_proposals(self):
        user = self.create_user("student_dev@example.test")
        headers = self.auth_headers(user)

        with self.session_factory() as db:
            # Student milestone & proposal
            student_ms = models.Milestone(
                user_id=user.id,
                role="student",
                title="Student Thesis Proposal",
                status="pending",
            )
            student_prop = models.AIProposal(
                user_id=user.id,
                role="student",
                request_text="Plan study",
                summary="Study Plan Proposal",
                status="pending",
            )
            # Developer milestone & proposal
            dev_ms = models.Milestone(
                user_id=user.id,
                role="developer",
                title="Deploy Kubernetes",
                status="pending",
            )
            dev_prop = models.AIProposal(
                user_id=user.id,
                role="developer",
                request_text="Plan deploy",
                summary="Cloud Architecture Proposal",
                status="pending",
            )
            db.add_all([student_ms, student_prop, dev_ms, dev_prop])
            db.commit()

        # Query milestones with role=student
        ms_resp = self.client.get("/api/v1/milestones?role=student", headers=headers)
        self.assertEqual(ms_resp.status_code, 200)
        ms_data = ms_resp.json()
        self.assertEqual(len(ms_data), 1)
        self.assertEqual(ms_data[0]["title"], "Student Thesis Proposal")
        self.assertEqual(ms_data[0]["role"], "student")

        # Query proposals with role=student
        prop_resp = self.client.get("/api/v1/ai/proposals?role=student", headers=headers)
        self.assertEqual(prop_resp.status_code, 200)
        prop_data = prop_resp.json()
        self.assertEqual(len(prop_data), 1)
        self.assertEqual(prop_data[0]["summary"], "Study Plan Proposal")
        self.assertEqual(prop_data[0]["role"], "student")

        # Query milestones with role=developer
        dev_ms_resp = self.client.get("/api/v1/milestones?role=developer", headers=headers)
        self.assertEqual(dev_ms_resp.status_code, 200)
        dev_ms_data = dev_ms_resp.json()
        self.assertEqual(len(dev_ms_data), 1)
        self.assertEqual(dev_ms_data[0]["title"], "Deploy Kubernetes")

    def test_cannot_link_cross_role_project_to_task_or_milestone(self):
        user = self.create_user("cross_linker@example.test")
        headers = self.auth_headers(user)

        with self.session_factory() as db:
            dev_project = models.Project(
                user_id=user.id,
                role="developer",
                title="Microservices Backend",
            )
            db.add(dev_project)
            db.commit()
            dev_project_id = dev_project.id

        # Attempt to create a student task pointing to developer project -> should fail 400
        task_resp = self.client.post(
            "/api/v1/tasks",
            headers=headers,
            json={
                "title": "Study Biology Chapter 1",
                "role": "student",
                "project_id": dev_project_id,
            },
        )
        self.assertEqual(task_resp.status_code, 400)
        self.assertIn("Project role mismatch", task_resp.json()["detail"])

        # Attempt to create a student milestone pointing to developer project -> should fail 400
        ms_resp = self.client.post(
            "/api/v1/milestones",
            headers=headers,
            json={
                "title": "Midterm Exam",
                "role": "student",
                "project_id": dev_project_id,
            },
        )
        self.assertEqual(ms_resp.status_code, 400)
        self.assertIn("Project role mismatch", ms_resp.json()["detail"])


if __name__ == "__main__":
    unittest.main()
