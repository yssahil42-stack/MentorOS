import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Send,
  Trash2,
  Info,
  CheckSquare,
  FileText,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import type { UserRole } from '../../types/user';
import { askChatbot, checkAiHealth, type ChatMessage } from '../../services/aiService';
import { MarkdownRenderer } from '../../components/ui/MarkdownRenderer';
import { SaveFromAiModal, type SaveFromAiMode } from '../../components/ai/SaveFromAiModal';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { cn } from '../../utils/cn';

type SupportedAskRole = 'developer' | 'student' | 'freelancer';

const STORAGE_KEY = 'mentoros_ask_page_chat';

export default function AskChatbotPage() {
  const { showToast } = useWorkspace();
  const { user } = useAuth();

  // Ask AI is strictly for student, freelancer, and developer modules — NOT job seeker
  if (user?.role === 'job_seeker') {
    return <Navigate to="/app/job-seeker/dashboard" replace />;
  }

  const initialRole: SupportedAskRole =
    user?.role === 'student' || user?.role === 'freelancer' ? user.role : 'developer';

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ChatMessage[] = JSON.parse(saved);
        return parsed.filter((m) => m.id !== 'msg-welcome-page');
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [selectedRole, setSelectedRole] = useState<SupportedAskRole>(initialRole);
  const [aiStatusInfo, setAiStatusInfo] = useState<{ online: boolean; model: string }>({
    online: true,
    model: 'Groq LPU Engine / Conversational AI',
  });
  const [saveModalConfig, setSaveModalConfig] = useState<{
    isOpen: boolean;
    mode: SaveFromAiMode;
    title: string;
    content: string;
  }>({
    isOpen: false,
    mode: 'task',
    title: '',
    content: '',
  });
  const [copiedId, setCopiedId] = useState<string | number | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamingTimerRef = useRef<number | null>(null);

  const deriveInitialTitle = (content: string, msgIdx: number) => {
    if (msgIdx > 0 && messages[msgIdx - 1]?.role === 'user') {
      const userPrompt = messages[msgIdx - 1].content.trim();
      if (userPrompt.length <= 60) return userPrompt;
      return userPrompt.slice(0, 57) + '...';
    }
    const firstLine = content.split('\n')[0].replace(/^#+\s*/, '').replace(/^\*+\s*/, '').trim();
    if (firstLine.length > 3 && firstLine.length <= 60) return firstLine;
    return 'Actionable Insight';
  };

  const handleOpenSaveModal = (mode: SaveFromAiMode, content: string, msgIdx: number) => {
    const derived = deriveInitialTitle(content, msgIdx);
    setSaveModalConfig({
      isOpen: true,
      mode,
      title: derived,
      content,
    });
  };

  const handleCopyMessage = (content: string, id: string | number) => {
    navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    showToast('Copied response to clipboard', 'info');
  };

  const handleDownloadMarkdown = (content: string, idx: number) => {
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mentoros-ai-response-${idx + 1}.md`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Downloaded markdown file', 'info');
  };

  // Clean up streaming on unmount
  useEffect(() => {
    return () => {
      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
      }
    };
  }, []);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Check AI health on mount
  useEffect(() => {
    checkAiHealth().then((info) => setAiStatusInfo(info)).catch(() => {});
  }, []);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend ?? input).trim();
    if (!text || isLoading || isStreaming) return;

    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const historyToSend = messages
        .filter((m) => m.id !== 'msg-welcome-page')
        .concat(userMessage);

      const res = await askChatbot({
        message: text,
        history: historyToSend,
        role: selectedRole,
      });

      // Stop thinking animation before starting typewriter streaming
      setIsLoading(false);
      setIsStreaming(true);

      const assistantMsgId = `msg-${Date.now()}-ai`;
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      // Tokenize reply into words while preserving spaces & newlines
      const tokens = res.reply.match(/(\S+\s*)/g) || [res.reply];
      let currentTokenIdx = 0;

      // Initialize empty assistant message with isStreaming flag
      setMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          content: '',
          timestamp,
          isStreaming: true,
        },
      ]);

      const intervalMs = Math.max(16, Math.min(32, Math.floor(1800 / tokens.length)));

      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
      }

      streamingTimerRef.current = window.setInterval(() => {
        currentTokenIdx++;
        const currentSlice = tokens.slice(0, currentTokenIdx).join('');
        const isStillStreaming = currentTokenIdx < tokens.length;

        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === assistantMsgId
              ? { ...msg, content: currentSlice, isStreaming: isStillStreaming }
              : msg
          )
        );

        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

        if (!isStillStreaming) {
          if (streamingTimerRef.current) {
            clearInterval(streamingTimerRef.current);
            streamingTimerRef.current = null;
          }
          setIsStreaming(false);
        }
      }, intervalMs);
    } catch (err: any) {
      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
        streamingTimerRef.current = null;
      }
      setIsLoading(false);
      setIsStreaming(false);

      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `⚠️ Encountered an issue fetching answer: ${err.message || 'Network error'}. Please try again.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearThread = () => {
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
    setIsStreaming(false);
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    showToast('Conversation cleared', 'info');
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto pb-8">
      {/* ─── Header ───────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-border-base">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-stone-950 shadow-sm shrink-0">
              <Bot className="w-4 h-4" />
            </div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-extrabold text-text-primary tracking-tight">
                Ask
              </h1>
              <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/25">
                Conversational AI &bull; Q&amp;A
              </span>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-text-secondary max-w-2xl">
            Conversational assistant for queries, doubts, debugging, and concept explanations. (Not a roadmap generator).
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Role Filter Selector */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-bg-surface border border-border-base text-xs font-medium">
            <span className="text-3xs uppercase font-semibold text-text-muted">Context:</span>
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value as SupportedAskRole)}
              className="bg-transparent text-xs font-bold text-text-primary focus:outline-none cursor-pointer capitalize"
            >
              <option value="developer" className="bg-bg-surface text-text-primary">Developer</option>
              <option value="student" className="bg-bg-surface text-text-primary">Student</option>
              <option value="freelancer" className="bg-bg-surface text-text-primary">Freelancer</option>
            </select>
          </div>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleClearThread}
            className="text-xs font-semibold hover:text-danger hover:border-danger/30"
            icon={<Trash2 className="w-3.5 h-3.5" />}
          >
            Clear Chat
          </Button>
        </div>
      </div>

      {/* ─── Conversational Chat Viewport ───────────────────────────────────── */}
      <div className="max-w-4xl mx-auto space-y-4">
        <div className="flex flex-col h-[700px] max-h-[82vh] rounded-2xl border border-border-base bg-white dark:bg-bg-surface shadow-sm overflow-hidden">
          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 no-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={cn(
                  'flex gap-3 animate-in fade-in duration-200',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl p-4 text-xs leading-relaxed shadow-2xs',
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 font-medium ml-10'
                      : 'bg-slate-50 dark:bg-bg-elevated border border-border-base text-text-primary'
                  )}
                >
                  {msg.role === 'user' ? (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  ) : (
                    <div className="prose-chat relative">
                      <MarkdownRenderer content={msg.content} showCopyButton={false} />
                      {msg.isStreaming && (
                        <span
                          className="inline-block w-2 h-4 ml-1 bg-orange-500 rounded-2xs animate-pulse align-middle"
                          aria-label="Generating response"
                        />
                      )}

                      {/* Action Toolbar on Assistant Messages */}
                      {!msg.isStreaming && (
                        <div className="mt-3 pt-2.5 border-t border-border-base/70 flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOpenSaveModal('task', msg.content, idx)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/25 transition-colors cursor-pointer"
                              title="Review and save as a task"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>Save as Task</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenSaveModal('note', msg.content, idx)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-bg-base hover:bg-slate-200 dark:hover:bg-bg-surface text-text-secondary hover:text-text-primary border border-border-base transition-colors cursor-pointer"
                              title="Review and save as a note"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <span>Save as Note</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.content, msg.id || idx)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-200/60 dark:hover:bg-bg-base transition-colors cursor-pointer"
                              title="Copy response"
                            >
                              {copiedId === (msg.id || idx) ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadMarkdown(msg.content, idx)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-200/60 dark:hover:bg-bg-base transition-colors cursor-pointer"
                              title="Download markdown"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.timestamp && (
                    <div
                      className={cn(
                        'text-[10px] mt-2 text-right font-mono',
                        msg.role === 'user' ? 'text-stone-800/70' : 'text-text-muted'
                      )}
                    >
                      {msg.timestamp}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Typing / Loading Indicator */}
            {isLoading && (
              <div className="flex gap-3 items-center animate-in fade-in duration-200">
                <div className="w-8 h-8 rounded-xl bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <Bot className="w-4 h-4 animate-bounce" />
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-bg-elevated border border-border-base flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse delay-150" />
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse delay-300" />
                  </div>
                  <span className="text-xs text-text-muted font-medium">Ask is synthesizing response...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Dock */}
          <div className="p-4 bg-white dark:bg-bg-surface border-t border-border-base shrink-0">
            <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-bg-base border border-border-base rounded-xl p-2.5 focus-within:border-orange-500/70 focus-within:ring-1 focus-within:ring-orange-500/50 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                disabled={isLoading || isStreaming}
                placeholder="Ask any query, code question, or doubt... (Enter to send, Shift+Enter for new line)"
                className="w-full bg-transparent resize-none text-xs text-text-primary placeholder:text-text-faint focus:outline-none max-h-36 leading-relaxed"
              />

              <button
                type="button"
                disabled={!input.trim() || isLoading || isStreaming}
                onClick={() => handleSendMessage()}
                className={cn(
                  'p-2.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5',
                  input.trim() && !isLoading && !isStreaming
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-bg-elevated text-text-muted cursor-not-allowed'
                )}
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
                <span className="hidden sm:inline text-xs">Send</span>
              </button>
            </div>
          </div>
        </div>

        {/* Assistant Info Footer */}
        <Card className="p-3.5 border-border-base/70 bg-gradient-to-br from-bg-surface to-bg-base flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-text-muted">
          <div className="flex items-center gap-2 text-text-primary font-semibold">
            <Info className="w-4 h-4 text-orange-500 shrink-0" />
            <span>Ask AI Mentorship</span>
          </div>
          <span className="text-3xs sm:text-xs text-text-muted">
            Direct conversational Q&amp;A, troubleshooting, and discussions (Not a roadmap generator).
          </span>
        </Card>
      </div>

      {/* Save as Task / Note Review Modal */}
      <SaveFromAiModal
        isOpen={saveModalConfig.isOpen}
        onClose={() => setSaveModalConfig((prev) => ({ ...prev, isOpen: false }))}
        mode={saveModalConfig.mode}
        initialTitle={saveModalConfig.title}
        initialContent={saveModalConfig.content}
        role={selectedRole}
      />
    </div>
  );
}
