import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  Shield,
  CheckCircle2,
  Database,
  Check,
} from 'lucide-react';
import { cn } from '../utils/cn';
import { ThemeToggle } from '../components/ui/ThemeToggle';
import { useAuth } from '../contexts/AuthContext';
import { useSeoMeta } from '../utils/useSeoMeta';

type RoleKey = 'student' | 'developer' | 'freelancer' | 'job_seeker';

interface RolePreviewContent {
  planTitle: string;
  planCount: string;
  planSubtitle: string;
  planProgress: number;
  planProgressLabel: string;
  trackTitle: string;
  trackActiveCount: string;
  trackBullets: { text: string; done?: boolean; active?: boolean }[];
  trackFooter: string;
  trackStatus: string;
  proposalTag: string;
  proposalQuote: string;
  scheduleList: { name: string; time: string; highlight?: boolean }[];
  scheduleFooter: string;
}

const ROLE_PREVIEWS: Record<RoleKey, RolePreviewContent> = {
  student: {
    planTitle: 'Plan & Create',
    planCount: '21 Tasks',
    planSubtitle: 'Set academic goals, subject topics, and exam roadmap.',
    planProgress: 70,
    planProgressLabel: '21/30 topics covered',
    trackTitle: 'Study & Track',
    trackActiveCount: '4 Active',
    trackBullets: [
      { text: 'Literature review & theory completed', done: true },
      { text: 'Core search algorithm simulation', active: true },
      { text: 'Final report presentation draft', active: false },
    ],
    trackFooter: 'Semester sprint on track',
    trackStatus: '2/3 completed',
    proposalTag: 'AI PROPOSAL: Study Roadmap',
    proposalQuote: '“Break down task summary: Distributed systems consensus algorithms and fault tolerance proofs.”',
    scheduleList: [
      { name: 'Research Paper Draft Submission', time: 'Tomorrow 14:00', highlight: true },
      { name: 'Oral Defense Checkpoint', time: 'Monday 10:00' },
    ],
    scheduleFooter: 'All Milestones on Track',
  },
  developer: {
    planTitle: 'Plan & Create',
    planCount: '28 Tasks',
    planSubtitle: 'Set project architecture, tech stack, and sprint roadmap.',
    planProgress: 75,
    planProgressLabel: '28/36 stories shipped',
    trackTitle: 'Build & Track',
    trackActiveCount: '5 Active',
    trackBullets: [
      { text: 'PostgreSQL schema & migrations', done: true },
      { text: 'Implement Redis cache-aside invalidation', active: true },
      { text: 'End-to-end integration tests & CI', active: false },
    ],
    trackFooter: 'Sprint 14 velocity 94%',
    trackStatus: '3/4 completed',
    proposalTag: 'AI PROPOSAL: Architecture Plan',
    proposalQuote: '“Draft ADR on state management: Zustand vs TanStack Query cache invalidation trade-offs.”',
    scheduleList: [
      { name: 'Staging Release Deployment', time: 'Today 18:00', highlight: true },
      { name: 'Architecture Review Meeting', time: 'Thursday 11:30' },
    ],
    scheduleFooter: 'Production Release on Schedule',
  },
  freelancer: {
    planTitle: 'Plan & Create',
    planCount: '16 Milestones',
    planSubtitle: 'Set client deliverables, project scope, and invoice milestones.',
    planProgress: 80,
    planProgressLabel: '₹1,85,000 / ₹2,40,000 billed',
    trackTitle: 'Deliver & Track',
    trackActiveCount: '3 Active',
    trackBullets: [
      { text: 'Initial design sign-off & 30% deposit', done: true },
      { text: 'Core application checkout integration', active: true },
      { text: 'Client handoff & admin portal demo', active: false },
    ],
    trackFooter: 'Client milestone sign-off pending',
    trackStatus: '2/3 delivered',
    proposalTag: 'AI PROPOSAL: Scope Revision',
    proposalQuote: '“Polite client response draft for handling out-of-scope feature requests without friction.”',
    scheduleList: [
      { name: 'Milestone 2 Sign-off & Demo', time: 'Friday 15:00', highlight: true },
      { name: 'Net-15 Invoice Due Date', time: 'Nov 28' },
    ],
    scheduleFooter: 'All Invoices & Milestones Synced',
  },
  job_seeker: {
    planTitle: 'Plan & Create',
    planCount: '18 Steps',
    planSubtitle: 'Set target companies, portfolio projects, and interview schedule.',
    planProgress: 65,
    planProgressLabel: '14/20 applications sent',
    trackTitle: 'Apply & Track',
    trackActiveCount: '6 Active',
    trackBullets: [
      { text: 'Resume ATS optimization & portfolio live', done: true },
      { text: 'System design interview preparation', active: true },
      { text: 'Full-stack take-home challenge review', active: false },
    ],
    trackFooter: '3 active hiring loops',
    trackStatus: '3 interviews scheduled',
    proposalTag: 'AI PROPOSAL: Interview Pitch',
    proposalQuote: '“Tailored STAR response for microservice scalability and database indexing questions.”',
    scheduleList: [
      { name: 'Technical Round 2 (Staff Eng)', time: 'Wednesday 16:30', highlight: true },
      { name: 'Founder & Culture Fit Chat', time: 'Friday 11:00' },
    ],
    scheduleFooter: 'Application Pipeline Active',
  },
};

export default function LandingPage() {
  const { user, isAuthenticated } = useAuth();
  const [activeRole, setActiveRole] = useState<RoleKey>('student');
  const preview = ROLE_PREVIEWS[activeRole];

  useSeoMeta({
    title: 'MentorOS — One workspace for your goals, tasks, schedules and content',
    description:
      'MentorOS helps you organize project goals, projects, tasks, schedules and content with private local AI assistance.',
    url: 'https://mentoros.app',
  });

  return (
    <div className="min-h-screen bg-[#faf8f5] dark:bg-[#0c0e14] text-stone-900 dark:text-stone-100 font-sans selection:bg-[#c04b1e]/20 selection:text-[#c04b1e] transition-colors relative overflow-x-hidden">
      {/* ─── Subtle Top-Right Ambient Peach Glow ─────────────────────────── */}
      <div
        className="absolute top-0 right-0 w-[550px] h-[550px] bg-gradient-to-br from-orange-200/35 via-amber-100/25 to-transparent blur-[130px] rounded-full pointer-events-none"
        aria-hidden="true"
      />

      {/* ─── Top Navigation Header ──────────────────────────────────────── */}
      <header role="banner" className="sticky top-0 z-50 bg-[#faf8f5]/90 dark:bg-[#0c0e14]/90 backdrop-blur-md border-b border-[#eee7e0] dark:border-stone-800/80 transition-colors">
        <nav
          className="max-w-7xl mx-auto flex items-center justify-between px-6 md:px-12 h-16"
          aria-label="Site navigation"
        >
          {/* Brand Logo */}
          <Link
            to="/"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2.5 group"
            aria-label="MentorOS Home"
          >
            <div className="w-8 h-8 rounded-lg bg-[#c04b1e] text-white flex items-center justify-center font-bold shadow-xs group-hover:bg-[#a83f17] transition-colors">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-stone-950 dark:text-white tracking-tight">
              MentorOS
            </span>
          </Link>

          {/* Center Links */}
          <div className="hidden md:flex items-center gap-8 text-xs sm:text-sm font-medium text-stone-600 dark:text-stone-300">
            <a
              href="#how-it-works"
              className="hover:text-[#c04b1e] dark:hover:text-orange-400 transition-colors"
            >
              How it works
            </a>
            <a
              href="#privacy"
              className="hover:text-[#c04b1e] dark:hover:text-orange-400 transition-colors"
            >
              Privacy
            </a>
            <Link
              to={isAuthenticated && user ? `/app/${user.role.replace('_', '-')}/dashboard` : '/login'}
              className="hover:text-[#c04b1e] dark:hover:text-orange-400 transition-colors"
            >
              Workspace
            </Link>
          </div>

          {/* Right Navigation CTAs */}
          <div className="flex items-center gap-3.5">
            <ThemeToggle size="sm" variant="icon" />

            {isAuthenticated && user ? (
              <Link
                to={`/app/${user.role.replace('_', '-')}/dashboard`}
                className="bg-[#c04b1e] hover:bg-[#a83f17] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
              >
                <span>Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-xs sm:text-sm font-medium text-stone-700 dark:text-stone-200 hover:text-stone-950 dark:hover:text-white transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="bg-[#c04b1e] hover:bg-[#a83f17] text-white text-xs sm:text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-xs"
                >
                  Get started
                </Link>
              </>
            )}
          </div>
        </nav>
      </header>

      {/* ─── Main Content ───────────────────────────────────────────────── */}
      <main id="main-content" role="main">
        {/* ─── Hero Section ─────────────────────────────────────────────── */}
        <section
          className="relative max-w-7xl mx-auto px-6 md:px-12 pt-12 md:pt-16 pb-20 md:pb-28"
          aria-label="Hero"
        >
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
            {/* Left Column: Headline & Content (7 cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#fbeee6] dark:bg-orange-950/40 border border-[#f5d5c5] dark:border-orange-900/40 text-[#a03d15] dark:text-orange-300 text-xs font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-[#c04b1e]" />
                <span>All project details stay on your device/workspace</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[54px] font-extrabold text-stone-950 dark:text-white tracking-tight leading-[1.12]">
                One workspace for your goals, tasks, schedules and content.
              </h1>

              {/* Subheading */}
              <p className="text-sm sm:text-base text-stone-600 dark:text-stone-300 leading-relaxed max-w-xl">
                MentorOS helps you organize project goals, projects, tasks, schedules and content.
                Plan with Skillpath AI, review every change, and sync updates across all
                connected modules.
              </p>

              {/* Call to action buttons */}
              <div className="flex flex-wrap items-center gap-3.5 pt-2">
                <Link
                  to={
                    isAuthenticated && user
                      ? `/app/${user.role.replace('_', '-')}/dashboard`
                      : '/register'
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-[#c04b1e] hover:bg-[#a83f17] shadow-sm transition-all"
                >
                  <span>Open your workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <a
                  href="#how-it-works"
                  className="px-5 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-stone-700 dark:text-stone-200 bg-white dark:bg-bg-elevated border border-stone-300 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-bg-surface transition-all shadow-2xs"
                >
                  See how it works
                </a>
              </div>

              {/* Built for: role selector */}
              <div className="pt-4 flex items-center gap-2.5 flex-wrap text-xs text-stone-500 dark:text-stone-400">
                <span className="font-medium text-stone-700 dark:text-stone-200">Built for:</span>
                {[
                  { key: 'student' as RoleKey, label: 'Students' },
                  { key: 'developer' as RoleKey, label: 'Developers' },
                  { key: 'freelancer' as RoleKey, label: 'Freelancers' },
                  { key: 'job_seeker' as RoleKey, label: 'Job seekers' },
                ].map((item) => {
                  const isSelected = activeRole === item.key;
                  return (
                    <button
                      key={item.key}
                      type="button"
                      onClick={() => setActiveRole(item.key)}
                      className={cn(
                        'px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer',
                        isSelected
                          ? 'bg-[#c04b1e]/10 text-[#c04b1e] border-[#c04b1e]/40 shadow-xs'
                          : 'bg-white/80 dark:bg-bg-surface/80 text-stone-600 dark:text-stone-400 border-stone-200 dark:border-stone-800 hover:border-stone-300'
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: macOS Window Mockup (5 cols) */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-bg-surface shadow-2xl p-4 sm:p-5 space-y-3.5 max-w-lg mx-auto">
                {/* Window Top Header */}
                <div className="flex items-center justify-between pb-3 border-b border-stone-100 dark:border-stone-800 text-[11px] text-stone-400 font-mono">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                    <span className="ml-2 text-stone-500 font-medium">
                      • Local Store: SQLite (Active)
                    </span>
                  </div>
                  <span className="hidden sm:inline text-3xs text-stone-400">
                    Connected Workspaces: [Student] [Dev] [Free]
                  </span>
                </div>

                {/* Content Card 1: Plan & Create */}
                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-bg-elevated/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-orange-100 dark:bg-orange-950/60 text-[#c04b1e] flex items-center justify-center font-bold text-xs">
                        📋
                      </div>
                      <h3 className="text-xs font-bold text-stone-900 dark:text-white">
                        {preview.planTitle}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 font-medium">
                      {preview.planCount}
                    </span>
                  </div>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400 leading-snug">
                    {preview.planSubtitle}
                  </p>
                  <div className="space-y-1 pt-1">
                    <div className="w-full h-1.5 rounded-full bg-stone-100 dark:bg-stone-800 overflow-hidden">
                      <div
                        className="h-full bg-[#c04b1e] rounded-full transition-all duration-500"
                        style={{ width: `${preview.planProgress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                      <span>Milestones</span>
                      <span>{preview.planProgressLabel}</span>
                    </div>
                  </div>
                </div>

                {/* Content Card 2: Study / Build & Track */}
                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-bg-elevated/40 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-orange-100 dark:bg-orange-950/60 text-[#c04b1e] flex items-center justify-center font-bold text-xs">
                        🎯
                      </div>
                      <h3 className="text-xs font-bold text-stone-900 dark:text-white">
                        {preview.trackTitle}
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {preview.trackActiveCount}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px] text-stone-600 dark:text-stone-300">
                    {preview.trackBullets.map((bullet, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {bullet.done ? (
                          <span className="w-3.5 h-3.5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                            ✓
                          </span>
                        ) : bullet.active ? (
                          <span className="w-3.5 h-3.5 rounded-full bg-[#c04b1e]/15 text-[#c04b1e] flex items-center justify-center text-[10px] font-bold shrink-0">
                            •
                          </span>
                        ) : (
                          <span className="w-3.5 h-3.5 rounded-full bg-stone-200 dark:bg-stone-800 text-stone-400 flex items-center justify-center text-[10px] shrink-0">
                            •
                          </span>
                        )}
                        <span
                          className={cn(
                            bullet.done && 'line-through text-stone-400 dark:text-stone-500',
                            bullet.active && 'font-medium text-stone-900 dark:text-stone-100'
                          )}
                        >
                          {bullet.text}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="pt-1 flex justify-between text-[10px] text-stone-400 border-t border-stone-100 dark:border-stone-800">
                    <span>{preview.trackFooter}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      {preview.trackStatus}
                    </span>
                  </div>
                </div>

                {/* Content Card 3: Generate Content */}
                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-bg-elevated/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-orange-100 dark:bg-orange-950/60 text-[#c04b1e] flex items-center justify-center font-bold text-xs">
                        ✨
                      </div>
                      <h3 className="text-xs font-bold text-stone-900 dark:text-white">
                        Generate Content
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-[#c04b1e] font-semibold">
                      Skillpath AI
                    </span>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#fbf5f0] dark:bg-orange-950/20 border border-[#f5e3d7] dark:border-orange-900/30 text-[11px] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[9px] font-bold uppercase text-[#c04b1e] bg-orange-100/80 dark:bg-orange-900/50 px-1.5 py-0.5 rounded">
                        {preview.proposalTag}
                      </span>
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Ready to apply
                      </span>
                    </div>
                    <p className="text-stone-700 dark:text-stone-300 italic text-[11px] leading-relaxed">
                      {preview.proposalQuote}
                    </p>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span className="text-[#c04b1e] font-medium hover:underline cursor-pointer">
                      View Proposal details
                    </span>
                    <span>Today, 2:15 PM</span>
                  </div>
                </div>

                {/* Content Card 4: Schedule & Review */}
                <div className="p-3.5 rounded-xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-bg-elevated/40 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded bg-orange-100 dark:bg-orange-950/60 text-[#c04b1e] flex items-center justify-center font-bold text-xs">
                        📅
                      </div>
                      <h3 className="text-xs font-bold text-stone-900 dark:text-white">
                        Schedule &amp; Review
                      </h3>
                    </div>
                    <span className="text-[10px] font-mono text-stone-500 font-medium">
                      Calendar Sync
                    </span>
                  </div>
                  <div className="space-y-1.5 text-[11px]">
                    {preview.scheduleList.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-1.5 rounded-lg bg-stone-50 dark:bg-stone-900/50 flex items-center justify-between"
                      >
                        <span className="font-medium text-stone-800 dark:text-stone-200">
                          {item.name}
                        </span>
                        <span
                          className={cn(
                            'text-[10px] font-mono font-bold',
                            item.highlight ? 'text-[#c04b1e]' : 'text-stone-500'
                          )}
                        >
                          {item.time}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-400 pt-1 border-t border-stone-100 dark:border-stone-800">
                    <span>{preview.scheduleFooter}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      Synced ✓
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── 5 Simple Steps Section ───────────────────────────────────── */}
        <section
          id="how-it-works"
          aria-labelledby="steps-section-title"
          className="py-20 md:py-28 px-6 md:px-12 max-w-6xl mx-auto border-t border-stone-200/70 dark:border-stone-800/80"
        >
          {/* Eyebrow and Section Header */}
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbeee6] dark:bg-orange-950/40 border border-[#f5d5c5] dark:border-orange-900/40 text-[#a03d15] dark:text-orange-300 text-[11px] font-bold uppercase tracking-wider">
              NON-TECH FRIENDLY WORKFLOW
            </div>
            <h2
              id="steps-section-title"
              className="text-3xl sm:text-4xl font-extrabold text-stone-950 dark:text-white tracking-tight"
            >
              How MentorOS works in 5 simple steps
            </h2>
            <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 max-w-xl mx-auto leading-relaxed">
              From initial project planning to execution, scheduling, and review: clear,
              automated, and completely under your control.
            </p>
          </div>

          {/* 5 Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Step 1 */}
            <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-bg-surface p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-[#c04b1e] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    1
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c04b1e]">
                    GOAL &amp; TECH STACK
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-950 dark:text-white">
                  Plan and create
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Quickly outline your project goals, scope, and target deadline. The system safely
                  saves your project details securely in your database.
                </p>
              </div>
              <div className="mt-5 p-3 rounded-xl bg-[#fbf5f0] dark:bg-stone-900/60 border border-[#f5e3d7] dark:border-stone-800 text-xs space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#c04b1e]">
                  WHAT HAPPENS
                </span>
                <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed">
                  System safely saves your project plan and target deadlines in your database.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-bg-surface p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-[#c04b1e] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    2
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c04b1e]">
                    AI ROADMAPS
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-950 dark:text-white">
                  Generate roadmap
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Skillpath AI proposes structured milestones, daily schedules, and execution checklists
                  to hit your target date without guesswork.
                </p>
              </div>
              <div className="mt-5 p-3 rounded-xl bg-[#fbf5f0] dark:bg-stone-900/60 border border-[#f5e3d7] dark:border-stone-800 text-xs space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#c04b1e]">
                  WHAT HAPPENS
                </span>
                <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed">
                  AI proposes milestones, actionable schedules, and milestones checklists.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-bg-surface p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-[#c04b1e] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    3
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c04b1e]">
                    VISUAL TASK BOARD
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-950 dark:text-white">
                  Build and track
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Work through your visual task board, ticking off tasks as you go. Your overall
                  project progress automatically updates in real time.
                </p>
              </div>
              <div className="mt-5 p-3 rounded-xl bg-[#fbf5f0] dark:bg-stone-900/60 border border-[#f5e3d7] dark:border-stone-800 text-xs space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#c04b1e]">
                  WHAT HAPPENS
                </span>
                <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed">
                  Check off tasks on your board as you work; updating completion status instantly.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-bg-surface p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-[#c04b1e] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    4
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c04b1e]">
                    DEADLINES &amp; MILESTONES
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-950 dark:text-white">Schedule</h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Organize your upcoming deadlines, review checkpoints, and scheduled items directly
                  into your visual calendar.
                </p>
              </div>
              <div className="mt-5 p-3 rounded-xl bg-[#fbf5f0] dark:bg-stone-900/60 border border-[#f5e3d7] dark:border-stone-800 text-xs space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#c04b1e]">
                  WHAT HAPPENS
                </span>
                <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed">
                  Add steps into and deliverables directly to your project calendar.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="rounded-2xl border border-stone-200/80 dark:border-stone-800 bg-white dark:bg-bg-surface p-5 flex flex-col justify-between shadow-xs hover:shadow-md transition-shadow md:col-span-2 lg:col-span-1">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-full bg-[#c04b1e] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                    5
                  </div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#c04b1e]">
                    MUTUAL WORKSPACE
                  </span>
                </div>
                <h3 className="text-base font-bold text-stone-950 dark:text-white">
                  Review dashboard
                </h3>
                <p className="text-xs text-stone-600 dark:text-stone-300 leading-relaxed">
                  Your home dashboard displays completed project milestones alongside upcoming
                  scheduled tasks and deadlines in one clean view.
                </p>
              </div>
              <div className="mt-5 p-3 rounded-xl bg-[#fbf5f0] dark:bg-stone-900/60 border border-[#f5e3d7] dark:border-stone-800 text-xs space-y-1">
                <span className="text-[10px] font-mono font-bold uppercase text-[#c04b1e]">
                  WHAT HAPPENS
                </span>
                <p className="text-[11px] text-stone-700 dark:text-stone-300 leading-relaxed">
                  Dashboard highlights your active progress, finished milestones, and upcoming
                  deliverables.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Zero Telemetry / Privacy Section ─────────────────────────── */}
        <section
          id="privacy"
          aria-labelledby="privacy-heading"
          className="py-16 px-6 md:px-12 max-w-5xl mx-auto"
        >
          <div className="rounded-3xl border border-stone-200/90 dark:border-stone-800 bg-white dark:bg-bg-surface p-8 sm:p-12 shadow-sm grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            {/* Left Content (6 cols) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="w-10 h-10 rounded-full bg-[#fbeee6] dark:bg-orange-950/60 text-[#c04b1e] flex items-center justify-center">
                <Shield className="w-5 h-5 text-[#c04b1e]" />
              </div>
              <h2
                id="privacy-heading"
                className="text-2xl sm:text-3xl font-extrabold text-stone-950 dark:text-white tracking-tight leading-tight"
              >
                Zero telemetry. <br className="hidden sm:inline" />
                Local private AI.
              </h2>
              <p className="text-xs sm:text-sm text-stone-600 dark:text-stone-300 leading-relaxed max-w-md">
                Your notes, project details, and goals remain safely stored on your local workspace.
                AI suggestions run securely and never silently modify your data without explicit approval.
              </p>
              <div className="pt-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-2xs">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>100% offline-capable with local database storage</span>
                </div>
              </div>
            </div>

            {/* Right Feature Blocks (6 cols) */}
            <div className="lg:col-span-6 space-y-3">
              {/* Feature 1 */}
              <div className="p-4 rounded-2xl bg-[#faf6f2] dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#f0e3d8] dark:bg-orange-950/50 text-[#c04b1e] flex items-center justify-center shrink-0 mt-0.5">
                  <Database className="w-4 h-4 text-[#c04b1e]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-950 dark:text-white">
                    Stored locally
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                    Notes, project details, and goals stay in your local workspace database.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="p-4 rounded-2xl bg-[#faf6f2] dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#f0e3d8] dark:bg-orange-950/50 text-[#c04b1e] flex items-center justify-center shrink-0 mt-0.5">
                  <Check className="w-4 h-4 text-[#c04b1e]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-950 dark:text-white">
                    You approve every change
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                    AI suggestions never silently modify your data without explicit approval.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="p-4 rounded-2xl bg-[#faf6f2] dark:bg-stone-900/60 border border-stone-200/80 dark:border-stone-800 flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-lg bg-[#f0e3d8] dark:bg-orange-950/50 text-[#c04b1e] flex items-center justify-center shrink-0 mt-0.5">
                  <Shield className="w-4 h-4 text-[#c04b1e]" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-bold text-stone-950 dark:text-white">
                    No tracking
                  </h4>
                  <p className="text-xs text-stone-600 dark:text-stone-300 mt-0.5 leading-relaxed">
                    Zero telemetry, and no metrics collection on your own machine.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Call To Action Banner ────────────────────────────────────── */}
        <section className="py-16 px-6 md:px-12 max-w-5xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-[#ba4317] via-[#c65220] to-[#b83e14] text-white p-10 sm:p-14 text-center shadow-xl space-y-4">
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Plan it, track it and ship it from one workspace.
            </h2>
            <p className="text-xs sm:text-sm text-orange-100 max-w-lg mx-auto leading-relaxed">
              Open your workspace and let Skillpath AI turn your next project goal into a clear,
              reviewable plan.
            </p>
            <div className="pt-3 flex flex-wrap items-center justify-center gap-3.5">
              <Link
                to={
                  isAuthenticated && user
                    ? `/app/${user.role.replace('_', '-')}/dashboard`
                    : '/register'
                }
                className="bg-white hover:bg-stone-100 text-[#c04b1e] font-bold text-xs sm:text-sm px-6 py-2.5 rounded-xl shadow-xs transition-colors"
              >
                Get started
              </Link>
              <Link
                to={
                  isAuthenticated && user
                    ? `/app/${user.role.replace('_', '-')}/dashboard`
                    : '/login'
                }
                className="bg-black/20 hover:bg-black/30 text-white border border-white/25 font-semibold text-xs sm:text-sm px-6 py-2.5 rounded-xl transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* ─── Footer ─────────────────────────────────────────────────────── */}
      <footer
        role="contentinfo"
        className="border-t border-stone-200 dark:border-stone-800/80 py-8 px-6 md:px-12 bg-white dark:bg-[#0c0e14] text-xs text-stone-500 transition-colors"
      >
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-5 h-5 rounded bg-[#c04b1e] text-white flex items-center justify-center font-bold text-[10px]">
              M
            </div>
            <span className="font-bold text-stone-950 dark:text-white">MentorOS</span>
            <span className="text-stone-400">
              • All your goals, productivity and workspaces kept sync-free
            </span>
          </div>
          <div className="flex items-center gap-6">
            <a
              href="#how-it-works"
              className="hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              How it works
            </a>
            <a
              href="#privacy"
              className="hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              Privacy
            </a>
            <Link
              to="/login"
              className="hover:text-stone-900 dark:hover:text-white transition-colors"
            >
              Sign in
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
