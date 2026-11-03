import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Code2,
  GitBranch,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Terminal,
  Layers,
  Sparkles,
  Zap,
  Globe,
  Mail,
  ArrowRight,
} from 'lucide-react';
import { Card3D } from '../../components/ui/Card3D';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useSeoMeta } from '../../utils/useSeoMeta';

interface ProjectShowcase {
  title: string;
  description: string;
  previewUrl: string;
  githubUrl: string;
  status: 'online' | 'building' | 'preview';
  techStack: string[];
  metrics: string;
}

export default function DeveloperPortfolioPage() {
  const { username = 'developer' } = useParams<{ username: string }>();
  const [copied, setCopied] = useState(false);

  const displayName = username.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  const pageUrl = `https://mentoros.app/portfolio/${username}`;

  const featuredProjects: ProjectShowcase[] = [
    {
      title: 'MentorOS Productivity Engine',
      description:
        'Modular workspace operating system featuring 4 specialized modules, local streaming AI proposals, and automated deploy preview workflows.',
      previewUrl: 'https://mentoros.app',
      githubUrl: 'https://github.com/developer/mentoros',
      status: 'online',
      techStack: ['React', 'TypeScript', 'Tailwind', 'FastAPI', 'Ollama'],
      metrics: '100% CI pass rate • 0 tech debt backlog',
    },
    {
      title: 'HyperScalable Microservice Gateway',
      description:
        'High-throughput asynchronous API gateway with rate-limiting, JWT rotation, and real-time distributed tracing metrics.',
      previewUrl: 'https://preview.api-gateway.internal',
      githubUrl: 'https://github.com/developer/api-gateway',
      status: 'online',
      techStack: ['Python', 'FastAPI', 'Docker', 'Redis', 'PostgreSQL'],
      metrics: 'Sub-15ms p99 latency • 99.99% uptime',
    },
    {
      title: 'Interactive 3D Spatial Canvas',
      description:
        'Performant canvas-based interactive visualization widget with custom KaTeX math rendering, dynamic drag-and-drop, and hardware acceleration.',
      previewUrl: 'https://preview.spatial3d.internal',
      githubUrl: 'https://github.com/developer/spatial-canvas',
      status: 'preview',
      techStack: ['TypeScript', 'WebGL', 'Framer Motion', 'KaTeX'],
      metrics: '60 FPS render pipeline • Zero dropped frames',
    },
  ];

  useSeoMeta({
    title: `${displayName}'s Developer Portfolio — Verified with MentorOS`,
    description: `Explore ${displayName}'s engineering portfolio, live deploy previews, architectural milestones, and verified project code.`,
    url: pageUrl,
    type: 'profile',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'ProfilePage',
      mainEntity: {
        '@type': 'Person',
        name: displayName,
        alternateName: username,
        jobTitle: 'Senior Full-Stack Engineer',
        description: `Verified engineer building full-stack products with MentorOS.`,
        knowsAbout: ['TypeScript', 'React', 'Python', 'FastAPI', 'Docker', 'Architecture'],
        sameAs: [`https://github.com/${username}`],
      },
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-bg-base text-text-primary selection:bg-orange-500/20 selection:text-orange-500">
      {/* Top Bar */}
      <header className="border-b border-border-base bg-bg-surface/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-xl bg-orange-500 text-white flex items-center justify-center font-black text-sm shadow-2xs group-hover:scale-105 transition-transform">
              M
            </div>
            <span className="font-extrabold text-sm tracking-tight text-text-primary">
              Mentor<span className="text-orange-500">OS</span>
            </span>
            <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" />
              Verified Portfolio
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
              {copied ? 'Copied' : 'Share Portfolio'}
            </Button>
            <a href="mailto:developer@example.com">
              <Button
                variant="primary"
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white shadow-2xs"
              >
                Contact Me
              </Button>
            </a>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-8">
        {/* Profile Card */}
        <Card3D
          maxTilt={4}
          depth={25}
          variant="secondary"
          className="p-6 sm:p-8 border border-border-base shadow-card backdrop-blur-md"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 text-white font-black text-2xl flex items-center justify-center shadow-md shrink-0">
                {displayName[0]}
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-text-primary tracking-tight">
                    {displayName}
                  </h1>
                  <Badge variant="outline" size="sm" className="font-mono text-xs">
                    @{username}
                  </Badge>
                </div>
                <p className="text-sm text-text-secondary max-w-xl">
                  Full-stack software architect specializing in reactive user experiences,
                  performant backend pipelines, and autonomous AI integrations.
                </p>
                <div className="flex items-center gap-2 flex-wrap pt-1 text-xs text-text-muted">
                  <span className="flex items-center gap-1">
                    <Globe className="w-3.5 h-3.5" />
                    <span>Remote / Global</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Open to new opportunities</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Verification Stats */}
            <div className="grid grid-cols-2 gap-3 shrink-0">
              <div className="p-3 bg-bg-base rounded-xl border border-border-base text-center min-w-[100px]">
                <div className="text-xl font-extrabold text-text-primary">100%</div>
                <div className="text-2xs text-text-muted">Milestones Met</div>
              </div>
              <div className="p-3 bg-bg-base rounded-xl border border-border-base text-center min-w-[100px]">
                <div className="text-xl font-extrabold text-emerald-500">0%</div>
                <div className="text-2xs text-text-muted">High Debt Ratio</div>
              </div>
            </div>
          </div>
        </Card3D>

        {/* Featured Projects with Deploy Previews */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-text-primary flex items-center gap-2">
              <Code2 className="w-5 h-5 text-orange-500" />
              <span>Featured Engineering Projects &amp; Previews</span>
            </h2>
            <span className="text-xs text-text-muted font-medium">
              All deployed with verified builds
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {featuredProjects.map((p, idx) => (
              <Card
                key={idx}
                className="p-5 border-border-base bg-bg-surface flex flex-col justify-between hover:border-orange-500/40 transition-all"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xs font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      {p.status}
                    </span>
                    <a
                      href={p.githubUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-text-muted hover:text-text-primary transition-colors"
                      aria-label={`View ${p.title} on GitHub`}
                    >
                      <GitBranch className="w-4 h-4" />
                    </a>
                  </div>

                  <h3 className="text-base font-bold text-text-primary">{p.title}</h3>
                  <p className="text-xs text-text-muted leading-relaxed">{p.description}</p>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    {p.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 text-3xs font-medium rounded bg-bg-elevated text-text-secondary border border-border-base"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-4 mt-4 border-t border-border-base flex items-center justify-between text-xs">
                  <span className="text-3xs text-text-faint">{p.metrics}</span>
                  <a
                    href={p.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 dark:text-orange-400 font-semibold hover:underline flex items-center gap-1 text-xs"
                  >
                    <span>Live Preview</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Footer CTA */}
        <div className="text-center py-6 border-t border-border-base">
          <p className="text-xs text-text-muted mb-2">
            Powered by MentorOS Public Developer Portfolios
          </p>
          <Link
            to="/"
            className="text-xs font-semibold text-orange-600 dark:text-orange-400 hover:underline"
          >
            Build your own verified developer portfolio →
          </Link>
        </div>
      </main>
    </div>
  );
}
