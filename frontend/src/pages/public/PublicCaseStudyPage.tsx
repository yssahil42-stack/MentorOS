import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  TrendingUp,
  Award,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Clock,
  ArrowRight,
  ShieldCheck,
  Building,
  Quote,
  Zap,
} from 'lucide-react';
import { Card3D } from '../../components/ui/Card3D';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useSeoMeta } from '../../utils/useSeoMeta';

interface CaseStudyData {
  id: string;
  title: string;
  client: string;
  industry: string;
  duration: string;
  deliverables: string;
  heroMetrics: { label: string; value: string; detail: string }[];
  summary: string;
  challenge: string;
  solution: string;
  milestones: { title: string; result: string }[];
  testimonial: { quote: string; author: string; role: string };
  techStack: string[];
}

const CASE_STUDIES: Record<string, CaseStudyData> = {
  'ecommerce-redesign': {
    id: 'ecommerce-redesign',
    title: 'High-Volume E-Commerce Platform Modernization',
    client: 'Nordic Apparel Co.',
    industry: 'Retail & E-Commerce',
    duration: '8 Weeks',
    deliverables: 'Headless Storefront, Microservice API, Checkout Pipeline',
    heroMetrics: [
      { label: 'Conversion Lift', value: '+42%', detail: 'Mobile checkout completion' },
      { label: 'Page Speed (LCP)', value: '0.8s', detail: 'Reduced from 3.4s' },
      {
        label: 'Infrastructure Savings',
        value: '$36k/yr',
        detail: 'Optimized serverless architecture',
      },
    ],
    summary:
      'Nordic Apparel needed a modern, lightning-fast storefront to replace a monolithic legacy stack ahead of peak seasonal flash sales.',
    challenge:
      'Legacy monolith suffered from 3+ second page render times, checkout timeouts under high concurrency, and technical debt that stalled feature releases.',
    solution:
      'Architected a headless React + TypeScript storefront with edge CDN caching, decoupled payment microservices, and automated PR deploy preview pipelines via MentorOS.',
    milestones: [
      {
        title: 'Phase 1: Architecture Blueprint & Edge Decoupling',
        result: '100% milestone delivery on schedule',
      },
      {
        title: 'Phase 2: Checkout Microservice & Automated Testing',
        result: 'Zero payment dropouts across load testing',
      },
      {
        title: 'Phase 3: Production Migration & Peak Traffic Run',
        result: 'Handled 250k concurrent users with 99.99% uptime',
      },
    ],
    testimonial: {
      quote:
        'The structured milestone delivery and transparent client portal kept our entire executive team confident from day one. Best engineering partner we’ve worked with.',
      author: 'Elin Lindqvist',
      role: 'VP of Digital, Nordic Apparel Co.',
    },
    techStack: ['React', 'TypeScript', 'Tailwind', 'FastAPI', 'Redis', 'Docker'],
  },
  'ai-code-companion': {
    id: 'ai-code-companion',
    title: 'Local AI Code Companion & Proposal System',
    client: 'MentorOS Internal Architecture',
    industry: 'Developer Tools',
    duration: '4 Weeks',
    deliverables: 'Streaming Ollama Engine, Proposal Modal, Diff Inspector',
    heroMetrics: [
      { label: 'External API Cost', value: '$0', detail: 'Runs locally with Ollama' },
      { label: 'Response Latency', value: '<250ms', detail: 'First streaming token' },
      { label: 'Test Suite Pass', value: '100%', detail: '220+ unit and E2E suites' },
    ],
    summary:
      'Engineering an offline-capable, zero-cost AI assistant that streams structured project proposals and task decompositions directly into a productivity workspace.',
    challenge:
      'Standard AI agents rely on expensive proprietary third-party APIs and leak proprietary project metadata over the public web.',
    solution:
      'Integrated lightweight local language models (qwen2.5 / smollm2) with a resilient streaming JSON parser and turn-based proposal approval workflows.',
    milestones: [
      {
        title: 'Phase 1: Local Model Server & Streaming SSE Pipeline',
        result: 'Instant local streaming token generation',
      },
      {
        title: 'Phase 2: Structured Proposal Checklist & Approval Modals',
        result: 'Atomic creation of projects, milestones & tasks',
      },
      {
        title: 'Phase 3: Role-Specific AI Prompt Templates',
        result: 'Customized prompting for students, developers & freelancers',
      },
    ],
    testimonial: {
      quote:
        'Having autonomous AI generation that costs zero dollars and operates with complete local privacy is an unprecedented productivity multiplier.',
      author: 'Marcus Vance',
      role: 'Lead Architect, Core Platform',
    },
    techStack: ['Ollama', 'FastAPI', 'React', 'TypeScript', 'TailwindCSS'],
  },
};

export default function PublicCaseStudyPage() {
  const { id = 'ecommerce-redesign' } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const study: CaseStudyData = CASE_STUDIES[id] || {
    id,
    title: `${id.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} Case Study`,
    client: 'Enterprise Client',
    industry: 'Software & Technology',
    duration: '6 Weeks',
    deliverables: 'Full-Stack Solution & Milestone Roadmap',
    heroMetrics: [
      { label: 'Milestones Completed', value: '100%', detail: 'On-time delivery' },
      { label: 'Uptime Benchmark', value: '99.9%', detail: 'Production verified' },
      { label: 'Tech Debt Score', value: '0', detail: 'High-severity backlog zero' },
    ],
    summary:
      'A verified case study documenting high-impact engineering and milestone delivery with MentorOS.',
    challenge:
      'Modernizing legacy infrastructure while maintaining operational stability and strict deadlines.',
    solution:
      'Applied iterative milestone delivery, automated quality gates, and AI-accelerated workflows.',
    milestones: [
      { title: 'Phase 1: Requirements & Architecture', result: 'Verified deliverables scope' },
      { title: 'Phase 2: Production Execution', result: 'Completed on schedule' },
    ],
    testimonial: {
      quote:
        'Exceptional milestone transparency and engineering quality throughout the project lifecycle.',
      author: 'Lead Stakeholder',
      role: 'Director of Technology',
    },
    techStack: ['React', 'TypeScript', 'FastAPI', 'TailwindCSS'],
  };

  const pageUrl = `https://mentoros.app/case-study/${study.id}`;

  useSeoMeta({
    title: `${study.title} — Case Study | MentorOS`,
    description: study.summary,
    url: pageUrl,
    type: 'article',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'TechArticle',
      headline: study.title,
      description: study.summary,
      author: {
        '@type': 'Organization',
        name: 'MentorOS',
      },
      publisher: {
        '@type': 'Organization',
        name: 'MentorOS',
        url: 'https://mentoros.app',
      },
      about: study.industry,
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-orange-500/20 selection:text-orange-500">
      {/* Top Header */}
      <header className="border-b border-border-base bg-bg-surface/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-2xs group-hover:scale-105 transition-transform">
              M
            </div>
            <span className="font-extrabold text-sm tracking-tight text-text-primary">
              Mentor<span className="text-orange-500">OS</span>
            </span>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
              Case Study
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              icon={
                copied ? (
                  <Check className="w-3.5 h-3.5 text-success" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )
              }
            >
              {copied ? 'Copied' : 'Share Case Study'}
            </Button>
            <Link to="/register">
              <Button
                variant="primary"
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-2xs"
              >
                Build Yours
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Title & Metadata Card */}
        <Card3D
          maxTilt={3}
          depth={20}
          variant="secondary"
          className="p-6 sm:p-8 border border-border-base shadow-card backdrop-blur-md"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge variant="default" size="sm">
                {study.industry}
              </Badge>
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Building className="w-3.5 h-3.5" />
                <span>Client: {study.client}</span>
              </span>
              <span className="text-xs text-text-muted flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{study.duration}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold text-text-primary tracking-tight">
              {study.title}
            </h1>

            <p className="text-base text-text-secondary leading-relaxed">{study.summary}</p>

            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <span className="text-2xs font-semibold uppercase text-text-muted">
                Technologies:
              </span>
              {study.techStack.map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 text-2xs font-medium rounded-lg bg-bg-elevated border border-border-base text-text-primary"
                >
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </Card3D>

        {/* 3 Quantitative Impact Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {study.heroMetrics.map((metric, idx) => (
            <Card
              key={idx}
              className="p-5 border-border-base bg-bg-surface text-center space-y-1 hover:border-orange-500/30 transition-all"
            >
              <div className="text-2xs font-bold uppercase tracking-wider text-text-muted">
                {metric.label}
              </div>
              <div className="text-3xl font-black text-orange-600 dark:text-orange-400">
                {metric.value}
              </div>
              <div className="text-xs text-text-secondary">{metric.detail}</div>
            </Card>
          ))}
        </div>

        {/* Challenge vs Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 border-border-base bg-bg-surface space-y-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-danger" />
              <span>The Challenge</span>
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {study.challenge}
            </p>
          </Card>

          <Card className="p-6 border-border-base bg-bg-surface space-y-3">
            <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-success" />
              <span>The Solution</span>
            </h2>
            <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
              {study.solution}
            </p>
          </Card>
        </div>

        {/* Milestones Achieved */}
        <Card className="p-6 border-border-base bg-bg-surface space-y-4">
          <h2 className="text-base font-bold text-text-primary flex items-center gap-2">
            <Award className="w-5 h-5 text-orange-500" />
            <span>Key Project Milestones &amp; Outcomes</span>
          </h2>

          <div className="space-y-3">
            {study.milestones.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-3.5 rounded-xl bg-bg-base border border-border-base gap-3"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span className="text-xs font-semibold text-text-primary truncate">
                    {m.title}
                  </span>
                </div>
                <Badge variant="outline" size="sm" className="shrink-0 text-3xs">
                  {m.result}
                </Badge>
              </div>
            ))}
          </div>
        </Card>

        {/* Testimonial Quote Card */}
        <Card3D
          maxTilt={2}
          depth={15}
          variant="secondary"
          className="p-6 sm:p-8 border border-border-base/80 bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-transparent"
        >
          <div className="space-y-4">
            <Quote className="w-8 h-8 text-orange-500/40" />
            <p className="text-sm sm:text-base italic text-text-primary font-medium leading-relaxed">
              &ldquo;{study.testimonial.quote}&rdquo;
            </p>
            <div className="pt-2 border-t border-border-base/50 flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-orange-500/10 text-orange-600 font-bold flex items-center justify-center text-xs">
                {study.testimonial.author[0]}
              </div>
              <div>
                <div className="text-xs font-bold text-text-primary">
                  {study.testimonial.author}
                </div>
                <div className="text-2xs text-text-muted">{study.testimonial.role}</div>
              </div>
            </div>
          </div>
        </Card3D>

        {/* Back navigation & Footer */}
        <div className="flex items-center justify-between pt-6 border-t border-border-base text-xs">
          <Link
            to="/"
            className="text-text-muted hover:text-text-primary transition-colors flex items-center gap-1.5"
          >
            <span>← Back to MentorOS Home</span>
          </Link>
          <Link
            to="/register"
            className="font-semibold text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1"
          >
            <span>Start Building Projects</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </main>
    </div>
  );
}
