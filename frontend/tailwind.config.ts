import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ─── Backgrounds (CSS variables with alpha support) ───
        bg: {
          base:     'rgb(var(--bg-base-rgb) / <alpha-value>)',
          surface:  'rgb(var(--bg-surface-rgb) / <alpha-value>)',
          elevated: 'rgb(var(--bg-elevated-rgb) / <alpha-value>)',
          overlay:  'rgb(var(--bg-overlay-rgb) / <alpha-value>)',
        },
        // ─── Borders ───────────────────────────────────────────
        border: {
          subtle:  'rgb(var(--border-subtle-rgb) / <alpha-value>)',
          DEFAULT: 'rgb(var(--border-rgb) / <alpha-value>)',
          base:    'rgb(var(--border-base-rgb) / <alpha-value>)',
          hover:   'rgb(var(--border-hover-rgb) / <alpha-value>)',
          strong:  'rgb(var(--border-strong-rgb) / <alpha-value>)',
        },
        // ─── Text ──────────────────────────────────────────────
        text: {
          primary:   'rgb(var(--text-primary-rgb) / <alpha-value>)',
          secondary: 'rgb(var(--text-secondary-rgb) / <alpha-value>)',
          muted:     'rgb(var(--text-muted-rgb) / <alpha-value>)',
          faint:     'rgb(var(--text-faint-rgb) / <alpha-value>)',
        },
        // ─── Role Accents ──────────────────────────────────────
        student: {
          50:  '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',   // primary (amber - source of truth: globals.css)
          600: '#D97706',
          700: '#B45309',
          900: '#78350F',
        },
        freelancer: {
          50:  '#FFF7ED',
          100: '#FFEDD5',
          200: '#FED7AA',
          300: '#FDBA74',
          400: '#FB923C',
          500: '#F97316',   // primary (orange flare - source of truth: globals.css)
          600: '#EA580C',
          700: '#C2410C',
          900: '#7C2D12',
        },
        developer: {
          50:  '#ECFEFF',
          100: '#CFFAFE',
          300: '#67E8F9',
          400: '#22D3EE',
          500: '#06B6D4',   // primary
          600: '#0891B2',
          700: '#0E7490',
          900: '#164E63',
        },
        job: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',   // primary
          600: '#059669',
          700: '#047857',
          900: '#064E3B',
        },
        job_seeker: {
          50:  '#ECFDF5',
          100: '#D1FAE5',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          900: '#064E3B',
        },
        // ─── Solar/Brand Theme Colors (Dynamic Light/Dark Mode) ──
        solar: {
          50:  'rgb(var(--solar-50-rgb, 239 246 255) / <alpha-value>)',
          100: 'rgb(var(--solar-100-rgb, 219 234 254) / <alpha-value>)',
          200: 'rgb(var(--solar-200-rgb, 191 219 254) / <alpha-value>)',
          300: 'rgb(var(--solar-300-rgb, 147 197 253) / <alpha-value>)',
          400: 'rgb(var(--solar-400-rgb, 96 165 250) / <alpha-value>)',
          500: 'rgb(var(--solar-500-rgb, 37 99 235) / <alpha-value>)',
          600: 'rgb(var(--solar-600-rgb, 29 78 216) / <alpha-value>)',
          700: 'rgb(var(--solar-700-rgb, 30 64 175) / <alpha-value>)',
          800: 'rgb(var(--solar-800-rgb, 30 58 138) / <alpha-value>)',
          900: 'rgb(var(--solar-900-rgb, 23 37 84) / <alpha-value>)',
          950: 'rgb(var(--solar-950-rgb, 15 23 42) / <alpha-value>)',
        },
        // ─── Semantic States ───────────────────────────────────
        success: {
          DEFAULT: '#16A34A',
          light:   '#22C55E',
          bg:      'rgba(22, 163, 74, 0.12)',
        },
        warning: {
          DEFAULT: '#D97706',
          light:   '#F59E0B',
          bg:      'rgba(217, 119, 6, 0.12)',
        },
        danger: {
          DEFAULT: '#DC2626',
          light:   '#EF4444',
          bg:      'rgba(220, 38, 38, 0.12)',
        },
        focus: 'var(--focus)',
      },
      // ─── Typography ──────────────────────────────────────────
      fontFamily: {
        sans:  ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      // ─── Spacing ─────────────────────────────────────────────
      spacing: {
        '4.5':  '1.125rem',
        '13':   '3.25rem',
        '15':   '3.75rem',
        '18':   '4.5rem',
        '22':   '5.5rem',
        '68':   '17rem',
        '72':   '18rem',
        '76':   '19rem',
        '80':   '20rem',
        '88':   '22rem',
        '96':   '24rem',
        '112':  '28rem',
        '128':  '32rem',
      },
      // ─── Border Radius ───────────────────────────────────────
      borderRadius: {
        'xl':   '0.75rem',
        '2xl':  '1rem',
        '3xl':  '1.5rem',
        '4xl':  '2rem',
      },
      // ─── Box Shadows / Glass ─────────────────────────────────
      boxShadow: {
        'glass':     'var(--shadow-glass)',
        'glass-lg':  'var(--shadow-glass-lg)',
        'glow-solar':'var(--shadow-glow-solar, 0 0 28px rgba(37,99,235,0.35))',
        'glow-amber':'0 0 24px rgba(217,119,6,0.4)',
        'glow-gold': '0 0 30px rgba(251,191,36,0.4)',
        'glow-indigo': '0 0 24px rgba(99,102,241,0.35)',
        'glow-violet': '0 0 24px rgba(139,92,246,0.35)',
        'glow-cyan':   '0 0 24px rgba(6,182,212,0.35)',
        'glow-mint':   '0 0 24px rgba(16,185,129,0.35)',
        'card':      'var(--shadow-card)',
        'card-hover':'var(--shadow-card-hover)',
        'inner-glow':'inset 0 0 16px rgba(245,158,11,0.12)',
      },
      // ─── Backdrop Blur ───────────────────────────────────────
      backdropBlur: {
        xs: '2px',
        '4xl': '48px',
      },
      // ─── Motion ──────────────────────────────────────────────
      transitionDuration: {
        '250': '250ms',
        '400': '400ms',
        '600': '600ms',
      },
      transitionTimingFunction: {
        'spring':      'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth':      'cubic-bezier(0.4, 0, 0.2, 1)',
        'ease-out-expo': 'cubic-bezier(0.19, 1, 0.22, 1)',
      },
      // ─── Animations ──────────────────────────────────────────
      keyframes: {
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-in-right': {
          from: { opacity: '0', transform: 'translateX(24px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to:   { opacity: '1', transform: 'scale(1)' },
        },
        'shimmer': {
          '0%':   { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1' },
          '50%':       { opacity: '0.5' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':       { transform: 'translateY(-10px)' },
        },
        'orbit': {
          from: { transform: 'rotate(0deg) translateX(80px) rotate(0deg)' },
          to:   { transform: 'rotate(360deg) translateX(80px) rotate(-360deg)' },
        },
      },
      animation: {
        'fade-in':        'fade-in 0.3s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'scale-in':       'scale-in 0.2s ease-out',
        'shimmer':        'shimmer 2s linear infinite',
        'pulse-glow':     'pulse-glow 2s ease-in-out infinite',
        'float':          'float 6s ease-in-out infinite',
        'float-slow':     'float 10s ease-in-out infinite',
        'orbit':          'orbit 8s linear infinite',
      },
      screens: {
        'xs':  '375px',
        'sm':  '640px',
        'md':  '768px',
        'lg':  '1024px',
        'xl':  '1280px',
        '2xl': '1536px',
      },
    },
  },
  plugins: [forms],
};

export default config;
