import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  ArrowRight,
  BookOpen,
  Code2,
  Briefcase,
  Layers,
  Clock,
  Download,
  Star,
  ExternalLink,
} from 'lucide-react';
import { Card3D } from '../../components/ui/Card3D';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useSeoMeta } from '../../utils/useSeoMeta';

interface TemplateData {
  id: string;
  title: string;
  description: string;
  role: 'developer' | 'freelancer' | 'student' | 'job_seeker';
  roleLabel: string;
  category: string;
  rating: number;
  downloads: number;
  estimatedWeeks: number;
  milestones: {
    title: string;
    description: string;
    tasks: string[];
  }[];
  techStack?: string[];
  features: string[];
}

const TEMPLATE_CATALOG: Record<string, TemplateData> = {
  'react-saas-starter': {
    id: 'react-saas-starter',
    title: 'Full-Stack React & AI SaaS Starter Plan',
    description:
      'Production-ready SaaS architecture milestone plan with authentication, CRUD data models, local AI agent integration, and cloud deploy previews.',
    role: 'developer',
    roleLabel: 'Developer',
    category: 'Full-Stack Development',
    rating: 4.9,
    downloads: 1420,
    estimatedWeeks: 6,
    techStack: ['React', 'TypeScript', 'FastAPI', 'TailwindCSS', 'Ollama'],
    milestones: [
      {
        title: 'Phase 1: Project Scaffold & Infrastructure',
        description: 'Initialize Vite app, Tailwind theme tokens, and backend routing boilerplate.',
        tasks: [
          'Configure React Query & centralized api.ts',
          'Setup auth context & token rotation',
          'Configure PWA manifest & test runners',
        ],
      },
      {
        title: 'Phase 2: Data Models & Core CRUD Workspaces',
        description: 'Deliver structured workspace boards, task models, and status lifecycle.',
        tasks: [
          'Implement project, milestone, and task hierarchy',
          'Build role-scoped data views & empty states',
          'Setup optimistic UI updates',
        ],
      },
      {
        title: 'Phase 3: Local AI & Live Deploy Previews',
        description:
          'Connect Ollama streaming generation, proposals review drawer, and CI deploy previews.',
        tasks: [
          'Integrate streaming proposal review modal',
          'Configure automated preview URLs on branch PR',
          'Execute end-to-end integration test passes',
        ],
      },
    ],
    features: [
      'Pre-configured role route guards & secure JWT auth',
      'Zero external API cost local AI streaming integration',
      'Integrated Kanban, list view, and responsive calendar',
      'Automated preview tracking & technical debt audit logging',
    ],
  },
  'freelance-client-tracker': {
    id: 'freelance-client-tracker',
    title: 'Freelance Client Engagements & Invoicing Roadmap',
    description:
      'End-to-end client deliverable delivery workflow with milestone tracking, rate calculation, and client portal sharing.',
    role: 'freelancer',
    roleLabel: 'Freelancer',
    category: 'Client Operations',
    rating: 4.8,
    downloads: 980,
    estimatedWeeks: 4,
    techStack: ['Invoice PDF', 'Client Portal', 'Milestone Tracking', 'Time Logging'],
    milestones: [
      {
        title: 'Milestone 1: Client Onboarding & Scope Agreement',
        description: 'Establish milestones, pricing tiers, and shared deliverables expectations.',
        tasks: [
          'Define scope contract & acceptance criteria',
          'Setup public read-only client portal link',
          'Schedule review meetings & target dates',
        ],
      },
      {
        title: 'Milestone 2: Deliverable Execution & Live Milestones',
        description: 'Deliver sprints and review client feedback with structured task lists.',
        tasks: [
          'Execute phase 1 deliverables',
          'Log billable hours against milestones',
          'Send weekly client digest report',
        ],
      },
      {
        title: 'Milestone 3: Final Delivery & Automated Invoice',
        description: 'Generate itemized PDF invoice from completed milestones and receive payment.',
        tasks: [
          'Verify acceptance checklist on client portal',
          'Generate itemized PDF invoice with payment terms',
          'Mark invoice paid & archive deliverable bundle',
        ],
      },
    ],
    features: [
      'Public read-only client portal with secure share tokens',
      'One-click itemized PDF invoice generation from milestones',
      'Hourly rate, utilization, and overhead profitability calculator',
      'Real-time deliverable progress tracking and status badges',
    ],
  },
  'student-exam-roadmap': {
    id: 'student-exam-roadmap',
    title: 'Semester Study Plan & Exam Preparation Roadmap',
    description:
      'High-yield academic planning template to organize semester courses, assignment deadlines, and spaced-repetition study blocks.',
    role: 'student',
    roleLabel: 'Student',
    category: 'Academic Success',
    rating: 4.9,
    downloads: 2150,
    estimatedWeeks: 12,
    techStack: ['Spaced Repetition', 'Study Standups', 'GPA Tracker', 'Course Accordions'],
    milestones: [
      {
        title: 'Block 1: Semester Syllabus Ingestion & Foundation',
        description: 'Log courses, grading weight distributions, and exam key dates.',
        tasks: [
          'Log all course syllabi and exam dates',
          'Assign target GPA milestones per course',
          'Build weekly study schedule in interactive calendar',
        ],
      },
      {
        title: 'Block 2: Midterm Sprint & Practice Problem Sets',
        description: 'Intense study review cycles with spaced repetition and daily focus standups.',
        tasks: [
          'Complete weekly problem set drills',
          'Review flashcard decks using AI tutor prompts',
          'Take timed midterm practice exams',
        ],
      },
      {
        title: 'Block 3: Final Projects & Exam Review Mastery',
        description: 'Consolidate lecture notes, capstone submissions, and final exam prep.',
        tasks: [
          'Submit academic project milestones',
          'Attend group study reviews',
          'Achieve target semester GPA benchmark',
        ],
      },
    ],
    features: [
      'Course accordion view with assignment completion tracking',
      'Daily study standup brief with 1-click focus task queue',
      'AI-assisted study plan & problem set breakdown generator',
      'Interactive visual calendar with deadline countdown badges',
    ],
  },
};

export default function PublicTemplatePage() {
  const { id = 'react-saas-starter' } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  // Retrieve template or generate dynamic fallback for any ID
  const template: TemplateData = TEMPLATE_CATALOG[id] || {
    id,
    title: `${id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Workflow Template`,
    description: `A systematic productivity and execution template designed for high performance in MentorOS.`,
    role: 'developer',
    roleLabel: 'Productivity',
    category: 'Workspace Template',
    rating: 4.8,
    downloads: 450,
    estimatedWeeks: 4,
    techStack: ['MentorOS', 'AI Assistant', 'Task Management'],
    milestones: [
      {
        title: 'Phase 1: Setup & Roadmap Planning',
        description: 'Establish key goals, initial tasks, and target milestone dates.',
        tasks: [
          'Define primary objectives and deliverables',
          'Set realistic target milestones and check-ins',
          'Assign task priorities and focus areas',
        ],
      },
      {
        title: 'Phase 2: Structured Execution',
        description: 'Execute deliverables with daily focus and milestone progress tracking.',
        tasks: [
          'Track focus items in dashboard',
          'Resolve blockers with local AI proposals',
          'Complete phase deliverables',
        ],
      },
    ],
    features: [
      'Ready-to-import milestone and task structure',
      'Works with free local AI planning assistance',
      'Built-in progress analytics and calendar integration',
    ],
  };

  const pageUrl = `https://mentoros.app/templates/${template.id}`;

  // Apply SEO meta tags & JSON-LD
  useSeoMeta({
    title: `${template.title} — MentorOS Template Gallery`,
    description: template.description,
    url: pageUrl,
    type: 'website',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'CreativeWork',
      name: template.title,
      description: template.description,
      creator: {
        '@type': 'Organization',
        name: 'MentorOS',
        url: 'https://mentoros.app',
      },
      category: template.category,
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: template.rating,
        reviewCount: template.downloads,
      },
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  });

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-orange-500/20 selection:text-orange-500">
      {/* Top Navigation */}
      <header className="border-b border-border-base bg-bg-surface/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-2xs group-hover:scale-105 transition-transform">
              M
            </div>
            <span className="font-extrabold text-sm tracking-tight text-text-primary">
              Mentor<span className="text-orange-500">OS</span>
            </span>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              Templates
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyLink}
              icon={
                copied ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )
              }
            >
              {copied ? 'Link Copied' : 'Share'}
            </Button>
            <Link to="/register">
              <Button
                variant="primary"
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-2xs"
              >
                Use Template
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Hero Header Card */}
        <Card3D
          maxTilt={4}
          depth={20}
          variant="secondary"
          className="p-6 sm:p-8 border border-border-base shadow-card backdrop-blur-md"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="default" size="sm">
                  {template.category}
                </Badge>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  <span className="font-bold text-text-primary">{template.rating}</span>
                  <span>({template.downloads.toLocaleString()} uses)</span>
                </span>
                <span className="text-xs text-text-muted flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{template.estimatedWeeks} Weeks Roadmap</span>
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                {template.title}
              </h1>

              <p className="text-sm text-text-secondary leading-relaxed">{template.description}</p>

              {template.techStack && (
                <div className="flex items-center gap-1.5 flex-wrap pt-2">
                  <span className="text-2xs font-semibold uppercase text-text-muted mr-1">
                    Includes:
                  </span>
                  {template.techStack.map((tech) => (
                    <span
                      key={tech}
                      className="px-2.5 py-1 text-2xs font-medium rounded-lg bg-bg-elevated border border-border-base text-text-primary"
                    >
                      {tech}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Import Box */}
            <div className="p-5 rounded-2xl bg-bg-base/90 border border-border-base space-y-3 min-w-[240px] shrink-0">
              <div className="text-xs font-semibold text-text-muted">Template Availability</div>
              <div className="text-2xl font-black text-text-primary flex items-baseline gap-1">
                <span>Free</span>
                <span className="text-xs font-normal text-text-muted">/ open-source</span>
              </div>
              <p className="text-2xs text-text-muted leading-tight">
                Imports directly into your MentorOS workspace with pre-populated milestones &amp; AI
                prompt templates.
              </p>
              <Link to={`/register?template=${template.id}`} className="block w-full">
                <Button
                  fullWidth
                  variant="primary"
                  size="md"
                  className="bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-2xs"
                >
                  <span>Import Template</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              </Link>
            </div>
          </div>
        </Card3D>

        {/* What is Included & Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Layers className="w-5 h-5 text-orange-500" />
              <span>Milestone &amp; Task Breakdown</span>
            </h2>

            <div className="space-y-4">
              {template.milestones.map((m, idx) => (
                <Card
                  key={idx}
                  className="p-5 border-border-base bg-bg-surface hover:border-orange-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-border-base">
                    <div>
                      <span className="text-2xs font-bold uppercase tracking-wider text-orange-600 dark:text-orange-400">
                        Milestone {idx + 1}
                      </span>
                      <h3 className="text-base font-bold text-text-primary mt-0.5">{m.title}</h3>
                      <p className="text-xs text-text-muted mt-1">{m.description}</p>
                    </div>
                    <Badge variant="outline" size="sm">
                      {m.tasks.length} Tasks
                    </Badge>
                  </div>

                  <ul className="mt-3.5 space-y-2 text-xs" role="list">
                    {m.tasks.map((task, tIdx) => (
                      <li key={tIdx} className="flex items-center gap-2 text-text-secondary">
                        <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar Highlights */}
          <div className="space-y-6">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-500" />
              <span>Highlights</span>
            </h2>

            <Card className="p-5 border-border-base bg-bg-surface space-y-3">
              {template.features.map((feat, fIdx) => (
                <div key={fIdx} className="flex items-start gap-2.5 text-xs text-text-secondary">
                  <div className="w-4 h-4 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-2.5 h-2.5" />
                  </div>
                  <span>{feat}</span>
                </div>
              ))}
            </Card>

            <Card className="p-5 border-border-base bg-bg-surface text-center space-y-3">
              <h3 className="text-sm font-bold text-text-primary">Want to publish a template?</h3>
              <p className="text-xs text-text-muted">
                Create and share your own workflows with the MentorOS public community.
              </p>
              <Link to="/register">
                <Button variant="outline" size="sm" fullWidth>
                  Get Started Free
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
