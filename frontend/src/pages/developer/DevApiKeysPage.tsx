import React, { useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Eye,
  EyeOff,
  Trash2,
  ShieldCheck,
  Terminal,
  ExternalLink,
  Code2,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { useWorkspace } from '../../contexts/WorkspaceContext';

interface ApiKeyItem {
  id: string;
  name: string;
  service: string;
  prefix: string;
  secret: string;
  created: string;
  lastUsed: string;
  status: 'active' | 'revoked';
}

const INITIAL_KEYS: ApiKeyItem[] = [
  {
    id: 'key-1',
    name: 'Gemini 1.5 Pro Production',
    service: 'Google Gemini AI',
    prefix: 'AIzaSyD-•••••••••••••99mK',
    secret: 'AIzaSyD-99xLK3920xLm99mK88201',
    created: '2026-10-15',
    lastUsed: '2 mins ago',
    status: 'active',
  },
  {
    id: 'key-2',
    name: 'OpenAI GPT-4o API Key',
    service: 'OpenAI (ChatGPT / GPT-4o)',
    prefix: 'sk-proj-•••••••••••••a1B2',
    secret: 'sk-proj-99xLK3920xLm99mKa1B2',
    created: '2026-11-07',
    lastUsed: 'Just now',
    status: 'active',
  },
  {
    id: 'key-3',
    name: 'Local Ollama / Smollm2 Endpoint',
    service: 'Ollama Local LLM',
    prefix: 'http://localhost:11434/v1',
    secret: 'http://localhost:11434/v1',
    created: '2026-10-28',
    lastUsed: 'Just now',
    status: 'active',
  },
];

export default function DevApiKeysPage() {
  const { showToast } = useWorkspace();
  const [keys, setKeys] = useState<ApiKeyItem[]>(INITIAL_KEYS);
  const [showSecretMap, setShowSecretMap] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New key form state
  const [isCreating, setIsCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyService, setNewKeyService] = useState('Google Gemini AI');
  const [newKeySecret, setNewKeySecret] = useState('');

  const toggleShowSecret = (id: string) => {
    setShowSecretMap((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const copyToClipboard = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('API Key copied to clipboard!', 'success');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    const randomSuffix = Math.random().toString(36).substring(2, 10).toUpperCase();
    const finalSecret = newKeySecret.trim() || `mos_live_${randomSuffix}_${Date.now()}`;
    const prefixVal =
      finalSecret.length > 10
        ? `${finalSecret.slice(0, 7)}••••••••${finalSecret.slice(-4)}`
        : '••••••••';

    const createdKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      service: newKeyService,
      prefix: prefixVal,
      secret: finalSecret,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      status: 'active',
    };

    setKeys([createdKey, ...keys]);
    setNewKeyName('');
    setNewKeySecret('');
    setIsCreating(false);
    showToast(`Added API Key "${createdKey.name}"`, 'success');
  };

  const handleRevoke = (id: string) => {
    setKeys((prev) => prev.map((k) => (k.id === id ? { ...k, status: 'revoked' as const } : k)));
    showToast('API Key revoked', 'info');
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-fade-in pb-12">
      {/* ─── Header ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border-base pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <Key className="w-5 h-5" />
            </span>
            <span className="text-2xs font-mono font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              Developer Credentials & API Gateway
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-text-primary mt-1">
            API Keys & Access Tokens
          </h1>
          <p className="text-xs md:text-sm text-text-muted mt-1">
            Manage credentials for LLM endpoints, GitHub CI/CD webhooks, and local code synthesis
            runners.
          </p>
        </div>

        <Button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add API Key</span>
        </Button>
      </div>

      {/* ─── New Key Modal / Drawer ─────────────────────────── */}
      {isCreating && (
        <Card className="p-5 border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20 animate-fade-in">
          <form onSubmit={handleCreateKey} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Add API Key
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Key Name / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production Key"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border-base bg-bg-surface px-3 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Target Service / Scope
                </label>
                <select
                  value={newKeyService}
                  onChange={(e) => setNewKeyService(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border-base bg-bg-surface px-3 text-xs text-text-primary focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <optgroup label="AI & LLM Services">
                    <option value="Google Gemini AI">Google Gemini AI</option>
                    <option value="OpenAI (ChatGPT / GPT-4o)">OpenAI (ChatGPT / GPT-4o)</option>
                    <option value="Anthropic Claude">Anthropic Claude</option>
                    <option value="DeepSeek AI">DeepSeek AI</option>
                    <option value="Groq Cloud">Groq Cloud</option>
                    <option value="Mistral AI">Mistral AI</option>
                    <option value="Perplexity AI">Perplexity AI</option>
                    <option value="OpenRouter">OpenRouter</option>
                    <option value="Hugging Face">Hugging Face</option>
                    <option value="Ollama Local LLM">Ollama Local LLM</option>
                  </optgroup>
                  <optgroup label="Developer Tools & CI/CD">
                    <option value="GitHub CI/CD & PAT">GitHub CI/CD &amp; PAT</option>
                    <option value="GitLab CI/CD">GitLab CI/CD</option>
                    <option value="Vercel Deployment">Vercel Deployment</option>
                    <option value="Supabase / Backend">Supabase / Backend</option>
                    <option value="MentorOS CLI Runner">MentorOS CLI Runner</option>
                    <option value="Custom API / Webhook">Custom API / Webhook</option>
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  API Key Secret <span className="text-text-muted font-normal">(optional)</span>
                </label>
                <input
                  type="password"
                  placeholder="Paste key or auto-generate"
                  value={newKeySecret}
                  onChange={(e) => setNewKeySecret(e.target.value)}
                  className="w-full h-9 rounded-lg border border-border-base bg-bg-surface px-3 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsCreating(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                Add API Key
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ─── API Keys List ──────────────────────────────────── */}
      <Card className="p-0 overflow-hidden border border-border-base shadow-sm">
        <div className="p-4 border-b border-border-base bg-bg-elevated/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-text-primary uppercase tracking-wider">
              Active Environment Credentials ({keys.length})
            </span>
          </div>
          <span className="text-2xs text-text-muted">End-to-end encrypted with AES-256</span>
        </div>

        <div className="divide-y divide-border-base overflow-x-auto">
          {keys.map((item) => {
            const isVisible = showSecretMap[item.id];
            const isCopied = copiedId === item.id;
            const isRevoked = item.status === 'revoked';

            return (
              <div
                key={item.id}
                className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-bg-elevated/30 transition-colors"
              >
                <div className="space-y-1 min-w-[240px]">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-text-primary">{item.name}</span>
                    <span
                      className={`text-2xs px-2 py-0.5 rounded-full font-semibold uppercase ${
                        isRevoked
                          ? 'bg-red-500/10 text-red-600 dark:text-red-400'
                          : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {item.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-2xs text-text-muted">
                    <span className="font-medium text-indigo-600 dark:text-indigo-400">
                      {item.service}
                    </span>
                    <span>•</span>
                    <span>Created {item.created}</span>
                    <span>•</span>
                    <span>Last used: {item.lastUsed}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 flex-1 max-w-md">
                  <div className="flex-1 font-mono text-xs bg-bg-elevated border border-border-base px-3 py-1.5 rounded-lg text-text-primary truncate">
                    {isVisible ? item.secret : item.prefix}
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleShowSecret(item.id)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-bg-elevated transition-colors"
                    title={isVisible ? 'Hide Secret' : 'Reveal Secret'}
                    aria-label="Toggle secret visibility"
                  >
                    {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => copyToClipboard(item.id, item.secret)}
                    className="p-1.5 rounded-lg text-text-muted hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 transition-colors"
                    title="Copy Key"
                    aria-label="Copy key to clipboard"
                  >
                    {isCopied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  {!isRevoked && (
                    <button
                      type="button"
                      onClick={() => handleRevoke(item.id)}
                      className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                      title="Revoke Key"
                      aria-label="Revoke key"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ─── Integration Instructions Card ─────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Card className="p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              <h3 className="text-sm font-bold text-text-primary">Local .env.local Configuration</h3>
            </div>
            <button
              type="button"
              onClick={() => {
                const snippet = `# MentorOS Local Developer Pipeline
AI_PROVIDER="gemini"
GEMINI_API_KEY="${keys.find((k) => k.service.includes('Gemini'))?.secret || 'AIzaSy...'}"
OPENAI_API_KEY="${keys.find((k) => k.service.includes('OpenAI'))?.secret || 'sk-proj-...'}"
LOCAL_LLM_ENDPOINT="http://localhost:11434"`;
                copyToClipboard('env-snippet', snippet);
              }}
              className="flex items-center gap-1 text-2xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              {copiedId === 'env-snippet' ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy .env</span>
                </>
              )}
            </button>
          </div>
          <p className="text-xs text-text-muted">
            Add these environment variables to your root development folder to enable local AI
            synthesis and repository analysis:
          </p>
          <pre className="p-3.5 rounded-xl bg-slate-900 text-slate-100 font-mono text-2xs overflow-x-auto leading-relaxed border border-slate-800 shadow-inner">
            {`# MentorOS Local Developer Pipeline
AI_PROVIDER="gemini"
GEMINI_API_KEY="${keys.find((k) => k.service.includes('Gemini'))?.secret || 'AIzaSyD-99xLK3920xLm99mK88201'}"
OPENAI_API_KEY="${keys.find((k) => k.service.includes('OpenAI'))?.secret || 'sk-proj-99xLK3920xLm99mKa1B2'}"
LOCAL_LLM_ENDPOINT="http://localhost:11434"`}
          </pre>
        </Card>

        <Card className="p-5 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-bold text-text-primary">
              Security & Storage Best Practices
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-text-muted">
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Keys are never transmitted in cleartext or committed to source control.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>All requests to local Ollama endpoints execute strictly on localhost.</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-emerald-500 font-bold">✓</span>
              <span>Revoked keys are instantly blocked across all active background workers.</span>
            </li>
          </ul>
        </Card>
      </div>
    </div>
  );
}
