import React, { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface GoogleSignInButtonProps {
  onSuccess: (credential: string) => void;
  onError?: (error: string) => void;
  text?: 'signin_with' | 'signup_with' | 'continue_with';
  disabled?: boolean;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential: string }) => void;
            auto_select?: boolean;
            cancel_on_tap_outside?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              logo_alignment?: 'left' | 'center';
              width?: number | string;
            }
          ) => void;
          prompt: () => void;
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '787072444746-7cp6uis2gfde9ifat86il4rsk34q55a8.apps.googleusercontent.com';

export function GoogleSignInButton({
  onSuccess,
  onError,
  text = 'continue_with',
  disabled = false,
}: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    const initGIS = () => {
      if (window.google?.accounts?.id && containerRef.current) {
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: (response) => {
              if (response.credential) {
                setLoading(true);
                try {
                  onSuccess(response.credential);
                } finally {
                  setLoading(false);
                }
              } else {
                onError?.('Failed to receive Google credential token.');
              }
            },
            auto_select: false,
          });

          // Check if dark theme is active
          const isDark = document.documentElement.classList.contains('dark');

          // Clear previous render if any
          containerRef.current.innerHTML = '';

          window.google.accounts.id.renderButton(containerRef.current, {
            theme: isDark ? 'filled_black' : 'outline',
            size: 'large',
            text,
            shape: 'rectangular',
            logo_alignment: 'left',
            width: '100%',
          });

          setScriptLoaded(true);
          return true;
        } catch (err) {
          console.error('Failed to initialize Google Identity Services:', err);
          return false;
        }
      }
      return false;
    };

    if (!initGIS()) {
      interval = setInterval(() => {
        if (initGIS()) {
          clearInterval(interval);
        }
      }, 300);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [onSuccess, onError, text]);

  return (
    <div className="w-full flex flex-col items-center justify-center">
      <div
        ref={containerRef}
        className={`w-full flex justify-center min-h-[44px] ${
          disabled || loading ? 'opacity-50 pointer-events-none' : ''
        }`}
      />
      {!scriptLoaded && (
        <div className="w-full h-10 rounded-xl border border-border-base bg-bg-surface flex items-center justify-center gap-2 text-xs font-semibold text-text-muted animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin text-text-faint" />
          <span>Connecting to Google Identity...</span>
        </div>
      )}
    </div>
  );
}
