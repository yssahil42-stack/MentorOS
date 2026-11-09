"""
Programmatic database seeder for MentorOS.
Populates standard demonstration users and initial workspace data cleanly in Python,
eliminating the need to commit binary SQLite database files to Git.
"""
import datetime
from sqlalchemy.orm import Session
from . import models
from .auth import get_password_hash


def seed_initial_data(db: Session) -> None:
    """Seeds baseline accounts and demo workspace data if the database is unpopulated."""
    try:
        user_count = db.query(models.User).count()
        default_pwd = get_password_hash("password123")
        core_accounts = [
            ("student@mentoros.dev", "Alex Student", "student", {"program": "BSc Computer Science", "semester": "Year 3"}),
            ("yssahil42@gmail.com", "Sahil yadav", "student", {"program": "BSc Computer Science", "semester": "Year 3", "main_subjects": "Data Structures, Operating Systems, Cloud Computing"}),
            ("developer@mentoros.dev", "Alex Developer", "developer", {"tech_stack": "TypeScript, Python, FastAPI, React"}),
            ("freelancer@mentoros.dev", "Alex Freelancer", "freelancer", {"hourly_rate": 85, "currency": "USD"}),
            ("jobseeker@mentoros.dev", "Alex JobSeeker", "job_seeker", {"target_role": "Full Stack Engineer", "experience_level": "Senior"}),
        ]
        if user_count > 0:
            for email, name, role, profile in core_accounts:
                existing = db.query(models.User).filter(models.User.email == email).first()
                if not existing:
                    u = models.User(
                        email=email,
                        hashed_password=default_pwd,
                        full_name=name,
                        role=role,
                        onboarding_completed=True,
                        profile_data=profile,
                    )
                    db.add(u)
            db.commit()
            return

        now = datetime.datetime.utcnow()
        default_pwd = get_password_hash("password123")

        # ── 1. Create Core Role Users ──────────────────────────────────────────
        users_to_create = [
            models.User(
                id=1,
                email="student@mentoros.dev",
                hashed_password=default_pwd,
                full_name="Alex Student",
                role="student",
                onboarding_completed=True,
                profile_data={"program": "BSc Computer Science", "semester": "Year 3"},
            ),
            models.User(
                id=2,
                email="yssahil42@gmail.com",
                hashed_password=default_pwd,
                full_name="Sahil yadav",
                role="student",
                onboarding_completed=True,
                profile_data={"program": "BSc Computer Science", "semester": "Year 3"},
            ),
            models.User(
                id=3,
                email="developer@mentoros.dev",
                hashed_password=default_pwd,
                full_name="Alex Developer",
                role="developer",
                onboarding_completed=True,
                profile_data={"tech_stack": "TypeScript, Python, FastAPI, React"},
            ),
            models.User(
                id=4,
                email="freelancer@mentoros.dev",
                hashed_password=default_pwd,
                full_name="Alex Freelancer",
                role="freelancer",
                onboarding_completed=True,
                profile_data={"hourly_rate": 85, "currency": "USD"},
            ),
            models.User(
                id=5,
                email="jobseeker@mentoros.dev",
                hashed_password=default_pwd,
                full_name="Alex JobSeeker",
                role="job_seeker",
                onboarding_completed=True,
                profile_data={"target_role": "Full Stack Engineer", "experience_level": "Senior"},
            ),
        ]

        for u in users_to_create:
            db.add(u)
        db.commit()

        # ── 2. Create Student Workspace Data ──────────────────────────────────
        student_proj = models.Project(
            id=1,
            user_id=2,  # yssahil42@gmail.com
            role="student",
            title="Distributed Systems & Cloud Computing Capstone",
            description="Semester-long capstone project exploring microservices, fault tolerance and message queues.",
            priority="high",
            target_date=(now + datetime.timedelta(days=45)).strftime("%Y-%m-%d"),
            progress=35,
        )
        student_proj_dev = models.Project(
            id=2,
            user_id=1,  # student@mentoros.dev
            role="student",
            title="Distributed Systems & Cloud Computing Capstone",
            description="Semester-long capstone project exploring microservices, fault tolerance and message queues.",
            priority="high",
            target_date=(now + datetime.timedelta(days=45)).strftime("%Y-%m-%d"),
            progress=35,
        )
        db.add(student_proj)
        db.add(student_proj_dev)
        db.commit()

        # Student Tasks for both student accounts
        for uid, pid in [(2, 1), (1, 2)]:
            tasks = [
                models.Task(
                    user_id=uid,
                    project_id=pid,
                    role="student",
                    title="Implement Paxos Consensus Algorithm Simulator",
                    description="Write Python simulation for distributed agreement under network partitions.",
                    priority="high",
                    status="in_progress",
                    due_date=(now + datetime.timedelta(days=5)).strftime("%Y-%m-%d"),
                    estimated_minutes=120,
                ),
                models.Task(
                    user_id=uid,
                    project_id=pid,
                    role="student",
                    title="Submit Operating Systems Lab 4 Report",
                    description="Kernel synchronization primitives and virtual memory paging benchmarks.",
                    priority="high",
                    status="todo",
                    due_date=(now + datetime.timedelta(days=2)).strftime("%Y-%m-%d"),
                    estimated_minutes=90,
                ),
                models.Task(
                    user_id=uid,
                    project_id=pid,
                    role="student",
                    title="Review Chapter 7: Relational Normalization (3NF & BCNF)",
                    description="Complete practice schema decomposition problems for Friday quiz.",
                    priority="medium",
                    status="completed",
                    due_date=(now - datetime.timedelta(days=1)).strftime("%Y-%m-%d"),
                    completed_at=now - datetime.timedelta(days=1),
                    estimated_minutes=60,
                ),
                models.Task(
                    user_id=uid,
                    project_id=pid,
                    role="student",
                    title="Set Up Docker Compose for Redis and RabbitMQ Cluster",
                    description="Local development orchestration for capstone service communication.",
                    priority="medium",
                    status="todo",
                    due_date=(now + datetime.timedelta(days=8)).strftime("%Y-%m-%d"),
                    estimated_minutes=75,
                ),
            ]
            for t in tasks:
                db.add(t)

            # Student Milestones
            milestones = [
                models.Milestone(
                    user_id=uid,
                    project_id=pid,
                    role="student",
                    title="Milestone 1: Architecture Specification & RFC",
                    description="Design document approved by academic faculty mentor.",
                    target_date=(now - datetime.timedelta(days=5)).strftime("%Y-%m-%d"),
                    status="completed",
                ),
                models.Milestone(
                    user_id=uid,
                    project_id=pid,
                    role="student",
                    title="Milestone 2: Alpha Prototype & Benchmarking",
                    description="Working messaging cluster with latency metrics.",
                    target_date=(now + datetime.timedelta(days=15)).strftime("%Y-%m-%d"),
                    status="in_progress",
                ),
                models.Milestone(
                    user_id=uid,
                    project_id=pid,
                    role="student",
                    title="Milestone 3: Final Defense & Code Delivery",
                    description="Live presentation and code repository handover.",
                    target_date=(now + datetime.timedelta(days=40)).strftime("%Y-%m-%d"),
                    status="pending",
                ),
            ]
            for m in milestones:
                db.add(m)

            # Student Calendar Events
            events = [
                models.CalendarEvent(
                    user_id=uid,
                    project_id=pid,
                    role="student",
                    title="Study Block: Cloud Computing Midterm Prep",
                    description="Focus deep work session covering AWS, GCP and container orchestration.",
                    start_at=(now + datetime.timedelta(days=1, hours=2)).isoformat(),
                    end_at=(now + datetime.timedelta(days=1, hours=4)).isoformat(),
                    event_type="study_block",
                ),
                models.CalendarEvent(
                    user_id=uid,
                    project_id=pid,
                    role="student",
                    title="Lab Submission Deadline: Distributed File System",
                    description="Submit Git commit hash to university portal.",
                    start_at=(now + datetime.timedelta(days=3, hours=5)).isoformat(),
                    end_at=(now + datetime.timedelta(days=3, hours=6)).isoformat(),
                    event_type="exam",
                ),
            ]
            for ev in events:
                db.add(ev)

            # Student Notes
            notes = [
                models.Note(
                    user_id=uid,
                    project_id=pid,
                    role="student",
                    title="Distributed Systems Lecture 12: Raft vs Paxos",
                    content="# Raft Consensus Algorithm Notes\n\n- Leader Election: Randomized election timeouts prevent split votes.\n- Log Replication: Strong leader invariant guarantees log matching.\n- Safety: Overlapping majorities in elections guarantee commit durability.",
                    is_pinned=True,
                ),
                models.Note(
                    user_id=uid,
                    project_id=pid,
                    role="student",
                    title="Exam Study Roadmap - Semester 6",
                    content="1. Computer Networks (Week 1-3)\n2. Distributed Systems (Week 4-7)\n3. Database Internals & LSM Trees (Week 8-11)",
                    is_pinned=False,
                ),
            ]
            for n in notes:
                db.add(n)

        # ── 3. Create Developer Workspace Data ─────────────────────────────────
        dev_proj = models.Project(
            id=3,
            user_id=3,
            role="developer",
            title="SaaS Platform Microservices Migration",
            description="Decomposing monolith into event-driven containerized microservices.",
            priority="high",
            target_date=(now + datetime.timedelta(days=30)).strftime("%Y-%m-%d"),
            progress=50,
        )
        db.add(dev_proj)
        db.commit()

        dev_tasks = [
            models.Task(
                user_id=3,
                project_id=3,
                role="developer",
                title="Implement OpenID Connect & JWT Token Rotation",
                description="Secure access tokens with Redis revocation blacklist.",
                priority="high",
                status="in_progress",
                due_date=(now + datetime.timedelta(days=3)).strftime("%Y-%m-%d"),
                estimated_minutes=90,
            ),
            models.Task(
                user_id=3,
                project_id=3,
                role="developer",
                title="Write Unit and Integration Tests for Auth Service",
                description="Achieve 90%+ code coverage on authorization routes.",
                priority="medium",
                status="todo",
                due_date=(now + datetime.timedelta(days=6)).strftime("%Y-%m-%d"),
                estimated_minutes=120,
            ),
        ]
        for dt in dev_tasks:
            db.add(dt)

        # ── 4. Create Freelancer Workspace Data ───────────────────────────────
        free_proj = models.Project(
            id=4,
            user_id=4,
            role="freelancer",
            title="E-Commerce Storefront Redesign (Acme Corp)",
            description="Next.js headless storefront with Stripe checkout integration.",
            priority="high",
            target_date=(now + datetime.timedelta(days=20)).strftime("%Y-%m-%d"),
            progress=65,
        )
        db.add(free_proj)
        db.commit()

        free_tasks = [
            models.Task(
                user_id=4,
                project_id=4,
                role="freelancer",
                title="Integrate Stripe Webhooks for Subscription Lifecycle",
                description="Handle customer.subscription.created, updated and deleted events.",
                priority="high",
                status="in_progress",
                due_date=(now + datetime.timedelta(days=4)).strftime("%Y-%m-%d"),
                estimated_minutes=120,
            ),
        ]
        for ft in free_tasks:
            db.add(ft)

        # Freelancer Invoice
        invoice = models.Invoice(
            user_id=4,
            project_id=4,
            role="freelancer",
            invoice_number="INV-2026-0001",
            status="sent",
            issue_date=(now - datetime.timedelta(days=7)).strftime("%Y-%m-%d"),
            due_date=(now + datetime.timedelta(days=23)).strftime("%Y-%m-%d"),
            payment_terms="net_30",
            client_name="Acme Corporation",
            client_email="billing@acmecorp.example",
            client_address="100 Tech Blvd, San Francisco, CA",
            subtotal=1500.00,
            tax_rate=0.0,
            tax_amount=0.0,
            total=1500.00,
            currency="USD",
            notes="Milestone 1 Deliverables (Storefront Design & Catalog Integration)",
        )
        db.add(invoice)

        # ── 5. Create Job Seeker Workspace Data ───────────────────────────────
        job_proj = models.Project(
            id=5,
            user_id=5,
            role="job_seeker",
            title="Q4 Full Stack Engineering Job Search",
            description="Targeting Senior Full-Stack and Backend Engineering roles.",
            priority="high",
            target_date=(now + datetime.timedelta(days=60)).strftime("%Y-%m-%d"),
            progress=40,
        )
        db.add(job_proj)
        db.commit()

        job_tasks = [
            models.Task(
                user_id=5,
                project_id=5,
                role="job_seeker",
                title="Complete System Design Practice: Distributed Rate Limiter",
                description="Prepare architectural trade-offs between Token Bucket and Leaky Bucket.",
                priority="high",
                status="in_progress",
                due_date=(now + datetime.timedelta(days=3)).strftime("%Y-%m-%d"),
                estimated_minutes=90,
            ),
            models.Task(
                user_id=5,
                project_id=5,
                role="job_seeker",
                title="Tailor Resume for Senior Platform Engineer at Vercel",
                description="Highlight experience with Next.js, Edge Functions and TypeScript.",
                priority="high",
                status="todo",
                due_date=(now + datetime.timedelta(days=1)).strftime("%Y-%m-%d"),
                estimated_minutes=45,
            ),
        ]
        for jt in job_tasks:
            db.add(jt)

        db.commit()
    except Exception as e:
        db.rollback()
        # Log error non-fatally to avoid crashing startup
        print(f"[Seed Error] {e}")
    finally:
        db.close()
