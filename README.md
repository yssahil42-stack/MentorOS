# MentorOS Pro

> **AI-Powered Personal Workspace for Career Growth**

MentorOS Pro is a comprehensive, role-based productivity platform that combines AI-generated learning roadmaps, project management, calendar scheduling, note-taking, and progress tracking — all tailored to your professional identity (Student, Freelancer, Developer, or Job Seeker).

---

## 🚀 Features

### 🎯 Role-Based Workspaces
- **Student** — Study plans, assignments, exam tracking, project milestones
- **Freelancer** — Client management, project delivery, invoicing, time tracking
- **Developer** — Code projects, Git integration, API documentation, sprint planning
- **Job Seeker** — Application tracking, interview prep, networking, resume building

### 🤖 AI-Powered Roadmap Generation
- Natural language prompts → structured multi-phase curriculums
- Automatic breakdown into projects, milestones, tasks, and calendar events
- One-click approval to persist AI proposals into your workspace
- Powered by local Ollama models (SmolLM2, etc.) for privacy

### 📋 Comprehensive Task & Project Management
- Kanban-style task boards with drag-and-drop
- Milestone tracking with progress visualization
- Priority levels, due dates, time estimates
- Cross-linking between tasks, projects, calendar, and notes

### 📅 Integrated Calendar
- Time-blocking for deep work sessions
- Exam/deadline/event scheduling
- Recurring events and reminders
- Role-specific event types (study blocks, client meetings, coding sprints, interviews)

### 📝 Rich Note-Taking
- Markdown support with live preview
- Project-linked notes
- Pinned notes for quick access
- AI-assisted note generation from roadmaps

### 📊 Progress Analytics
- Role-specific dashboards (study hours, billable hours, code commits, applications sent)
- Weekly/monthly progress reports
- Streak tracking and habit formation
- Visual progress charts

### ⌨️ Command Palette
- Global keyboard shortcuts (⌘K / Ctrl+K)
- Quick navigation, create actions, search
- Context-aware commands per role

### 🎨 Modern UI/UX
- Spatial 3D canvas for visual roadmap exploration
- Responsive design for desktop and mobile
- Dark/light theme support
- Smooth animations with Framer Motion
- Accessible components (WCAG AA)

---

## 🛠 Tech Stack

### Frontend
- **React 19** + **TypeScript** + **Vite 6**
- **Tailwind CSS 3.4** for styling
- **React Router 7** for routing
- **TanStack Query 5** for server state
- **React Hook Form 7** + **Zod 4** for forms/validation
- **Framer Motion 11** for animations
- **Lucide React** for icons
- **@dnd-kit** for drag-and-drop

### Backend
- **FastAPI** (Python 3.11+)
- **SQLAlchemy 2.0** + **SQLite** (dev) / **PostgreSQL** (prod)
- **Pydantic 2** for validation
- **JWT** authentication with bcrypt
- **Ollama** integration for local AI inference

### Testing & Quality
- **Vitest** for unit/integration tests
- **Playwright** for E2E tests
- **ESLint** + **Prettier** for linting/formatting
- **TypeScript strict mode**

---

## 📦 Project Structure

```
MentorOS/
├── backend/
│   ├── app/
│   │   ├── routers/        # API endpoints (auth, tasks, projects, calendar, notes, dashboard, ai)
│   │   ├── models.py       # SQLAlchemy models
│   │   ├── schemas.py      # Pydantic schemas
│   │   ├── auth.py         # JWT authentication
│   │   ├── database.py     # Database configuration
│   │   ├── config.py       # Settings management
│   │   └── main.py         # FastAPI application
│   ├── tests/              # Backend tests
│   └── mentoros.db         # SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components by role
│   │   ├── routes/         # Route configuration & guards
│   │   ├── contexts/       # React contexts (Auth, Theme, etc.)
│   │   ├── services/       # API service layer
│   │   ├── store/          # State management
│   │   ├── types/          # TypeScript types
│   │   ├── utils/          # Utility functions
│   │   ├── styles/         # Global styles
│   │   ├── config/         # Frontend configuration
│   │   ├── App.tsx         # Root component
│   │   └── main.tsx        # Entry point
│   ├── public/             # Static assets
│   ├── index.html          # HTML template
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── tailwind.config.ts
├── .env.example            # Environment variables template
├── run_all.py              # Development startup script
└── README.md               # This file
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js 20+** and **npm 10+**
- **Python 3.11+** and **pip**
- **Ollama** (for local AI) — [Install Ollama](https://ollama.com/)
  ```bash
  ollama pull smollm2:1.7b
  ```

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd MentorOS
   ```

2. **Backend setup**
   ```bash
   cd backend
   python -m venv venv
   source venv/bin/activate  # Windows: venv\Scripts\activate
   pip install -r requirements.txt
   cp .env.example .env
   # Edit .env with your settings
   python -m app.main
   ```

3. **Frontend setup**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

4. **Run both simultaneously** (from root)
   ```bash
   python run_all.py
   ```

### Environment Variables

**Backend (.env)**
```env
SECRET_KEY=your-super-secret-key-min-32-chars
DATABASE_URL=sqlite:///./mentoros.db
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=smollm2:1.7b
CORS_ORIGINS=http://localhost:5173
SEED_DEMO_DATA=false
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:8000/api/v1
```

---

## 🧪 Testing

### Backend Tests
```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm run test        # Vitest unit tests
npm run test:e2e    # Playwright E2E tests
```

### Linting & Formatting
```bash
cd frontend
npm run lint        # ESLint
npm run format      # Prettier
```

---

## 🏗 Building for Production

### Backend
```bash
cd backend
# Use production .env with PostgreSQL, strong SECRET_KEY, HTTPS CORS
python -m gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
```

### Frontend
```bash
cd frontend
npm run build
# Output in dist/ — serve with nginx, Vercel, Netlify, etc.
```

---

## 🔐 Authentication Flow

1. **Register** — Email, password (12+ chars), role selection
2. **Login** — JWT access token (15 min) + refresh token (7 days)
3. **Onboarding** — Profile setup, preferences, initial role configuration
4. **Role Guard** — Routes protected by `RoleRouteGuard` per workspace

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Style
- Follow existing TypeScript/Python patterns
- Run `npm run lint` and `npm run format` before committing
- Write tests for new features
- Update documentation as needed

---

## 📄 License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- **Ollama** for local AI inference
- **SmolLM2** by HuggingFace for efficient language models
- **FastAPI** for the modern Python web framework
- **React** + **Vite** for the frontend tooling
- **Tailwind CSS** for utility-first styling
- **All open-source contributors** who make this possible

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/your-org/mentoros/issues)
- **Discussions**: [GitHub Discussions](https://github.com/your-org/mentoros/discussions)
- **Email**: support@mentoros.dev

---

*Built with ❤️ for lifelong learners and career builders everywhere.*