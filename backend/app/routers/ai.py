import json
import re
from typing import Dict, Any, List
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

    # Check for duration (e.g. "3 months", "6 weeks", "30 days")
    months_match = re.search(r'(\d+)\s*(?:month|mo)', p_lower)
    weeks_match = re.search(r'(\d+)\s*(?:week|wk)', p_lower)
    days_match = re.search(r'(\d+)\s*(?:day)', p_lower)

    total_days = 90
    duration_label = "3-Month"
    if months_match:
        m = int(months_match.group(1))
        total_days = max(m * 30, 14)
        duration_label = f"{m}-Month"
    elif weeks_match:
        w = int(weeks_match.group(1))
        total_days = max(w * 7, 7)
        duration_label = f"{w}-Week"
    elif days_match:
        d = int(days_match.group(1))
        total_days = max(d, 3)
        duration_label = f"{d}-Day"

    target_dt = (now + timedelta(days=total_days)).strftime("%Y-%m-%d")
    m1_dt = (now + timedelta(days=max(int(total_days * 0.33), 3))).strftime("%Y-%m-%d")
    m2_dt = (now + timedelta(days=max(int(total_days * 0.66), 7))).strftime("%Y-%m-%d")
    m3_dt = target_dt

    # Check role context
    role_ctx = "BSc CS student and interested in AI/full-stack development" if role in ["student", "developer"] else f"{role.replace('_', ' ')} striving for career mastery"

    # Subject 1: Python
    if "python" in p_lower:
        subject = "Python"
        proj_title = f"{duration_label} Python Mastery Roadmap"

        roadmap_text = f"""Absolutely. If your goal is to become genuinely comfortable with Python in 3 months—not just memorize syntax—we can structure it around learning + coding practice + projects.
Since you’re a {role_ctx}, I’d recommend a path that eventually leads into backend development, data handling, and AI development.

### 3-Month Python Roadmap
| Month | Focus | What you'll be able to do |
| :--- | :--- | :--- |
| **Month 1** | Python Fundamentals | Write programs confidently |
| **Month 2** | Intermediate Python | Build useful applications |
| **Month 3** | Advanced + Projects | Build real-world Python projects |

---

### Month 1 — Python Fundamentals
#### Week 1: Python Basics
- Installing Python / VS Code
- Python syntax
- Variables
- Data types
- int, float, str, bool
- Input/output
- Type conversion
- Operators
- Comments
**Practice:**
- Calculator
- Unit converter
- Simple bill calculator
- Age calculator

#### Week 2: Decision Making
- if
- elif
- else
- Nested conditions
- Comparison operators
- Logical operators
**Practice:**
- Grade calculator
- Login system
- Number checker
- Simple ATM program

#### Week 3: Loops
- for
- while
- range()
- break
- continue
- Nested loops
**Practice:**
- Multiplication table
- Number guessing game
- Pattern programs
- Simple quiz

#### Week 4: Data Structures
- Lists
- Tuples
- Sets
- Dictionaries
- Indexing
- Slicing
- Adding/removing/updating elements
- Looping through collections
**Mini-project: Student Management System**
- Add student
- View students
- Search student
- Update student
- Delete student
- Calculate average marks

---

### Month 2 — Intermediate Python
#### Week 5: Functions
- Creating functions
- Parameters
- Arguments
- Return values
- Default arguments
- Keyword arguments
- Scope
- Lambda functions
*You should start writing programs as reusable functions rather than putting everything inside one large script.*

#### Week 6: Files + Error Handling
- Reading files
- Writing files
- CSV
- JSON
- try
- except
- finally
- Raising exceptions
**Project: Expense Tracker**
Store expenses in a JSON/CSV file and provide:
- Add expense
- Delete expense
- View expenses
- Category-wise expenses
- Total expenses
- Monthly summary

#### Week 7: Object-Oriented Programming
**Learn:**
- Classes
- Objects
- Attributes
- Methods
- __init__
- Encapsulation
- Inheritance
- Polymorphism
**Project: Library Management System**

#### Week 8: Modules + Professional Python
**Learn:**
- Modules
- Packages
- pip
- Virtual environments
- requirements.txt
- Environment variables
- datetime
- os
- pathlib
- random
- collections
**Also start using:**
- venv
- Git
- GitHub
- VS Code debugging

---

### Month 3 — Advanced Python + Real Projects
#### Week 9: Advanced Python
**Learn:**
- List comprehensions
- Dictionary comprehensions
- *args
- **kwargs
- Iterators
- Generators
- Decorators
- map()
- filter()
- zip()
- enumerate()
*Don't try to memorize these. Build small programs with them.*

#### Week 10: APIs + Database
*This is particularly important for your career direction.*
**Learn:**
- HTTP basics
- REST APIs
- JSON
- requests
- Databases & SQL
- SQL basics
- CRUD
- Python + database
**Build: Python API + Database Application**
For example: Users, Products, Tasks, Categories with CRUD operations.

#### Week 11: FastAPI
*Since you're already interested in AI/backend development, this is where Python becomes directly useful for your projects.*
**Learn:**
- FastAPI
- Routes
- GET
- POST
- PUT
- DELETE
- Request body
- Query parameters
- Path parameters
- Pydantic
- API validation
- Connecting database
- API documentation
**Build: Task Management REST API**
- POST   /tasks
- GET    /tasks
- GET    /tasks/{{id}}
- PUT    /tasks/{{id}}
- DELETE /tasks/{{id}}

#### Week 12: Final Project
*Build one complete project instead of doing another collection of tiny exercises.*
**For you, I would recommend: AI Productivity Workspace Backend**
Python handles:
- User management
- Tasks
- Projects
- Notes
- Goals
- Productivity statistics
- Database
- REST API
- AI integration

**Architecture:**
```
Frontend
   ↓
FastAPI
   ↓
Python Business Logic
   ↓
Database Layer
   ↓
AI Model / API
```
*By the end of the third month, you should be able to understand and modify a backend like this rather than simply copying code.*

---

### Daily Schedule
You don't need 6–8 hours every day.
Aim for 1.5–2 hours/day, 6 days/week.

A good session:
- 20 min → Learn concept
- 30 min → Follow examples
- 40 min → Solve problems yourself
- 20 min → Build/improve project
- 10 min → Review

> The most important rule: Don't spend 2 hours watching Python tutorials. Spend 2 hours writing Python.

For every concept, use this cycle:
```
Learn
  ↓
Understand why
  ↓
Write code yourself
  ↓
Break the code
  ↓
Fix it
  ↓
Build something
```

### Your progression
You should think of the 3 months like this:
```
MONTH 1
Python syntax
     ↓
Problem solving
     ↓
Small programs

MONTH 2
Functions
     ↓
OOP
     ↓
Files
     ↓
Modules
     ↓
Medium projects

MONTH 3
APIs
     ↓
Database
     ↓
FastAPI
     ↓
Real project
     ↓
Portfolio
```
If you follow this consistently, 3 months is enough to reach a solid practical Python level, although mastery obviously takes longer."""

        milestones = [
            {
                "project_title": proj_title,
                "title": "Month 1: Python Fundamentals & Problem Solving (Weeks 1–4)",
                "description": "Master variables, data types, conditionals, loops, functions, and collections with small CLI programs.",
                "target_date": m1_dt,
            },
            {
                "project_title": proj_title,
                "title": "Month 2: Intermediate Python, OOP & File Systems (Weeks 5–8)",
                "description": "Deep dive into reusable functions, JSON/CSV file handling, OOP class hierarchies, and virtualenv/Git.",
                "target_date": m2_dt,
            },
            {
                "project_title": proj_title,
                "title": "Month 3: Advanced Python, FastAPI & AI Backend Capstone (Weeks 9–12)",
                "description": "Master comprehensions, databases, FastAPI REST endpoints, and build the AI Workspace Backend.",
                "target_date": m3_dt,
            }
        ]

        tasks = [
            {
                "project_title": proj_title,
                "title": "Week 1: Python Basics — Build Calculator & Unit Converter",
                "description": "Set up VS Code & Python. Write Calculator, Unit converter, Bill calculator, and Age calculator.",
                "priority": "urgent",
                "estimated_minutes": 60,
                "due_date": (now + timedelta(days=7)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 2: Decision Making — Grade Calculator, Login & ATM Program",
                "description": "Master if/elif/else, comparison & logical operators. Build Login and ATM flow programs.",
                "priority": "high",
                "estimated_minutes": 60,
                "due_date": (now + timedelta(days=14)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 3: Loops Mastery — Multiplication Table & Guessing Game",
                "description": "Practice for/while, range, break, and continue. Implement number guessing game and pattern programs.",
                "priority": "high",
                "estimated_minutes": 60,
                "due_date": (now + timedelta(days=21)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 4 Mini-Project: Student Management System (Full CRUD)",
                "description": "Lists, dicts, indexing, slicing. Build CLI system: Add, View, Search, Update, Delete students.",
                "priority": "urgent",
                "estimated_minutes": 90,
                "due_date": (now + timedelta(days=28)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 5: Modularize Programs into Reusable Functions & Scope",
                "description": "Parameters, return values, default/keyword args, scope, and lambdas. Refactor scripts into functions.",
                "priority": "high",
                "estimated_minutes": 60,
                "due_date": (now + timedelta(days=35)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 6 Project: JSON/CSV Expense Tracker with Error Handling",
                "description": "File I/O, try/except, CSV & JSON persistence. Add, delete, and summarize monthly expenses.",
                "priority": "high",
                "estimated_minutes": 90,
                "due_date": (now + timedelta(days=42)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 7 Project: Library Management System with OOP Hierarchy",
                "description": "Classes, objects, __init__, encapsulation, inheritance, and methods for Book & Member management.",
                "priority": "high",
                "estimated_minutes": 90,
                "due_date": (now + timedelta(days=49)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 8: Set Up Professional venv, Git, GitHub & VS Code Debugger",
                "description": "Modules, packages, pip, virtual environments, requirements.txt, datetime, and Git commit workflow.",
                "priority": "high",
                "estimated_minutes": 60,
                "due_date": (now + timedelta(days=56)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 9: Build Advanced Drills with Comprehensions & Decorators",
                "description": "List/dict comprehensions, *args/**kwargs, generators, decorators, map(), filter(), and zip().",
                "priority": "high",
                "estimated_minutes": 75,
                "due_date": (now + timedelta(days=63)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 10: Build CRUD Database Service with requests API",
                "description": "HTTP basics, REST APIs, JSON, database integration, SQL CRUD operations for Users & Tasks.",
                "priority": "high",
                "estimated_minutes": 90,
                "due_date": (now + timedelta(days=70)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 11: Develop Task Management REST API with FastAPI & Pydantic",
                "description": "Endpoints GET/POST/PUT/DELETE /tasks, Pydantic schemas, database dependency, and Swagger docs.",
                "priority": "urgent",
                "estimated_minutes": 105,
                "due_date": (now + timedelta(days=77)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 12 Capstone: Build AI Productivity Workspace Backend",
                "description": "Multi-entity backend (Users, Tasks, Projects, Notes, AI integrations) connecting relational database.",
                "priority": "urgent",
                "estimated_minutes": 120,
                "due_date": (now + timedelta(days=85)).strftime("%Y-%m-%d"),
            }
        ]

    # Subject 2: Web Development / React / Frontend
    elif any(k in p_lower for k in ["web", "react", "frontend", "javascript", "html", "css", "fullstack"]):
        subject = "Web Development & Frontend"
        proj_title = f"{duration_label} Web Development Mastery Roadmap"

        roadmap_text = f"""Absolutely. If your goal is to master modern web development with HTML, CSS, JavaScript, React and TypeScript in {duration_label.lower()}, we can structure it around learning + active component building + production applications.
Since you’re a {role_ctx}, I’d recommend a path leading from core web foundations (HTML/CSS/JS) into modern React, state management, and full-stack API integration.

### {duration_label} Web Development Roadmap
| Phase | Focus | What you'll be able to do |
| :--- | :--- | :--- |
| **Phase 1** | Modern Web Fundamentals (HTML/CSS/JS) | Build clean interactive components |
| **Phase 2** | Hooks, State & Routing | Develop multi-page applications with APIs |
| **Phase 3** | Full-Stack Integration & Capstone | Build production-ready portfolio apps |

---

### Phase 1 — Modern JavaScript & React Fundamentals (Weeks 1–4)
#### Week 1: JavaScript ES6+ Foundations
- Modern syntax: `let`/`const`, arrow functions, template literals
- Destructuring, spread/rest operators (`...`)
- Array methods: `map()`, `filter()`, `reduce()`, `find()`
- Promises, `async`/`await`, and `fetch()`
**Practice:**
- Array manipulation exercises
- Async weather fetch CLI/browser script
- DOM event listener interactive widget

#### Week 2: React Core & Component Architecture
- Vite + React + TypeScript setup
- JSX syntax, expressions & conditional rendering
- Components, props, and children composition
- Styling with Tailwind CSS
**Practice:**
- Profile card showcase component
- Interactive product catalog listing
- Pricing tier switcher

#### Week 3: State & Interactive UI
- `useState` hook in depth
- Event handling & synthetic events
- Controlled form inputs vs uncontrolled
- Lifting state up to parent components
**Practice:**
- Dynamic Todo list with filters (all, active, completed)
- Form validation interactive widget
- Interactive accordion & modal dialogs

#### Week 4: Mini-Project: Personal Developer Portfolio
- Responsive navbar with mobile drawer
- Hero section, skills grid, and project showcase
- Contact form with local state validation
- Dark/light mode theme toggle

---

### Phase 2 — Advanced Hooks, State & APIs (Weeks 5–8)
#### Week 5: Side Effects & Lifecycle (`useEffect`)
- `useEffect` mechanics and dependency array rules
- Data fetching from REST APIs
- Cleanup functions & preventing race conditions
- Custom hooks for data fetching (`useFetch`)
**Practice:**
- Live GitHub user profile explorer
- Crypto price tracker with auto-refresh

#### Week 6: Client-Side Routing (React Router v6/v7)
- `BrowserRouter`, `Routes`, `Route`, `Link`, `NavLink`
- Dynamic route params (`/projects/:id`)
- Nested layouts, Outlet, and 404 catch-all
- Protected route guards for authenticated views
**Practice:**
- Multi-page e-commerce storefront prototype
- Role-gated dashboard navigation

#### Week 7: Global State Management (Zustand / Context)
- Prop drilling pitfalls vs Context API
- Modern lightweight state with Zustand
- Store selectors, actions, and persistence middleware
**Project: Interactive Shopping Cart & Checkout**
- Global cart store, item quantity toggling, checkout summary

#### Week 8: Production Tooling & TypeScript Mastery
- TypeScript interfaces, types, generics, and React event typing
- Component testing basics with Vitest/Jest
- Linting, formatting, and VS Code productivity setups

---

### Phase 3 — Production Capstone & Architecture (Weeks 9–12)
#### Week 9: Performance & Advanced Patterns
- `useMemo`, `useCallback`, and `React.memo`
- Code splitting with `React.lazy` and `Suspense`
- Optimistic UI updates

#### Week 10: Full-Stack Integration
- Connecting to FastAPI or Node REST API
- JWT authentication flow (Login, Register, Bearer tokens)
- Error boundaries & toast notification system

#### Week 11: Polish & Animations
- Fluid transitions with Framer Motion
- Keyboard shortcuts & command palettes (`Cmd+K`)
- Accessible form controls (ARIA, focus management)

#### Week 12: Final Capstone Project
**Recommended Capstone: Collaborative AI Project Management Workspace**
- Full Kanban board with drag-and-drop
- Live API integration with FastAPI/PostgreSQL
- Role-based views, dark mode, and Vercel/Netlify deployment.

---

### ⏱️ Daily Schedule
Aim for **1.5–2 hours/day, 6 days/week**.
- 20 min → Learn new concept
- 30 min → Dissect live code examples
- 40 min → Build components from scratch
- 20 min → Integrate into weekly project
- 10 min → Code review & Git commit

**The most important rule:**
> **Don't spend 2 hours watching React tutorials. Spend 2 hours building components.**"""

        milestones = [
            {
                "project_title": proj_title,
                "title": "Phase 1: Modern JS & React Component Architecture (Weeks 1–4)",
                "description": "ES6+, JSX, components, props, useState, Tailwind, and Personal Portfolio.",
                "target_date": m1_dt,
            },
            {
                "project_title": proj_title,
                "title": "Phase 2: Hooks, React Router & Global State (Weeks 5–8)",
                "description": "useEffect, custom hooks, dynamic routing, protected routes, and Zustand state.",
                "target_date": m2_dt,
            },
            {
                "project_title": proj_title,
                "title": "Phase 3: Full-Stack API Integration & Portfolio Capstone (Weeks 9–12)",
                "description": "JWT auth, FastAPI backend integration, animations, and SaaS capstone deployment.",
                "target_date": m3_dt,
            }
        ]

        tasks = [
            {
                "project_title": proj_title,
                "title": "Week 1: Modern JavaScript ES6+ & Async Practice Drills",
                "description": "Master arrow functions, destructuring, array methods (map, filter, reduce), and async/await.",
                "priority": "urgent",
                "estimated_minutes": 60,
                "due_date": (now + timedelta(days=7)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 2: Vite + React + TypeScript Component Architecture",
                "description": "Build reusable UI components with props, TypeScript interfaces, and Tailwind styling.",
                "priority": "high",
                "estimated_minutes": 60,
                "due_date": (now + timedelta(days=14)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 3: State Management with useState & Form Handling",
                "description": "Implement interactive todo list, controlled form inputs, and modal dialogs.",
                "priority": "high",
                "estimated_minutes": 60,
                "due_date": (now + timedelta(days=21)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 4 Project: Responsive Developer Portfolio Site",
                "description": "Complete portfolio with navigation, skills grid, projects showcase, and dark mode.",
                "priority": "urgent",
                "estimated_minutes": 90,
                "due_date": (now + timedelta(days=28)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 5: API Integration with useEffect & Custom useFetch Hook",
                "description": "Fetch REST data, handle loading & error states, build GitHub user explorer widget.",
                "priority": "high",
                "estimated_minutes": 60,
                "due_date": (now + timedelta(days=35)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 6: Multi-Page Navigation with React Router v6/v7",
                "description": "Implement dynamic route params, nested layouts, Outlet, and protected auth guards.",
                "priority": "high",
                "estimated_minutes": 60,
                "due_date": (now + timedelta(days=42)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 7 Project: Global Shopping Cart Store with Zustand",
                "description": "Zustand store with selectors, actions, local storage persistence, and cart UI.",
                "priority": "high",
                "estimated_minutes": 90,
                "due_date": (now + timedelta(days=49)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 8: Full-Stack JWT Authentication & API Integration",
                "description": "Connect React frontend to backend auth routes with Bearer token storage and headers.",
                "priority": "urgent",
                "estimated_minutes": 90,
                "due_date": (now + timedelta(days=56)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": "Week 12 Capstone: Production AI Workspace Web Application",
                "description": "Deploy complete full-stack portfolio capstone with responsive design and docs.",
                "priority": "urgent",
                "estimated_minutes": 120,
                "due_date": (now + timedelta(days=85)).strftime("%Y-%m-%d"),
            }
        ]

    # Subject 3: General Domain or Custom Prompt
    else:
        subject = prompt[:35].strip() or "Professional Skill"
        proj_title = f"{duration_label} {subject} Roadmap"

        roadmap_text = f"""Absolutely. If your goal is to master {subject} in {duration_label.lower()}—not just review surface concepts—we can structure it around learning + coding practice + projects.
Since you’re a {role_ctx}, I’d recommend a progression moving systematically from core foundations to practical applications and portfolio-ready capstones.

### {duration_label} {subject} Roadmap
| Phase | Focus | What you'll be able to do |
| :--- | :--- | :--- |
| **Phase 1** | Core Fundamentals & Tooling | Execute foundational tasks with confidence |
| **Phase 2** | Intermediate Architecture & Practice | Build structured, functional applications |
| **Phase 3** | Advanced Mastery & Capstone | Deliver a complete production-grade deliverable |

---

### Phase 1 — Foundations & Environment (Weeks 1–4)
#### Concepts & Tooling:
- Setup modern workspace, configuration, and dependencies
- Master core syntax, data models, and fundamental execution patterns
- Understand inputs, outputs, error handling, and debugging
**Practice:**
- 4 foundational coding drills and test scripts
- Mini-project: Interactive CLI or data validation tool

---

### Phase 2 — Intermediate Execution & Architecture (Weeks 5–8)
#### Concepts & Tooling:
- Reusable modular architecture, separation of concerns
- Data persistence, API integrations, and external services
- Testing, automated verification, and performance profiling
**Practice:**
- Integration project with local storage or database
- Error resilience and validation test suite

---

### Phase 3 — Advanced Real-World Capstone (Weeks 9–12)
#### Concepts & Tooling:
- Advanced language/framework idioms and optimization
- Complete end-to-end project deliverable
- Documentation, deployment, and portfolio packaging

**Architecture:**
```
Input / Interface → Core Engine Logic → Persistence / API → Output Delivery
```

---

### ⏱️ Daily Schedule
Aim for **1.5–2 hours/day, 6 days/week**.
- 20 min → Learn concept
- 30 min → Study examples
- 40 min → Solve problems yourself
- 20 min → Build project
- 10 min → Review & commit

**The most important rule:**
> **Don't spend 2 hours watching tutorials. Spend 2 hours writing code.**

---

### 📈 Your Progression
```
PHASE 1: Syntax & Tools → Problem Solving → Small Programs
   ↓
PHASE 2: Modularity → Persistence & APIs → Medium Projects
   ↓
PHASE 3: Advanced Architecture → Real Capstone Deliverable
```"""

        milestones = [
            {
                "project_title": proj_title,
                "title": f"Phase 1: {subject} Foundations & Discovery",
                "description": f"Master basic principles, tools, and foundational concepts for {subject}.",
                "target_date": m1_dt,
            },
            {
                "project_title": proj_title,
                "title": f"Phase 2: Core Execution & Hands-on Practice",
                "description": f"Work through practical problem sets, benchmarks, and active implementation.",
                "target_date": m2_dt,
            },
            {
                "project_title": proj_title,
                "title": f"Phase 3: Capstone Deliverable & Verification",
                "description": f"Synthesize knowledge into a complete portfolio-ready project or review benchmark.",
                "target_date": m3_dt,
            }
        ]

        tasks = [
            {
                "project_title": proj_title,
                "title": f"Set up workspace and resources for {subject}",
                "description": "Gather curriculum, documentation, and tools.",
                "priority": "urgent",
                "estimated_minutes": 45,
                "due_date": (now + timedelta(days=2)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": f"Complete foundational exercises in {subject}",
                "description": "Solidify understanding with focused practice drills.",
                "priority": "high",
                "estimated_minutes": 90,
                "due_date": (now + timedelta(days=10)).strftime("%Y-%m-%d"),
            },
            {
                "project_title": proj_title,
                "title": f"Finalize capstone milestone review for {subject}",
                "description": "Assess learning outcomes and review deliverables.",
                "priority": "high",
                "estimated_minutes": 120,
                "due_date": (now + timedelta(days=total_days - 5)).strftime("%Y-%m-%d"),
            }
        ]

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
            }
        ],
        "notes": [
            {
                "title": f"{duration_label} {subject} Study Curriculum & Guide",
                "content": roadmap_text,
            }
        ]
    }

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
Output ONLY valid JSON matching this schema:
{{
  "summary": "Full comprehensive roadmap in rich Markdown: an encouraging personal mentor introduction tailored to a student/developer, a clean overview table (Month | Focus | What you will be able to do), detailed week-by-week breakdown with core concepts and hands-on practice problems, real-world mini-projects & capstone with architecture, a daily 1.5-2h study schedule with the golden active practice rule, and progression flowchart",
  "projects": [{{"title": "...", "description": "...", "priority": "high", "target_date": "YYYY-MM-DD"}}],
  "milestones": [{{"project_title": "...", "title": "...", "description": "...", "target_date": "YYYY-MM-DD"}}],
  "tasks": [{{"project_title": "...", "title": "...", "description": "...", "priority": "high", "estimated_minutes": 60, "due_date": "YYYY-MM-DD"}}],
  "calendar_events": [{{"title": "...", "start_at": "YYYY-MM-DDTHH:MM:SS", "end_at": "YYYY-MM-DDTHH:MM:SS", "event_type": "study_block"}}],
  "notes": [{{"title": "...", "content": "..."}}]
}}
Make sure to include:
1. Exactly 1 overarching roadmap project in "projects".
2. 3 progressive roadmap milestones/phases in "milestones" covering each phase or month.
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
                "content": f"# Guidance & Execution Roadmap for: {prompt}\n\n## Strategy & Approach\nFollow a paced schedule and focus on high-priority deliverables first.\n\n## Action Plan\n1. Review project milestones.\n2. Complete daily tasks on the task board.\n3. Verify progress at each phase check-in.",
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
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return (
        db.query(models.AIProposal)
        .filter(models.AIProposal.user_id == current_user.id)
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

    project_title_map: Dict[str, int] = {
        str(item.payload.get("title")): item.persisted_record_id
        for item in proposal.items
        if item.item_type == "project" and item.approved and item.persisted_record_id is not None
    }

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

        payload = item.payload.copy()
        if req.item_overrides and item.id in req.item_overrides:
            payload.update(req.item_overrides[item.id].model_dump(exclude_unset=True))

        if item.item_type == "project":
            p = models.Project(
                user_id=current_user.id,
                role=proposal.role,
                title=payload.get("title", "New Project"),
                description=payload.get("description"),
                priority=payload.get("priority", "medium"),
                target_date=payload.get("target_date"),
                progress=0,
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
                status="pending",
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
                status="todo",
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

            start_at_val = payload.get("start_at") or datetime.utcnow().isoformat()
            end_at_val = payload.get("end_at") or (datetime.utcnow() + timedelta(hours=1)).isoformat()
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
                content=payload.get("content", ""),
                is_pinned=False,
            )
            db.add(n)
            db.flush()
            item.approved = True
            item.persisted_record_id = n.id
            result["created_notes"].append(schemas.NoteOut.from_orm(n))

    proposal.status = "approved" if all(item.approved for item in proposal.items) else "pending"
    db.commit()
    return result
