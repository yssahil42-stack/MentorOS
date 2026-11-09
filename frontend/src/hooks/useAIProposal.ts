import { useState, useRef, useCallback, useEffect } from 'react';
import type { AIProposal } from '../types/aiProposal';
import { useWorkspace } from '../contexts/WorkspaceContext';

export type AIProposalStatus = 'idle' | 'streaming' | 'done' | 'error';

export interface ProposeOptions {
  role?: string;
  context?: Record<string, unknown>;
}

export function useAIProposal() {
  const { showToast } = useWorkspace();
  const [status, setStatus] = useState<AIProposalStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isTimeout, setIsTimeout] = useState(false);
  const [lastPrompt, setLastPrompt] = useState<string>('');
  const [lastOptions, setLastOptions] = useState<ProposeOptions | undefined>();

  const abortControllerRef = useRef<AbortController | null>(null);
  const timeoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const cleanupTimers = useCallback(() => {
    if (timeoutTimerRef.current) {
      clearTimeout(timeoutTimerRef.current);
      timeoutTimerRef.current = null;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const cancel = useCallback(() => {
    cleanupTimers();
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setStatus('idle');
    setProgress(0);
    setIsTimeout(false);
    showToast('Cancelled', 'info');
  }, [cleanupTimers, showToast]);

  const propose = useCallback(
    async (prompt: string, options?: ProposeOptions): Promise<AIProposal | null> => {
      const trimmed = prompt.trim();
      if (!trimmed) return null;

      setLastPrompt(trimmed);
      setLastOptions(options);
      setStatus('streaming');
      setProgress(8);
      setError(null);
      setIsTimeout(false);
      cleanupTimers();

      const controller = new AbortController();
      abortControllerRef.current = controller;

      // Increment progress smoothly while generation streams
      progressIntervalRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 92) return prev;
          const inc = Math.max(1, Math.floor((92 - prev) * 0.12));
          return Math.min(prev + inc, 92);
        });
      }, 400);

      // 90-second timeout handler
      timeoutTimerRef.current = setTimeout(() => {
        setIsTimeout(true);
      }, 90_000);

      try {
        const token = localStorage.getItem('mentor_token');
        const baseUrl =
          import.meta.env.VITE_API_URL ||
          (import.meta.env.PROD ? '/api/v1' : 'http://127.0.0.1:8000/api/v1');
        const role = options?.role || 'developer';

        const response = await fetch(`${baseUrl}/ai/propose`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({
            request_text: trimmed,
            role,
            ...(options?.context ? { context: options.context } : {}),
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const errBody = await response.json().catch(() => null);
          const message = errBody?.detail || response.statusText || 'Failed to generate proposal';
          throw new Error(message);
        }

        // ReadableStream consumption
        let accumulatedText = '';
        if (response.body) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let done = false;

          while (!done) {
            const { value, done: streamDone } = await reader.read();
            done = streamDone;
            if (value) {
              const chunk = decoder.decode(value, { stream: !done });
              accumulatedText += chunk;
              setProgress((prev) => Math.min(prev + 5, 96));
            }
          }
        } else {
          accumulatedText = await response.text();
        }

        cleanupTimers();

        // Parse proposal from accumulated response
        let parsedProposal: AIProposal;
        if (accumulatedText.includes('data:')) {
          const jsonLines = accumulatedText
            .split('\n')
            .filter((l) => l.trim().startsWith('data:'))
            .map((l) => l.replace(/^data:\s*/, '').trim());
          const lastJson = jsonLines[jsonLines.length - 1];
          parsedProposal = JSON.parse(lastJson);
        } else {
          parsedProposal = JSON.parse(accumulatedText);
        }

        setProgress(100);
        setStatus('done');
        return parsedProposal;
      } catch (err: any) {
        cleanupTimers();
        if (err.name === 'AbortError') {
          return null;
        }
        const errorMsg = err.message || 'An error occurred while generating the proposal';
        setError(errorMsg);
        setStatus('error');
        showToast(errorMsg, 'error');
        return null;
      }
    },
    [cleanupTimers, showToast]
  );

  const retry = useCallback(() => {
    if (lastPrompt) {
      return propose(lastPrompt, lastOptions);
    }
    return Promise.resolve(null);
  }, [lastPrompt, lastOptions, propose]);

  useEffect(() => {
    return () => {
      cleanupTimers();
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [cleanupTimers]);

  return {
    propose,
    cancel,
    retry,
    progress,
    status,
    error,
    isTimeout,
  };
}
