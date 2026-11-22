import json
import re
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import httpx
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from .. import models, schemas
from ..config import settings
from ..auth import get_current_user

router = APIRouter(prefix="/ai", tags=["ai"])

def synthesize_smart_roadmap(prompt: str, role: str) -> Dict[str, Any]:
    """Domain-aware intelligent roadmap generator that creates detailed multi-phase mentor-grade curriculums."""
    p_lower = prompt.lower()
    now = datetime.utcnow()

    # Check for duration with standard library regex
    dur_match = re.search(r'(\d+)\s*(month|mo|week|wk|day)', p_lower)
    if dur_match:
        val, unit = int(dur_match.group(1)), dur_match.group(2)
        if unit.startswith(('month', 'mo')):
            total_days, duration_label = max(val * 30, 14), f"{val}-Month"
        elif unit.startswith(('week', 'wk')):
            total_days, duration_label = max(val * 7, 7), f"{val}-Week"
        else:
            total_days, duration_label = max(val, 3), f"{val}-Day"
    else:
        total_days, duration_label = 90, "3-Month"

    target_dt = (now + timedelta(days=total_days)).strftime("%Y-%m-%d")
    m1_dt = (now + timedelta(days=max(int(total_days * 0.33), 3))).strftime("%Y-%m-%d")
    m2_dt = (now + timedelta(days=max(int(total_days * 0.66), 7))).strftime("%Y-%m-%d")
    m3_dt = target_dt

    role_ctx = (
        "BSc CS student and interested in AI/full-stack development"
        if role in ["student", "developer"]
        else f"{role.replace('_', ' ')} striving for career mastery"
    )

    if "python" in p_lower:
        subject = "Python"
        proj_title = f"{duration_label} Python Mastery Roadmap"
        phases_meta = [
            ("Month 1", "Python Fundamentals & Problem Solving", "Master variables, data types, conditionals, loops, functions, and collections with small CLI programs.", m1_dt),
            ("Month 2", "Core Applications, OOP & File Systems", "Deep dive into reusable functions, JSON/CSV file handling, OOP class hierarchies, and virtualenv/Git.", m2_dt),
            ("Month 3", "Advanced Python, FastAPI & AI Backend Capstone", "Master comprehensions, databases, FastAPI REST endpoints, and build the AI Workspace Backend.", m3_dt),
        ]
        task_tuples = [
            ("Week 1: Python Basics — Build Calculator & Unit Converter", "Set up VS Code & Python. Write Calculator, Unit converter, Bill calculator, and Age calculator.", "urgent", 60, 7),
            ("Week 2: Decision Making — Grade Calculator, Login & ATM Program", "Master if/elif/else, comparison & logical operators. Build Login and ATM flow programs.", "high", 60, 14),
            ("Week 3: Loops Mastery — Multiplication Table & Guessing Game", "Practice for/while, range, break, and continue. Implement number guessing game and pattern programs.", "high", 60, 21),
            ("Week 4 Mini-Project: Student Management System (Full CRUD)", "Lists, dicts, indexing, slicing. Build CLI system: Add, View, Search, Update, Delete students.", "urgent", 90, 28),
            ("Week 5: Modularize Programs into Reusable Functions & Scope", "Parameters, return values, default/keyword args, scope, and lambdas. Refactor scripts into functions.", "high", 60, 35),
            ("Week 6 Project: JSON/CSV Expense Tracker with Error Handling", "File I/O, try/except, CSV & JSON persistence. Add, delete, and summarize monthly expenses.", "high", 90, 42),
            ("Week 7 Project: Library Management System with OOP Hierarchy", "Classes, objects, __init__, encapsulation, inheritance, and methods for Book & Member management.", "high", 90, 49),
            ("Week 8: Set Up Professional venv, Git, GitHub & VS Code Debugger", "Modules, packages, pip, virtual environments, requirements.txt, datetime, and Git commit workflow.", "high", 60, 56),
            ("Week 9: Build Advanced Drills with Comprehensions & Decorators", "List/dict comprehensions, *args/**kwargs, generators, decorators, map(), filter(), and zip().", "high", 75, 63),
            ("Week 10: Build CRUD Database Service with requests API", "HTTP basics, REST APIs, JSON, database integration, SQL CRUD operations for Users & Tasks.", "high", 90, 70),
            ("Week 11: Develop Task Management REST API with FastAPI & Pydantic", "Endpoints GET/POST/PUT/DELETE /tasks, Pydantic schemas, database dependency, and Swagger docs.", "urgent", 105, 77),
            ("Week 12 Capstone: Build AI Productivity Workspace Backend", "Multi-entity backend (Users, Tasks, Projects, Notes, AI integrations) connecting relational database.", "urgent", 120, 85),
        ]
    elif any(k in p_lower for k in ["web", "react", "frontend", "javascript", "html", "css", "fullstack"]):
        subject = "Web Development & Frontend"
        proj_title = f"{duration_label} Web Development Mastery Roadmap"
        phases_meta = [
            ("Phase 1", "Modern JS & React Component Architecture (Weeks 1–4)", "ES6+, JSX, components, props, useState, Tailwind, and Personal Portfolio.", m1_dt),
            ("Phase 2", "Hooks, React Router & Global State (Weeks 5–8)", "useEffect, custom hooks, dynamic routing, protected routes, and Zustand state.", m2_dt),
            ("Phase 3", "Full-Stack API Integration & Portfolio Capstone (Weeks 9–12)", "JWT auth, FastAPI backend integration, animations, and SaaS capstone deployment.", m3_dt),
        ]
        task_tuples = [
            ("Week 1: Modern JavaScript ES6+ & Async Practice Drills", "Master arrow functions, destructuring, array methods (map, filter, reduce), and async/await.", "urgent", 60, 7),
            ("Week 2: Vite + React + TypeScript Component Architecture", "Build reusable UI components with props, TypeScript interfaces, and Tailwind styling.", "high", 60, 14),
            ("Week 3: State Management with useState & Form Handling", "Implement interactive todo list, controlled form inputs, and modal dialogs.", "high", 60, 21),
            ("Week 4 Project: Responsive Developer Portfolio Site", "Complete portfolio with navigation, skills grid, projects showcase, and dark mode.", "urgent", 90, 28),
            ("Week 5: API Integration with useEffect & Custom useFetch Hook", "Fetch REST data, handle loading & error states, build GitHub user explorer widget.", "high", 60, 35),
            ("Week 6: Multi-Page Navigation with React Router v6/v7", "Implement dynamic route params, nested layouts, Outlet, and protected auth guards.", "high", 60, 42),
            ("Week 7 Project: Global Shopping Cart Store with Zustand", "Zustand store with selectors, actions, local storage persistence, and cart UI.", "high", 90, 49),
            ("Week 8: Full-Stack JWT Authentication & API Integration", "Connect React frontend to backend auth routes with Bearer token storage and headers.", "urgent", 90, 56),
            ("Week 12 Capstone: Production AI Workspace Web Application", "Deploy complete full-stack portfolio capstone with responsive design and docs.", "urgent", 120, 85),
        ]
    else:
        subject = prompt[:35].strip() or "Professional Skill"
        proj_title = f"{duration_label} {subject} Roadmap"
        phases_meta = [
            ("Phase 1", f"{subject} Foundations & Discovery", f"Master basic principles, tools, and foundational concepts for {subject}.", m1_dt),
            ("Phase 2", f"Core Execution & Hands-on Practice", f"Work through practical problem sets, benchmarks, and active implementation.", m2_dt),
            ("Phase 3", f"Capstone Deliverable & Verification", f"Synthesize knowledge into a complete portfolio-ready project or review benchmark.", m3_dt),
        ]
        task_tuples = [
            (f"Set up workspace and resources for {subject}", "Gather curriculum, documentation, and tools.", "urgent", 45, 2),
            (f"Complete foundational exercises in {subject}", "Solidify understanding with focused practice drills.", "high", 90, 10),
            (f"Finalize capstone milestone review for {subject}", "Assess learning outcomes and review deliverables.", "high", 120, total_days - 5),
        ]

    milestones = [
        {
            "project_title": proj_title,
            "title": f"{name}: {focus}",
            "description": desc,
            "target_date": dt,
        }
        for name, focus, desc, dt in phases_meta
    ]

    tasks = [
        {
            "project_title": proj_title,
            "title": title,
            "description": desc,
            "priority": prio,
            "estimated_minutes": mins,
            "due_date": (now + timedelta(days=days_offset)).strftime("%Y-%m-%d"),
        }
        for title, desc, prio, mins, days_offset in task_tuples
    ]

    phase_rows = "\n".join(f"| **{name}** | {focus} | {desc} |" for name, focus, desc, _ in phases_meta)
    roadmap_text = f"""### {duration_label} {subject} Mastery Roadmap
Since you're a {role_ctx}, this progression moves systematically from foundational syntax to practical applications and portfolio capstones.

| Phase | Focus | What you'll be able to do |
| :--- | :--- | :--- |
{phase_rows}

---

### Recommended Schedule
Aim for **1.5–2 hours/day, 6 days/week**:
- 20 min -> Learn core concept
- 30 min -> Follow interactive code examples
- 40 min -> Solve problems and drills independently
- 20 min -> Build and refine weekly project deliverables
- 10 min -> Code review and Git commit

> **Core Rule**: Spend time actively writing and testing code rather than passively watching tutorials."""

    return {
        "summary": roadmap_text,
        "projects": [
            {
                "title": proj_title,
                "description": f"Structured {duration_label.lower()} roadmap for mastering {subject}. Covers core syntax, deep practice, and real-world project deliverables.",
                "priority": "high",
                "target_date": target_dt,
            }
        ],
        "milestones": milestones,
        "tasks": tasks,
        "calendar_events": [
            {
                "title": f"Daily Study Block: {subject} Active Coding (Learn & Solve)",
                "start_at": (now + timedelta(days=1)).replace(hour=10, minute=0).isoformat(),
                "end_at": (now + timedelta(days=1)).replace(hour=12, minute=0).isoformat(),
                "event_type": "study_block",
            },
            {
                "title": f"Deep Work: {subject} Hands-on Project Implementation",
                "start_at": (now + timedelta(days=4)).replace(hour=14, minute=0).isoformat(),
                "end_at": (now + timedelta(days=4)).replace(hour=16, minute=30).isoformat(),
                "event_type": "study_block",
            },
        ],
        "notes": [
            {
                "title": f"{duration_label} {subject} Study Curriculum & Guide",
                "content": roadmap_text,
            }
        ],
    }


def sanitize_roadmap_topic_labels(data: Dict[str, Any]) -> Dict[str, Any]:
    """Ensures roadmap generation never classifies or labels topics as high, low, or intermediate."""
    if not isinstance(data, dict):
        return data

    replacements = (
        (r'(?i)\bintermediate python\b', 'Core Application Python'),
        (r'(?i)\bintermediate architecture\b', 'Core Architecture'),
        (r'(?i)\bintermediate execution\b', 'Applied Execution'),
        (r'(?i)\bintermediate logic\b', 'Application Logic'),
        (r'(?i)\bintermediate paradigms\b', 'Modular paradigms'),
        (r'(?i)\bintermediate level\b', 'Applied stage'),
        (r'(?i)\bintermediate\b', 'Applied'),
        (r'(?i)\b(topic|subject|phase|module)\s+(?:should be|is)\s+(?:high|low|intermediate)\b', r'\1 is core'),
        (r'(?i)\b(?:high|low|intermediate)[ -]priority topic\b', 'Core topic'),
        (r'(?i)\b(?:high|low|intermediate) topic\b', 'Topic'),
        (r'(?i)\bfocus on high-priority deliverables first\b', 'focus on milestone deliverables in sequence'),
    )

    def clean_text(text: str) -> str:
        for pat, repl in replacements:
            text = re.sub(pat, repl, text)
        return text

    def clean_obj(obj: Any) -> Any:
        if isinstance(obj, str):
            return clean_text(obj)
        if isinstance(obj, dict):
            return {k: clean_obj(v) for k, v in obj.items()}
        if isinstance(obj, list):
            return [clean_obj(item) for item in obj]
        return obj

    return clean_obj(data)



@router.get("/health")
async def ai_health():
    if settings.GROQ_API_KEY:
        return {
            "status": "ok",
            "model": f"Groq LPU Engine ({settings.GROQ_MODEL})",
            "provider": "groq",
            "speed": "ultra-fast",
        }
    return {
        "status": "degraded",
        "model": "Built-in curriculum generator (Offline)",
        "provider": "local_fallback",
        "speed": "instant",
    }


def generate_conversational_reply(
    prompt: str, role: str = "developer", history: Optional[List[schemas.ChatMessage]] = None
) -> str:
    """Conversational fallback responder for queries, Q&A, and interactive mentorship (NOT a roadmap generator).
    Produces small, reasonable responses grounded in MentorOS workflows.
    """
    p_lower = prompt.lower().strip()

    # Greetings & Introductions
    if (
        any(
            p_lower.startswith(g)
            for g in ["hi", "hello", "hey", "greetings", "good morning", "good evening", "good afternoon"]
        )
        and len(p_lower.split()) <= 4
    ):
        return (
            f"Hello! I am **Ask**, your mentor in **MentorOS**. "
            f"I'm here to answer queries, debug code, and guide your {role.replace('_', ' ')} workspace. "
            f"How can I help you today?"
        )

    # Questions asking about MentorOS or Ask AI
    if any(k in p_lower for k in ["mentoros", "who are you", "what can you do", "what is ask"]):
        return (
            "I am **Ask**, the conversational mentor in **MentorOS** (tailored for Developer, Freelancer, and Student workspaces).\n\n"
            "- **Supported Workspaces**: Focused guidance for Developers, Freelancers, and Students.\n"
            "- **Time & Milestone Tracking**: Every module tracks expected vs actual hours to optimize delivery.\n"
            "- **Direct Mentorship**: Ask me coding questions, architectural trade-offs, or workflow guidance."
        )

    # Time tracking / Expected vs actual time
    if any(k in p_lower for k in ["expected time", "actual time", "variance", "time tracking"]):
        return (
            "In **MentorOS**, every task and milestone tracks **Expected Time** and **Actual Time**:\n\n"
            "- **Expected Time**: Target effort planned upfront.\n"
            "- **Actual Time**: Real hours logged during execution.\n"
            "- **Variance**: Monitored across all modules to spot bottlenecks and ensure timely completion."
        )

    # GitLab sync / Repositories
    if any(k in p_lower for k in ["gitlab", "repo", "git sync", "merge request"]):
        return (
            "In the **MentorOS Developer Workspace**, **GitLab Sync** connects directly with GitLab projects:\n\n"
            "- Synchronizes repository commits, open issues, and merge requests.\n"
            "- Easily convert GitLab issues into MentorOS tasks with tracked expected hours.\n"
            "- Configure your token in *GitLab Sync* in the developer navigation."
        )

    # Documentation / Dev Notes
    if any(k in p_lower for k in ["doc", "documentation", "notes", "adr", "tech spec"]):
        return (
            "In **MentorOS**, documentation is managed under **Developer Notes**:\n\n"
            "- Click **Draft with Ask AI** to generate technical specs (ADRs, Architecture Specs, Runbooks).\n"
            "- Customize target audience, detail level, and stack constraints directly in the modal.\n"
            "- Review, edit, and save with live Markdown rendering."
        )

    # Freelancing / Rates / Invoices / Client handling / Scope creep
    if role == "freelancer" or any(w in p_lower for w in ["client", "rate", "invoice", "proposal", "contract", "scope creep"]):
        if "scope creep" in p_lower:
            return (
                "**Handling Scope Creep in MentorOS**:\n\n"
                "- Acknowledge the request: *\"That's a great addition! It falls outside our current milestone scope, so I can schedule it for Phase 2 or prepare an addendum quote.\"*\n"
                "- In MentorOS, log the extra scope as a separate billable milestone with its own expected hours rather than overextending active deliverables."
            )
        return (
            "**MentorOS Freelancer Guidance**:\n\n"
            "- **Rate Calculator**: Access static INR market benchmarks with the built-in currency converter under *Rate Calculator*.\n"
            "- **Milestone Invoicing**: Break project proposals into measurable milestones with tracked expected and actual hours.\n"
            "- **Payment Terms**: Standard practice is 30% upfront deposit, 40% midway milestone, and 30% upon completion."
        )

    # Student / CS / Study methods / DSA
    if role == "student" or any(w in p_lower for w in ["study", "exam", "dsa", "algorithm", "college", "course"]):
        return (
            "**MentorOS Study Guidance**:\n\n"
            "- **Active Recall**: Test your understanding by coding from an empty editor instead of passively reading.\n"
            "- **Spaced Repetition**: Review difficult concepts at 1, 3, and 7-day intervals.\n"
            "- **Study Plan**: Organize focused revision sessions in your MentorOS *Study Plan* with tracked expected hours."
        )

    # Job Seeker / Interview prep / Resume
    if role == "job_seeker" or any(w in p_lower for w in ["interview", "resume", "salary", "job", "offer", "star"]):
        return (
            "**MentorOS Career Guidance**:\n\n"
            "- **STAR Framework**: Answer behavioral questions using Situation, Task, Action, and measurable Result.\n"
            "- **Impact Bullets**: Use *\"Accomplished [X], measured by [Y], by doing [Z]\"*.\n"
            "- **Application Pipeline**: Track interviews and follow-up milestones in your MentorOS Job Seeker dashboard."
        )

    # React / Frontend questions
    if (
        "react" in p_lower
        or "useeffect" in p_lower
        or "usememo" in p_lower
        or "usestate" in p_lower
        or "re-render" in p_lower
        or "hook" in p_lower
    ):
        return (
            "**React Best Practice in MentorOS**:\n\n"
            "- **`useMemo`**: Caches computed values to avoid heavy recalculations during re-renders.\n"
            "- **`useCallback`**: Caches callback function references to avoid re-rendering memoized child components.\n"
            "- **State Locality**: Keep state local to where it's needed to prevent unnecessary parent tree re-renders."
        )

    # Python / Backend questions
    if (
        "python" in p_lower
        or ("async" in p_lower and "python" in p_lower)
        or "fastapi" in p_lower
        or "pydantic" in p_lower
    ):
        return (
            "**Python & FastAPI Practice in MentorOS**:\n\n"
            "- Use `async def` for I/O operations (network, async DB) and standard `def` for synchronous DB drivers.\n"
            "- Enforce type safety with Pydantic v2 schemas using `.model_dump()`.\n"
            "- Structure endpoints into modular routers matching your domain models."
        )

    # SQL / Database questions
    if "sql" in p_lower or "database" in p_lower or "postgres" in p_lower or "index" in p_lower:
        return (
            "**Database Optimization in MentorOS**:\n\n"
            "- **Composite Indexes**: Follow the leftmost prefix rule for compound query filters.\n"
            "- **N+1 Avoidance**: Use eager loading (`joinedload`/`selectinload`) when querying models with relationships.\n"
            "- **Transactions**: Keep DB transactions concise to prevent locking shared connections."
        )

    # Default general concise conversational answer
    return (
        f"**MentorOS Insight on: {prompt.strip()}**\n\n"
        f"- Focus on breaking the problem into clear, measurable steps matching your {role.replace('_', ' ')} workspace.\n"
        f"- Track expected vs actual progress in MentorOS to maintain clarity and avoid bottlenecks.\n"
        f"- Feel free to ask a specific follow-up query or paste code for quick debugging!"
    )


@router.post("/ask", response_model=schemas.AskResponse)
async def ask_chatbot(
    req: schemas.AskRequest,
    current_user: models.User = Depends(get_current_user),
):
    """
    Conversational AI Assistant 'Ask' for queries, Q&A, and general conversation.
    Explicitly NOT a roadmap or project proposal generator.
    """
    role = req.role or current_user.role or "developer"
    user_msg = req.message.strip()

    # If Groq API key is configured, call Groq LLM
    if settings.GROQ_API_KEY:
        system_prompt = f"""You are "Ask", the conversational AI mentor inside MentorOS.
The user's current workspace role is: {role}.

CRITICAL GUIDELINES:
1. SMALL AND REASONABLE:
   - Keep answers short, direct, and reasonable in length (strictly under 100-140 words or 2-3 concise bullet points).
   - Never generate essays, bloated introductions, repeated greetings, or boilerplate summaries. Get straight to the point.
2. BASED ON MENTOROS:
   - Ground answers in MentorOS features, workspaces, and workflows:
     * Time Tracking: Every task and milestone across all modules displays Expected vs Actual Time with variance metrics.
     * Developer: GitLab repository sync (commits, issues, MRs), Build Plan, Documentation (Dev Notes drafted with Ask AI).
     * Freelancer: Client Portal, Proposals, Invoices, Milestones with time tracking, Rate Calculator (static benchmarks in INR with currency converter).
     * Student: Academic Courses, Assignments, Study Plans with time estimates.
   - Note: Ask AI is exclusively tailored for Student, Freelancer, and Developer workspaces (not Job Seeker).
   - You are a direct conversational Q&A assistant in MentorOS — NOT a roadmap generator.
3. Clean, crisp GitHub-flavored Markdown."""

        messages: List[Dict[str, str]] = [{"role": "system", "content": system_prompt}]
        if req.history:
            # Append up to the last 8 turns of conversation for contextual continuity
            for msg in req.history[-8:]:
                if msg.role in ("user", "assistant"):
                    messages.append({"role": msg.role, "content": msg.content})

        messages.append({"role": "user", "content": user_msg})

        try:
            async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT) as client:
                res = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                    json={
                        "model": settings.GROQ_MODEL,
                        "messages": messages,
                        "temperature": 0.5,
                        "max_tokens": 350,
                    },
                )
                if res.status_code == 200:
                    reply_text = res.json()["choices"][0]["message"]["content"]
                    return schemas.AskResponse(
                        reply=reply_text,
                        provider="groq",
                        model=settings.GROQ_MODEL,
                    )
        except Exception:
            # Fall back to local conversational synthesis if network/API fails
            pass

    # Built-in conversational response engine
    fallback_reply = generate_conversational_reply(user_msg, role=role, history=req.history)
    return schemas.AskResponse(
        reply=fallback_reply,
        provider="local_fallback",
        model="MentorOS Conversational AI (Ask)",
    )

@router.post("/propose", response_model=schemas.AIProposalOut)
async def generate_ai_proposal(
    req: schemas.AIProposalRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    role = req.role or current_user.role
    prompt = req.request_text.strip()
    existing_proposal = (
        db.query(models.AIProposal)
        .filter(
            models.AIProposal.user_id == current_user.id,
            models.AIProposal.role == role,
            models.AIProposal.request_text == prompt,
            models.AIProposal.status == "pending",
        )
        .order_by(models.AIProposal.created_at.desc())
        .first()
    )
    if existing_proposal:
        # Check if existing proposal is missing calendar events
        has_events = any(item.item_type == "calendar_event" for item in existing_proposal.items)
        if not has_events and existing_proposal.status != "approved":
            first_proj = next((i for i in existing_proposal.items if i.item_type == "project"), None)
            proj_title = first_proj.payload.get("title", f"Roadmap: {prompt[:35]}") if first_proj else f"Roadmap: {prompt[:35]}"
            ev_type = "study_block" if role == "student" else "build_block"
            now_dt = datetime.utcnow()
            ev1 = models.AIProposalItem(
                proposal_id=existing_proposal.id,
                item_type="calendar_event",
                payload={
                    "title": f"Study Session: {proj_title[:35]} Kickoff",
                    "description": f"Scheduled study session for: {prompt[:60]}",
                    "start_at": (now_dt + timedelta(days=1)).replace(hour=10, minute=0, second=0).isoformat(),
                    "end_at": (now_dt + timedelta(days=1)).replace(hour=11, minute=30, second=0).isoformat(),
                    "event_type": ev_type,
                }
            )
            ev2 = models.AIProposalItem(
                proposal_id=existing_proposal.id,
                item_type="calendar_event",
                payload={
                    "title": f"Deep Work: {proj_title[:35]} Practice",
                    "description": f"Hands-on practice exercises for: {prompt[:60]}",
                    "start_at": (now_dt + timedelta(days=3)).replace(hour=14, minute=0, second=0).isoformat(),
                    "end_at": (now_dt + timedelta(days=3)).replace(hour=16, minute=0, second=0).isoformat(),
                    "event_type": ev_type,
                }
            )
            db.add(ev1)
            db.add(ev2)
            db.commit()
            db.refresh(existing_proposal)
        return existing_proposal

    structured_data = None

    system_prompt = f"""You are MentorOS AI Copilot for the {role} role.
Your task is to analyze the user request and generate comprehensive mentor-grade guidance and a clear sequential roadmap.
CRITICAL CONSTRAINT: In roadmap generation, never tell or classify any topic, module, task, or phase as 'high', 'low', or 'intermediate' (neither in difficulty, complexity, nor priority). Do not use the words 'high', 'low', or 'intermediate' to qualify topics or learning stages. Present all topics with descriptive domain concepts, actionable skills, and practical project deliverables.
Output ONLY valid JSON matching this schema:
{{
  "summary": "Full comprehensive roadmap in rich Markdown: an encouraging personal mentor introduction tailored to a student/developer, a clean overview table (Month | Focus | What you will be able to do), detailed week-by-week breakdown with core concepts and hands-on practice problems (without classifying topics as high, low, or intermediate), real-world mini-projects & capstone with architecture, a daily 1.5-2h study schedule with the golden active practice rule, and progression flowchart",
  "projects": [{{"title": "...", "description": "...", "priority": "medium", "target_date": "YYYY-MM-DD"}}],
  "milestones": [{{"project_title": "...", "title": "...", "description": "...", "target_date": "YYYY-MM-DD"}}],
  "tasks": [{{"project_title": "...", "title": "...", "description": "...", "priority": "medium", "estimated_minutes": 60, "due_date": "YYYY-MM-DD"}}],
  "calendar_events": [{{"title": "...", "start_at": "YYYY-MM-DDTHH:MM:SS", "end_at": "YYYY-MM-DDTHH:MM:SS", "event_type": "study_block"}}],
  "notes": [{{"title": "...", "content": "..."}}]
}}
Make sure to include:
1. Exactly 1 overarching roadmap project in "projects".
2. 3 progressive roadmap milestones/phases in "milestones" covering each phase or month without using 'high', 'low', or 'intermediate' labels.
3. Actionable focus tasks in "tasks" for weekly practice drills and milestone projects.
4. 1-2 scheduled study/work sessions in "calendar_events".
5. 1 strategic guidance note in "notes" with the complete roadmap guide.
Output raw JSON only. Do not include markdown code block backticks around the JSON.
"""

    # Fast Groq LPU invocation
    async def try_groq() -> Dict[str, Any] | None:
        if not settings.GROQ_API_KEY:
            return None
        try:
            async with httpx.AsyncClient(timeout=settings.AI_TIMEOUT) as client:
                res = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={"Authorization": f"Bearer {settings.GROQ_API_KEY}"},
                    json={
                        "model": settings.GROQ_MODEL,
                        "messages": [
                            {"role": "system", "content": system_prompt},
                            {"role": "user", "content": f"User Request: {prompt}"},
                        ],
                        "response_format": {"type": "json_object"},
                        "temperature": 0.2,
                    },
                )
                if res.status_code == 200:
                    content = res.json()["choices"][0]["message"]["content"]
                    return json.loads(content)
        except Exception:
            pass
        return None

    # Exclusively query Groq for fastest response
    structured_data = await try_groq()

    # For learning/roadmap requests, guarantee a comprehensive mentor-grade syllabus
    p_check = prompt.lower()
    if ("learn" in p_check or "roadmap" in p_check or "python" in p_check or "react" in p_check or "web" in p_check):
        smart_plan = synthesize_smart_roadmap(prompt, role)
        # Keep LLM output if it generated at least 1 project and 2 tasks; only fallback if empty
        if not structured_data or not structured_data.get("projects") or len(structured_data.get("tasks", [])) < 2:
            structured_data = smart_plan
        else:
            if not structured_data.get("notes"):
                structured_data["notes"] = smart_plan["notes"]

    # Fallback if still empty
    if not structured_data:
        structured_data = synthesize_smart_roadmap(prompt, role)

    now = datetime.utcnow()
    target_dt = (now + timedelta(days=14)).strftime("%Y-%m-%d")

    # 3. Smart Semantic Roadmap Synthesizer (Instant fallback if LLM is offline or timed out)
    if not structured_data:
        structured_data = synthesize_smart_roadmap(prompt, role)

    # Safety Check: Guarantee every proposal contains a project, milestones, and guidance note
    if not structured_data.get("projects"):
        default_p_title = f"{role.capitalize()} Roadmap: {prompt[:35]}"
        structured_data["projects"] = [{
            "title": default_p_title,
            "description": f"Structured execution roadmap for: {prompt}",
            "priority": "high",
            "target_date": target_dt,
        }]
    first_proj_title = structured_data["projects"][0].get("title", f"Roadmap: {prompt[:35]}")

    if not structured_data.get("milestones"):
        structured_data["milestones"] = [
            {
                "project_title": first_proj_title,
                "title": "Phase 1: Foundation & Discovery",
                "description": "Establish fundamentals and review requirements",
                "target_date": (now + timedelta(days=4)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": first_proj_title,
                "title": "Phase 2: Core Execution & Application",
                "description": "Work through main deliverables and milestone targets",
                "target_date": (now + timedelta(days=10)).strftime("%Y-%m-%d"),
            },
        ]

    if not structured_data.get("notes"):
        structured_data["notes"] = [
            {
                "title": f"Strategic Guidance & Roadmap: {prompt[:30]}",
                "content": f"# Guidance & Execution Roadmap for: {prompt}\n\n## Strategy & Approach\nFollow a paced schedule and focus on milestone deliverables in sequence.\n\n## Action Plan\n1. Review project milestones.\n2. Complete daily tasks on the task board.\n3. Verify progress at each phase check-in.",
            }
        ]

    if not structured_data.get("calendar_events"):
        ev_type = "study_block" if role == "student" else "build_block"
        structured_data["calendar_events"] = [
            {
                "title": f"Study Session: {first_proj_title[:35]} Kickoff & Core Concepts",
                "description": f"Focused learning and practical exercises for {prompt[:70]}",
                "start_at": (now + timedelta(days=1)).replace(hour=10, minute=0, second=0).isoformat(),
                "end_at": (now + timedelta(days=1)).replace(hour=11, minute=30, second=0).isoformat(),
                "event_type": ev_type,
            },
            {
                "title": f"Deep Work: {first_proj_title[:35]} Hands-on Practice",
                "description": f"Implement practice tasks and review progress for {prompt[:70]}",
                "start_at": (now + timedelta(days=3)).replace(hour=14, minute=0, second=0).isoformat(),
                "end_at": (now + timedelta(days=3)).replace(hour=16, minute=0, second=0).isoformat(),
                "event_type": ev_type,
            },
        ]
        if structured_data.get("milestones"):
            m0 = structured_data["milestones"][0]
            target_str = m0.get("target_date")
            try:
                m_date = datetime.strptime(target_str, "%Y-%m-%d")
            except Exception:
                m_date = now + timedelta(days=7)
            structured_data["calendar_events"].append({
                "title": f"Milestone Review: {m0.get('title', 'Phase 1 Review')[:35]}",
                "description": f"Milestone deliverable evaluation: {m0.get('description', '')[:90]}",
                "start_at": m_date.replace(hour=16, minute=0, second=0).isoformat(),
                "end_at": m_date.replace(hour=17, minute=30, second=0).isoformat(),
                "event_type": "assignment_deadline" if role == "student" else "milestone_target",
            })

    # Sanitize roadmap topic labels to ensure no high, low, or intermediate labels are present
    structured_data = sanitize_roadmap_topic_labels(structured_data)

    # Persist proposal into DB
    proposal = models.AIProposal(
        user_id=current_user.id,
        role=role,
        request_text=prompt,
        summary=structured_data.get("summary", "AI Generated Plan"),
        status="pending",
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)

    # Persist items
    for p in structured_data.get("projects", []):
        item = models.AIProposalItem(proposal_id=proposal.id, item_type="project", payload=p)
        db.add(item)

    for m in structured_data.get("milestones", []):
        item = models.AIProposalItem(proposal_id=proposal.id, item_type="milestone", payload=m)
        db.add(item)

    for t in structured_data.get("tasks", []):
        item = models.AIProposalItem(proposal_id=proposal.id, item_type="task", payload=t)
        db.add(item)

    for ev in structured_data.get("calendar_events", []):
        item = models.AIProposalItem(proposal_id=proposal.id, item_type="calendar_event", payload=ev)
        db.add(item)

    for n in structured_data.get("notes", []):
        item = models.AIProposalItem(proposal_id=proposal.id, item_type="note", payload=n)
        db.add(item)

    db.commit()
    db.refresh(proposal)
    return proposal

@router.get("/proposals", response_model=List[schemas.AIProposalOut])
def list_proposals(
    role: Optional[str] = None,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    query = db.query(models.AIProposal).filter(models.AIProposal.user_id == current_user.id)
    target_role = role or current_user.role
    query = query.filter(models.AIProposal.role == target_role)
    return (
        query
        .order_by(models.AIProposal.created_at.desc())
        .limit(20)
        .all()
    )

@router.post("/proposals/{proposal_id}/approve", response_model=schemas.AIApprovalResult)
def approve_proposal(
    proposal_id: int,
    req: schemas.AIApproveRequest,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    proposal = db.query(models.AIProposal).filter(
        models.AIProposal.id == proposal_id,
        models.AIProposal.user_id == current_user.id,
    ).first()

    if not proposal:
        raise HTTPException(status_code=404, detail="Proposal not found")

    result = {
        "created_tasks": [],
        "created_projects": [],
        "created_milestones": [],
        "created_events": [],
        "created_notes": [],
    }

    now = datetime.utcnow()

    # Pre-populate title map from both proposal and existing user projects
    project_title_map: Dict[str, int] = {
        str(item.payload.get("title")): item.persisted_record_id
        for item in proposal.items
        if item.item_type == "project" and item.approved and item.persisted_record_id is not None
    }
    existing_user_projects = db.query(models.Project).filter(models.Project.user_id == current_user.id).all()
    for proj in existing_user_projects:
        project_title_map[proj.title] = proj.id

    proposal_item_ids = {item.id for item in proposal.items}
    if not set(req.approved_item_ids).issubset(proposal_item_ids):
        raise HTTPException(status_code=400, detail="One or more proposal items are invalid")

    should_approve_all_events = any(
        i.item_type in ("project", "milestone") and i.id in req.approved_item_ids
        for i in proposal.items
    )

    for item in proposal.items:
        if item.approved:
            continue
        if item.id not in req.approved_item_ids:
            if item.item_type == "calendar_event" and should_approve_all_events:
                pass
            else:
                continue

        payload = item.payload.copy() if isinstance(item.payload, dict) else {}
        if req.item_overrides and item.id in req.item_overrides:
            payload.update(req.item_overrides[item.id].model_dump(exclude_unset=True))

        try:
            if item.item_type == "project":
                p = models.Project(
                    user_id=current_user.id,
                    role=proposal.role,
                    title=payload.get("title", "New Project"),
                    description=payload.get("description"),
                    priority=payload.get("priority", "medium"),
                    target_date=payload.get("target_date"),
                    progress=0,
                    status=payload.get("status", "active"),
                    created_at=now,
                    updated_at=now,
                )
                db.add(p)
                db.flush()
                project_title_map[p.title] = p.id
                item.approved = True
                item.persisted_record_id = p.id
                result["created_projects"].append(schemas.ProjectOut.from_orm(p))

            elif item.item_type == "milestone":
                p_title = payload.get("project_title")
                p_id = project_title_map.get(p_title)
                m = models.Milestone(
                    user_id=current_user.id,
                    project_id=p_id,
                    role=proposal.role,
                    title=payload.get("title", "New Milestone"),
                    description=payload.get("description"),
                    target_date=payload.get("target_date"),
                    estimated_minutes=payload.get("estimated_minutes", 0),
                    actual_minutes=payload.get("actual_minutes", 0),
                    status="pending",
                    created_at=now,
                    updated_at=now,
                )
                db.add(m)
                db.flush()
                item.approved = True
                item.persisted_record_id = m.id
                result["created_milestones"].append(schemas.MilestoneOut.from_orm(m))

            elif item.item_type == "task":
                p_title = payload.get("project_title")
                p_id = project_title_map.get(p_title)
                t = models.Task(
                    user_id=current_user.id,
                    project_id=p_id,
                    role=proposal.role,
                    title=payload.get("title", "New Task"),
                    description=payload.get("description"),
                    priority=payload.get("priority", "medium"),
                    due_date=payload.get("due_date"),
                    estimated_minutes=payload.get("estimated_minutes", 60),
                    actual_minutes=payload.get("actual_minutes", 0),
                    status="todo",
                    created_at=now,
                    updated_at=now,
                )
                db.add(t)
                db.flush()
                item.approved = True
                item.persisted_record_id = t.id
                out = schemas.TaskOut.from_orm(t)
                out.project_title = p_title
                result["created_tasks"].append(out)

            elif item.item_type == "calendar_event":
                default_ev_type = "study_block" if proposal.role == "student" else "build_block"
                p_title = payload.get("project_title")
                p_id = project_title_map.get(p_title) if p_title else (list(project_title_map.values())[0] if project_title_map else None)

                start_at_val = payload.get("start_at") or now.isoformat()
                end_at_val = payload.get("end_at") or (now + timedelta(hours=1)).isoformat()
                ev_type_val = payload.get("event_type") or default_ev_type

                ev = models.CalendarEvent(
                    user_id=current_user.id,
                    role=proposal.role,
                    project_id=p_id,
                    title=payload.get("title", "Scheduled Session"),
                    description=payload.get("description"),
                    start_at=start_at_val,
                    end_at=end_at_val,
                    all_day=payload.get("all_day", False),
                    event_type=ev_type_val,
                    created_at=now,
                    updated_at=now,
                )
                db.add(ev)
                db.flush()
                item.approved = True
                item.persisted_record_id = ev.id
                result["created_events"].append(schemas.CalendarEventOut.from_orm(ev))

            elif item.item_type == "note":
                n = models.Note(
                    user_id=current_user.id,
                    role=proposal.role,
                    title=payload.get("title", "Note"),
                    content=payload.get("content") or payload.get("description") or "Study notes and roadmap curriculum.",
                    is_pinned=False,
                    created_at=now,
                    updated_at=now,
                )
                db.add(n)
                db.flush()
                item.approved = True
                item.persisted_record_id = n.id
                result["created_notes"].append(schemas.NoteOut.from_orm(n))
        except Exception as e:
            # Continue approving remaining items rather than failing the whole batch
            continue

    proposal.status = "approved" if all(item.approved for item in proposal.items) else "pending"
    db.commit()
    return result
