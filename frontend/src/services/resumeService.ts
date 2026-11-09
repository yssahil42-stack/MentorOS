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

export function isEducationPursuing(yearStr?: string, explicitPursuing?: boolean): boolean {
  if (explicitPursuing) return true;
  if (!yearStr) return false;
  const currentYear = new Date().getFullYear();
  const yr = parseInt(yearStr.trim(), 10);
  return !isNaN(yr) && yr > currentYear;
}

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
    tenthEducation: {
      board: 'CBSE',
      percentage: '94.5%',
      school: 'St. Xavier Senior Secondary School',
      year: '2017',
    },
    twelfthEducation: {
      board: 'CBSE',
      percentage: '91.2%',
      school: 'Delhi Public School',
      year: '2019',
      stream: 'Science (PCM)',
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
        degree: 'B.Tech in Computer Science and Engineering',
        institution: 'University of California, Berkeley',
        location: 'Berkeley, CA',
        graduationYear: '2023',
        percentage: '3.9 GPA / 92%',
        details: 'Honors in Computer Engineering, Coursework in Distributed Systems & Compilers',
        isPursuing: false,
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
    tenthEducation: {
      board: 'ICSE',
      percentage: '93.0%',
      school: 'St. Mary High School',
      year: '2020',
    },
    twelfthEducation: {
      board: 'ISC',
      percentage: '89.5%',
      school: 'National Junior College',
      year: '2022',
      stream: 'Science',
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
        degree: 'B.Tech in Software Engineering',
        institution: 'Georgia Institute of Technology',
        graduationYear: '2027',
        percentage: '3.8 GPA',
        details: "Dean's List for Academic Excellence",
        isPursuing: true,
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

  // Synthesize tailored summary variations
  const topMatched = keywordReport.matchedKeywords.slice(0, 4).join(', ') || 'modern full-stack tooling';
  const seniorityLabel = input.isFresher
    ? 'Entry-Level'
    : input.seniority.charAt(0).toUpperCase() + input.seniority.slice(1);

  const summaryVariations = {
    metrics: `${seniorityLabel} ${input.targetRole} specializing in ${topMatched}. Proven record of engineering high-efficiency systems and optimizing end-user delivery pipelines across ${input.targetIndustry || 'modern digital platforms'}, consistently driving measurable performance gains and reliable milestone execution.`,
    technical: `Dedicated ${seniorityLabel} ${input.targetRole} with in-depth technical proficiency in ${topMatched}. Focused on building clean, maintainable architectures, enforcing type-safe patterns, and implementing robust software engineering standards across ${input.targetIndustry || 'distributed ecosystems'}.`,
    growth: `Motivated ${input.isFresher ? 'graduate and aspiring' : ''} ${input.targetRole} with strong foundational command of ${topMatched}. Adept at rapid skill acquisition, hands-on project delivery, and collaborative problem-solving to build reliable applications and create immediate value across ${input.targetIndustry || 'agile engineering teams'}.`,
  };

  const chosenStyle = input.summaryStyle || (input.isFresher ? 'growth' : 'metrics');
  const summary = input.customSummary || summaryVariations[chosenStyle];

  // Tailored Experiences (omitted if fresher with no formal corporate experience)
  const tailoredExperiences = input.omitExperience
    ? []
    : input.experiences.map((exp) => ({
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
  const degreeEntries = input.education.map((edu) => {
    const isPursuing = isEducationPursuing(edu.graduationYear, edu.isPursuing);
    return {
      degree: edu.degree,
      institution: edu.institution,
      year: isPursuing ? `${edu.graduationYear} (Pursuing)` : edu.graduationYear,
      details: edu.details,
      percentage: edu.percentage,
      board: edu.board,
      stream: edu.stream,
      educationLevel: 'degree' as const,
      isPursuing,
    };
  });

  const twelfthEntry =
    input.twelfthEducation &&
    (input.twelfthEducation.board ||
      input.twelfthEducation.percentage ||
      input.twelfthEducation.school)
      ? [
          {
            degree: `Class XII (Higher Secondary)${
              input.twelfthEducation.board ? ` — ${input.twelfthEducation.board}` : ''
            }`,
            institution: input.twelfthEducation.school || 'Junior College / School',
            year: input.twelfthEducation.year,
            percentage: input.twelfthEducation.percentage,
            board: input.twelfthEducation.board,
            stream: input.twelfthEducation.stream,
            educationLevel: '12th' as const,
            isPursuing: isEducationPursuing(input.twelfthEducation.year),
            details: [
              input.twelfthEducation.board ? `Board: ${input.twelfthEducation.board}` : '',
              input.twelfthEducation.percentage
                ? `Percentage: ${input.twelfthEducation.percentage}`
                : '',
              input.twelfthEducation.stream ? `Stream: ${input.twelfthEducation.stream}` : '',
            ]
              .filter(Boolean)
              .join(' • '),
          },
        ]
      : [];

  const tenthEntry =
    input.tenthEducation &&
    (input.tenthEducation.board || input.tenthEducation.percentage || input.tenthEducation.school)
      ? [
          {
            degree: `Class X (Secondary)${
              input.tenthEducation.board ? ` — ${input.tenthEducation.board}` : ''
            }`,
            institution: input.tenthEducation.school || 'Secondary School',
            year: input.tenthEducation.year,
            percentage: input.tenthEducation.percentage,
            board: input.tenthEducation.board,
            educationLevel: '10th' as const,
            isPursuing: false,
            details: [
              input.tenthEducation.board ? `Board: ${input.tenthEducation.board}` : '',
              input.tenthEducation.percentage
                ? `Percentage: ${input.tenthEducation.percentage}`
                : '',
            ]
              .filter(Boolean)
              .join(' • '),
          },
        ]
      : [];

  const education = [...degreeEntries, ...twelfthEntry, ...tenthEntry];

  const templateId = input.templateId || 'modern';
  const isFresher = Boolean(input.isFresher);

  // Markdown representation
  const markdown = generateMarkdownResume(input.profile, {
    targetRole: input.targetRole,
    summary,
    skillsCategorized,
    tailoredExperiences,
    tailoredProjects,
    education,
    isFresher,
  });

  // Plain text representation for ATS paste
  const plainText = generatePlainTextResume(input.profile, {
    targetRole: input.targetRole,
    summary,
    skillsCategorized,
    tailoredExperiences,
    tailoredProjects,
    education,
    isFresher,
  });

  return {
    summary,
    summaryVariations,
    templateId,
    isFresher,
    markdown,
    plainText,
    keywordReport,
    skillsCategorized,
    tailoredExperiences,
    tailoredProjects,
    education,
    tenthEducation: input.tenthEducation,
    twelfthEducation: input.twelfthEducation,
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
      percentage?: string;
      board?: string;
      stream?: string;
      educationLevel?: 'degree' | '12th' | '10th' | 'other';
      isPursuing?: boolean;
    }[];
    isFresher?: boolean;
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

  // Helper closures for section rendering
  const appendProjects = () => {
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
  };

  const appendExperience = () => {
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
  };

  const appendEducation = () => {
    if (data.education.length > 0) {
      md.push('## Education');
      data.education.forEach((edu) => {
        const pursuingTag = edu.isPursuing ? ' [Pursuing]' : '';
        md.push(`### ${edu.degree}${pursuingTag}`);
        const yearDisplay = edu.isPursuing ? `*Expected ${edu.year} (Pursuing)*` : `*Graduated / Passing Year: ${edu.year}*`;
        md.push(`**${edu.institution}** — ${yearDisplay}`);
        if (edu.percentage || edu.board) {
          const parts = [
            edu.board ? `Board: ${edu.board}` : '',
            edu.percentage ? `Score: ${edu.percentage}` : '',
            edu.stream ? `Stream: ${edu.stream}` : '',
          ].filter(Boolean);
          md.push(`- ${parts.join(' • ')}`);
        }
        if (edu.details && !edu.details.includes('Percentage:') && !edu.details.includes('Board:')) {
          md.push(`- ${edu.details}`);
        }
        md.push('');
      });
    }
  };

  if (data.isFresher) {
    // Freshers showcase Education & Projects before Work Experience
    appendEducation();
    if (data.education.length > 0) md.push('---', '');
    appendProjects();
    appendExperience();
  } else {
    // Experienced candidates showcase Projects & Experience first
    appendProjects();
    appendExperience();
    appendEducation();
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
      percentage?: string;
      board?: string;
      stream?: string;
      educationLevel?: 'degree' | '12th' | '10th' | 'other';
      isPursuing?: boolean;
    }[];
    isFresher?: boolean;
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

  const appendProjectsTxt = () => {
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
  };

  const appendExperienceTxt = () => {
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
  };

  const appendEducationTxt = () => {
    if (data.education.length > 0) {
      txt.push(
        'EDUCATION',
        '--------------------------------------------------------------------------------'
      );
      data.education.forEach((edu) => {
        const pursuingTag = edu.isPursuing ? ' [PURSUING]' : '';
        txt.push(`${edu.degree}${pursuingTag} - ${edu.institution} (${edu.year})`);
        if (edu.percentage || edu.board) {
          const scoreParts = [
            edu.board ? `Board: ${edu.board}` : '',
            edu.percentage ? `Score: ${edu.percentage}` : '',
            edu.stream ? `Stream: ${edu.stream}` : '',
          ].filter(Boolean);
          txt.push(`* ${scoreParts.join(' | ')}`);
        }
        if (edu.details && !edu.details.includes('Percentage:') && !edu.details.includes('Board:')) {
          txt.push(`* ${edu.details}`);
        }
        txt.push('');
      });
    }
  };

  if (data.isFresher) {
    appendEducationTxt();
    appendProjectsTxt();
    appendExperienceTxt();
  } else {
    appendProjectsTxt();
    appendExperienceTxt();
    appendEducationTxt();
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
export function exportResumePdf(
  result: TailoredResumeResult,
  profile: ResumeCandidateProfile,
  templateIdOverride?: string
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export your resume to PDF.');
    return;
  }

  const activeTemplate = templateIdOverride || result.templateId || 'modern';
  const isFresher = Boolean(result.isFresher);

  // Template-specific style presets
  const templateStyles = {
    modern: {
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      accentColor: '#059669',
      headerBorder: '2px solid #10B981',
      sectionBorder: '1px solid #E5E7EB',
      headerAlign: 'center',
      titleCase: 'uppercase',
    },
    classic: {
      fontFamily: 'Georgia, Cambria, "Times New Roman", Times, serif',
      accentColor: '#1E3A8A',
      headerBorder: '2.5px solid #1E3A8A',
      sectionBorder: '1px solid #94A3B8',
      headerAlign: 'left',
      titleCase: 'uppercase',
    },
    minimal: {
      fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      accentColor: '#18181B',
      headerBorder: '1px solid #18181B',
      sectionBorder: '1px solid #E4E4E7',
      headerAlign: 'left',
      titleCase: 'none',
    },
    academic: {
      fontFamily: 'Baskerville, Georgia, "Times New Roman", serif',
      accentColor: '#334155',
      headerBorder: '1.5px solid #475569',
      sectionBorder: '1px solid #CBD5E1',
      headerAlign: 'center',
      titleCase: 'uppercase',
    },
  }[activeTemplate] || {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    accentColor: '#059669',
    headerBorder: '2px solid #10B981',
    sectionBorder: '1px solid #E5E7EB',
    headerAlign: 'center',
    titleCase: 'uppercase',
  };

  const projectsHtml =
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
      : '';

  const experienceHtml =
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
      : '';

  const educationHtml =
    result.education.length > 0
      ? `
  <div class="section-title">Education</div>
  ${result.education
    .map(
      (edu) => `
    <div class="item-header">
      <span class="item-title">${edu.degree} ${
        edu.isPursuing
          ? '<span style="font-size: 7.5pt; background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; padding: 1px 5px; border-radius: 4px; font-weight: bold; margin-left: 6px;">Pursuing</span>'
          : ''
      } <span class="item-company">| ${edu.institution}</span></span>
      <span class="item-period">${edu.year}</span>
    </div>
    ${
      edu.percentage || edu.board
        ? `<div style="font-size: 8.5pt; color: #374151; margin-left: 16px; font-weight: 500;">${
            edu.board ? `Board: ${edu.board} • ` : ''
          }Score: ${edu.percentage}${edu.stream ? ` • ${edu.stream}` : ''}</div>`
        : ''
    }
    ${
      edu.details && !edu.details.includes('Percentage:') && !edu.details.includes('Board:')
        ? `<div style="font-size: 8.5pt; color: #4B5563; margin-left: 16px;">${edu.details}</div>`
        : ''
    }
  `
    )
    .join('')}
  `
      : '';

  const mainSectionsHtml = isFresher
    ? `${educationHtml}${projectsHtml}${experienceHtml}`
    : `${projectsHtml}${experienceHtml}${educationHtml}`;

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
      font-family: ${templateStyles.fontFamily};
      font-size: 10pt;
      line-height: 1.45;
      color: #111827;
      background: #fff;
    }
    .header {
      text-align: ${templateStyles.headerAlign};
      margin-bottom: 12px;
      border-bottom: ${templateStyles.headerBorder};
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
      color: ${templateStyles.accentColor};
      margin-top: 2px;
    }
    .contact {
      font-size: 8.5pt;
      color: #4B5563;
      margin-top: 4px;
    }
    .contact a {
      color: ${templateStyles.accentColor};
      text-decoration: none;
    }
    .section-title {
      font-size: 10pt;
      font-weight: 700;
      text-transform: ${templateStyles.titleCase};
      letter-spacing: 0.05em;
      color: #111827;
      border-bottom: ${templateStyles.sectionBorder};
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
      color: ${templateStyles.accentColor};
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

  ${mainSectionsHtml}

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
