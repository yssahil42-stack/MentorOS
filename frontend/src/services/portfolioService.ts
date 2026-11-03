import { api } from './api';
import type {
  ProjectInputData,
  GeneratedPortfolioResult,
  GeneratedReadme,
  GeneratedCaseStudy,
} from '../types/portfolio';

const DRAFTS_KEY = 'mentor_portfolio_drafts';

/**
 * Generate README and Case Study using AI endpoint with a rich client-side synthesis fallback.
 */
export async function generatePortfolio(
  input: ProjectInputData,
  signal?: AbortSignal
): Promise<GeneratedPortfolioResult> {
  try {
    const res = await api.post<GeneratedPortfolioResult>('/ai/generate-portfolio', input, {
      signal,
    });
    if (res && res.readme && res.caseStudy) {
      return res;
    }
  } catch {
    // Graceful fallback to client-side generative synthesis if AI endpoint is not connected
  }

  return synthesizePortfolio(input);
}

/**
 * Procedural AI-style synthesis generating production-grade README & Case Study
 */
export function synthesizePortfolio(input: ProjectInputData): GeneratedPortfolioResult {
  const cleanTitle = input.title || 'Untitled Project';
  const cleanTagline =
    input.tagline || 'High-performance application built with modern architecture';
  const techList = input.techStack.length ? input.techStack : ['React', 'TypeScript', 'Node.js'];
  const featureList = input.features.length
    ? input.features
    : [
        'Responsive and accessible modern user interface',
        'End-to-end type safety with continuous verification',
        'Optimized client-side state and background query caching',
      ];
  const metrics = input.metrics.length
    ? input.metrics
    : [
        { label: 'Uptime', value: '99.98%' },
        { label: 'Response Latency', value: '<45ms' },
        { label: 'Test Coverage', value: '94%' },
      ];

  const badges = techList
    .map(
      (tech) =>
        `![${tech}](https://img.shields.io/badge/${encodeURIComponent(tech)}-orange?style=flat-square)`
    )
    .join(' ');

  // ─── Generate README Markdown ──────────────────────────────────────────────
  const readmeMarkdown = `# ${cleanTitle}

> ${cleanTagline}

${badges}
![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=flat-square)

---

## 📌 Overview
${input.description || 'A modern full-stack web application designed for high performance, reliability, and developer ergonomics.'}

${input.liveUrl ? `🔗 **Live Demo**: [${input.liveUrl}](${input.liveUrl})\n` : ''}
${input.githubUrl ? `📂 **Repository**: [${input.githubUrl}](${input.githubUrl})\n` : ''}

---

## ✨ Key Features
${featureList.map((f) => `- **${f}**`).join('\n')}

---

## 🛠️ Tech Stack & Architecture
${techList.map((t) => `- \`${t}\``).join('\n')}

${
  input.architectureDetails
    ? `### Architectural Blueprint\n${input.architectureDetails}\n`
    : `### Architectural Pattern\nBuilt following clean component-driven architecture with modular service layers, automated test suites, and strict separation of concerns.`
}

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or later)
- npm or pnpm

### Installation
\`\`\`bash
# 1. Clone the repository
git clone ${input.githubUrl || 'https://github.com/developer/' + cleanTitle.toLowerCase().replace(/\\s+/g, '-')}
cd ${cleanTitle.toLowerCase().replace(/\\s+/g, '-')}

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.example .env

# 4. Start the development server
npm run dev
\`\`\`

---

## 📊 Key Highlights & Metrics
| Metric | Benchmark |
| :--- | :--- |
${metrics.map((m) => `| ${m.label} | **${m.value}** |`).join('\n')}

---

## 📄 License
This project is open-source and distributed under the MIT License.
`;

  // ─── Generate Case Study Markdown ──────────────────────────────────────────
  const caseStudyMarkdown = `# Case Study: ${cleanTitle}
**${cleanTagline}**

*Category*: **${input.category}** | *Status*: **Production Verified**

---

## 🎯 Executive Summary
${cleanTitle} was engineered to address critical performance bottlenecks and architectural scalability.
By leveraging modern tooling (${techList.join(', ')}), this implementation achieved measurable improvements in runtime speed, developer ergonomics, and system reliability.

---

## 🧩 The Challenge & Problem Statement
${input.challenges || 'Legacy implementations suffered from complex tight coupling, lack of clear component boundaries, and unoptimized background fetching that degraded overall responsiveness during peak user interactions.'}

Key hurdles encountered:
- Managing asynchronous lifecycle and background invalidation without UI blocking.
- Ensuring strict design token consistency across diverse responsive viewports.
- Maintaining rapid build and test turnaround without regressions.

---

## 💡 The Architectural Solution
${input.solution || 'A modular layered architecture was deployed with centralized API client interceptors, debounced query invalidation, and isolated UI primitive tokens.'}

### Key Technical Decisions
${techList.map((tech, idx) => `1. **Choice of ${tech}**: Selected for predictable state primitives, low runtime overhead, and seamless integration with existing toolchains.`).join('\n')}

${
  input.architectureDetails
    ? `### Implementation Details\n${input.architectureDetails}`
    : `### System Flow\nRequest lifecycle flows through typed service gateways with automated retry logic, token refresh handling, and local storage fallback mechanisms.`
}

---

## 📈 Measured Outcomes & Impact
| Key Result Area | Value Achieved |
| :--- | :--- |
${metrics.map((m) => `| ${m.label} | **${m.value}** |`).join('\n')}

- **100% Type Coverage**: Strict compiler settings enabled across all service boundaries.
- **Enhanced UX**: Smooth layout transitions without cumulative layout shifts (CLS).
- **Maintainability**: Clear separation between UI presentation, domain hooks, and API services.

---

## 🎓 Key Learnings & Takeaways
- Decoupling view models from network requests allows predictable UI testing and offline development.
- Pre-computing and debouncing user query inputs significantly cuts unnecessary network dispatch overhead.
- Establishing reusable design variant utilities drastically accelerates feature velocity while preventing visual inconsistencies.
`;

  const readme: GeneratedReadme = {
    markdown: readmeMarkdown,
    overview: input.description,
    features: featureList,
    installation: 'git clone ... && npm install && npm run dev',
    usage: 'npm run dev',
    architecture: input.architectureDetails || 'Layered service & UI architecture',
    license: 'MIT',
  };

  const caseStudy: GeneratedCaseStudy = {
    title: cleanTitle,
    tagline: cleanTagline,
    summary: input.description,
    problemStatement: input.challenges || 'Architectural bottleneck resolution',
    technicalDecisions: techList.map((t) => `Utilized ${t} for reliability and type safety`),
    systemArchitecture: input.architectureDetails || 'Modular client-server pipeline',
    metricsImpact: metrics,
    keyOutcomes: ['Improved latency', 'Zero breaking regressions', 'Production deployed'],
    learnings: [
      'Early automated integration testing guarantees stability',
      'Debounced filter inputs optimize user experience',
    ],
    markdown: caseStudyMarkdown,
  };

  return {
    id: `portfolio-${Date.now()}`,
    createdAt: new Date().toISOString(),
    projectInput: input,
    readme,
    caseStudy,
  };
}

/**
 * Export Markdown file to user's disk
 */
export function exportMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.md') ? filename : `${filename}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

/**
 * Export Document to PDF via Browser Print Window
 */
export function exportPdf(title: string, markdown: string, filename: string): void {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to export printable PDF');
    return;
  }

  // Basic markdown-to-HTML conversion for readable print view
  const formattedHtml = markdown
    .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold my-4 border-b pb-2">$1</h1>')
    .replace(
      /^## (.*$)/gim,
      '<h2 class="text-2xl font-bold my-3 text-orange-600 border-b pb-1">$1</h2>'
    )
    .replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold my-2">$1</h3>')
    .replace(
      /^> (.*$)/gim,
      '<blockquote class="border-l-4 border-orange-500 pl-4 italic text-gray-600 my-2">$1</blockquote>'
    )
    .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/gim, '<em>$1</em>')
    .replace(
      /```([\s\S]*?)```/gim,
      '<pre class="bg-gray-100 p-3 rounded font-mono text-sm my-2 overflow-x-auto">$1</pre>'
    )
    .replace(
      /`([^`]+)`/gim,
      '<code class="bg-gray-100 px-1 py-0.5 rounded font-mono text-xs">$1</code>'
    )
    .replace(/\| (.*) \|/gim, (match) => `<div class="font-mono text-xs">${match}</div>`)
    .replace(/\n$/gim, '<br />');

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="utf-8" />
      <title>${title} — Export</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        @media print {
          body { font-size: 12pt; color: #111; padding: 20mm; }
          .no-print { display: none !important; }
          a { text-decoration: underline; color: #ea580c; }
          pre, blockquote { page-break-inside: avoid; }
        }
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      </style>
    </head>
    <body class="bg-white text-gray-900 p-8 max-w-4xl mx-auto">
      <div class="no-print mb-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-center justify-between">
        <div>
          <h4 class="font-bold text-orange-900">Print Preview</h4>
          <p class="text-xs text-orange-700">Use browser print dialog (Ctrl+P / Cmd+P) and choose "Save as PDF".</p>
        </div>
        <button onclick="window.print()" class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm shadow">
          Print / Save PDF
        </button>
      </div>
      <div class="prose max-w-none">
        ${formattedHtml}
      </div>
    </body>
    </html>
  `);

  printWindow.document.close();
  printWindow.focus();
}

/**
 * Local Draft Storage
 */
export function savePortfolioDraft(data: GeneratedPortfolioResult): void {
  try {
    const existing = loadPortfolioDrafts();
    const updated = [data, ...existing.filter((d) => d.id !== data.id)].slice(0, 10);
    localStorage.setItem(DRAFTS_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save draft:', err);
  }
}

export function loadPortfolioDrafts(): GeneratedPortfolioResult[] {
  try {
    const raw = localStorage.getItem(DRAFTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
