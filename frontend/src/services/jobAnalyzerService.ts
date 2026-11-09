import type {
  JobAnalysisRequest,
  JobAnalysisResult,
  RolePreset,
  JobPortalLink,
  TargetIndustryProfile,
  MatchedSkill,
  MissingSkill,
  MentorOpinion,
  SeniorityLevel,
} from '../types/jobAnalyzer';

/**
 * Curated Role Presets for Quick Selection
 */
export const POPULAR_ROLE_PRESETS: RolePreset[] = [
  {
    id: 'data-analyst',
    role: 'Data Analyst',
    label: 'Data Analyst',
    category: 'Analytics & Data',
    description: 'Transform raw data into business intelligence, KPI dashboards, and statistical insights.',
    suggestedSkills: ['SQL', 'Python', 'Excel', 'Tableau', 'Power BI', 'Pandas', 'Statistics', 'A/B Testing'],
  },
  {
    id: 'frontend-dev',
    role: 'Frontend Developer',
    label: 'Frontend Developer',
    category: 'Engineering',
    description: 'Craft responsive, high-performance web applications and interactive client interfaces.',
    suggestedSkills: ['React', 'TypeScript', 'JavaScript', 'Tailwind CSS', 'Next.js', 'REST APIs', 'Git'],
  },
  {
    id: 'fullstack-eng',
    role: 'Full-Stack Engineer',
    label: 'Full-Stack Engineer',
    category: 'Engineering',
    description: 'Build complete web architectures spanning responsive frontends, backend APIs, and databases.',
    suggestedSkills: ['TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Docker', 'REST APIs', 'Git'],
  },
  {
    id: 'ml-ai-eng',
    role: 'Machine Learning Engineer',
    label: 'ML / AI Engineer',
    category: 'Artificial Intelligence',
    description: 'Train, evaluate, and deploy predictive models, neural networks, and LLM pipelines.',
    suggestedSkills: ['Python', 'PyTorch', 'Scikit-Learn', 'Pandas', 'FastAPI', 'Docker', 'SQL', 'NLP'],
  },
  {
    id: 'devops-eng',
    role: 'Cloud / DevOps Engineer',
    label: 'Cloud / DevOps Engineer',
    category: 'Infrastructure',
    description: 'Architect scalable cloud infrastructure, CI/CD automation pipelines, and monitoring.',
    suggestedSkills: ['Docker', 'Kubernetes', 'AWS', 'Linux', 'Terraform', 'CI/CD Pipelines', 'GitHub Actions'],
  },
  {
    id: 'bi-analyst',
    role: 'Business Intelligence Analyst',
    label: 'BI Analyst',
    category: 'Analytics & Strategy',
    description: 'Design executive dashboards, build dimensional data models, and communicate business metrics.',
    suggestedSkills: ['SQL (Advanced)', 'Power BI / DAX', 'Tableau', 'Data Warehousing', 'Excel', 'Stakeholder Presentations'],
  },
];

interface RoleBenchmark {
  coreSkills: { name: string; aliases: string[]; whyItMatters: string; timeToLearn: string; project: string }[];
  highValueSkills: { name: string; aliases: string[]; whyItMatters: string; timeToLearn: string; project: string }[];
  bonusSkills: { name: string; aliases: string[]; whyItMatters: string; timeToLearn: string; project: string }[];
  industries: TargetIndustryProfile[];
  mentorInsights: {
    fresherAdvice: string;
    experiencedAdvice: string;
    criticalWarning: string;
    topPortfolioDeliverable: string;
  };
}

/**
 * In-depth Role Benchmarks & Skill Taxonomy
 */
const ROLE_BENCHMARKS: Record<string, RoleBenchmark> = {
  'data analyst': {
    coreSkills: [
      {
        name: 'SQL (Queries, Joins, Aggregations)',
        aliases: ['sql', 'postgresql', 'mysql', 'sqlite', 'oracle sql', 'transact-sql', 't-sql'],
        whyItMatters: '90%+ of data screening rounds test SQL. Extracting, joining, and filtering datasets is non-negotiable.',
        timeToLearn: '1-2 weeks',
        project: 'Write complex multi-table analytical queries with window functions on retail transaction data.',
      },
      {
        name: 'BI & Dashboarding (Tableau or Power BI)',
        aliases: ['tableau', 'power bi', 'powerbi', 'looker', 'metabase', 'dashboarding', 'bi'],
        whyItMatters: 'Executives do not read raw queries. They require visual charts and automated business KPI dashboards.',
        timeToLearn: '1-2 weeks',
        project: 'Create an executive churn-risk or revenue-retention dashboard published on Tableau Public or NovyPro.',
      },
      {
        name: 'Python for Data Analysis (Pandas & NumPy)',
        aliases: ['python', 'pandas', 'numpy', 'jupyter', 'eda'],
        whyItMatters: 'Crucial for cleaning messy datasets, missing-value imputation, and automated reporting scripts.',
        timeToLearn: '2-3 weeks',
        project: 'Conduct an Exploratory Data Analysis (EDA) notebook investigating customer lifetime value (LTV).',
      },
      {
        name: 'Excel (Pivot Tables & VLOOKUP/XLOOKUP)',
        aliases: ['excel', 'advanced excel', 'spreadsheets', 'google sheets', 'pivot tables', 'vlookup', 'xlookup'],
        whyItMatters: 'The universal language of business stakeholders and cross-functional teams.',
        timeToLearn: '3-5 days',
        project: 'Build a financial scenario model with dynamic pivot tables, slicers, and conditional formatting.',
      },
    ],
    highValueSkills: [
      {
        name: 'Statistical Hypothesis Testing & A/B Testing',
        aliases: ['statistics', 'hypothesis testing', 'a/b testing', 'ab testing', 'p-value', 'experimentation'],
        whyItMatters: 'Distinguishes junior query writers from strategic decision partners who validate feature rollouts.',
        timeToLearn: '2 weeks',
        project: 'Simulate a 2-sample conversion rate test calculating sample sizes, p-values, and confidence intervals.',
      },
      {
        name: 'Data Modeling & Schema Design',
        aliases: ['data modeling', 'star schema', 'snowflake schema', 'normalization', 'dbt'],
        whyItMatters: 'Ensures dashboards run fast and analytics queries remain reliable over millions of rows.',
        timeToLearn: '1-2 weeks',
        project: 'Design a Star Schema (fact & dimension tables) for an e-commerce subscription model.',
      },
      {
        name: 'Business KPI Definition & Metrics Framework',
        aliases: ['kpi', 'metrics', 'business analysis', 'okrs', 'cohort analysis', 'retention'],
        whyItMatters: 'Hiring managers prize analysts who understand business drivers like CAC, LTV, and churn.',
        timeToLearn: '1 week',
        project: 'Build a cohort retention analysis matrix showing month-over-month user drop-off.',
      },
    ],
    bonusSkills: [
      {
        name: 'Cloud Data Warehouses (BigQuery / Snowflake)',
        aliases: ['bigquery', 'snowflake', 'redshift', 'cloud sql', 'databricks'],
        whyItMatters: 'Demonstrates readiness for modern cloud-native data stacks.',
        timeToLearn: '1-2 weeks',
        project: 'Query a public 10M+ row dataset on Google BigQuery optimizing query slot usage.',
      },
      {
        name: 'Machine Learning Basics (Scikit-Learn Regression)',
        aliases: ['machine learning', 'scikit-learn', 'linear regression', 'forecasting', 'time series'],
        whyItMatters: 'Enables predictive modeling beyond descriptive backward-looking summaries.',
        timeToLearn: '2 weeks',
        project: 'Train a sales forecasting time-series model comparing ARIMA against Random Forest.',
      },
      {
        name: 'Version Control (Git & GitHub)',
        aliases: ['git', 'github', 'version control', 'gitlab'],
        whyItMatters: 'Collaborate with engineering teams through pull requests and version-controlled SQL scripts.',
        timeToLearn: '3-5 days',
        project: 'Publish a clean, documented repository with reproducible analysis notebooks and SQL migrations.',
      },
    ],
    industries: [
      {
        name: 'FinTech & Digital Payments',
        description: 'High transaction volumes requiring fraud detection, credit risk, and user transaction velocity analytics.',
        typicalRoles: ['Junior Data Analyst', 'Risk & Fraud Analyst', 'Product Analytics Specialist'],
        exampleCompanies: ['Stripe', 'Razorpay', 'Revolut', 'PayPal', 'Block / Square'],
        hiringFocus: 'Heavy SQL performance, cohort analysis, and transaction anomaly detection.',
      },
      {
        name: 'E-Commerce, D2C & Quick-Commerce',
        description: 'Focus on marketing spend ROAS, basket size, delivery SLA analytics, and inventory forecasting.',
        typicalRoles: ['Growth Analyst', 'Commercial Data Analyst', 'Supply Chain Analyst'],
        exampleCompanies: ['Amazon', 'Shopify', 'Flipkart', 'Instacart', 'Target Tech'],
        hiringFocus: 'A/B testing, cohort retention, and customer acquisition cost optimization.',
      },
      {
        name: 'B2B SaaS & Product-Led Tech',
        description: 'SaaS metrics such as Net Revenue Retention (NRR), product feature adoption, and churn prediction.',
        typicalRoles: ['Product Data Analyst', 'Customer Success Analyst', 'Revenue Operations Analyst'],
        exampleCompanies: ['HubSpot', 'Notion', 'Datadog', 'Zendesk', 'Linear'],
        hiringFocus: 'Event telemetry analytics, Mixpanel/Amplitude, and funnel conversion tracking.',
      },
      {
        name: 'Healthcare & Pharma Analytics',
        description: 'Clinical trial patient outcome monitoring, hospital bed allocation, and regulatory compliance.',
        typicalRoles: ['Healthcare Data Analyst', 'Clinical Operations Analyst', 'Biostatistics Associate'],
        exampleCompanies: ['UnitedHealth', 'IQVIA', 'Cerner', 'Epic Systems', 'Oscar Health'],
        hiringFocus: 'Statistical rigor, data privacy (HIPAA), and clean reproducible reporting.',
      },
    ],
    mentorInsights: {
      fresherAdvice: 'Do not just list Python libraries on your resume. Hiring managers want to see 1 solid SQL project with window functions and 1 interactive dashboard (Tableau Public or Power BI) with a live clickable link.',
      experiencedAdvice: 'Emphasize business impact over tool names. Frame bullet points around how your analysis increased revenue, cut churn, or shaved hours off manual reporting pipelines.',
      criticalWarning: 'Avoid applying without SQL proficiency. Almost all initial screening rounds involve a live or timed HackerRank SQL assessment.',
      topPortfolioDeliverable: 'An interactive 2-page executive dashboard with a live link and a GitHub repo containing clean, commented SQL queries.',
    },
  },
  'frontend developer': {
    coreSkills: [
      {
        name: 'React.js & Component Architecture',
        aliases: ['react', 'react.js', 'reactjs', 'hooks', 'jsx'],
        whyItMatters: 'Industry standard for modern web client interfaces and component design.',
        timeToLearn: '2-3 weeks',
        project: 'Build a responsive multi-page dashboard with custom hooks and context state.',
      },
      {
        name: 'TypeScript',
        aliases: ['typescript', 'ts', 'type system'],
        whyItMatters: 'Default requirement across almost all high-paying teams for maintainable frontend code.',
        timeToLearn: '1-2 weeks',
        project: 'Migrate a JavaScript application to strict TypeScript with zero any assertions.',
      },
      {
        name: 'CSS Systems & Responsive Design (Tailwind / CSS Modules)',
        aliases: ['tailwind', 'css', 'tailwind css', 'scss', 'responsive design', 'flexbox', 'grid'],
        whyItMatters: 'Essential for mobile-friendly, fluid, accessible, and pixel-perfect UIs.',
        timeToLearn: '1 week',
        project: 'Create a fully accessible responsive layout supporting dark mode and keyboard navigation.',
      },
      {
        name: 'State Management & Asynchronous Data Fetching',
        aliases: ['tanstack query', 'react query', 'redux', 'zustand', 'axios', 'fetch', 'rest api'],
        whyItMatters: 'Handles loading states, cache invalidation, and server synchronization seamlessly.',
        timeToLearn: '1 week',
        project: 'Implement infinite scrolling with optimistic mutations and offline cache using TanStack Query.',
      },
    ],
    highValueSkills: [
      {
        name: 'Next.js & Server-Side Rendering (SSR / App Router)',
        aliases: ['next.js', 'nextjs', 'ssr', 'ssg', 'server components', 'app router'],
        whyItMatters: 'Powers modern SEO-friendly production web applications and high-speed page loads.',
        timeToLearn: '2 weeks',
        project: 'Build an e-commerce storefront with server components, dynamic metadata, and ISR.',
      },
      {
        name: 'Frontend Testing (Vitest, Testing Library & Playwright)',
        aliases: ['testing', 'vitest', 'jest', 'react testing library', 'playwright', 'cypress', 'unit tests'],
        whyItMatters: 'Hiring managers use automated test writing to identify engineering maturity.',
        timeToLearn: '1-2 weeks',
        project: 'Write unit tests covering edge cases and an end-to-end user checkout flow.',
      },
      {
        name: 'Web Performance Optimization (Core Web Vitals)',
        aliases: ['performance', 'core web vitals', 'lcp', 'bundle size', 'lighthouse', 'lazy loading'],
        whyItMatters: 'Crucial for conversion rates and top-tier consumer apps.',
        timeToLearn: '1 week',
        project: 'Audit and optimize an application to achieve a 95+ score on Google Lighthouse.',
      },
    ],
    bonusSkills: [
      {
        name: 'CI/CD & Deployment (Vercel, GitHub Actions)',
        aliases: ['ci/cd', 'github actions', 'vercel', 'netlify', 'deployments'],
        whyItMatters: 'Demonstrates end-to-end delivery capability without hand-holding.',
        timeToLearn: '3-5 days',
        project: 'Set up automated linting, test runs, and preview branch deployments.',
      },
      {
        name: 'GraphQL & WebSockets',
        aliases: ['graphql', 'apollo', 'websockets', 'socket.io', 'realtime'],
        whyItMatters: 'Required for real-time collaboration platforms and complex graph APIs.',
        timeToLearn: '1-2 weeks',
        project: 'Build a real-time messaging room using WebSockets with reconnection logic.',
      },
    ],
    industries: [
      {
        name: 'Product-Led SaaS Startups',
        description: 'Focus on slick developer tools, productivity suites, and interactive canvases.',
        typicalRoles: ['Frontend Engineer', 'UI Platform Engineer', 'Web Developer'],
        exampleCompanies: ['Vercel', 'Figma', 'Linear', 'Notion', 'Supabase'],
        hiringFocus: 'TypeScript rigor, component design systems, sub-100ms UI latency.',
      },
      {
        name: 'Consumer Platforms & Streaming',
        description: 'Large user volume where mobile responsiveness and responsive caching dominate.',
        typicalRoles: ['Web Platform Engineer', 'UI/UX Developer'],
        exampleCompanies: ['Netflix', 'Spotify', 'Airbnb', 'Uber'],
        hiringFocus: 'Performance optimization, accessibility (WCAG), and responsive rendering.',
      },
    ],
    mentorInsights: {
      fresherAdvice: 'Do not build another generic Todo app or weather widget. Build a feature-rich, deployed product with authentication, real API integration, and clean responsive CSS.',
      experiencedAdvice: 'Emphasize architectural decisions, performance wins (e.g. bundle size reduction, LCP gains), and design system governance.',
      criticalWarning: 'Make sure your portfolio links actually work! Broken links or unstyled mobile views result in immediate candidate rejection.',
      topPortfolioDeliverable: 'A deployed SaaS or dashboard tool featuring TypeScript, full responsive design, and integration with a real public backend.',
    },
  },
  'full-stack engineer': {
    coreSkills: [
      {
        name: 'Backend API Development (Node.js / Python / Go)',
        aliases: ['node.js', 'express', 'python', 'fastapi', 'django', 'backend', 'rest apis'],
        whyItMatters: 'Creating secure, scalable, and well-documented server endpoints.',
        timeToLearn: '2-3 weeks',
        project: 'Build a RESTful API with authentication, rate limiting, and structured validation.',
      },
      {
        name: 'Relational Database & ORM (PostgreSQL / MySQL)',
        aliases: ['sql', 'postgresql', 'mysql', 'prisma', 'sqlalchemy', 'drizzle'],
        whyItMatters: 'Data integrity, indexing, foreign keys, and performant query execution.',
        timeToLearn: '2 weeks',
        project: 'Design a multi-tenant relational schema with indexes, transactions, and migrations.',
      },
      {
        name: 'Modern Frontend (React / TypeScript)',
        aliases: ['react', 'typescript', 'frontend', 'javascript', 'tailwind'],
        whyItMatters: 'Full-stack roles require independently executing from database to browser UI.',
        timeToLearn: '2 weeks',
        project: 'Connect your backend API to a responsive TypeScript dashboard.',
      },
    ],
    highValueSkills: [
      {
        name: 'Containerization & Docker',
        aliases: ['docker', 'containers', 'docker compose'],
        whyItMatters: 'Guarantees reliable local environments and seamless production deploys.',
        timeToLearn: '1 week',
        project: 'Dockerize a multi-service app (frontend, backend API, Postgres, Redis) with Docker Compose.',
      },
      {
        name: 'Caching & Queues (Redis / BullMQ / Celery)',
        aliases: ['redis', 'caching', 'queues', 'celery', 'background jobs'],
        whyItMatters: 'Keeps API response times low by offloading heavy work to asynchronous workers.',
        timeToLearn: '1-2 weeks',
        project: 'Implement an asynchronous email/report generator using Redis job queues.',
      },
      {
        name: 'Authentication & Security (OAuth, JWT, RBAC)',
        aliases: ['auth', 'jwt', 'oauth', 'security', 'rbac'],
        whyItMatters: 'Every commercial application must protect customer data and enforce roles.',
        timeToLearn: '1 week',
        project: 'Implement token refresh rotation and role-based route guards.',
      },
    ],
    bonusSkills: [
      {
        name: 'Cloud Infrastructure (AWS / GCP) & CI/CD',
        aliases: ['aws', 'gcp', 'cloud', 'terraform', 'github actions'],
        whyItMatters: 'Enables end-to-end product delivery from code to production cloud.',
        timeToLearn: '2 weeks',
        project: 'Deploy a containerized application to AWS ECS or GCP Cloud Run with automated CI/CD.',
      },
    ],
    industries: [
      {
        name: 'High-Growth Tech Startups',
        description: 'Fast-moving teams that value generalists who can ship features end-to-end in days.',
        typicalRoles: ['Founding Engineer', 'Full-Stack Developer', 'Product Engineer'],
        exampleCompanies: ['Y Combinator Startups', 'Ramp', 'Retool', 'Brex', 'Postman'],
        hiringFocus: 'Speed of shipping, self-sufficiency, clean API design, and rapid iteration.',
      },
    ],
    mentorInsights: {
      fresherAdvice: 'Show you know how both sides connect. Document how your frontend communicates with your database, and how you handle authentication securely.',
      experiencedAdvice: 'Highlight system scalability, database migration workflows, and production incident management.',
      criticalWarning: 'Avoid neglecting database fundamentals. Many full-stack candidates fail technical interviews on SQL joins and database concurrency.',
      topPortfolioDeliverable: 'A deployed full-stack SaaS with user authentication, database persistence, background workers, and CI/CD pipelines.',
    },
  },
};

/**
 * Normalizes strings for resilient keyword matching
 */
function normalize(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]/g, ' ').trim();
}

/**
 * Checks if a user's skill list matches a benchmark requirement
 */
function matchSkill(
  benchmarkItem: { name: string; aliases: string[] },
  userSkillsNormalized: { raw: string; norm: string }[]
): { matched: boolean; userSkillRaw: string } {
  const matches: string[] = [];
  for (const userSkill of userSkillsNormalized) {
    // Direct or alias match
    if (
      userSkill.norm === normalize(benchmarkItem.name) ||
      benchmarkItem.aliases.some((alias) => {
        const normAlias = normalize(alias);
        return userSkill.norm === normAlias || userSkill.norm.includes(normAlias) || normAlias.includes(userSkill.norm);
      })
    ) {
      matches.push(userSkill.raw);
    }
  }
  return {
    matched: matches.length > 0,
    userSkillRaw: matches.join(', '),
  };
}

/**
 * Generates verified, actionable job search portal URLs for the target role
 */
export function generateJobPortalLinks(role: string, location = 'Remote'): JobPortalLink[] {
  const encRole = encodeURIComponent(role);
  const encLoc = encodeURIComponent(location);
  const roleSlug = role.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  return [
    {
      platform: 'LinkedIn Jobs',
      url: `https://www.linkedin.com/jobs/search/?keywords=${encRole}&location=${encLoc}`,
      badge: 'Highest Volume',
      description: 'Primary platform for corporate, tech, and agency postings with 1-click recruiter connections.',
    },
    {
      platform: 'Wellfound (AngelList)',
      url: `https://wellfound.com/jobs?role=${encRole}`,
      badge: 'Best for Startups',
      description: 'Direct access to startup founders and engineering leads without third-party recruiter middleman.',
    },
    {
      platform: 'Indeed',
      url: `https://www.indeed.com/jobs?q=${encRole}&l=${encLoc}`,
      badge: 'Mid-Market & Enterprise',
      description: 'Extensive listing across local, hybrid, enterprise, and government contracting positions.',
    },
    {
      platform: 'RemoteOK',
      url: `https://remoteok.com/remote-${roleSlug}-jobs`,
      badge: 'Global Remote',
      description: 'Curated 100% remote job listings with public salary ranges and USD compensation benchmarks.',
    },
    {
      platform: 'Google Jobs Search',
      url: `https://www.google.com/search?q=${encodeURIComponent(`${role} jobs ${location}`)}&ibp=htl;jobs`,
      badge: 'Aggregator',
      description: 'Aggregates job listings across company career portals, Greenhouse, Lever, and Workday.',
    },
    {
      platform: 'Glassdoor',
      url: `https://www.glassdoor.com/Job/jobs.htm?sc.keyword=${encRole}`,
      badge: 'Salary & Reviews',
      description: 'Detailed company reviews, interview questions, and transparent salary breakdowns.',
    },
  ];
}

/**
 * Default fallback benchmark for custom/uncommon roles
 */
function buildGenericBenchmark(targetRole: string): RoleBenchmark {
  const normRole = targetRole.toLowerCase();
  const isData = normRole.includes('data') || normRole.includes('analytics') || normRole.includes('bi');
  const isCode = normRole.includes('developer') || normRole.includes('engineer') || normRole.includes('software');

  return {
    coreSkills: [
      {
        name: isData ? 'SQL & Data Extraction' : isCode ? 'Core Programming Language' : 'Domain Subject Matter Expertise',
        aliases: isData ? ['sql', 'database'] : isCode ? ['python', 'javascript', 'typescript', 'java', 'c++'] : ['domain knowledge'],
        whyItMatters: `Fundamental baseline required in virtually every interview for ${targetRole}.`,
        timeToLearn: '2-3 weeks',
        project: `Build a foundational portfolio project demonstrating practical command of ${targetRole} workflows.`,
      },
      {
        name: isData ? 'Data Analysis & Visualization' : isCode ? 'Frameworks & Systems Design' : 'Industry Tooling & Workflow',
        aliases: isData ? ['tableau', 'power bi', 'excel'] : isCode ? ['react', 'node', 'fastapi', 'architecture'] : ['workflow tools'],
        whyItMatters: 'Enables translating raw tasks into tangible, usable deliverables for team leaders.',
        timeToLearn: '2 weeks',
        project: `Produce a polished case study showcasing your problem-solving methodology for ${targetRole}.`,
      },
      {
        name: 'Technical Communication & Reporting',
        aliases: ['communication', 'documentation', 'reporting', 'stakeholder management'],
        whyItMatters: 'Hiring managers filter for candidates who can explain complex findings concisely.',
        timeToLearn: '1 week',
        project: 'Write a 1-page executive summary or RFC document summarizing a technical challenge.',
      },
    ],
    highValueSkills: [
      {
        name: 'Workflow Automation & Scripting',
        aliases: ['automation', 'python', 'scripting', 'bash', 'macros'],
        whyItMatters: 'Automates repetitive work and accelerates turnaround times by 5x.',
        timeToLearn: '1-2 weeks',
        project: 'Create an automated script or template that reduces a manual 3-step process to 1 click.',
      },
      {
        name: 'Quantitative Metrics & Performance Measurement',
        aliases: ['kpi', 'metrics', 'analytics', 'statistics', 'evaluation'],
        whyItMatters: 'Shows strategic business awareness rather than merely following instructions.',
        timeToLearn: '1 week',
        project: 'Define 3 primary KPIs and measure their improvement across an illustrative project.',
      },
    ],
    bonusSkills: [
      {
        name: 'Cloud Services & Collaboration Platforms',
        aliases: ['cloud', 'aws', 'git', 'github', 'collaboration'],
        whyItMatters: 'Demonstrates modern team readiness and technical adaptability.',
        timeToLearn: '1 week',
        project: 'Publish your work on a public repository or hosted portfolio page.',
      },
    ],
    industries: [
      {
        name: 'Tech & Digital Products',
        description: 'Fast-paced growth organizations prioritizing technical proficiency and rapid delivery.',
        typicalRoles: [targetRole, `Associate ${targetRole}`, `Senior ${targetRole}`],
        exampleCompanies: ['Product Startups', 'Growth-stage Scaleups', 'B2B SaaS Companies'],
        hiringFocus: 'Portfolio proof of work, adaptability, and clear communication.',
      },
      {
        name: 'Enterprise & Consultancies',
        description: 'Established firms offering structured onboarding, mentorship programs, and client projects.',
        typicalRoles: [targetRole, `Staff ${targetRole}`, `Consultant`],
        exampleCompanies: ['Global Consultancies', 'Financial Services', 'Enterprise SaaS'],
        hiringFocus: 'Methodology, documentation quality, and stakeholder presentation skills.',
      },
    ],
    mentorInsights: {
      fresherAdvice: `For entry-level ${targetRole} positions, focus on proof of work. One public, high-quality project with clear documentation is worth 50 passive applications.`,
      experiencedAdvice: `Frame your previous experience around business ROI, efficiency improvements, and team leadership for ${targetRole}.`,
      criticalWarning: `Do not mass-apply with a generic resume. Customize your keywords and portfolio to match the specific needs of each posting.`,
      topPortfolioDeliverable: `A comprehensive case study demonstrating your end-to-end execution from problem discovery to final result.`,
    },
  };
}

/**
 * Primary Analysis Engine:
 * Compares user skills with role benchmarks, identifies gaps, builds channel strategies,
 * and writes a senior mentor opinion and strategic roadmap.
 */
export function analyzeJobRole(request: JobAnalysisRequest): JobAnalysisResult {
  const targetRoleClean = request.targetRole.trim() || 'Data Analyst';
  const seniority = request.seniority || 'junior';
  const roleKey = targetRoleClean.toLowerCase();

  // Find matching benchmark or fallback to generic
  let benchmark: RoleBenchmark | undefined;
  for (const [key, b] of Object.entries(ROLE_BENCHMARKS)) {
    if (roleKey.includes(key) || key.includes(roleKey)) {
      benchmark = b;
      break;
    }
  }
  if (!benchmark) {
    benchmark = buildGenericBenchmark(targetRoleClean);
  }

  // Normalize user skills
  const userSkillsNormalized = request.userSkills
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
    .map((s) => ({ raw: s, norm: normalize(s) }));

  // Evaluate Matched Skills
  const matchedSkills: MatchedSkill[] = [];
  const missingSkills: MissingSkill[] = [];

  let coreEarned = 0;
  const coreTotal = benchmark.coreSkills.length;
  for (const core of benchmark.coreSkills) {
    const res = matchSkill(core, userSkillsNormalized);
    if (res.matched) {
      coreEarned += 1;
      matchedSkills.push({
        name: core.name,
        matchedWith: res.userSkillRaw,
        category: 'core',
        relevanceExplanation: `Fulfills a core requirement for ${targetRoleClean}. ${core.whyItMatters}`,
      });
    } else {
      missingSkills.push({
        name: core.name,
        priority: 'critical',
        whyItMatters: core.whyItMatters,
        estimatedTimeToLearn: core.timeToLearn,
        suggestedProject: core.project,
      });
    }
  }

  let highValueEarned = 0;
  const highValueTotal = benchmark.highValueSkills.length;
  for (const hv of benchmark.highValueSkills) {
    const res = matchSkill(hv, userSkillsNormalized);
    if (res.matched) {
      highValueEarned += 1;
      matchedSkills.push({
        name: hv.name,
        matchedWith: res.userSkillRaw,
        category: 'high_value',
        relevanceExplanation: `Provides a competitive edge against other applicants. ${hv.whyItMatters}`,
      });
    } else {
      missingSkills.push({
        name: hv.name,
        priority: 'high',
        whyItMatters: hv.whyItMatters,
        estimatedTimeToLearn: hv.timeToLearn,
        suggestedProject: hv.project,
      });
    }
  }

  let bonusEarned = 0;
  const bonusTotal = benchmark.bonusSkills.length;
  for (const bonus of benchmark.bonusSkills) {
    const res = matchSkill(bonus, userSkillsNormalized);
    if (res.matched) {
      bonusEarned += 1;
      matchedSkills.push({
        name: bonus.name,
        matchedWith: res.userSkillRaw,
        category: 'differentiator',
        relevanceExplanation: `Bonus differentiator that stands out to hiring managers. ${bonus.whyItMatters}`,
      });
    } else {
      missingSkills.push({
        name: bonus.name,
        priority: 'bonus',
        whyItMatters: bonus.whyItMatters,
        estimatedTimeToLearn: bonus.timeToLearn,
        suggestedProject: bonus.project,
      });
    }
  }

  // Also include any user skills that didn't match the benchmark as transferable skills
  for (const u of userSkillsNormalized) {
    const alreadyIncluded = matchedSkills.some(
      (m) => normalize(m.matchedWith).includes(u.norm) || normalize(m.name).includes(u.norm)
    );
    if (!alreadyIncluded) {
      matchedSkills.push({
        name: u.raw,
        matchedWith: u.raw,
        category: 'differentiator',
        relevanceExplanation: `Transferable skill from your background that adds unique interdisciplinary breadth.`,
      });
    }
  }

  // Calculate Readiness Score
  // Core = 60%, High-Value = 25%, Bonus = 15%
  const coreScore = coreTotal > 0 ? (coreEarned / coreTotal) * 60 : 60;
  const highValueScore = highValueTotal > 0 ? (highValueEarned / highValueTotal) * 25 : 25;
  const bonusScore = bonusTotal > 0 ? (bonusEarned / bonusTotal) * 15 : 15;

  let calculatedScore = Math.round(coreScore + highValueScore + bonusScore);
  // Cap between 15% and 98%
  calculatedScore = Math.max(18, Math.min(98, calculatedScore));

  // Determine Verdict Tone
  let verdictTone: 'ready' | 'competitive_gap' | 'upskilling_needed' = 'competitive_gap';
  let overallVerdict = '';
  if (calculatedScore >= 75) {
    verdictTone = 'ready';
    overallVerdict = `Strong Profile Match (${calculatedScore}% Readiness) — You are well-positioned to apply actively.`;
  } else if (calculatedScore >= 50) {
    verdictTone = 'competitive_gap';
    overallVerdict = `Promising Foundation (${calculatedScore}% Readiness) — Close 1 or 2 critical gaps to double your interview conversion rate.`;
  } else {
    verdictTone = 'upskilling_needed';
    overallVerdict = `Foundational Stage (${calculatedScore}% Readiness) — Build 2 focused portfolio deliverables before high-volume applying.`;
  }

  // Formulate Senior Mentor Opinion
  const criticalGaps = missingSkills.filter((s) => s.priority === 'critical');
  const biggestBlocker =
    criticalGaps.length > 0
      ? `Lack of demonstrated ${criticalGaps[0].name}. Hiring managers or automated ATS filters look for this within the first 10 seconds of scanning.`
      : missingSkills.length > 0
      ? `Distinction in practical projects. You have core skills, but need to prove impact through an active case study.`
      : 'No major blockers. Your skills closely match the target profile!';

  const strengthsSummary =
    matchedSkills.length > 0
      ? `You already command strong foundations in ${matchedSkills
          .slice(0, 3)
          .map((s) => s.name.split('(')[0].trim())
          .join(', ')}. This gives you immediate credibility for ${targetRoleClean} discussions.`
      : `You are starting fresh, which means you can build directly towards high-demand modern stack requirements without unlearning legacy tools.`;

  const mentorExecutiveSummary =
    seniority === 'fresher'
      ? `${benchmark.mentorInsights.fresherAdvice} ${benchmark.mentorInsights.criticalWarning}`
      : `${benchmark.mentorInsights.experiencedAdvice} ${benchmark.mentorInsights.criticalWarning}`;

  // Formulate Strategic Action Plan
  const strategicActionPlan = [
    {
      phase: 'Phase 1: Gap Closure',
      timeline: 'Days 1 - 10',
      title: criticalGaps.length > 0 ? `Target ${criticalGaps[0].name.split('(')[0].trim()}` : 'Deepen Core Capabilities',
      tasks: [
        criticalGaps.length > 0
          ? `Complete targeted practice: ${criticalGaps[0].suggestedProject}`
          : 'Refine your best existing code or analytics deliverable with clean documentation.',
        'Document your methodology and learnings in a concise README on GitHub or a blog post.',
      ],
    },
    {
      phase: 'Phase 2: Portfolio Asset',
      timeline: 'Days 11 - 20',
      title: 'Build Top Deliverable',
      tasks: [
        benchmark.mentorInsights.topPortfolioDeliverable,
        'Publish with a live, clickable URL and verify it opens without login friction on mobile and desktop.',
      ],
    },
    {
      phase: 'Phase 3: Targeted Applications',
      timeline: 'Days 21 - 30',
      title: 'Application & Outreach Blitz',
      tasks: [
        `Tailor your resume using the MentorOS Resume Tailor specifically emphasizing ${targetRoleClean} keywords.`,
        'Apply to 5-10 targeted positions weekly: 50% warm LinkedIn recruiter messages, 30% direct company portals, 20% job boards.',
        'Send professional follow-up emails at 7 and 14 days using the MentorOS Application Tracker.',
      ],
    },
  ];

  const mentorOpinion: MentorOpinion = {
    overallVerdict,
    verdictTone,
    readinessPercentage: calculatedScore,
    executiveSummary: mentorExecutiveSummary,
    strengthsSummary,
    biggestBlocker,
    strategicActionPlan,
    portfolioAdvice: benchmark.mentorInsights.topPortfolioDeliverable,
    applicationStrategy:
      'Split your job search: 50% via direct recruiter outreach & networking on LinkedIn, 30% via specialized portals (Wellfound, RemoteOK), and 20% via general boards (Indeed/LinkedIn Jobs). Avoid cold mass-applying without a tailored resume.',
  };

  // Compile Where To Apply
  const portalLinks = generateJobPortalLinks(targetRoleClean, request.locationPreference || 'Remote');
  const targetIndustries = benchmark.industries;

  const recommendedChannels = [
    {
      channel: 'Direct Recruiter Outreach & LinkedIn InMail',
      allocation: 45,
      advice: 'Find engineering managers and talent acquisition leads at companies hiring for this role. Send a polite 3-sentence note referencing your portfolio project.',
    },
    {
      channel: 'Startup & Direct Founder Hiring (Wellfound / YC)',
      allocation: 35,
      advice: 'Startups move fast and value raw capability over years of corporate tenure. Emphasize your ability to own projects independently.',
    },
    {
      channel: 'General Career Portals (Indeed, Glassdoor, LinkedIn Jobs)',
      allocation: 20,
      advice: 'Apply only when your resume is keyword-tailored to the posting description to ensure ATS compatibility.',
    },
  ];

  return {
    targetRole: targetRoleClean,
    seniority,
    analyzedAt: new Date().toISOString(),
    readinessScore: calculatedScore,
    matchedSkills,
    missingSkills,
    whereToApply: {
      portalLinks,
      targetIndustries,
      recommendedChannels,
    },
    mentorOpinion,
  };
}
