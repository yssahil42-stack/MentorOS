import type {
  ResumeTailorInput,
  TailoredResumeResult,
  ResumeKeywordReport,
  ResumeCandidateProfile,
} from '../types/resume';
import { api } from './api';

// Common industry tech & methodology keywords for ATS matching
const COMMON_ROLE_KEYWORDS: Record<string, string[]> = {
  frontend: [
    'React',
    'TypeScript',
    'JavaScript',
    'Next.js',
    'TailwindCSS',
    'HTML5',
    'CSS3',
    'State Management',
    'TanStack Query',
    'Redux',
    'Zustand',
    'Vite',
    'Webpack',
    'REST APIs',
    'GraphQL',
    'Performance Optimization',
    'Accessibility (a11y)',
    'Responsive Design',
    'Vitest',
    'Jest',
    'Playwright',
    'CI/CD',
    'Git',
    'Cross-Browser Compatibility',
  ],
  backend: [
    'Node.js',
    'TypeScript',
    'Python',
    'FastAPI',
    'Go',
    'PostgreSQL',
    'Redis',
    'Docker',
    'Kubernetes',
    'AWS',
    'Microservices',
    'REST APIs',
    'GraphQL',
    'gRPC',
    'Message Queues',
    'Kafka',
    'RabbitMQ',
    'CI/CD',
    'System Design',
    'Distributed Systems',
    'Database Optimization',
    'Security',
    'Unit Testing',
  ],
  fullstack: [
    'React',
    'TypeScript',
    'Node.js',
    'Next.js',
    'TailwindCSS',
    'PostgreSQL',
    'Redis',
    'REST APIs',
    'GraphQL',
    'Docker',
    'AWS',
    'CI/CD',
    'Microservices',
    'System Design',
    'TanStack Query',
    'Performance Optimization',
    'Automated Testing',
    'Git',
    'Agile',
  ],
  devops: [
    'Docker',
    'Kubernetes',
    'Terraform',
    'AWS',
    'GCP',
    'CI/CD',
    'GitHub Actions',
    'Prometheus',
    'Grafana',
    'Linux',
    'Bash',
    'Python',
    'Ansible',
    'Helm',
    'Security',
    'Infrastructure as Code',
    'Site Reliability',
    'Observability',
  ],
};

const ACTION_VERBS = [
  'Architected',
  'Spearheaded',
  'Engineered',
  'Designed',
  'Optimized',
  'Developed',
  'Implemented',
  'Accelerated',
  'Reduced',
  'Delivered',
  'Deployed',
  'Streamlined',
  'Automated',
  'Orchestrated',
  'Scale',
  'Refactored',
];

export const SAMPLE_RESUME_INPUTS: Record<string, ResumeTailorInput> = {
  fullstack: {
    profile: {
      name: 'Alex Morgan',
      email: 'alex.morgan@example.com',
      phone: '+1 (555) 234-5678',
      location: 'San Francisco, CA (Open to Remote)',
      linkedin: 'linkedin.com/in/alexmorgan-dev',
      github: 'github.com/alexmorgan',
      website: 'alexmorgan.dev',
    },
    targetRole: 'Senior Full-Stack Engineer',
    seniority: 'senior',
    targetIndustry: 'B2B SaaS / FinTech',
    jobDescription:
      'Looking for a Senior Full-Stack Engineer proficient in React, TypeScript, Node.js, and distributed microservices. Experience with PostgreSQL, Redis, Docker, and CI/CD pipelines. Must be adept at high-concurrency systems, REST APIs, and automated testing.',
    skills: {
      languages: ['TypeScript', 'JavaScript', 'Python', 'SQL', 'HTML/CSS'],
      frameworks: ['React', 'Next.js', 'Node.js', 'Express', 'TailwindCSS', 'TanStack Query'],
      tools: ['Docker', 'Git', 'Vite', 'Vitest', 'Jest', 'Postman'],
      cloud: ['AWS (ECS, S3, RDS)', 'PostgreSQL', 'Redis', 'GitHub Actions'],
    },
    experiences: [
      {
        id: 'exp-1',
        role: 'Senior Software Engineer',
        company: 'CloudPulse Technologies',
        location: 'San Francisco, CA',
        startDate: 'Jan 2023',
        endDate: 'Present',
        current: true,
        bullets: [
          'Architected and delivered multi-tenant workspace platform serving 120k+ daily active users, maintaining 99.98% service uptime.',
          'Spearheaded front-end migration to React 19 and TanStack Query, cutting client bundle overhead by 42% and accelerating page loads.',
          'Engineered resilient background task processing pipeline with Redis queues, processing over 1.5M transactions daily with zero dropped events.',
        ],
      },
      {
        id: 'exp-2',
        role: 'Full-Stack Developer',
        company: 'Vanguard Systems',
        location: 'Austin, TX',
        startDate: 'Jun 2021',
        endDate: 'Dec 2022',
        current: false,
        bullets: [
          'Engineered scalable REST APIs with Node.js and TypeScript, handling 4,000 requests/sec with average p99 latency under 45ms.',
          'Refactored legacy database queries and implemented caching layers, reducing database CPU load by 35%.',
          'Automated CI/CD test and deployment matrix with GitHub Actions, reducing release cycle time from 3 hours to 14 minutes.',
        ],
      },
    ],
    projects: [
      {
        id: 'proj-1',
        title: 'MentorOS Productivity Engine',
        role: 'Lead Architect & Creator',
        techStack: ['React', 'TypeScript', 'TailwindCSS', 'TanStack Query', 'FastAPI'],
        githubUrl: 'https://github.com/developer/mentoros',
        liveUrl: 'https://mentoros.app',
        selected: true,
        bullets: [
          'Engineered multi-role productivity operating system with local-first AI capabilities and sub-100ms dashboard responsiveness.',
          'Implemented end-to-end type safety across 4 distinct role workflows, achieving 95% test coverage across 80+ unit and integration test suites.',
          'Streamlined proposal streaming drawers and automated batch review approvals with zero UI blocking.',
        ],
      },
      {
        id: 'proj-2',
        title: 'Distributed Event Bus & Analytics Pipeline',
        role: 'Core Contributor',
        techStack: ['Node.js', 'TypeScript', 'Redis', 'Docker', 'AWS'],
        githubUrl: 'https://github.com/developer/event-stream-engine',
        liveUrl: 'https://stream.demo.dev',
        selected: true,
        bullets: [
          'Designed high-throughput message streaming broker handling 50k events/sec with guaranteed at-least-once delivery semantics.',
          'Packaged containerized deployments with Docker Compose and AWS ECS tasks, saving 30% on compute overhead.',
        ],
      },
      {
        id: 'proj-3',
        title: 'Real-Time Collaborative Code Editor',
        role: 'Sole Developer',
        techStack: ['React', 'WebSockets', 'TailwindCSS', 'WebRTC'],
        githubUrl: 'https://github.com/developer/pair-code',
        selected: false,
        bullets: [
          'Built collaborative code canvas utilizing Operational Transformation algorithms with under 15ms broadcast latency.',
        ],
      },
    ],
    education: [
      {
        id: 'edu-1',
        degree: 'B.S. in Computer Science',
        institution: 'University of California, Berkeley',
        location: 'Berkeley, CA',
        graduationYear: '2021',
        details: 'Honors in Computer Engineering, Coursework in Distributed Systems & Compilers',
      },
    ],
  },
  frontend: {
    profile: {
      name: 'Jordan Lee',
      email: 'jordan.lee@example.com',
      phone: '+1 (555) 876-5432',
      location: 'New York, NY (Remote)',
      linkedin: 'linkedin.com/in/jordanlee-frontend',
      github: 'github.com/jordanlee',
      website: 'jordanlee.design',
    },
    targetRole: 'Senior Frontend Engineer (UI/UX & Design Systems)',
    seniority: 'senior',
    targetIndustry: 'E-Commerce / Creator Economy',
    jobDescription:
      'Seeking a Senior Frontend Specialist with deep mastery in React, TypeScript, Next.js, and CSS/Tailwind. Candidate should excel at building accessible, performant Design Systems, component libraries, animations, and microfrontends with high test coverage.',
    skills: {
      languages: ['TypeScript', 'JavaScript', 'HTML5', 'CSS3/SCSS'],
      frameworks: ['React', 'Next.js', 'TailwindCSS', 'Radix UI', 'Framer Motion'],
      tools: ['Storybook', 'Vite', 'Figma', 'Vitest', 'Testing Library', 'Playwright'],
      cloud: ['Vercel', 'AWS CloudFront', 'GitHub Actions', 'Node.js'],
    },
    experiences: [
      {
        id: 'fe-exp-1',
        role: 'Lead UI/UX Engineer',
        company: 'Aurora Retail Labs',
        location: 'New York, NY',
        startDate: 'Mar 2022',
        endDate: 'Present',
        current: true,
        bullets: [
          'Spearheaded enterprise design system powering 6 consumer-facing web apps, driving a 40% reduction in feature delivery times.',
          'Audited and refactored core customer flows for WCAG 2.1 AA compliance, reaching 100% lighthouse accessibility scores.',
          'Optimized Largest Contentful Paint (LCP) from 3.8s to 1.1s across mobile checkout funnels, increasing conversion by 14.6%.',
        ],
      },
    ],
    projects: [
      {
        id: 'fe-proj-1',
        title: 'Prism Design System & Component Library',
        role: 'Creator & Maintainer',
        techStack: ['React', 'TypeScript', 'TailwindCSS', 'Storybook', 'Vitest'],
        githubUrl: 'https://github.com/developer/prism-ui',
        liveUrl: 'https://prism.design',
        selected: true,
        bullets: [
          'Engineered 45+ production-ready accessible components with dark mode, keyboard navigation, and zero runtime CSS overhead.',
          'Configured automated visual regression testing pipeline via Playwright catching 100% of breaking style changes.',
        ],
      },
    ],
    education: [
      {
        id: 'fe-edu-1',
        degree: 'B.S. in Software Engineering',
        institution: 'Georgia Institute of Technology',
        graduationYear: '2020',
      },
    ],
  },
};

/**
 * Extracts and analyzes keywords from target job description and candidate profile
 */
export function analyzeKeywords(input: ResumeTailorInput): ResumeKeywordReport {
  const roleLower = input.targetRole.toLowerCase();
  let baseKeywords = COMMON_ROLE_KEYWORDS.fullstack;
  if (roleLower.includes('front')) baseKeywords = COMMON_ROLE_KEYWORDS.frontend;
  else if (roleLower.includes('back')) baseKeywords = COMMON_ROLE_KEYWORDS.backend;
  else if (
    roleLower.includes('devops') ||
    roleLower.includes('cloud') ||
    roleLower.includes('infra')
  )
    baseKeywords = COMMON_ROLE_KEYWORDS.devops;

  const jdText = (input.jobDescription || '').toLowerCase();

  // Combine all candidate skills
  const candidateSkillsCombined = [
    ...input.skills.languages,
    ...input.skills.frameworks,
    ...input.skills.tools,
    ...input.skills.cloud,
    ...input.projects.flatMap((p) => p.techStack),
  ].map((s) => s.toLowerCase());

  // Detect which base keywords appear in the job description or role
  const relevantKeywords = Array.from(
    new Set([
      ...baseKeywords,
      ...input.skills.languages,
      ...input.skills.frameworks,
      ...input.skills.tools,
      ...input.skills.cloud,
    ])
  );

  const matchedKeywords: string[] = [];
  const missingKeywords: string[] = [];
  const keywordDensity: { keyword: string; count: number }[] = [];

  for (const kw of relevantKeywords) {
    const kwLower = kw.toLowerCase();
    const inJd = jdText.includes(kwLower) || roleLower.includes(kwLower);
    const inCandidate = candidateSkillsCombined.some(
      (c) => c.includes(kwLower) || kwLower.includes(c)
    );

    if (inJd) {
      // Count frequency in JD
      const regex = new RegExp(`\\b${kwLower}\\b`, 'gi');
      const matches = jdText.match(regex);
      const count = matches ? matches.length : 1;
      keywordDensity.push({ keyword: kw, count });

      if (inCandidate) {
        matchedKeywords.push(kw);
      } else {
        missingKeywords.push(kw);
      }
    } else if (inCandidate && matchedKeywords.length < 15) {
      matchedKeywords.push(kw);
    }
  }

  // Calculate Match Score
  const totalTargetKeywords = matchedKeywords.length + missingKeywords.length;
  const matchScore =
    totalTargetKeywords > 0
      ? Math.min(100, Math.round((matchedKeywords.length / totalTargetKeywords) * 100))
      : 85;

  // Calculate action verb score from bullets
  const allBullets = [
    ...input.experiences.flatMap((e) => e.bullets),
    ...input.projects.flatMap((p) => p.bullets),
  ];
  const actionVerbCount = allBullets.filter((b) =>
    ACTION_VERBS.some((verb) => b.trim().startsWith(verb))
  ).length;
  const actionVerbScore =
    allBullets.length > 0 ? Math.round((actionVerbCount / allBullets.length) * 100) : 90;

  // ATS Readability Score: checks clean structure, bullet count, length
  let atsScore = 80;
  if (allBullets.length >= 6 && allBullets.length <= 15) atsScore += 10;
  if (actionVerbScore >= 70) atsScore += 5;
  if (input.profile.email && input.profile.phone && input.profile.location) atsScore += 5;
  atsScore = Math.min(100, atsScore);

  const recommendedAdditions = missingKeywords.slice(0, 5);

  return {
    matchScore,
    atsScore,
    matchedKeywords,
    missingKeywords,
    recommendedAdditions,
    keywordDensity,
    bulletCount: allBullets.length,
    actionVerbScore,
  };
}

/**
 * Synthesizes a tailored, ATS-optimized resume from the input parameters
 */
export function synthesizeTailoredResume(input: ResumeTailorInput): TailoredResumeResult {
  const keywordReport = analyzeKeywords(input);
  const selectedProjects = input.projects.filter((p) => p.selected);

  // Synthesize tailored summary
  const topMatched = keywordReport.matchedKeywords.slice(0, 4).join(', ');
  const seniorityLabel = input.seniority.charAt(0).toUpperCase() + input.seniority.slice(1);
  const summary = `${seniorityLabel} ${input.targetRole} with proven expertise in engineering robust, high-performance systems utilizing ${topMatched}. Demonstrated track record of delivering scalable architectures, accelerating deployment velocity, and optimizing end-user experiences across ${input.targetIndustry || 'modern digital platforms'}. Adept at collaborating in agile cross-functional environments to solve complex technical bottlenecks and drive measurable business impact.`;

  // Tailored Experiences
  const tailoredExperiences = input.experiences.map((exp) => ({
    company: exp.company,
    role: exp.role,
    location: exp.location,
    period: `${exp.startDate} - ${exp.current ? 'Present' : exp.endDate}`,
    bullets: exp.bullets,
  }));

  // Tailored Projects
  const tailoredProjects = selectedProjects.map((p) => ({
    title: p.title,
    role: p.role,
    techStack: p.techStack,
    bullets: p.bullets,
    links: {
      github: p.githubUrl,
      live: p.liveUrl,
    },
  }));

  // Skills categorized
  const skillsCategorized = {
    languages: input.skills.languages,
    frameworks: input.skills.frameworks,
    toolsAndCloud: [...input.skills.tools, ...input.skills.cloud],
  };

  // Education
  const education = input.education.map((edu) => ({
    degree: edu.degree,
    institution: edu.institution,
    year: edu.graduationYear,
    details: edu.details,
  }));

  // Markdown representation
  const markdown = generateMarkdownResume(input.profile, {
    targetRole: input.targetRole,
    summary,
    skillsCategorized,
    tailoredExperiences,
    tailoredProjects,
    education,
  });

  // Plain text representation for ATS paste
  const plainText = generatePlainTextResume(input.profile, {
    targetRole: input.targetRole,
    summary,
    skillsCategorized,
    tailoredExperiences,
    tailoredProjects,
    education,
  });

  return {
    summary,
    markdown,
    plainText,
    keywordReport,
    skillsCategorized,
    tailoredExperiences,
    tailoredProjects,
    education,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Primary tailoring function with API call and fallback
 */
export async function tailorResume(
  input: ResumeTailorInput,
  signal?: AbortSignal
): Promise<TailoredResumeResult> {
  try {
    const res = await api.post<TailoredResumeResult>('/ai/tailor-resume', input, {
      signal,
    });
    if (res && res.markdown) {
      return res;
    }
  } catch {
    // Graceful procedural synthesis fallback
  }

  return synthesizeTailoredResume(input);
}

function generateMarkdownResume(
  profile: ResumeCandidateProfile,
  data: {
    targetRole: string;
    summary: string;
    skillsCategorized: {
      languages: string[];
      frameworks: string[];
      toolsAndCloud: string[];
    };
    tailoredExperiences: {
      company: string;
      role: string;
      location: string;
      period: string;
      bullets: string[];
    }[];
    tailoredProjects: {
      title: string;
      role: string;
      techStack: string[];
      bullets: string[];
      links: { github?: string; live?: string };
    }[];
    education: {
      degree: string;
      institution: string;
      year: string;
      details?: string;
    }[];
  }
): string {
  const links = [
    profile.email,
    profile.phone,
    profile.location,
    profile.linkedin ? `[LinkedIn](${profile.linkedin})` : '',
    profile.github ? `[GitHub](${profile.github})` : '',
    profile.website ? `[Portfolio](${profile.website})` : '',
  ]
    .filter(Boolean)
    .join(' • ');

  const md: string[] = [
    `# ${profile.name}`,
    `**${data.targetRole}**`,
    `${links}`,
    '',
    '---',
    '',
    '## Professional Summary',
    data.summary,
    '',
    '---',
    '',
    '## Technical Skills',
    `- **Languages**: ${data.skillsCategorized.languages.join(', ')}`,
    `- **Frameworks & Libraries**: ${data.skillsCategorized.frameworks.join(', ')}`,
    `- **Tools & Cloud**: ${data.skillsCategorized.toolsAndCloud.join(', ')}`,
    '',
    '---',
    '',
  ];

  if (data.tailoredProjects.length > 0) {
    md.push('## Featured Projects');
    data.tailoredProjects.forEach((p) => {
      const projLinks = [
        p.links.live ? `[Live Demo](${p.links.live})` : '',
        p.links.github ? `[Code](${p.links.github})` : '',
      ]
        .filter(Boolean)
        .join(' | ');

      md.push(`### ${p.title} — *${p.role}* ${projLinks ? `(${projLinks})` : ''}`);
      md.push(`*Technologies: ${p.techStack.join(', ')}*`);
      p.bullets.forEach((b) => md.push(`- ${b}`));
      md.push('');
    });
    md.push('---', '');
  }

  if (data.tailoredExperiences.length > 0) {
    md.push('## Professional Experience');
    data.tailoredExperiences.forEach((exp) => {
      md.push(`### ${exp.role} | **${exp.company}**`);
      md.push(`*${exp.location} • ${exp.period}*`);
      exp.bullets.forEach((b) => md.push(`- ${b}`));
      md.push('');
    });
    md.push('---', '');
  }

  if (data.education.length > 0) {
    md.push('## Education');
    data.education.forEach((edu) => {
      md.push(`### ${edu.degree}`);
      md.push(`**${edu.institution}** — *Graduated ${edu.year}*`);
      if (edu.details) md.push(`- ${edu.details}`);
      md.push('');
    });
  }

  return md.join('\n');
}

function generatePlainTextResume(
  profile: ResumeCandidateProfile,
  data: {
    targetRole: string;
    summary: string;
    skillsCategorized: {
      languages: string[];
      frameworks: string[];
      toolsAndCloud: string[];
    };
    tailoredExperiences: {
      company: string;
      role: string;
      location: string;
      period: string;
      bullets: string[];
    }[];
    tailoredProjects: {
      title: string;
      role: string;
      techStack: string[];
      bullets: string[];
      links: { github?: string; live?: string };
    }[];
    education: {
      degree: string;
      institution: string;
      year: string;
      details?: string;
    }[];
  }
): string {
  const contact = [profile.email, profile.phone, profile.location, profile.linkedin, profile.github]
    .filter(Boolean)
    .join(' | ');

  const txt: string[] = [
    profile.name.toUpperCase(),
    data.targetRole.toUpperCase(),
    contact,
    '================================================================================',
    '',
    'PROFESSIONAL SUMMARY',
    '--------------------------------------------------------------------------------',
    data.summary,
    '',
    'TECHNICAL SKILLS',
    '--------------------------------------------------------------------------------',
    `Languages:             ${data.skillsCategorized.languages.join(', ')}`,
    `Frameworks/Libraries:  ${data.skillsCategorized.frameworks.join(', ')}`,
    `Tools & Cloud:         ${data.skillsCategorized.toolsAndCloud.join(', ')}`,
    '',
  ];

  if (data.tailoredProjects.length > 0) {
    txt.push(
      'FEATURED PROJECTS',
      '--------------------------------------------------------------------------------'
    );
    data.tailoredProjects.forEach((p) => {
      txt.push(`${p.title.toUpperCase()} - ${p.role}`);
      txt.push(`Technologies: ${p.techStack.join(', ')}`);
      p.bullets.forEach((b) => txt.push(`* ${b}`));
      txt.push('');
    });
  }

  if (data.tailoredExperiences.length > 0) {
    txt.push(
      'PROFESSIONAL EXPERIENCE',
      '--------------------------------------------------------------------------------'
    );
    data.tailoredExperiences.forEach((exp) => {
      txt.push(`${exp.role.toUpperCase()} | ${exp.company} (${exp.location})`);
      txt.push(`Period: ${exp.period}`);
      exp.bullets.forEach((b) => txt.push(`* ${b}`));
      txt.push('');
    });
  }

  if (data.education.length > 0) {
    txt.push(
      'EDUCATION',
      '--------------------------------------------------------------------------------'
    );
    data.education.forEach((edu) => {
      txt.push(`${edu.degree} - ${edu.institution} (${edu.year})`);
      if (edu.details) txt.push(`* ${edu.details}`);
      txt.push('');
    });
  }

  return txt.join('\n');
}

/**
 * Downloads plain text version of resume
 */
export function exportResumePlainText(content: string, filename = 'resume.txt') {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Downloads markdown file
 */
export function exportResumeMarkdown(content: string, filename = 'resume.md') {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Renders an ATS-friendly, clean single/two-page printable resume view and opens browser print dialog
 */
export function exportResumePdf(result: TailoredResumeResult, profile: ResumeCandidateProfile) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export your resume to PDF.');
    return;
  }

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${profile.name} - Resume</title>
  <style>
    @page {
      margin: 0.5in 0.55in;
      size: letter portrait;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      font-size: 10pt;
      line-height: 1.45;
      color: #111827;
      background: #fff;
    }
    .header {
      text-align: center;
      margin-bottom: 12px;
      border-bottom: 1.5px solid #10B981;
      padding-bottom: 10px;
    }
    .name {
      font-size: 18pt;
      font-weight: 700;
      color: #111827;
      letter-spacing: -0.02em;
    }
    .target-role {
      font-size: 11pt;
      font-weight: 600;
      color: #059669;
      margin-top: 2px;
    }
    .contact {
      font-size: 8.5pt;
      color: #4B5563;
      margin-top: 4px;
    }
    .contact a {
      color: #059669;
      text-decoration: none;
    }
    .section-title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #111827;
      border-bottom: 1px solid #D1D5DB;
      padding-bottom: 2px;
      margin-top: 10px;
      margin-bottom: 6px;
    }
    .summary-text {
      font-size: 9.5pt;
      color: #374151;
      text-align: justify;
    }
    .skills-grid {
      font-size: 9pt;
      color: #374151;
      line-height: 1.5;
    }
    .skills-category {
      font-weight: 600;
      color: #111827;
    }
    .item-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-top: 6px;
    }
    .item-title {
      font-weight: 700;
      font-size: 9.5pt;
      color: #111827;
    }
    .item-company {
      font-weight: 600;
      color: #059669;
    }
    .item-period {
      font-size: 8.5pt;
      color: #6B7280;
      font-weight: 500;
    }
    .item-tech {
      font-size: 8.5pt;
      font-style: italic;
      color: #4B5563;
      margin-bottom: 2px;
    }
    ul.bullets {
      margin-left: 16px;
      margin-top: 3px;
      margin-bottom: 6px;
    }
    ul.bullets li {
      font-size: 9pt;
      color: #374151;
      margin-bottom: 2px;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="name">${profile.name}</div>
    <div class="target-role">${result.summary.split('.')[0]}</div>
    <div class="contact">
      ${profile.email} • ${profile.phone} • ${profile.location}
      ${profile.linkedin ? ` • <a href="https://${profile.linkedin.replace(/^https?:\/\//, '')}">LinkedIn</a>` : ''}
      ${profile.github ? ` • <a href="https://${profile.github.replace(/^https?:\/\//, '')}">GitHub</a>` : ''}
      ${profile.website ? ` • <a href="https://${profile.website.replace(/^https?:\/\//, '')}">Portfolio</a>` : ''}
    </div>
  </div>

  <div class="section-title">Professional Summary</div>
  <div class="summary-text">${result.summary}</div>

  <div class="section-title">Technical Skills</div>
  <div class="skills-grid">
    <div><span class="skills-category">Languages:</span> ${result.skillsCategorized.languages.join(', ')}</div>
    <div><span class="skills-category">Frameworks &amp; Libraries:</span> ${result.skillsCategorized.frameworks.join(', ')}</div>
    <div><span class="skills-category">Tools, Cloud &amp; Platforms:</span> ${result.skillsCategorized.toolsAndCloud.join(', ')}</div>
  </div>

  ${
    result.tailoredProjects.length > 0
      ? `
  <div class="section-title">Featured Projects</div>
  ${result.tailoredProjects
    .map(
      (p) => `
    <div class="item-header">
      <span class="item-title">${p.title} <span style="font-weight:normal;">— ${p.role}</span></span>
    </div>
    <div class="item-tech">Technologies: ${p.techStack.join(', ')}</div>
    <ul class="bullets">
      ${p.bullets.map((b) => `<li>${b}</li>`).join('')}
    </ul>
  `
    )
    .join('')}
  `
      : ''
  }

  ${
    result.tailoredExperiences.length > 0
      ? `
  <div class="section-title">Professional Experience</div>
  ${result.tailoredExperiences
    .map(
      (exp) => `
    <div class="item-header">
      <span class="item-title">${exp.role} <span class="item-company">| ${exp.company}</span></span>
      <span class="item-period">${exp.location} • ${exp.period}</span>
    </div>
    <ul class="bullets">
      ${exp.bullets.map((b) => `<li>${b}</li>`).join('')}
    </ul>
  `
    )
    .join('')}
  `
      : ''
  }

  ${
    result.education.length > 0
      ? `
  <div class="section-title">Education</div>
  ${result.education
    .map(
      (edu) => `
    <div class="item-header">
      <span class="item-title">${edu.degree} <span class="item-company">| ${edu.institution}</span></span>
      <span class="item-period">${edu.year}</span>
    </div>
    ${edu.details ? `<div style="font-size: 8.5pt; color: #4B5563; margin-left: 16px;">${edu.details}</div>` : ''}
  `
    )
    .join('')}
  `
      : ''
  }

  <script>
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 250);
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(html);
  printWindow.document.close();
}

/**
 * LocalStorage draft management
 */
const RESUME_DRAFT_KEY = 'mentor_resume_draft';

export function saveResumeDraft(input: ResumeTailorInput) {
  try {
    localStorage.setItem(RESUME_DRAFT_KEY, JSON.stringify(input));
  } catch {
    // Non-fatal
  }
}

export function loadResumeDraft(): ResumeTailorInput | null {
  try {
    const raw = localStorage.getItem(RESUME_DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
