import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Send,
  X,
  Minimize2,
  Maximize2,
  Trash2,
  ExternalLink,
  CheckSquare,
  FileText,
  Copy,
  Check,
  Download,
} from 'lucide-react';
import { useWorkspace } from '../../contexts/WorkspaceContext';
import { useAuth } from '../../contexts/AuthContext';
import { getWorkspaceRole } from '../../utils/roleUtils';
import type { UserRole } from '../../types/user';
import { askChatbot, type ChatMessage } from '../../services/aiService';
import { MarkdownRenderer } from '../ui/MarkdownRenderer';
import { SaveFromAiModal, type SaveFromAiMode } from './SaveFromAiModal';
import { cn } from '../../utils/cn';

const STORAGE_KEY = 'mentoros_ask_chat_messages';

export function AskChatbotWidget() {
  const { isAskOpen, closeAsk, toggleAsk, askInitialQuery, showToast } = useWorkspace();
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  // Ask AI must ONLY show after login AND inside supported authenticated modules
  const activeRole = getWorkspaceRole(location.pathname, (user?.role as UserRole) || 'developer');
  const isAskSupported =
    Boolean(isAuthenticated && user) &&
    location.pathname.startsWith('/app') &&
    activeRole !== 'job_seeker' &&
    !location.pathname.startsWith('/app/job-seeker') &&
    user?.role !== 'job_seeker';

  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed: ChatMessage[] = JSON.parse(saved);
        return parsed.filter((m) => m.id !== 'msg-welcome');
      }
    } catch {
      // ignore
    }
    return [];
  });

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
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
    const firstLine = content
      .split('\n')[0]
      .replace(/^#+\s*/, '')
      .replace(/^\*+\s*/, '')
      .trim();
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

  const handleDeleteMessage = (idx: number) => {
    setMessages((prev) => prev.filter((_, i) => i !== idx));
    showToast('Deleted chat message', 'info');
  };

  // Clean up streaming timer on unmount
  useEffect(() => {
    return () => {
      if (streamingTimerRef.current) {
        clearInterval(streamingTimerRef.current);
      }
    };
  }, []);

  // Sync to session storage
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Handle incoming initial prompt from context
  useEffect(() => {
    if (askInitialQuery && isAskOpen) {
      setInput(askInitialQuery);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  }, [askInitialQuery, isAskOpen]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (isAskOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isAskOpen, isLoading]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isAskOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isAskOpen]);

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
      // Send message along with prior history turns (excluding welcome message)
      const historyToSend = messages.filter((m) => m.id !== 'msg-welcome').concat(userMessage);

      const res = await askChatbot({
        message: text,
        history: historyToSend,
        role: activeRole,
      });

      // Stop thinking indicator before starting typewriter streaming
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
        content: `⚠️ Sorry, I encountered an issue: ${err.message || 'Network error'}. Please try asking again.`,
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

  const handleClearChat = () => {
    if (streamingTimerRef.current) {
      clearInterval(streamingTimerRef.current);
      streamingTimerRef.current = null;
    }
    setIsStreaming(false);
    setMessages([]);
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    showToast('Chat history cleared', 'info');
  };

  // Do not render Ask AI in Job Seeker module
  if (!isAskSupported) {
    return null;
  }

  return (
    <>
      {/* ─── FLOATING ACTION BUTTON (When closed) ────────────────────── */}
      {!isAskOpen && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center gap-2 group animate-in fade-in slide-in-from-bottom-4 duration-300">
          <button
            type="button"
            onClick={() => toggleAsk()}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-xs',
              'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-stone-950 shadow-lg hover:shadow-orange-500/25',
              'border border-orange-400/50 hover:scale-105 active:scale-95 transition-all cursor-pointer'
            )}
            aria-label="Open Ask AI"
          >
            <div className="relative">
              <Sparkles className="w-4 h-4 text-stone-950 animate-pulse" />
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            </div>
            <span>Ask AI</span>
          </button>
        </div>
      )}

      {/* ─── FLOATING CHATBOT WINDOW (When opened) ───────────────────── */}
      {isAskOpen && (
        <div
          className={cn(
            'fixed z-50 flex flex-col bg-white dark:bg-bg-surface border border-border-base rounded-2xl shadow-2xl overflow-hidden transition-all duration-300',
            isExpanded
              ? 'inset-4 sm:inset-10 md:inset-16 max-w-5xl mx-auto'
              : 'bottom-6 right-6 w-[92vw] sm:w-[420px] md:w-[460px] h-[580px] max-h-[88vh]'
          )}
        >
          {/* Top Bar Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent border-b border-border-base flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-stone-950 shadow-sm shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-text-primary tracking-tight truncate">
                    Ask
                  </h3>
                  <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-orange-500/15 text-orange-600 dark:text-orange-400 border border-orange-500/30">
                    Conversational AI
                  </span>
                </div>
                <p className="text-[11px] text-text-muted truncate">
                  Queries &bull; Q&amp;A &bull; Mentorship (Not a roadmap generator)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <Link
                to="/app/ask"
                onClick={closeAsk}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-bg-elevated transition-colors"
                title="Open Full Page Chat"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>
              <button
                type="button"
                onClick={handleClearChat}
                className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                title="Clear conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setIsExpanded((prev) => !prev)}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-bg-elevated transition-colors cursor-pointer"
                title={isExpanded ? 'Restore size' : 'Expand window'}
              >
                {isExpanded ? (
                  <Minimize2 className="w-3.5 h-3.5" />
                ) : (
                  <Maximize2 className="w-3.5 h-3.5" />
                )}
              </button>
              <button
                type="button"
                onClick={closeAsk}
                className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-slate-100 dark:hover:bg-bg-elevated transition-colors cursor-pointer"
                title="Close chat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Notice Badge */}
          <div className="bg-amber-500/5 px-4 py-1.5 border-b border-amber-500/20 flex items-center justify-between text-[11px] text-amber-700 dark:text-amber-300">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500 shrink-0" />
              Ask any question, debug code, or request explanations
            </span>
            <span className="text-3xs uppercase font-mono font-bold text-text-muted">
              Role: {activeRole}
            </span>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 no-scrollbar">
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={cn(
                  'flex gap-2.5 animate-in fade-in duration-200',
                  msg.role === 'user' ? 'justify-end' : 'justify-start'
                )}
              >
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 mt-0.5 shadow-2xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed shadow-2xs',
                    msg.role === 'user'
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-stone-950 font-medium ml-8'
                      : 'bg-slate-50 dark:bg-bg-elevated border border-border-base text-text-primary'
                  )}
                >
                  {msg.role === 'user' ? (
                    <div className="flex items-start justify-between gap-2 group">
                      <div className="whitespace-pre-wrap flex-1">{msg.content}</div>
                      <button
                        type="button"
                        onClick={() => handleDeleteMessage(idx)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-black/15 transition-opacity text-stone-900 cursor-pointer shrink-0"
                        title="Delete this message"
                        aria-label="Delete this message"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="prose-chat relative">
                      <MarkdownRenderer content={msg.content} showCopyButton={false} />
                      {msg.isStreaming && (
                        <span
                          className="inline-block w-2 h-3.5 ml-1 bg-orange-500 rounded-2xs animate-pulse align-middle"
                          aria-label="Generating response"
                        />
                      )}

                      {/* Action Toolbar on Assistant Messages */}
                      {!msg.isStreaming && (
                        <div className="mt-3 pt-2 border-t border-border-base/70 flex items-center justify-between gap-1 flex-wrap">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => handleOpenSaveModal('task', msg.content, idx)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-3xs font-semibold bg-orange-500/10 hover:bg-orange-500/20 text-orange-600 dark:text-orange-400 border border-orange-500/25 transition-colors cursor-pointer"
                              title="Review and save as a task"
                            >
                              <CheckSquare className="w-3 h-3" />
                              <span>Save as Task</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenSaveModal('note', msg.content, idx)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-3xs font-semibold bg-slate-100 dark:bg-bg-base hover:bg-slate-200 dark:hover:bg-bg-surface text-text-secondary hover:text-text-primary border border-border-base transition-colors cursor-pointer"
                              title="Review and save as a note"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Save as Note</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => handleCopyMessage(msg.content, msg.id || idx)}
                              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-slate-200/60 dark:hover:bg-bg-base transition-colors cursor-pointer"
                              title="Copy response"
                            >
                              {copiedId === (msg.id || idx) ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDownloadMarkdown(msg.content, idx)}
                              className="p-1 rounded-md text-text-muted hover:text-text-primary hover:bg-slate-200/60 dark:hover:bg-bg-base transition-colors cursor-pointer"
                              title="Download markdown"
                            >
                              <Download className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(idx)}
                              className="p-1 rounded-md text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                              title="Delete this chat message"
                              aria-label="Delete this chat message"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {msg.timestamp && (
                    <div
                      className={cn(
                        'text-[10px] mt-1.5 text-right font-mono',
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
              <div className="flex gap-2.5 items-center animate-in fade-in duration-200">
                <div className="w-7 h-7 rounded-lg bg-orange-500/15 border border-orange-500/30 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0 shadow-2xs">
                  <Bot className="w-3.5 h-3.5 animate-bounce" />
                </div>
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-bg-elevated border border-border-base flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse delay-150" />
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse delay-300" />
                  </div>
                  <span className="text-[11px] text-text-muted font-medium">
                    Ask is thinking...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Input Area */}
          <div className="p-3 bg-white dark:bg-bg-surface border-t border-border-base shrink-0">
            <div className="relative flex items-end gap-2 bg-slate-50 dark:bg-bg-base border border-border-base rounded-xl p-2 focus-within:border-orange-500/70 focus-within:ring-1 focus-within:ring-orange-500/50 transition-all">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={isExpanded ? 3 : 2}
                disabled={isLoading || isStreaming}
                placeholder={`Ask any query, code question, or doubt... (Enter to send, Shift+Enter for newline)`}
                className="w-full bg-transparent resize-none text-xs text-text-primary placeholder:text-text-faint focus:outline-none max-h-32 leading-relaxed"
              />

              <button
                type="button"
                disabled={!input.trim() || isLoading || isStreaming}
                onClick={() => handleSendMessage()}
                className={cn(
                  'p-2 rounded-lg font-bold transition-all shrink-0 cursor-pointer',
                  input.trim() && !isLoading && !isStreaming
                    ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-sm'
                    : 'bg-slate-200 dark:bg-bg-elevated text-text-muted cursor-not-allowed'
                )}
                aria-label="Send message"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save as Task / Note Review Modal */}
      <SaveFromAiModal
        isOpen={saveModalConfig.isOpen}
        onClose={() => setSaveModalConfig((prev) => ({ ...prev, isOpen: false }))}
        mode={saveModalConfig.mode}
        initialTitle={saveModalConfig.title}
        initialContent={saveModalConfig.content}
        role={activeRole}
      />
    </>
  );
}
