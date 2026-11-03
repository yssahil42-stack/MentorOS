import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Layers, Shield, CheckCircle2,
  Calendar, CheckSquare, BookOpen, FileText,
  LogOut, ArrowRight, Clock, Check, Database,
  GraduationCap, Code2, Briefcase, Search
} from 'lucide-react';
import { cn } from '../utils/cn';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';

// ─── Clean Non-Tech Friendly Step Component ───────────────────────────────────

function WorkflowStep({
  n,
  title,
  subtitle,
  description,
  example,
}: {
  n: number;
  title: string;
  subtitle: string;
  description: string;
  example: string;
}) {
  return (
    <div className="card p-6 flex flex-col justify-between text-left gap-4 border-border-base hover:border-solar-500/40 transition-all duration-200">
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="w-8 h-8 rounded-xl bg-solar-500/15 border border-solar-500/30 flex items-center justify-center text-solar-500 font-extrabold text-sm">
            {n}
          </div>
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-solar-500 bg-solar-500/10 px-2 py-0.5 rounded-full border border-solar-500/20">
            {subtitle}
          </span>
        </div>
        <h3 className="text-base font-bold text-text-primary">{title}</h3>
        <p className="text-xs text-text-secondary leading-relaxed mt-1.5">{description}</p>
      </div>

      <div className="pt-3 border-t border-border-subtle bg-bg-base/60 -mx-6 -mb-6 p-4 rounded-b-2xl">
        <p className="text-3xs font-bold uppercase tracking-wider text-text-muted mb-0.5">What Happens</p>
        <p className="text-2xs text-text-primary font-medium">{example}</p>
      </div>
    </div>
  );
}

// ─── Role Showcase Configurations for Interactive Switcher ──────────────────

type RoleKey = 'student' | 'developer' | 'freelancer' | 'job_seeker';

const ROLE_KEYS: RoleKey[] = ['student', 'developer', 'freelancer', 'job_seeker'];

interface RoleShowcaseData {
  id: RoleKey;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  sqliteName: string;
  tagline: string;
  route: string;
  pillar1: {
    tag: string;
    title: string;
    subtitle: string;
    milestones: string;
    progress: number;
  };
  pillar2: {
    tag: string;
    title: string;
    tasks: { text: string; completed?: boolean; active?: boolean }[];
    pacing: string;
    completedCount: string;
  };
  pillar3: {
    tag: string;
    title: string;
    badge: string;
    draft: string;
    source: string;
  };
  pillar4: {
    tag: string;
    title: string;
    events: { name: string; time: string }[];
    calendarLabel: string;
  };
}

const ROLE_SHOWCASES: Record<RoleKey, RoleShowcaseData> = {
  student: {
    id: 'student',
    name: 'Student',
    icon: GraduationCap,
    color: '#F59E0B',
    sqliteName: 'student-workspace.sqlite',
    tagline: 'Coursework goals, research projects & exam schedules',
    route: '/app/student/dashboard',
    pillar1: {
      tag: '1. Plan',
      title: 'Plan & Create',
      subtitle: 'Coursework goals, exam dates, and AI study roadmaps',
      milestones: '3 Milestones Planned',
      progress: 75,
    },
    pillar2: {
      tag: '2. Build',
      title: 'Study & Track',
      tasks: [
        { text: 'Literature review synthesis', completed: true },
        { text: 'Consensus algorithm simulation', active: true },
        { text: 'Final thesis bibliography format', completed: false },
      ],
      pacing: 'Pomodoro focus blocks',
      completedCount: '2 Completed',
    },
    pillar3: {
      tag: '3. Content',
      title: 'Generate Content',
      badge: 'Study Notes & Summary',
      draft: '"Executive thesis summary: Consensus safety and recovery mechanisms in distributed networks..."',
      source: 'From Research Notes',
    },
    pillar4: {
      tag: '4. Schedule',
      title: 'Schedule & Review',
      events: [
        { name: 'Paper Draft Submission', time: 'Thursday 14:00' },
        { name: 'Oral Defense Checkpoint', time: 'Monday 10:00' },
      ],
      calendarLabel: 'On Academic Calendar',
    },
  },
  developer: {
    id: 'developer',
    name: 'Developer',
    icon: Code2,
    color: '#06B6D4',
    sqliteName: 'developer-workspace.sqlite',
    tagline: 'Architecture specs, implementation tasks & dev logs',
    route: '/app/developer/dashboard',
    pillar1: {
      tag: '1. Plan',
      title: 'Plan & Create',
      subtitle: 'Sprint goals, tech stack decisions, and feature roadmaps',
      milestones: '4 Sprints Planned',
      progress: 80,
    },
    pillar2: {
      tag: '2. Build',
      title: 'Build & Track',
      tasks: [
        { text: 'Async TCP connection pool', completed: true },
        { text: 'AOF persistence engine', active: true },
        { text: 'Run 100k req/s benchmark', completed: false },
      ],
      pacing: 'Sprint velocity',
      completedCount: '3 Completed',
    },
    pillar3: {
      tag: '3. Content',
      title: 'Generate Content',
      badge: 'README & Dev Log',
      draft: '"Engineered a zero-allocation key-value store in Rust handling 120k QPS with Tokio async IO..."',
      source: 'From Git Commits & Notes',
    },
    pillar4: {
      tag: '4. Schedule',
      title: 'Schedule & Review',
      events: [
        { name: 'v0.9 Beta Launch', time: 'Thursday 18:00' },
        { name: 'Architecture Review', time: 'Friday 14:00' },
      ],
      calendarLabel: 'On Release Calendar',
    },
  },
  freelancer: {
    id: 'freelancer',
    name: 'Freelancer',
    icon: Briefcase,
    color: '#F97316',
    sqliteName: 'freelancer-workspace.sqlite',
    tagline: 'Client deliverables, milestone pacing & case studies',
    route: '/app/freelancer/dashboard',
    pillar1: {
      tag: '1. Plan',
      title: 'Plan & Create',
      subtitle: 'Client deliverables, scope agreements, and milestone plans',
      milestones: '3 Milestones Planned',
      progress: 65,
    },
    pillar2: {
      tag: '2. Build',
      title: 'Deliver & Track',
      tasks: [
        { text: 'Interactive Figma design tokens', completed: true },
        { text: 'Client review revisions', active: true },
        { text: 'Production asset handoff bundle', completed: false },
      ],
      pacing: 'Milestone pacing',
      completedCount: '2 Completed',
    },
    pillar3: {
      tag: '3. Content',
      title: 'Generate Content',
      badge: 'Client Case Study',
      draft: '"Delivered a 34% increase in user retention through modern component redesign and micro-interactions..."',
      source: 'From Deliverable Archive',
    },
    pillar4: {
      tag: '4. Schedule',
      title: 'Schedule & Review',
      events: [
        { name: 'Stakeholder Demo Call', time: 'Wednesday 11:00' },
        { name: 'Deliverable Handover', time: 'Friday 17:00' },
      ],
      calendarLabel: 'On Delivery Calendar',
    },
  },
  job_seeker: {
    id: 'job_seeker',
    name: 'Job Seeker',
    icon: Search,
    color: '#10B981',
    sqliteName: 'jobseeker-workspace.sqlite',
    tagline: 'Application pipeline, interview prep & portfolio case studies',
    route: '/app/job-seeker/dashboard',
    pillar1: {
      tag: '1. Plan',
      title: 'Plan & Create',
      subtitle: 'Target company pipeline, interview targets, and CV roadmaps',
      milestones: '4 Milestones Planned',
      progress: 85,
    },
    pillar2: {
      tag: '2. Build',
      title: 'Prep & Track',
      tasks: [
        { text: 'Deploy full-stack portfolio app', completed: true },
        { text: 'System design mock interview', active: true },
        { text: 'Tailor resume for tier-1 teams', completed: false },
      ],
      pacing: 'Daily application goal',
      completedCount: '4 Completed',
    },
    pillar3: {
      tag: '3. Content',
      title: 'Generate Content',
      badge: 'Portfolio Case Study',
      draft: '"How I architected a distributed queue with 99.99% uptime and zero message loss for real-time analytics..."',
      source: 'From Portfolio Projects',
    },
    pillar4: {
      tag: '4. Schedule',
      title: 'Schedule & Review',
      events: [
        { name: 'Technical Screen Interview', time: 'Tuesday 14:00' },
        { name: 'System Design Onsite', time: 'Thursday 16:30' },
      ],
      calendarLabel: 'On Interview Calendar',
    },
  },
};

// ─── Main Landing Page ────────────────────────────────────────────────────────

export default function LandingPage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeRole, setActiveRole] = useState<RoleKey>(() => user?.role ?? 'student');
  const currentShowcase = ROLE_SHOWCASES[activeRole];

  return (
    <div className="min-h-screen bg-bg-base text-text-primary overflow-x-hidden selection:bg-solar-500/25 selection:text-solar-500">
      {/* ─── Header Navigation ──────────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-12 h-16 glass border-b border-border-base backdrop-blur-xl transition-colors"
        aria-label="Site navigation"
      >
        <Link
          to="/"
          id="navbar-brand-mentoros"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-3 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-xl"
          title="MentorOS - First page"
          aria-label="MentorOS Home"
        >
          <div className="w-9 h-9 rounded-xl bg-solar-500/15 border border-solar-500/30 flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
            <Layers className="h-5 w-5 text-solar-500" aria-hidden="true" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-base font-extrabold tracking-tight text-text-primary group-hover:text-solar-500 transition-colors">
              MentorOS
            </span>
          </div>
        </Link>

        {/* Right Navigation Actions */}
        <div className="flex items-center gap-3">
          {/* Theme Switcher */}
          <ThemeToggle size="sm" variant="icon" />

          {isAuthenticated && user ? (
            <>
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border shadow-sm bg-solar-500/10 text-solar-500 border-solar-500/30">
                <span className="w-1.5 h-1.5 rounded-full bg-solar-500" />
                {user.full_name}
              </span>

              <Link
                to={currentShowcase.route}
                className="px-4 py-2 rounded-xl text-xs md:text-sm font-semibold text-white bg-solar-500 hover:bg-solar-600 transition-all shadow-sm hover:shadow-glow-solar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus active:translate-y-[1px] flex items-center gap-1.5"
              >
                <span>Go to Workspace</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>

              <button
                onClick={logout}
                className="p-2 rounded-xl text-xs font-semibold text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus active:translate-y-[1px]"
                title="Sign out"
                aria-label="Sign out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="px-4 py-2 rounded-xl text-xs md:text-sm font-semibold text-text-secondary hover:text-text-primary hover:bg-bg-elevated transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus active:translate-y-[1px]"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-xl text-xs md:text-sm font-semibold text-white bg-solar-500 hover:bg-solar-600 transition-all shadow-sm hover:shadow-glow-solar focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus active:translate-y-[1px]"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      </nav>

      {/* ─── Hero Section ─────────────────────────────────────────── */}
      <section
        className="relative min-h-[85vh] flex flex-col items-center justify-start pt-32 pb-20 overflow-hidden"
        aria-label="Hero section"
      >
        {/* Dynamic Ambient Glow matching selected role */}
        <div
          className="absolute top-1/6 left-1/2 -translate-x-1/2 w-[650px] h-[450px] rounded-full blur-[140px] pointer-events-none opacity-20 transition-all duration-700"
          style={{ backgroundColor: currentShowcase.color }}
          aria-hidden="true"
        />

        {/* ─── Hero Content ──────────────────────────────────── */}
        <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-3xl mb-8">
          {/* Label chip */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-solar-500/10 border border-solar-500/25 text-solar-500 dark:text-solar-400 text-xs font-semibold mb-6 shadow-sm backdrop-blur-sm">
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            <span>AI powered productivity and workspace management</span>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl font-black tracking-tight mb-5 text-balance">
            <span className="gradient-text-solar">MentorOS</span>
          </h1>

          {/* Description */}
          <p className="text-base sm:text-lg text-text-secondary leading-relaxed max-w-2xl text-balance">
            An AI powered productivity and workspace management tool where users organize project goals, projects, tasks, schedules, and content. The application delivers a unified workspace experience, with local AI assistance for planning, human review, and automatic updates across all connected modules.
          </p>
        </div>

        {/* ─── Four Interactive Role Buttons Above Connected Workspace ──── */}
        <div className="relative z-10 flex flex-col items-center mb-8 px-4">
          <div
            className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 p-1.5 rounded-2xl bg-bg-surface/85 border border-border-base backdrop-blur-xl shadow-sm"
            role="tablist"
            aria-label="Workspace Role Views"
          >
            {ROLE_KEYS.map((key) => {
              const role = ROLE_SHOWCASES[key];
              const isSelected = activeRole === key;
              const Icon = role.icon;
              return (
                <button
                  key={key}
                  id={`role-btn-${key}`}
                  type="button"
                  onClick={() => setActiveRole(key)}
                  className={cn(
                    'relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus select-none',
                    isSelected
                      ? 'text-text-primary shadow-sm'
                      : 'text-text-muted hover:text-text-primary hover:bg-bg-elevated/50'
                  )}
                  role="tab"
                  aria-selected={isSelected}
                  aria-controls="connected-workspace-window"
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeLandingRole"
                      className="absolute inset-0 rounded-xl bg-bg-elevated border"
                      style={{
                        borderColor: `${role.color}45`,
                        boxShadow: `0 0 16px -2px ${role.color}25`,
                      }}
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
                    />
                  )}
                  <span
                    className="relative z-10 w-6 h-6 rounded-lg flex items-center justify-center transition-colors"
                    style={{
                      backgroundColor: isSelected ? `${role.color}20` : 'transparent',
                      color: isSelected ? role.color : 'currentColor',
                    }}
                  >
                    <Icon className="w-4 h-4" />
                  </span>
                  <span className="relative z-10">{role.name}</span>
                  {isSelected && (
                    <span
                      className="relative z-10 w-1.5 h-1.5 rounded-full animate-pulse"
                      style={{ backgroundColor: role.color }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ─── Calm, Unified 4-Pillar Showcase Window ────────────────── */}
        <div className="w-full max-w-5xl px-4 sm:px-6 relative z-10" id="connected-workspace-window">
          <motion.div
            className="w-full rounded-2xl md:rounded-3xl border bg-bg-surface/95 backdrop-blur-xl framer-window-shadow overflow-hidden transition-all duration-300"
            style={{ borderColor: `${currentShowcase.color}40` }}
          >
            {/* Window Frame Header */}
            <div className="px-5 py-3.5 bg-bg-elevated/70 border-b border-border-base flex items-center justify-between gap-3 select-none">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80 border border-red-600/40" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-600/40" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-600/40" />
                <div className="hidden sm:flex items-center gap-1.5 ml-3 font-mono text-[11px] text-text-muted">
                  <Database className="w-3 h-3" style={{ color: currentShowcase.color }} />
                  <span>{currentShowcase.sqliteName}</span>
                  <span className="text-emerald-500 font-semibold">• Synced</span>
                </div>
              </div>

              <div className="flex items-center gap-2 text-2xs font-semibold text-text-muted">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: currentShowcase.color }} />
                <span>Connected Workspace ({currentShowcase.name})</span>
              </div>
            </div>

            {/* Showcase 4-Pillar Grid */}
            <div className="p-6 sm:p-8 bg-dot-grid">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeRole}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4"
                >
                  {/* Pillar 1: Projects & Plan */}
                  <div
                    className="glass p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
                    style={{ borderColor: `${currentShowcase.color}35` }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-8 h-8 rounded-xl border flex items-center justify-center"
                          style={{
                            backgroundColor: `${currentShowcase.color}15`,
                            borderColor: `${currentShowcase.color}30`,
                            color: currentShowcase.color,
                          }}
                        >
                          <BookOpen className="w-4 h-4" />
                        </div>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                          style={{
                            color: currentShowcase.color,
                            backgroundColor: `${currentShowcase.color}10`,
                            borderColor: `${currentShowcase.color}25`,
                          }}
                        >
                          {currentShowcase.pillar1.tag}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary">{currentShowcase.pillar1.title}</h4>
                      <p className="text-xs text-text-muted mt-1 leading-snug">{currentShowcase.pillar1.subtitle}</p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border-subtle">
                      <div className="flex items-center justify-between text-2xs font-semibold text-text-secondary mb-1">
                        <span>Milestones</span>
                        <span style={{ color: currentShowcase.color }}>{currentShowcase.pillar1.milestones}</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-bg-base overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${currentShowcase.pillar1.progress}%`,
                            backgroundColor: currentShowcase.color,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Pillar 2: Build & Track */}
                  <div
                    className="glass p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
                    style={{ borderColor: `${currentShowcase.color}35` }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-8 h-8 rounded-xl border flex items-center justify-center"
                          style={{
                            backgroundColor: `${currentShowcase.color}15`,
                            borderColor: `${currentShowcase.color}30`,
                            color: currentShowcase.color,
                          }}
                        >
                          <CheckSquare className="w-4 h-4" />
                        </div>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                          style={{
                            color: currentShowcase.color,
                            backgroundColor: `${currentShowcase.color}10`,
                            borderColor: `${currentShowcase.color}25`,
                          }}
                        >
                          {currentShowcase.pillar2.tag}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary">{currentShowcase.pillar2.title}</h4>
                      <div className="mt-2.5 space-y-1.5">
                        {currentShowcase.pillar2.tasks.map((task, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 text-xs text-text-secondary">
                            {task.completed ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : task.active ? (
                              <div
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: currentShowcase.color }}
                              />
                            ) : (
                              <div className="w-2 h-2 rounded-full bg-border-strong shrink-0" />
                            )}
                            <span className={task.completed ? 'line-through text-text-muted' : ''}>
                              {task.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-2xs text-text-muted">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" style={{ color: currentShowcase.color }} />
                        {currentShowcase.pillar2.pacing}
                      </span>
                      <span className="text-emerald-500 font-semibold">{currentShowcase.pillar2.completedCount}</span>
                    </div>
                  </div>

                  {/* Pillar 3: Generate Content */}
                  <div
                    className="glass p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
                    style={{ borderColor: `${currentShowcase.color}35` }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-8 h-8 rounded-xl border flex items-center justify-center"
                          style={{
                            backgroundColor: `${currentShowcase.color}15`,
                            borderColor: `${currentShowcase.color}30`,
                            color: currentShowcase.color,
                          }}
                        >
                          <FileText className="w-4 h-4" />
                        </div>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                          style={{
                            color: currentShowcase.color,
                            backgroundColor: `${currentShowcase.color}10`,
                            borderColor: `${currentShowcase.color}25`,
                          }}
                        >
                          {currentShowcase.pillar3.tag}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary">{currentShowcase.pillar3.title}</h4>
                      <div className="mt-2.5 p-2 rounded-xl bg-bg-base/80 border border-border-subtle text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span
                            className="text-3xs font-bold uppercase tracking-wider"
                            style={{ color: currentShowcase.color }}
                          >
                            {currentShowcase.pillar3.badge}
                          </span>
                          <span className="text-3xs text-emerald-500 font-semibold">✓ Draft Ready</span>
                        </div>
                        <p className="text-2xs text-text-secondary line-clamp-2">
                          {currentShowcase.pillar3.draft}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-2xs text-text-muted">
                      <span>{currentShowcase.pillar3.source}</span>
                      <span className="font-semibold" style={{ color: currentShowcase.color }}>
                        Ready to Edit
                      </span>
                    </div>
                  </div>

                  {/* Pillar 4: Schedule & Review */}
                  <div
                    className="glass p-5 rounded-2xl border shadow-sm flex flex-col justify-between"
                    style={{ borderColor: `${currentShowcase.color}35` }}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <div
                          className="w-8 h-8 rounded-xl border flex items-center justify-center"
                          style={{
                            backgroundColor: `${currentShowcase.color}15`,
                            borderColor: `${currentShowcase.color}30`,
                            color: currentShowcase.color,
                          }}
                        >
                          <Calendar className="w-4 h-4" />
                        </div>
                        <span
                          className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border"
                          style={{
                            color: currentShowcase.color,
                            backgroundColor: `${currentShowcase.color}10`,
                            borderColor: `${currentShowcase.color}25`,
                          }}
                        >
                          {currentShowcase.pillar4.tag}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-text-primary">{currentShowcase.pillar4.title}</h4>
                      <div className="mt-2.5 space-y-1.5 text-xs">
                        {currentShowcase.pillar4.events.map((evt, idx) => (
                          <div key={idx} className="p-1.5 rounded-lg bg-bg-base/80 border border-border-subtle flex items-center justify-between">
                            <span className="font-medium text-text-primary truncate">{evt.name}</span>
                            <span className="text-2xs font-semibold shrink-0 ml-1" style={{ color: currentShowcase.color }}>
                              {evt.time}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-border-subtle flex items-center justify-between text-2xs text-text-muted">
                      <span>{currentShowcase.pillar4.calendarLabel}</span>
                      <span className="font-semibold" style={{ color: currentShowcase.color }}>
                        Synced
                      </span>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>

              {/* Informative note footer */}
              <div className="mt-6 pt-4 border-t border-border-base/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-text-muted">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Human review required — AI proposals never write to SQLite without your approval</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-mono text-2xs text-solar-500">Zero Cloud Telemetry</span>
                  <Link
                    to={isAuthenticated ? currentShowcase.route : `/register?role=${activeRole}`}
                    className="inline-flex items-center gap-1 font-bold text-xs hover:underline transition-colors"
                    style={{ color: currentShowcase.color }}
                  >
                    <span>Open {currentShowcase.name} Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── 5-Step Simple Workflow ─────────────────────────────────── */}
      <section className="py-20 px-6 max-w-6xl mx-auto border-t border-border-base">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-solar-500/10 text-solar-500 text-xs font-semibold uppercase tracking-wider mb-2">
            Non-Tech Friendly Workflow
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-text-primary mb-3">
            How MentorOS Works in 5 Simple Steps
          </h2>
          <p className="text-xs sm:text-sm text-text-muted max-w-xl mx-auto">
            From initial project planning to execution, scheduling, and review — clear, automated, and completely under your control.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <WorkflowStep
            n={1}
            title="1. Plan and Create"
            subtitle="Goal & Deadline"
            description="Start by defining your project goals, scope, and target deadline. The system saves your project details securely in your database."
            example="System safely saves your project plan and target deadline to your database."
          />
          <WorkflowStep
            n={2}
            title="2. Generate Roadmap"
            subtitle="AI Roadmaps"
            description="Local AI proposes structured milestones, daily subtasks, and a realistic schedule to hit your target date without guesswork."
            example="AI proposes milestones, actionable subtasks, and a clear daily timeline."
          />
          <WorkflowStep
            n={3}
            title="3. Build & Track"
            subtitle="Visual Task Board"
            description="Work through your visual task board, ticking off tasks as you go. Your overall project progress automatically updates in real time."
            example="Check off tasks on your board as you work, updating completion status instantly."
          />
          <WorkflowStep
            n={4}
            title="4. Schedule"
            subtitle="Calendar & Milestones"
            description="Organize your upcoming deadlines, review checkpoints, and scheduled tasks directly into your visual calendar."
            example="Add deadlines and deliverables directly to your project calendar."
          />
          <WorkflowStep
            n={5}
            title="5. Review Dashboard"
            subtitle="Unified Overview"
            description="Your home dashboard displays completed project milestones alongside upcoming scheduled tasks and deadlines in one clean view."
            example="Dashboard highlights your active projects, finished milestones, and upcoming deliverables."
          />
        </div>
      </section>

      {/* ─── Local AI Privacy Highlight ───────────────────── */}
      <section className="py-16 px-6 max-w-3xl mx-auto text-center">
        <div className="card p-8 relative overflow-hidden border-border-base bg-bg-surface/90 backdrop-blur-xl framer-window-shadow">
          <div className="w-12 h-12 rounded-2xl bg-solar-500/10 border border-solar-500/25 flex items-center justify-center mx-auto mb-4 text-solar-500">
            <Shield className="h-6 w-6" aria-hidden="true" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-text-primary mb-2">
            Zero Telemetry. Local Private AI.
          </h2>
          <p className="text-xs sm:text-sm text-text-muted leading-relaxed max-w-xl mx-auto mb-4">
            Your notes, project details, and goals remain safely on your computer in SQLite.
            AI suggestions run locally and never silently modify your data without explicit approval.
          </p>

          <div className="inline-flex items-center gap-2 text-xs font-semibold text-text-secondary bg-bg-elevated px-4 py-2 rounded-xl border border-border-base">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>100% offline capable with local SQLite database</span>
          </div>
        </div>
      </section>

      {/* ─── Footer ───────────────────────────────────────── */}
      <footer className="border-t border-border-base py-10 px-6 md:px-12 flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-text-muted">
        <Link
          to="/"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2.5 group hover:opacity-90 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus rounded-lg"
          title="MentorOS - First page"
        >
          <Layers className="h-4 w-4 text-solar-500 transition-transform" aria-hidden="true" />
          <span className="font-bold text-text-primary group-hover:text-solar-500 transition-colors">MentorOS</span>
          <span>• AI Powered Productivity and Workspace Management</span>
        </Link>

        <div className="flex items-center gap-6">
          <ThemeToggle size="sm" variant="pill" showLabel />
          <Link to="/login" className="hover:text-text-primary transition-colors">Sign In</Link>
          <Link to="/register" className="hover:text-text-primary transition-colors">Sign Up</Link>
        </div>
      </footer>
    </div>
  );
}
