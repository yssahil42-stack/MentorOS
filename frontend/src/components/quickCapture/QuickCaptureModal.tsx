import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import {
  Mic,
  MicOff,
  X,
  Send,
  Tag,
  Target,
  Link2,
  Clock,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { useQuickCapture } from '../../contexts/QuickCaptureContext';
import type { CaptureType, CaptureSource } from '../../lib/quickCaptureDB';

export interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  prefill?: {
    title?: string;
    content?: string;
    type?: CaptureType;
    tags?: string[];
    source?: CaptureSource;
  };
}

const CAPTURE_TYPES: { value: CaptureType; label: string; icon: React.ReactNode }[] = [
  { value: 'task', label: 'Task', icon: <Target className="w-4 h-4" /> },
  { value: 'idea', label: 'Idea', icon: <AlertCircle className="w-4 h-4" /> },
  { value: 'note', label: 'Note', icon: <Send className="w-4 h-4" /> },
  { value: 'deadline', label: 'Deadline', icon: <Clock className="w-4 h-4" /> },
  { value: 'contact', label: 'Contact', icon: <Link2 className="w-4 h-4" /> },
  { value: 'link', label: 'Link', icon: <Link2 className="w-4 h-4" /> },
];

const TYPE_COLORS: Record<CaptureType, string> = {
  task: 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
  idea: 'bg-purple-500/20 text-purple-600 dark:text-purple-400 border-purple-500/30',
  note: 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
  deadline: 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
  contact: 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
  link: 'bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border-indigo-500/30',
};

export function QuickCaptureModal({ isOpen, onClose, prefill }: QuickCaptureModalProps) {
  const { capture, settings } = useQuickCapture();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<CaptureType>('note');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  // ─── Initialize Speech Recognition ──────────────────────────────────────────

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = settings.voiceLanguage || 'en-US';

      recognitionRef.current.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          }
        }
        if (finalTranscript) {
          setTranscript((prev) => prev + ' ' + finalTranscript);
          setContent((prev) => prev + ' ' + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, [settings.voiceLanguage]);

  // ─── Handle Prefill ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (prefill) {
      setTitle(prefill.title || '');
      setContent(prefill.content || '');
      setType(prefill.type || 'note');
      setTags(prefill.tags || []);
    } else {
      setTitle('');
      setContent('');
      setType('note');
      setTags([]);
    }
    setTagInput('');
    setIsSubmitting(false);
  }, [isOpen, prefill]);

  // ─── Focus Management ───────────────────────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => contentRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // ─── Tag Handling ───────────────────────────────────────────────────────────

  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ',') && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags((prev) => [...prev, newTag]);
      }
      setTagInput('');
    } else if (e.key === 'Backspace' && !tagInput && tags.length > 0) {
      setTags((prev) => prev.slice(0, -1));
    }
  };

  const removeTag = (tag: string) => {
    setTags((prev) => prev.filter((t) => t !== tag));
  };

  // ─── Voice Input ────────────────────────────────────────────────────────────

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setTranscript('');
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // ─── Submit ─────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() && !content.trim()) return;

    setIsSubmitting(true);
    try {
      await capture({
        title: title.trim() || 'Untitled',
        content: content.trim(),
        type,
        tags,
        source: prefill?.source || 'shortcut',
      });
      onClose();
    } catch (error) {
      console.error('Failed to capture:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ─── Keyboard Shortcuts ─────────────────────────────────────────────────────

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        onClose();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        handleSubmit(e as unknown as React.FormEvent);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        toggleListening();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, handleSubmit, toggleListening]);

  if (!isOpen) return null;

  return createPortal(
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Quick Capture"
      description="Capture a thought, task, or idea — organize later"
      size="lg"
      closeOnBackdrop={false}
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label
            htmlFor="capture-title"
            className="block text-xs font-medium text-text-muted mb-1.5"
          >
            Title
          </label>
          <input
            id="capture-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What's on your mind?"
            className="w-full bg-bg-base/80 border border-border-base rounded-xl px-3.5 py-2.5 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-solar-500/50 transition-colors"
            autoComplete="off"
          />
        </div>

        {/* Content */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-text-muted">Content</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={toggleListening}
              disabled={!recognitionRef.current}
              className={cn(
                'gap-1.5',
                isListening && 'bg-solar-500/10 text-solar-500 border-solar-500/30'
              )}
              aria-label={isListening ? 'Stop voice input' : 'Start voice input'}
            >
              {isListening ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{isListening ? 'Listening…' : 'Voice'}</span>
            </Button>
          </div>
          <textarea
            ref={contentRef}
            id="capture-content"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Details, context, links…"
            rows={4}
            className="w-full bg-bg-base/80 border border-border-base rounded-xl px-3.5 py-2.5 text-text-primary placeholder:text-text-faint focus:outline-none focus:border-solar-500/50 transition-colors resize-none"
          />
          {isListening && (
            <p className="mt-1.5 text-xs text-solar-500 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-solar-500 animate-pulse" />
              Listening… press{' '}
              <kbd className="px-1.5 py-0.5 bg-bg-base border border-border-base rounded text-[10px]">
                Ctrl+M
              </kbd>{' '}
              to stop
            </p>
          )}
        </div>

        {/* Type Selector */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5">Type</label>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Capture type">
            {CAPTURE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                role="radio"
                aria-checked={type === t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all',
                  type === t.value
                    ? TYPE_COLORS[t.value] + ' shadow-sm'
                    : 'bg-bg-base/80 text-text-muted border-border-base hover:border-border-hover hover:text-text-primary'
                )}
              >
                <span className="shrink-0">{t.icon}</span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Tags */}
        <div>
          <label className="block text-xs font-medium text-text-muted mb-1.5 flex items-center gap-1.5">
            Tags
            <Tag className="w-3.5 h-3.5 text-text-muted" />
          </label>
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-solar-500/10 text-solar-500 text-xs border border-solar-500/20"
              >
                #{tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:bg-solar-500/20 rounded-full p-0.5"
                  aria-label={`Remove tag ${tag}`}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={handleTagKeyDown}
              placeholder="Add tag (Enter/Comma)"
              className="flex-1 min-w-[120px] bg-bg-base/80 border border-border-base rounded-xl px-3 py-1.5 text-xs text-text-primary placeholder:text-text-faint focus:outline-none focus:border-solar-500/50 transition-colors"
            />
          </div>
          <p className="mt-1 text-[10px] text-text-faint">Press Enter or Comma to add tags</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border-base">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" loading={isSubmitting} className="min-w-[100px]">
            {isSubmitting ? 'Capturing…' : 'Capture'}
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>

        {/* Shortcuts Hint */}
        <div className="flex items-center justify-center gap-4 text-[10px] text-text-faint">
          <kbd className="px-1.5 py-0.5 bg-bg-base border border-border-base rounded">
            Ctrl+Enter
          </kbd>{' '}
          Save
          <kbd className="px-1.5 py-0.5 bg-bg-base border border-border-base rounded">
            Ctrl+M
          </kbd>{' '}
          Voice
          <kbd className="px-1.5 py-0.5 bg-bg-base border border-border-base rounded">Esc</kbd>{' '}
          Cancel
        </div>
      </form>
    </Modal>,
    document.body
  );
}
