import type {
  InterviewQuestion,
  PracticeAnswer,
  SalaryResearchEntry,
  InterviewFilterOptions,
} from '../types/interview';

const PRACTICE_STORAGE_KEY = 'mentoros_interview_practice';
const SALARY_STORAGE_KEY = 'mentoros_salary_research_entries';

/**
 * Curated Question Bank across top tech companies & roles
 */
export const CURATED_QUESTIONS: InterviewQuestion[] = [
  {
    id: 'goog-sys-1',
    company: 'Google',
    role: 'Full-Stack Engineer',
    category: 'system_design',
    difficulty: 'hard',
    question:
      'Design a real-time collaborative document editing engine (Google Docs) with operational transformation or CRDTs and offline conflict resolution.',
    keyPointsToCover: [
      'Client-side state replication & optimistic UI updates',
      'Operational Transformation (OT) vs CRDT trade-offs',
      'WebSocket connection pooling & session keep-alive',
      'Snapshot storage and delta changelog compaction',
    ],
    sampleAnswer:
      'Architecture begins with a central coordination server managing a document changelog. Clients apply local mutations optimistically, broadcast delta operations via WebSockets, and use state-based CRDTs (like Yjs or Automerge) to guarantee convergence without central locks. Periodic document snapshots are persisted to distributed object storage while delta logs handle active replay.',
    tags: ['CRDT', 'WebSockets', 'Concurrency', 'System Design'],
  },
  {
    id: 'goog-beh-1',
    company: 'Google',
    role: 'Frontend Engineer',
    category: 'behavioral',
    difficulty: 'medium',
    question:
      'Tell me about a complex project where technical requirements were ambiguous and stakeholder expectations were conflicting.',
    keyPointsToCover: [
      'Proactive alignment and requirement discovery',
      'Creating technical design documents (PRDs / RFCs) to force clarity',
      'Iterative milestones and progressive risk de-risking',
      'Measurable impact and team retrospectives',
    ],
    starFramework: {
      situation:
        'At my previous company, our team was tasked with building an internal analytics hub with zero clear product specs and three separate teams requesting contradictory metrics.',
      task: 'I volunteered to spearhead the technical discovery phase to unify requirements and establish a shared roadmap.',
      action:
        'I drafted an RFC blueprint proposing modular plugin metrics, scheduled 30-minute interviews with each team lead to identify core must-haves, and built a rapid wireframe prototype demonstrating the unified pipeline.',
      result:
        'All three teams signed off on the architecture within 2 weeks. We delivered the project 10 days ahead of schedule with 98% positive adoption sentiment.',
    },
    tags: ['Googleyness', 'Leadership', 'Ambiguity', 'STAR'],
  },
  {
    id: 'meta-tech-1',
    company: 'Meta',
    role: 'Frontend Engineer',
    category: 'technical',
    difficulty: 'hard',
    question:
      'How would you architect a virtualized infinite scroll feed (like Meta News Feed) supporting dynamic height posts, media prefetching, and zero frame drops?',
    keyPointsToCover: [
      'Windowing algorithm calculating viewport visible indices',
      'Estimating and caching dynamic node heights via ResizeObserver',
      'Offscreen node cleanup to prevent DOM bloat and memory leaks',
      'IntersectionObserver for lazy image/video prefetching',
    ],
    sampleAnswer:
      'A virtualized list calculates total scroll height using cumulative offset sums. We track the scroll position using requestAnimationFrame and render only the items within [startIndex - buffer, endIndex + buffer]. As dynamic elements mount, a ResizeObserver measures actual heights, updating the position index cache and adjusting scroll offset to eliminate layout jumps.',
    tags: ['React', 'Performance', 'DOM Virtualization', '60fps'],
  },
  {
    id: 'meta-beh-1',
    company: 'Meta',
    role: 'Full-Stack Engineer',
    category: 'behavioral',
    difficulty: 'medium',
    question:
      'Give an example of when you had a strong disagreement with a Tech Lead or Product Manager over an architectural decision. How did you resolve it?',
    keyPointsToCover: [
      'Focusing on objective data and benchmarks rather than subjective opinions',
      'Disagree and commit principle',
      'Building small proofs of concept to empirically evaluate trade-offs',
    ],
    starFramework: {
      situation:
        'Our Tech Lead wanted to adopt a complex distributed event queue for an internal microservice, while I believed it introduced excessive operational overhead compared to a simpler transactional outbox pattern.',
      task: 'I needed to present my technical concerns objectively without stalling our sprint deadline.',
      action:
        'I built a quick load benchmark comparing latency, error recovery complexity, and infrastructure cost for both approaches. I presented the metrics in our architecture review, showing the outbox pattern satisfied our throughput requirements at 40% less cloud cost.',
      result:
        'The team collectively agreed on the simpler outbox solution for Phase 1 with clear trigger metrics for when to migrate to Kafka. We saved 3 weeks of infrastructure maintenance.',
    },
    tags: ['Conflict Resolution', 'Data-Driven', 'STAR'],
  },
  {
    id: 'stripe-sys-1',
    company: 'Stripe',
    role: 'Backend Engineer',
    category: 'system_design',
    difficulty: 'hard',
    question:
      'Design an idempotent payment processing and webhook delivery system that guarantees at-least-once delivery with exponential backoff retry semantics.',
    keyPointsToCover: [
      'Idempotency keys and atomic database transactions',
      'Dead-letter queues (DLQ) and exponential jitter backoff',
      'HMAC signature verification for webhook payloads',
      'Handling race conditions and network timeouts during payment authorization',
    ],
    sampleAnswer:
      'Every payment request requires a client-generated Idempotency-Key. The API server acquires a distributed redis lock on the key. If the key exists, it returns the cached result. For webhooks, events are written to an append-only transactional event log. Worker consumers poll the queue, sign the payload using HMAC-SHA256, and deliver with exponential backoff (1s, 5s, 30s, 5m). Failed deliveries land in a DLQ for operational alerts.',
    tags: ['Idempotency', 'Distributed Systems', 'Webhooks', 'Security'],
  },
  {
    id: 'stripe-tech-1',
    company: 'Stripe',
    role: 'Frontend Engineer',
    category: 'technical',
    difficulty: 'medium',
    question:
      'How do you design a secure, PCI-compliant iframe/SDK component for credit card inputs that embeds seamlessly in third-party merchant checkouts?',
    keyPointsToCover: [
      'Isolated sandbox iframes preventing host script inspection',
      'Cross-origin messaging via postMessage with strict origin whitelisting',
      'Tokenization endpoint exchanging PAN for ephemeral client tokens',
      'Form accessibility and keyboard navigation within iframes',
    ],
    sampleAnswer:
      'To prevent XSS from leaking sensitive cardholder data, card input fields are rendered inside sandboxed iframes hosted on a dedicated PCI-compliant domain. The parent merchant checkout interacts with our SDK via window.postMessage with explicit targetOrigin checks. Once validated, the card numbers are exchanged directly with our tokenization server for an ephemeral token (tok_123), ensuring raw card details never touch merchant storage.',
    tags: ['Security', 'iFrame', 'postMessage', 'PCI DSS'],
  },
  {
    id: 'amzn-beh-1',
    company: 'Amazon',
    role: 'Full-Stack Engineer',
    category: 'culture',
    difficulty: 'medium',
    question:
      'Amazon LP (Customer Obsession): Tell me about a time when you had to make a trade-off between speed of delivery and long-term customer experience.',
    keyPointsToCover: [
      'Customer-centric prioritization over arbitrary sprint deadlines',
      'Measuring customer pain points with telemetry',
      'Communicating risks transparently to executive stakeholders',
    ],
    starFramework: {
      situation:
        'During a major holiday sale release, management urged us to bypass a complex accessibility and cross-browser regression test suite to launch 3 days earlier.',
      task: 'As the frontend owner, I had to advocate for customer experience and prevent launching a broken mobile checkout.',
      action:
        'I demonstrated that 18% of our customer traffic originated from mobile web browsers where the expedited checkout had unclickable CTA elements. I proposed a phased compromise: deploying the backend optimizations immediately while mobilizing two engineers to complete the mobile layout fixes within 24 hours.',
      result:
        'We launched 24 hours later with zero checkout drop-offs and a 12% boost in completed orders over the previous holiday benchmark.',
    },
    tags: ['Customer Obsession', 'Leadership Principles', 'STAR'],
  },
  {
    id: 'amzn-sys-1',
    company: 'Amazon',
    role: 'Backend Engineer',
    category: 'system_design',
    difficulty: 'hard',
    question:
      'Design a multi-tier distributed rate limiter supporting tier-based quotas, token bucket algorithms, and sub-5ms latency across global availability zones.',
    keyPointsToCover: [
      'Token bucket vs Leaky bucket vs Sliding window counters',
      'Distributed caching with Redis clusters and Lua scripts',
      'Local in-memory proxy caching to handle Redis failover',
      'Graceful degradation (fail-open vs fail-closed strategies)',
    ],
    sampleAnswer:
      'We deploy an API gateway filter utilizing a Token Bucket algorithm. Redis clusters execute atomic Lua scripts to evaluate token counts for each user/tenant key without race conditions. To achieve sub-5ms latency, local gateway nodes maintain a local micro-cache of active quotas and sync in batches. If the Redis cluster suffers degradation, non-financial routes fail open while sensitive billing routes fail closed.',
    tags: ['Rate Limiting', 'Redis', 'Lua', 'Availability'],
  },
  {
    id: 'nflx-beh-1',
    company: 'Netflix',
    role: 'Full-Stack Engineer',
    category: 'behavioral',
    difficulty: 'hard',
    question:
      'Netflix Culture (Freedom & Responsibility): Describe a critical production incident that occurred under your watch. What was the post-mortem outcome?',
    keyPointsToCover: [
      'Taking extreme ownership without finger-pointing',
      'Blameless root cause analysis (5 Whys)',
      'Implementing automated circuit breakers and regression tests',
    ],
    starFramework: {
      situation:
        'A rogue cache invalidation loop caused our customer dashboard to overwhelm the primary database, causing 504 gateway timeouts for 25 minutes.',
      task: 'I stepped up as the incident lead to coordinate mitigation and restore production availability.',
      action:
        'I ordered an immediate rollout of read-replica fallback traffic and throttled automated refresh intervals at the edge CDN. Once traffic stabilized, I authored a blameless post-mortem identifying a race condition in our WebSocket reconnections.',
      result:
        'We introduced jittered exponential backoffs and circuit breakers across all frontend clients. We experienced zero duplicate cache avalanches over the subsequent 18 months.',
    },
    tags: ['Culture', 'Incident Management', 'Ownership', 'STAR'],
  },
  {
    id: 'gen-tech-1',
    company: 'General / Tech Startups',
    role: 'Frontend Engineer',
    category: 'technical',
    difficulty: 'medium',
    question:
      'Explain how React 19 / Modern React handles concurrent rendering, automatic batching, and server components (RSC). How do they impact perceived performance?',
    keyPointsToCover: [
      'Concurrent Mode and non-blocking state transitions (useTransition)',
      'Server Components streaming HTML with zero client bundle overhead',
      'Automatic batching of state updates across async boundaries',
      'Optimistic updates with useOptimistic hook',
    ],
    sampleAnswer:
      'React Server Components run exclusively on the server, serializing UI elements into a lightweight streaming JSON stream that merges directly with the client DOM without shipping their npm dependencies to the client bundle. Concurrent rendering allows React to interrupt non-urgent renders (wrapped in useTransition) so user input remains responsive at 60fps even during heavy CPU computation.',
    tags: ['React 19', 'RSC', 'Concurrency', 'Modern Frontend'],
  },
];

/**
 * Curated initial salary benchmarks with direct Levels.fyi links
 */
export const DEFAULT_SALARY_ENTRIES: SalaryResearchEntry[] = [
  {
    id: 'sal-1',
    company: 'Stripe',
    role: 'Software Engineer',
    level: 'L3 / L4 (Full-Stack)',
    location: 'San Francisco, CA / Remote',
    baseSalary: 180000,
    stockGrantPerYear: 75000,
    bonus: 25000,
    totalComp: 280000,
    currency: 'USD',
    levelsFyiUrl: 'https://www.levels.fyi/companies/stripe/salaries/software-engineer',
    notes:
      'Stripe offers competitive equity with quarterly liquidity windows. High base salary benchmark.',
    negotiationStrategy: 'Leverage competing offers to negotiate sign-on bonuses up to $40k-$60k.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sal-2',
    company: 'Google',
    role: 'Software Engineer',
    level: 'L5 (Senior SWE)',
    location: 'Mountain View, CA / Remote US',
    baseSalary: 215000,
    stockGrantPerYear: 120000,
    bonus: 38000,
    totalComp: 373000,
    currency: 'USD',
    levelsFyiUrl: 'https://www.levels.fyi/companies/google/salaries/software-engineer',
    notes: 'Google equity vests 33/33/22/12 frontloaded. Annual target bonus is ~15-20%.',
    negotiationStrategy: 'Request higher stock grants (GSUs) as base salary has rigid band bands.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'sal-3',
    company: 'Meta',
    role: 'Software Engineer',
    level: 'E4 / E5 (Mid-Senior)',
    location: 'New York, NY',
    baseSalary: 195000,
    stockGrantPerYear: 95000,
    bonus: 30000,
    totalComp: 320000,
    currency: 'USD',
    levelsFyiUrl: 'https://www.levels.fyi/companies/facebook/salaries/software-engineer',
    notes: 'Equity refreshers given annually based on performance rating (Meets All / Exceeds).',
    negotiationStrategy:
      'Counter with Levels.fyi 75th percentile benchmark during final recruiter call.',
    createdAt: new Date().toISOString(),
  },
];

/**
 * Generates direct Levels.fyi URL for quick compensation reference
 */
export function generateLevelsFyiLink(company: string, role = 'software-engineer'): string {
  const cleanCompany = company
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  const cleanRole = role
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');

  return `https://www.levels.fyi/companies/${cleanCompany || 'google'}/salaries/${cleanRole || 'software-engineer'}`;
}

/**
 * Filters the curated questions
 */
export function getFilteredQuestions(filters: InterviewFilterOptions): InterviewQuestion[] {
  return CURATED_QUESTIONS.filter((q) => {
    // Company match
    if (filters.company && filters.company !== 'All Companies') {
      if (q.company.toLowerCase() !== filters.company.toLowerCase()) return false;
    }

    // Role match
    if (filters.role && filters.role !== 'All Roles') {
      if (!q.role.toLowerCase().includes(filters.role.toLowerCase())) return false;
    }

    // Category match
    if (filters.category && filters.category !== 'all') {
      if (q.category !== filters.category) return false;
    }

    // Difficulty match
    if (filters.difficulty && filters.difficulty !== 'all') {
      if (q.difficulty !== filters.difficulty) return false;
    }

    // Text search query
    if (filters.searchQuery && filters.searchQuery.trim()) {
      const query = filters.searchQuery.toLowerCase();
      const match =
        q.question.toLowerCase().includes(query) ||
        q.tags.some((t) => t.toLowerCase().includes(query)) ||
        q.keyPointsToCover.some((kp) => kp.toLowerCase().includes(query));
      if (!match) return false;
    }

    return true;
  });
}

/**
 * User practice progress persistence
 */
export function getPracticeAnswers(): Record<string, PracticeAnswer> {
  try {
    const raw = localStorage.getItem(PRACTICE_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePracticeAnswer(answer: PracticeAnswer): void {
  try {
    const all = getPracticeAnswers();
    all[answer.questionId] = answer;
    localStorage.setItem(PRACTICE_STORAGE_KEY, JSON.stringify(all));
  } catch {
    // Non-fatal
  }
}

/**
 * Salary research entries persistence
 */
export function getSalaryEntries(): SalaryResearchEntry[] {
  try {
    const raw = localStorage.getItem(SALARY_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // Non-fatal fallback
  }
  return DEFAULT_SALARY_ENTRIES;
}

export function saveSalaryEntry(
  entry: Omit<SalaryResearchEntry, 'id' | 'createdAt'>
): SalaryResearchEntry {
  const existing = getSalaryEntries();
  const newEntry: SalaryResearchEntry = {
    ...entry,
    id: `sal-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newEntry, ...existing];
  try {
    localStorage.setItem(SALARY_STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // Non-fatal
  }
  return newEntry;
}

export function deleteSalaryEntry(id: string): boolean {
  const existing = getSalaryEntries();
  const filtered = existing.filter((s) => s.id !== id);
  try {
    localStorage.setItem(SALARY_STORAGE_KEY, JSON.stringify(filtered));
  } catch {
    // Non-fatal
  }
  return true;
}
