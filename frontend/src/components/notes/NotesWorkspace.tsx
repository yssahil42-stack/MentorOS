import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  FileText,
  Plus,
  Search,
  Sparkles,
  Pin,
  Trash2,
  Edit3,
  BookOpen,
  Calendar,
  Layers,
  Boxes,
  Terminal,
  Users,
  Briefcase,
  Award,
  Building2,
  HelpCircle,
  Copy,
  Check,
  Calculator,
  FlaskConical,
  Code,
  FileCheck,
  MessageSquare,
  ArrowRight,
  Eye,
  PenLine,
  Loader2,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { fetchNotes, createNote, updateNote, deleteNote } from '../../services/noteService';
import { askAI } from '../../services/aiService';
import { Modal } from '../ui/Modal';
import { LoadingSkeleton } from '../ui/LoadingSkeleton';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import type { Note } from '../../types/aiProposal';

export type WorkspaceModuleRole = 'student' | 'developer' | 'freelancer' | 'job_seeker';

export interface NoteTemplate {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  defaultTitle: string;
  content: string;
}

export interface ModuleNotesConfig {
  role: WorkspaceModuleRole;
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  defaultCategories: string[];
  templates: NoteTemplate[];
  aiPromptPlaceholder: string;
  aiSuggestedTopics: string[];
}

export const MODULE_NOTE_CONFIGS: Record<WorkspaceModuleRole, ModuleNotesConfig> = {
  student: {
    role: 'student',
    title: 'Study notes',
    subtitle: 'Lecture summaries, formula sheets and lab records in one place.',
    searchPlaceholder: 'Search notes, formulas, concepts',
    defaultCategories: ['DBMS', 'Operating systems', 'Maths', 'Computer Networks', 'Algorithms'],
    templates: [
      {
        id: 'lecture-summary',
        title: 'Lecture summary',
        subtitle: 'Key points from a class',
        category: 'DBMS',
        icon: BookOpen,
        defaultTitle: 'Lecture Summary: [Topic Name]',
        content: `## Lecture: [Subject / Topic Name]
**Date:** ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | **Unit:** Unit 1

### Key Concepts & Definitions
- **Concept 1:** Definition and core mechanism
- **Concept 2:** Real-world application

### Core Formulas & Rules
- Key formula or invariant:

### Summary & Exam Highlights
- Common traps and must-remember facts:
- Questions likely to appear on exam:`,
      },
      {
        id: 'formula-sheet',
        title: 'Formula sheet',
        subtitle: 'Quick-reference equations',
        category: 'Maths',
        icon: Calculator,
        defaultTitle: 'Formula sheet: [Topic Name]',
        content: `## Formula Sheet: [Subject / Topic]
**Last Revised:** ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}

### Key Equations & Identities
- Formula 1:
- Formula 2:

### Variable Legend
- $x$: Independent variable
- $y$: Dependent variable

### Shortcut Methods & Quick Tricks
- Tip 1:
- Tip 2:`,
      },
      {
        id: 'lab-record',
        title: 'Lab record',
        subtitle: 'Aim, steps, observations',
        category: 'Operating systems',
        icon: FlaskConical,
        defaultTitle: 'Lab experiment: [Experiment Title]',
        content: `## Lab Experiment: [Experiment Title]
**Experiment #:** 01 | **Date:** ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}

### Aim & Objective
- Objective statement:

### Tools & Environment
- Environment / compiler / OS:

### Algorithm / Steps
1. Step 1:
2. Step 2:

### Observations & Output
- Results obtained:
- Inferences:`,
      },
    ],
    aiPromptPlaceholder:
      'e.g., Explain Database Normalization forms from 1NF to BCNF with exam traps',
    aiSuggestedTopics: [
      'Database Normalization (1NF to BCNF) with examples',
      'CPU Scheduling Algorithms: FCFS, SJF, and Round Robin',
      'Matrices and Determinants Quick Formula Sheet',
      'TCP 3-Way Handshake and Flow Control Deep Dive',
    ],
  },
  developer: {
    role: 'developer',
    title: 'Engineering notes',
    subtitle: 'Architecture decisions, API specs and runbooks in one place.',
    searchPlaceholder: 'Search architecture, runbooks, snippets',
    defaultCategories: ['Architecture', 'API Specs', 'DevOps', 'Frontend', 'Backend', 'Database'],
    templates: [
      {
        id: 'architecture-adr',
        title: 'Architecture ADR',
        subtitle: 'Context, decision & tradeoffs',
        category: 'Architecture',
        icon: Boxes,
        defaultTitle: 'ADR: [Decision Title]',
        content: `## Architecture Decision Record (ADR)
**Status:** Accepted | **Date:** ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}

### Context & Problem Statement
- What technical challenge or architectural decision requires resolution?

### Decision Outcome
- Chosen option:
- Justification:

### Alternatives Considered
- **Option A:** Pros & cons
- **Option B:** Pros & cons

### Positive & Negative Consequences
- **Positive:** Improved scalability and decoupled deployments.
- **Trade-off:** Operational complexity in message deduplication.`,
      },
      {
        id: 'api-specification',
        title: 'API specification',
        subtitle: 'Endpoints, payload & schemas',
        category: 'API Specs',
        icon: Code,
        defaultTitle: 'API Spec: [Service / Endpoint]',
        content: `## API Specification: [Service Name]
**Base URL:** \`/api/v1\` | **Auth:** Bearer Token

### \`POST /api/v1/resource\`
**Description:** Creates a new entity.

#### Request Headers
\`\`\`http
Authorization: Bearer <token>
Content-Type: application/json
\`\`\`

#### Request Body Schema
\`\`\`json
{
  "title": "string",
  "priority": "high"
}
\`\`\`

#### Responses
- \`201 Created\`: Returns the created entity
- \`400 Bad Request\`: Validation failed`,
      },
      {
        id: 'incident-runbook',
        title: 'Incident runbook',
        subtitle: 'Diagnosis, triage & mitigation',
        category: 'DevOps',
        icon: Terminal,
        defaultTitle: 'Runbook: [Failure Scenario]',
        content: `## Incident Runbook: [Service / Scenario]
**Severity:** P1 / High | **On-Call:** DevOps / Platform

### Symptoms & Trigger Alerts
- High 5xx error rate on public gateway (> 2%)
- Database connection pool exhaustion

### Immediate Triage Steps
1. Check Prometheus dashboard & container memory usage
2. Inspect application error logs: \`kubectl logs -l app=api -n prod\`

### Mitigation & Recovery
- Scale deployment replicas: \`kubectl scale deployment/api --replicas=8\`
- Force connection pool recycle if locked`,
      },
    ],
    aiPromptPlaceholder:
      'e.g., Draft an ADR for Event-Driven Microservices using Kafka vs RabbitMQ',
    aiSuggestedTopics: [
      'Event-Driven Microservices: Kafka vs RabbitMQ Trade-Offs',
      'REST API Security Checklist: JWT Rotation & Rate Limiting',
      'PostgreSQL Query Optimization & Indexing Cheat Sheet',
      'Kubernetes Ingress & SSL Cert Renewal Runbook',
    ],
  },
  freelancer: {
    role: 'freelancer',
    title: 'Client notes',
    subtitle: 'Meeting briefs, project scopes and deliverable specs in one place.',
    searchPlaceholder: 'Search client briefs, deliverables, meeting logs',
    defaultCategories: ['Client Briefs', 'Deliverables', 'Meeting Notes', 'Proposals', 'Contracts'],
    templates: [
      {
        id: 'client-discovery',
        title: 'Client discovery',
        subtitle: 'Requirements, goals & timelines',
        category: 'Client Briefs',
        icon: Users,
        defaultTitle: 'Client Discovery: [Client / Brand Name]',
        content: `## Client Discovery Brief: [Client Name]
**Industry:** E-Commerce / SaaS | **Target Launch:** Q4

### Business Problem & Objectives
- Primary objective:
- Desired business metric impact:

### Target Audience & User Persona
- Who is the end user?
- Key pain points to solve:

### Key Milestones & Estimated Budget
- **Budget Estimate:** \$X,XXX
- **Phase 1 Delivery:** Wireframes & Design System
- **Phase 2 Delivery:** Full Responsive Frontend Build`,
      },
      {
        id: 'project-brief',
        title: 'Project brief',
        subtitle: 'Deliverables, scope & milestones',
        category: 'Deliverables',
        icon: FileCheck,
        defaultTitle: 'Project Scope: [Project Name]',
        content: `## Project Scope & Deliverables: [Project Name]
**Client:** [Client Name] | **Status:** Active

### Included in Scope
- [x] Responsive web application built with Next.js & Tailwind CSS
- [x] Stripe checkout & invoice integration
- [x] Cross-browser QA testing & deployment to custom domain

### Excluded (Out of Scope)
- Native mobile app development (iOS/Android)
- Ongoing content authoring and copywriting

### Revision Policy
- Includes 2 rounds of design revisions prior to final delivery.`,
      },
      {
        id: 'meeting-minutes',
        title: 'Meeting minutes',
        subtitle: 'Discussion points & action items',
        category: 'Meeting Notes',
        icon: MessageSquare,
        defaultTitle: 'Meeting Minutes: [Client Name] Sync',
        content: `## Meeting Minutes: [Client Name] Sync
**Date:** ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} | **Attendees:** Client Lead, Freelancer

### Agenda & Discussion Points
1. Reviewed draft Figma prototypes for checkout flow
2. Approved terracotta brand color scheme
3. Agreed on revised launch timeline

### Client Feedback
- Make mobile checkout button sticky on product pages
- Add currency selection for international buyers

### Next Action Items
- [ ] Deliver updated prototypes by Friday
- [ ] Client to provide Stripe production keys`,
      },
    ],
    aiPromptPlaceholder:
      'e.g., Draft a client project brief for a responsive Shopify storefront redesign',
    aiSuggestedTopics: [
      'Client Discovery Call Questionnaire & Scoping Template',
      'Web Design Retainer Agreement Scope & Deliverables',
      'Sprint Review Meeting Summary with Client Action Items',
      'Freelance Proposal: Scope of Work and Milestone Breakdown',
    ],
  },
  job_seeker: {
    role: 'job_seeker',
    title: 'Career notes',
    subtitle: 'Interview prep, company research and STAR stories in one place.',
    searchPlaceholder: 'Search interview questions, STAR stories, company notes',
    defaultCategories: [
      'Behavioral (STAR)',
      'Company Research',
      'Technical Prep',
      'Questions to Ask',
      'Offer Review',
    ],
    templates: [
      {
        id: 'star-story',
        title: 'STAR story',
        subtitle: 'Situation, Task, Action, Result',
        category: 'Behavioral (STAR)',
        icon: Award,
        defaultTitle: 'STAR: [Leadership / Conflict / Scaling Story]',
        content: `## Behavioral STAR Story: [Competency / Challenge]
**Theme:** Leadership / Conflict Resolution / Overcoming Roadblocks

### Situation
- What was the context, company situation, or urgent problem?

### Task
- What was your specific responsibility or goal?

### Action
- What concrete steps did you personally take to drive resolution?
- How did you communicate with stakeholders and overcome obstacles?

### Result & Impact
- **Quantifiable Outcome:** Reduced latency by 45% or delivered 2 weeks ahead of schedule.
- **Key Takeaway:** What did you learn that applies to this target role?`,
      },
      {
        id: 'company-dossier',
        title: 'Company dossier',
        subtitle: 'Values, leadership & tech stack',
        category: 'Company Research',
        icon: Building2,
        defaultTitle: 'Company Dossier: [Target Company]',
        content: `## Company Dossier: [Company Name]
**Target Role:** Senior Full-Stack Engineer | **Stage:** Final Round

### Company Mission & Business Model
- Core product:
- Primary revenue streams & market positioning:

### Engineering Culture & Technology Stack
- Tech stack: React, TypeScript, FastAPI, PostgreSQL, AWS
- Engineering values: High agency, velocity, developer autonomy

### Recent Company News & Leadership
- CEO / CTO priorities:
- Recent product launches or funding milestones:

### Why I Want to Join (Talking Points)
1. Alignment with their high-craft product standards
2. Opportunity to scale mission-critical platform workflows`,
      },
      {
        id: 'interview-questions',
        title: 'Interview questions',
        subtitle: 'Questions to ask the interviewer',
        category: 'Questions to Ask',
        icon: HelpCircle,
        defaultTitle: 'Questions for Interviewer: [Company Name]',
        content: `## Thoughtful Questions for the Interviewer
**Role:** [Role] | **Interviewer:** [Hiring Manager / Tech Lead]

### Architecture & Engineering Practices
- How do you balance shipping new user features vs paying down technical debt?
- What does a typical sprint and CI/CD deployment cycle look like?

### Team Culture & Ownership
- How are high-impact architectural decisions made across the team?
- What separates a good engineer from a truly exceptional one in this team?

### 90-Day Expectations
- What would a home-run first 90 days look like for someone stepping into this role?`,
      },
    ],
    aiPromptPlaceholder:
      'e.g., Draft a STAR story demonstrating cross-functional leadership under tight deadlines',
    aiSuggestedTopics: [
      'STAR Story: Diagnosing and Resolving a Critical Production Outage',
      'Target Company Dossier & Architecture Talking Points',
      'Top 10 High-Impact Questions to Ask Engineering Directors',
      'System Design Behavioral Answers for Technical Rounds',
    ],
  },
};

/**
 * Extracts clean category tag and clean title from a Note.
 * Formats supported:
 * 1. `[Category] Title` -> `{ category: "Category", title: "Title" }`
 * 2. `Category: Title` -> `{ category: "Category", title: "Title" }`
 * 3. Default category fallback
 */
export function extractNoteMetadata(note: Note, defaultCategory: string) {
  const bracketMatch = note.title.match(/^\[(.*?)\]\s*(.*)$/);
  if (bracketMatch) {
    return { category: bracketMatch[1].trim(), cleanTitle: bracketMatch[2].trim() };
  }
  const colonMatch = note.title.match(/^([A-Za-z0-9\s_-]{2,24}):\s+(.*)$/);
  if (colonMatch && !colonMatch[1].toLowerCase().startsWith('http')) {
    return { category: colonMatch[1].trim(), cleanTitle: colonMatch[2].trim() };
  }
  return { category: defaultCategory, cleanTitle: note.title };
}

interface NotesWorkspaceProps {
  role?: WorkspaceModuleRole;
}

export function NotesWorkspace({ role = 'student' }: NotesWorkspaceProps) {
  const config = MODULE_NOTE_CONFIGS[role] || MODULE_NOTE_CONFIGS.student;
  const { showToast } = useWorkspace();
  const queryClient = useQueryClient();

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'pinned'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Modals
  const [isEditorModalOpen, setIsEditorModalOpen] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isReaderModalOpen, setIsReaderModalOpen] = useState(false);

  // Form State
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [formCategory, setFormCategory] = useState<string>(config.defaultCategories[0]);
  const [formTitle, setFormTitle] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formPinned, setFormPinned] = useState(false);
  const [editorTab, setEditorTab] = useState<'write' | 'preview'>('write');

  // AI Modal State
  const [aiPrompt, setAiPrompt] = useState('');
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [aiGeneratedResult, setAiGeneratedResult] = useState<{
    title: string;
    content: string;
    category: string;
  } | null>(null);

  // Fetch Notes strictly for this workspace role
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ['notes', role],
    queryFn: () => fetchNotes(undefined, role),
  });

  // Collect all unique categories across existing notes and default categories
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    config.defaultCategories.forEach((c) => set.add(c));
    notes.forEach((n) => {
      const { category } = extractNoteMetadata(n, config.defaultCategories[0]);
      if (category && category.trim()) set.add(category.trim());
    });
    return Array.from(set);
  }, [notes, config]);

  // Mutations
  const saveNoteMutation = useMutation({
    mutationFn: async () => {
      const finalTitle = `[${formCategory}] ${formTitle.trim()}`;
      if (editingNoteId) {
        return updateNote(editingNoteId, {
          title: finalTitle,
          content: formContent,
          is_pinned: formPinned,
        });
      }
      return createNote({
        title: finalTitle,
        content: formContent,
        is_pinned: formPinned,
        role: role,
      });
    },
    onSuccess: () => {
      setIsEditorModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['notes', role] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast(
        editingNoteId ? 'Note updated successfully!' : 'Note created successfully!',
        'success'
      );
    },
    onError: () => {
      showToast('Failed to save note. Please try again.', 'error');
    },
  });

  const togglePinMutation = useMutation({
    mutationFn: async (note: Note) => {
      return updateNote(note.id, { is_pinned: !note.is_pinned });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notes', role] });
    },
    onError: () => {
      showToast('Failed to update pinned status', 'error');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id: number) => deleteNote(id),
    onSuccess: () => {
      setIsReaderModalOpen(false);
      setSelectedNote(null);
      queryClient.invalidateQueries({ queryKey: ['notes', role] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      showToast('Note deleted', 'info');
    },
    onError: () => {
      showToast('Failed to delete note', 'error');
    },
  });

  const resetForm = () => {
    setEditingNoteId(null);
    setFormCategory(config.defaultCategories[0]);
    setFormTitle('');
    setFormContent('');
    setFormPinned(false);
    setEditorTab('write');
  };

  const openNewNoteModal = () => {
    resetForm();
    setIsEditorModalOpen(true);
  };

  const openTemplateModal = (template: NoteTemplate) => {
    resetForm();
    setFormCategory(template.category);
    setFormTitle(template.defaultTitle.replace(/^\[.*?\]\s*/, ''));
    setFormContent(template.content);
    setIsEditorModalOpen(true);
  };

  const openEditNoteModal = (note: Note) => {
    const { category, cleanTitle } = extractNoteMetadata(note, config.defaultCategories[0]);
    setEditingNoteId(note.id);
    setFormCategory(category);
    setFormTitle(cleanTitle);
    setFormContent(note.content);
    setFormPinned(note.is_pinned);
    setEditorTab('write');
    setIsReaderModalOpen(false);
    setIsEditorModalOpen(true);
  };

  const openViewNoteModal = (note: Note) => {
    setSelectedNote(note);
    setIsReaderModalOpen(true);
  };

  // AI Generation Handler
  const handleGenerateAiNote = async (promptText?: string) => {
    const text = (promptText || aiPrompt).trim();
    if (!text || isAiGenerating) return;

    setIsAiGenerating(true);
    setAiGeneratedResult(null);

    try {
      const systemInstruction = `You are an expert mentor drafting a structured high-impact note for a ${role} workspace.
Produce clean Markdown note with a descriptive title and structured sections (Definitions, Code/Formulas, Real-world examples, Pitfalls/Summary).
Return valid markdown.`;

      const reply = await askAI(
        `Please create a comprehensive, beautifully structured ${config.title} note on the following topic:\n"${text}"\n\nInclude concrete insights, practical examples, and memorable bullet points.`,
        role,
        undefined
      );

      const generatedContent = reply.reply || reply.text || 'No content generated.';
      const lines = generatedContent.split('\n').filter((l: string) => l.trim().length > 0);
      const firstLine = lines[0]?.replace(/^[#\s*]+/, '').trim() || text;

      setAiGeneratedResult({
        title: firstLine,
        content: generatedContent,
        category: config.defaultCategories[0],
      });
    } catch {
      showToast('AI note draft failed. Please check your network and try again.', 'error');
    } finally {
      setIsAiGenerating(false);
    }
  };

  const handleApplyAiResult = () => {
    if (!aiGeneratedResult) return;
    resetForm();
    setFormCategory(aiGeneratedResult.category);
    setFormTitle(aiGeneratedResult.title);
    setFormContent(aiGeneratedResult.content);
    setIsAiModalOpen(false);
    setIsEditorModalOpen(true);
  };

  // Filter notes
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      const { category, cleanTitle } = extractNoteMetadata(n, config.defaultCategories[0]);
      const matchesSearch =
        cleanTitle.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase()) ||
        category.toLowerCase().includes(search.toLowerCase());

      const matchesPin = filterType === 'all' || (filterType === 'pinned' && n.is_pinned);
      const matchesCategory =
        selectedCategory === 'All' || category.toLowerCase() === selectedCategory.toLowerCase();

      return matchesSearch && matchesPin && matchesCategory;
    });
  }, [notes, search, filterType, selectedCategory, config]);

  const pinnedNotesCount = useMemo(() => notes.filter((n) => n.is_pinned).length, [notes]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-16 px-1 sm:px-4">
      {/* ─── Main White Container Card Matching Screenshot ─── */}
      <div className="bg-white dark:bg-bg-surface rounded-3xl border border-border-base/90 p-5 sm:p-8 space-y-6 shadow-xs">
        {/* 1. Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-text-primary">
              {config.title}
            </h1>
            <p className="text-xs text-text-secondary mt-1 font-medium">
              {notes.length > 0 ? (
                <span>
                  {notes.length} note{notes.length === 1 ? '' : 's'} · {pinnedNotesCount} pinned
                </span>
              ) : (
                <span>{config.subtitle}</span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            {/* "Generate with AI" Button */}
            <button
              type="button"
              onClick={() => {
                setAiPrompt('');
                setAiGeneratedResult(null);
                setIsAiModalOpen(true);
              }}
              className="h-10 px-4 rounded-xl border border-border-base bg-white dark:bg-bg-elevated hover:bg-slate-50 dark:hover:bg-bg-surface text-xs font-semibold text-text-primary flex items-center gap-2 shadow-2xs transition-all hover:border-[#c04b1e]/40 cursor-pointer active:translate-y-[1px]"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#c04b1e]" />
              <span>Generate with AI</span>
            </button>

            {/* "New note" Primary Terracotta Button */}
            <button
              type="button"
              onClick={openNewNoteModal}
              className="h-10 px-4 rounded-xl bg-[#c04b1e] hover:bg-[#a33d16] text-white text-xs font-semibold flex items-center gap-2 shadow-xs transition-all active:translate-y-[1px] cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>New note</span>
            </button>
          </div>
        </div>

        {/* 2. Search & Segmented Filter Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-text-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={config.searchPlaceholder}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-border-base bg-white dark:bg-bg-elevated/40 text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#c04b1e]/20 focus:border-[#c04b1e] transition-all"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-primary text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Segmented Filter Pills: All | Pinned */}
          <div className="bg-slate-100/80 dark:bg-bg-elevated p-1 rounded-xl flex items-center gap-1 border border-border-base/50 shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white dark:bg-bg-surface text-text-primary shadow-2xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilterType('pinned')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                filterType === 'pinned'
                  ? 'bg-white dark:bg-bg-surface text-text-primary shadow-2xs'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Pin className="w-3 h-3 text-amber-500 fill-amber-500/20" />
              <span>Pinned</span>
            </button>
          </div>
        </div>

        {/* 3. Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            type="button"
            onClick={() => setSelectedCategory('All')}
            className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              selectedCategory === 'All'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                : 'bg-white dark:bg-bg-surface border border-border-base text-text-secondary hover:text-text-primary hover:border-text-muted'
            }`}
          >
            All
          </button>
          {allCategories.map((category) => {
            const isSelected = selectedCategory.toLowerCase() === category.toLowerCase();
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-2xs'
                    : 'bg-white dark:bg-bg-surface border border-border-base text-text-secondary hover:text-text-primary hover:border-text-muted'
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>

        {/* 4. Notes Grid or Empty State */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <LoadingSkeleton className="h-40 rounded-2xl" />
            <LoadingSkeleton className="h-40 rounded-2xl" />
            <LoadingSkeleton className="h-40 rounded-2xl" />
            <LoadingSkeleton className="h-40 rounded-2xl" />
          </div>
        ) : filteredNotes.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {filteredNotes.map((note) => {
              const { category, cleanTitle } = extractNoteMetadata(
                note,
                config.defaultCategories[0]
              );
              const snippet = note.content.replace(/^[#\s*->]+|\n+/g, ' ').slice(0, 140);

              return (
                <div
                  key={note.id}
                  onClick={() => openViewNoteModal(note)}
                  className="p-5 rounded-2xl border border-border-base/90 bg-white dark:bg-bg-surface hover:border-[#c04b1e]/40 hover:shadow-xs transition-all flex flex-col justify-between min-h-[160px] group cursor-pointer relative"
                >
                  <div>
                    {/* Top Row: Category Badge & Pin Action */}
                    <div className="flex items-center justify-between gap-2">
                      <span className="bg-[#fef3c7] text-[#92400e] dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 text-[11px] font-semibold px-2.5 py-0.5 rounded-full inline-block">
                        {category}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePinMutation.mutate(note);
                        }}
                        title={note.is_pinned ? 'Unpin note' : 'Pin note'}
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-colors cursor-pointer ${
                          note.is_pinned
                            ? 'text-amber-600 dark:text-amber-400 fill-amber-500/20'
                            : 'text-slate-300 hover:text-amber-500 opacity-60 group-hover:opacity-100'
                        }`}
                      >
                        <Pin className={`w-3.5 h-3.5 ${note.is_pinned ? 'fill-current' : ''}`} />
                      </button>
                    </div>

                    {/* Note Title */}
                    <h3 className="text-sm sm:text-base font-bold text-text-primary group-hover:text-[#c04b1e] transition-colors mt-2.5 tracking-tight line-clamp-1">
                      {cleanTitle}
                    </h3>

                    {/* Note Snippet */}
                    <p className="text-xs text-text-secondary line-clamp-2 mt-1 leading-relaxed">
                      {snippet}
                    </p>
                  </div>

                  {/* Footer Row: Date & Actions */}
                  <div className="flex items-center justify-between mt-4 pt-2 border-t border-border-base/40">
                    <span className="text-[11px] text-text-muted font-normal">
                      {formatDate(note.created_at)}
                    </span>

                    <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditNoteModal(note);
                        }}
                        className="p-1 rounded-md text-text-muted hover:text-[#c04b1e] hover:bg-slate-100 dark:hover:bg-bg-elevated transition-colors"
                        title="Edit note"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (window.confirm('Are you sure you want to delete this note?')) {
                            deleteNoteMutation.mutate(note.id);
                          }
                        }}
                        className="p-1 rounded-md text-text-muted hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-bg-elevated transition-colors"
                        title="Delete note"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* ─── Empty State Matching Screenshot Bottom Card ─── */
          <div className="rounded-2xl border-2 border-dashed border-border-base/90 bg-white/40 dark:bg-bg-elevated/10 p-8 sm:p-14 text-center space-y-6 mt-2">
            {/* Center Graphic Container */}
            <div className="w-14 h-14 rounded-2xl bg-amber-100/90 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200/50 flex items-center justify-center mx-auto shadow-2xs">
              <FileText className="w-6 h-6 stroke-[1.8]" />
            </div>

            {/* Empty State Titles */}
            <div className="space-y-1">
              <h2 className="text-base sm:text-lg font-bold text-text-primary">
                Start your first note
              </h2>
              <p className="text-xs text-text-secondary max-w-sm mx-auto leading-relaxed">
                Pick a template, or let AI draft one from a topic.
              </p>
            </div>

            {/* 3 Quick-Start Template Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto text-left pt-2">
              {config.templates.map((tpl) => {
                const IconComp = tpl.icon;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => openTemplateModal(tpl)}
                    className="p-4 rounded-xl border border-border-base bg-white dark:bg-bg-surface hover:border-[#c04b1e] hover:shadow-xs transition-all cursor-pointer group"
                  >
                    <IconComp className="w-4 h-4 text-text-muted group-hover:text-[#c04b1e] mb-3 transition-colors stroke-[2]" />
                    <h3 className="text-xs font-bold text-text-primary group-hover:text-[#c04b1e] transition-colors">
                      {tpl.title}
                    </h3>
                    <p className="text-[11px] text-text-secondary mt-0.5 leading-snug">
                      {tpl.subtitle}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ─── Create / Edit Note Modal ─── */}
      <Modal
        isOpen={isEditorModalOpen}
        onClose={() => setIsEditorModalOpen(false)}
        title={editingNoteId ? 'Edit Note' : 'Create New Note'}
        size="lg"
      >
        <div className="space-y-4 pt-2">
          {/* Category & Pinned Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-text-secondary shrink-0">Category:</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {allCategories.slice(0, 5).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setFormCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                      formCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-[#c04b1e] text-white shadow-2xs'
                        : 'bg-slate-100 dark:bg-bg-elevated text-text-secondary hover:text-text-primary'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            <label className="flex items-center gap-2 text-xs font-medium text-text-secondary cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formPinned}
                onChange={(e) => setFormPinned(e.target.checked)}
                className="w-4 h-4 rounded text-[#c04b1e] focus:ring-[#c04b1e]"
              />
              <span>Pin to top</span>
            </label>
          </div>

          {/* Title Input */}
          <div>
            <label className="text-xs font-bold text-text-secondary block mb-1">Title</label>
            <input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="e.g. Normalization forms or CPU scheduling..."
              className="w-full h-10 px-3 rounded-xl border border-border-base bg-white dark:bg-bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-[#c04b1e]/20 focus:border-[#c04b1e]"
            />
          </div>

          {/* Content Area with Write / Preview Tabs */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-text-secondary">
                Note Content (Markdown supported)
              </label>
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-bg-elevated p-0.5 rounded-lg border border-border-base/50">
                <button
                  type="button"
                  onClick={() => setEditorTab('write')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    editorTab === 'write'
                      ? 'bg-white dark:bg-bg-surface text-text-primary shadow-2xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setEditorTab('preview')}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition-colors ${
                    editorTab === 'preview'
                      ? 'bg-white dark:bg-bg-surface text-text-primary shadow-2xs'
                      : 'text-text-muted hover:text-text-primary'
                  }`}
                >
                  Preview
                </button>
              </div>
            </div>

            {editorTab === 'write' ? (
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                rows={10}
                placeholder="Write your note in Markdown. Use # for headers, - for bullets, and $ for math formulas..."
                className="w-full p-3 rounded-xl border border-border-base bg-white dark:bg-bg-surface text-xs font-mono text-text-primary focus:outline-none focus:ring-2 focus:ring-[#c04b1e]/20 focus:border-[#c04b1e] leading-relaxed resize-y"
              />
            ) : (
              <div className="min-h-[200px] max-h-[350px] overflow-y-auto p-4 rounded-xl border border-border-base bg-slate-50/50 dark:bg-bg-elevated/20 text-xs">
                {formContent ? (
                  <MarkdownRenderer content={formContent} />
                ) : (
                  <span className="text-text-muted italic">Nothing to preview</span>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-base/70">
            <button
              type="button"
              onClick={() => setIsEditorModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-border-base text-xs font-semibold text-text-secondary hover:text-text-primary hover:bg-slate-50 dark:hover:bg-bg-elevated transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => saveNoteMutation.mutate()}
              disabled={!formTitle.trim() || !formContent.trim() || saveNoteMutation.isPending}
              className="px-5 py-2 rounded-xl bg-[#c04b1e] hover:bg-[#a33d16] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              {saveNoteMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{editingNoteId ? 'Save Changes' : 'Create Note'}</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* ─── Note Reader Modal ─── */}
      {selectedNote && (
        <Modal
          isOpen={isReaderModalOpen}
          onClose={() => setIsReaderModalOpen(false)}
          title={
            <div className="flex items-center gap-2">
              <span className="bg-[#fef3c7] text-[#92400e] dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/40 text-[10px] font-semibold px-2.5 py-0.5 rounded-full">
                {extractNoteMetadata(selectedNote, config.defaultCategories[0]).category}
              </span>
              <span className="truncate">
                {extractNoteMetadata(selectedNote, config.defaultCategories[0]).cleanTitle}
              </span>
            </div>
          }
          size="lg"
        >
          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between text-xs text-text-muted pb-3 border-b border-border-base/70">
              <span>Created: {formatDate(selectedNote.created_at)}</span>
              {selectedNote.is_pinned && (
                <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-semibold">
                  <Pin className="w-3 h-3 fill-current" /> Pinned
                </span>
              )}
            </div>

            <div className="max-h-[55vh] overflow-y-auto pr-1 text-xs leading-relaxed text-text-primary">
              <MarkdownRenderer content={selectedNote.content} />
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-border-base/70">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(selectedNote.content);
                  showToast('Note content copied to clipboard!', 'info');
                }}
                className="px-3 py-1.5 rounded-xl border border-border-base text-xs font-semibold text-text-secondary hover:text-text-primary flex items-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => openEditNoteModal(selectedNote)}
                  className="px-4 py-1.5 rounded-xl border border-border-base hover:border-[#c04b1e] text-xs font-semibold text-text-primary flex items-center gap-1.5 transition-colors"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit Note</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm('Delete this note permanently?')) {
                      deleteNoteMutation.mutate(selectedNote.id);
                    }
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* ─── AI Note Generator Modal ─── */}
      <Modal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        title="Generate Note with AI"
        size="md"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-text-secondary leading-relaxed">
            Enter a topic, exam concept, or technical subject. MentorOS AI will draft a complete,
            structured note ready to save into your workspace.
          </p>

          <div>
            <label className="text-xs font-bold text-text-secondary block mb-1">
              Topic or Prompt
            </label>
            <div className="relative">
              <input
                type="text"
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleGenerateAiNote();
                }}
                placeholder={config.aiPromptPlaceholder}
                className="w-full h-10 px-3 rounded-xl border border-border-base bg-white dark:bg-bg-surface text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-[#c04b1e]/20 focus:border-[#c04b1e]"
              />
            </div>
          </div>

          {/* Suggested Topic Chips */}
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-text-muted block mb-1.5">
              Suggested Topics
            </span>
            <div className="space-y-1.5">
              {config.aiSuggestedTopics.map((topic) => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => {
                    setAiPrompt(topic);
                    handleGenerateAiNote(topic);
                  }}
                  className="w-full text-left p-2 rounded-lg bg-slate-50 dark:bg-bg-elevated/40 hover:bg-amber-50 dark:hover:bg-amber-950/20 text-xs text-text-secondary hover:text-[#c04b1e] border border-border-base/50 transition-colors flex items-center justify-between group"
                >
                  <span className="truncate">{topic}</span>
                  <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2 text-[#c04b1e]" />
                </button>
              ))}
            </div>
          </div>

          {/* AI Result Preview */}
          {isAiGenerating ? (
            <div className="p-6 rounded-xl border border-dashed border-border-base text-center space-y-2 bg-slate-50/50">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-[#c04b1e]" />
              <p className="text-xs font-semibold text-text-primary">
                Generating structured note...
              </p>
              <p className="text-[11px] text-text-muted">
                Drafting formulas, explanations and key points
              </p>
            </div>
          ) : aiGeneratedResult ? (
            <div className="p-4 rounded-xl border border-border-base bg-emerald-500/[0.04] space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-text-primary flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Draft Ready: {aiGeneratedResult.title}</span>
                </span>
              </div>
              <p className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                {aiGeneratedResult.content}
              </p>
            </div>
          ) : null}

          {/* Action Row */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border-base/70">
            <button
              type="button"
              onClick={() => setIsAiModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-border-base text-xs font-semibold text-text-secondary hover:text-text-primary"
            >
              Close
            </button>
            {aiGeneratedResult ? (
              <button
                type="button"
                onClick={handleApplyAiResult}
                className="px-5 py-2 rounded-xl bg-[#c04b1e] hover:bg-[#a33d16] text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>Edit &amp; Save Note</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleGenerateAiNote()}
                disabled={!aiPrompt.trim() || isAiGenerating}
                className="px-5 py-2 rounded-xl bg-[#c04b1e] hover:bg-[#a33d16] disabled:opacity-50 text-white text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isAiGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                <span>Generate Note</span>
              </button>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
