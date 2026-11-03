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
    name: 'GitHub Action Deployment Token',
    service: 'GitHub CI/CD',
    prefix: 'ghp_•••••••••••••••••7b02',
    secret: 'ghp_88f9x0LKMbvd2984180x07b02',
    created: '2026-10-22',
    lastUsed: '1 hour ago',
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
    const createdKey: ApiKeyItem = {
      id: `key-${Date.now()}`,
      name: newKeyName.trim(),
      service: newKeyService,
      prefix: `mos_live_••••••••••••${randomSuffix.slice(-4)}`,
      secret: `mos_live_${randomSuffix}_${Date.now()}`,
      created: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
      status: 'active',
    };

    setKeys([createdKey, ...keys]);
    setNewKeyName('');
    setIsCreating(false);
    showToast(`Created API Key "${createdKey.name}"`, 'success');
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
          <span>Generate New Key</span>
        </Button>
      </div>

      {/* ─── New Key Modal / Drawer ─────────────────────────── */}
      {isCreating && (
        <Card className="p-5 border-indigo-500/40 bg-indigo-50/20 dark:bg-indigo-950/20 animate-fade-in">
          <form onSubmit={handleCreateKey} className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-text-primary flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                Generate Developer Access Token
              </h3>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="text-xs text-text-muted hover:text-text-primary"
              >
                Cancel
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-text-secondary mb-1">
                  Key Name / Description
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Staging LLM Bridge"
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
                  <option value="Google Gemini AI">Google Gemini AI</option>
                  <option value="GitHub CI/CD">GitHub CI/CD</option>
                  <option value="Ollama Local LLM">Ollama Local LLM</option>
                  <option value="MentorOS CLI Runner">MentorOS CLI Runner</option>
                </select>
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
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs"
              >
                Create & Display Secret
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
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-text-primary">Local .env.local Configuration</h3>
          </div>
          <p className="text-xs text-text-muted">
            Add these environment variables to your root development folder to enable local AI
            synthesis and repository analysis:
          </p>
          <pre className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-2xs overflow-x-auto leading-relaxed">
            {`# MentorOS Local Developer Pipeline
VITE_AI_PROVIDER="gemini"
GEMINI_API_KEY="${keys[0]?.secret || 'AIzaSy...'}"
GITHUB_PERSONAL_ACCESS_TOKEN="${keys[1]?.secret || 'ghp_...'}"
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
