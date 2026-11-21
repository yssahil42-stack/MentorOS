import React, { useState, useMemo } from 'react';
import { ArrowLeftRight, Coins, Check, Copy, Calculator } from 'lucide-react';
import { Card3D } from './Card3D';
import { Button } from './Button';
import { Badge } from './Badge';
import { CurrencySelect } from './CurrencySelect';
import {
  convertCurrency,
  getExchangeRate,
  formatCurrencyAmount,
  getCurrencySymbol,
} from '../../utils/currency';
import { cn } from '../../utils/cn';

interface CurrencyConverterProps {
  initialAmount?: number;
  initialFromCurrency?: string;
  initialToCurrency?: string;
  onApplyRate?: (amount: number, currency: string) => void;
  applyButtonLabel?: string;
  variant?: 'card' | 'compact' | 'modal';
  className?: string;
}

export const CurrencyConverter: React.FC<CurrencyConverterProps> = ({
  initialAmount = 2500,
  initialFromCurrency = 'INR',
  initialToCurrency = 'USD',
  onApplyRate,
  applyButtonLabel = 'Apply to Rate Calculator',
  variant = 'card',
  className = '',
}) => {
  const [amount, setAmount] = useState<number>(initialAmount);
  const [fromCurrency, setFromCurrency] = useState<string>(initialFromCurrency);
  const [toCurrency, setToCurrency] = useState<string>(initialToCurrency);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Conversion calculations for ONLY the selected currency pair
  const convertedAmount = useMemo(() => {
    return convertCurrency(amount, fromCurrency, toCurrency);
  }, [amount, fromCurrency, toCurrency]);

  const exchangeRate = useMemo(() => {
    return getExchangeRate(fromCurrency, toCurrency);
  }, [fromCurrency, toCurrency]);

  const inverseRate = useMemo(() => {
    return getExchangeRate(toCurrency, fromCurrency);
  }, [fromCurrency, toCurrency]);

  // Swap currencies
  const handleSwap = () => {
    const temp = fromCurrency;
    setFromCurrency(toCurrency);
    setToCurrency(temp);
  };

  const handleCopy = () => {
    const text = `${formatCurrencyAmount(amount, fromCurrency)} = ${formatCurrencyAmount(convertedAmount, toCurrency)}`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Quick preset chips depending on source currency
  const quickPresets = useMemo(() => {
    if (fromCurrency === 'INR') {
      return [1000, 2500, 5000, 10000, 25000, 50000, 100000];
    }
    return [25, 50, 75, 100, 250, 500, 1000];
  }, [fromCurrency]);

  return (
    <Card3D
      maxTilt={variant === 'compact' ? 1 : 2}
      depth={20}
      variant="secondary"
      className={cn(
        'p-5 sm:p-6 border border-border-base/90 shadow-card backdrop-blur-md space-y-6',
        className
      )}
    >
      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border-base">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/25">
            <Coins className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-text-primary tracking-tight">
                Freelance Currency Converter
              </h3>
              <Badge variant="warning" size="sm">
                Real-Time Rate
              </Badge>
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Convert rates, hourly billing, and contract milestones between your selected
              currencies
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-lg bg-bg-base border border-border-base text-text-secondary">
            1 {fromCurrency} = {exchangeRate} {toCurrency}
          </span>
        </div>
      </div>

      {/* ── Conversion Inputs & Swapper ───────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        {/* Source Amount & Currency */}
        <div className="md:col-span-5 space-y-2">
          <label className="block text-xs font-semibold text-text-secondary">
            Amount &amp; Source Currency
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 font-semibold text-text-muted text-sm">
                {getCurrencySymbol(fromCurrency)}
              </span>
              <input
                type="number"
                min="0"
                step={fromCurrency === 'INR' ? '100' : '5'}
                value={amount || ''}
                onChange={(e) => setAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                placeholder="Enter amount..."
                className="w-full bg-bg-base border border-border-base rounded-xl pl-8 pr-3 py-2.5 text-base font-bold text-text-primary placeholder:text-text-faint focus:outline-none focus:border-amber-500/50 transition-colors"
              />
            </div>

            <CurrencySelect
              value={fromCurrency}
              onChange={(c) => setFromCurrency(c)}
              format="code-symbol"
              className="w-36 shrink-0"
              buttonClassName="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2.5 hover:border-amber-500/50"
              excludeValues={[toCurrency]}
            />
          </div>
        </div>

        {/* Swap Button */}
        <div className="md:col-span-2 flex justify-center pt-4 md:pt-0">
          <button
            type="button"
            onClick={handleSwap}
            title="Swap Currencies"
            className="p-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/25 transition-all active:scale-95 group shadow-2xs cursor-pointer"
          >
            <ArrowLeftRight className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
          </button>
        </div>

        {/* Target Currency */}
        <div className="md:col-span-5 space-y-2">
          <label className="block text-xs font-semibold text-text-secondary">Target Currency</label>
          <div className="flex gap-2">
            <CurrencySelect
              value={toCurrency}
              onChange={(c) => setToCurrency(c)}
              format="full"
              className="w-full"
              buttonClassName="w-full bg-bg-base border border-border-base rounded-xl px-3 py-2.5 hover:border-amber-500/50"
              excludeValues={[fromCurrency]}
            />
          </div>
        </div>
      </div>

      {/* ── Quick Preset Chips ────────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        <span className="text-3xs font-semibold text-text-muted uppercase tracking-wider shrink-0 mr-1">
          Quick Amounts:
        </span>
        {quickPresets.map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => setAmount(val)}
            className={cn(
              'px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all border shrink-0',
              amount === val
                ? 'bg-amber-500 text-stone-950 border-amber-500 font-bold shadow-2xs'
                : 'bg-bg-base/70 text-text-muted border-border-base hover:text-text-primary hover:border-amber-500/30'
            )}
          >
            {formatCurrencyAmount(val, fromCurrency)}
          </button>
        ))}
      </div>

      {/* ── Converted Result Hero Card (ONLY for the selected currency) ─────── */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-emerald-500/5 border border-amber-500/25 relative overflow-hidden space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
          <div>
            <span className="text-3xs uppercase tracking-wider font-semibold text-amber-600 dark:text-amber-400">
              Converted Amount ({toCurrency})
            </span>
            <div className="text-2xl sm:text-4xl font-extrabold text-text-primary font-mono tracking-tight mt-1 flex items-baseline gap-2 flex-wrap">
              <span>{formatCurrencyAmount(convertedAmount, toCurrency)}</span>
              <span className="text-xs font-semibold text-text-muted font-sans">
                from {formatCurrencyAmount(amount, fromCurrency)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2 sm:pt-0">
            <Button
              variant="secondary"
              size="xs"
              onClick={handleCopy}
              className="text-xs font-medium cursor-pointer"
              icon={
                isCopied ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )
              }
            >
              {isCopied ? 'Copied' : 'Copy'}
            </Button>
            {onApplyRate && (
              <Button
                variant="primary"
                size="xs"
                onClick={() =>
                  onApplyRate(toCurrency === 'INR' ? convertedAmount : amount, fromCurrency)
                }
                className="bg-amber-500 hover:bg-amber-600 text-stone-950 font-bold text-xs cursor-pointer"
                icon={<Calculator className="w-3.5 h-3.5" />}
              >
                {applyButtonLabel}
              </Button>
            )}
          </div>
        </div>

        {/* Rate Breakdown Details for Selected Pair */}
        <div className="pt-3 border-t border-amber-500/20 flex flex-wrap items-center justify-between gap-3 text-xs text-text-muted font-mono">
          <div className="flex items-center gap-4 flex-wrap">
            <span>
              Direct: 1 {fromCurrency} = {exchangeRate} {toCurrency}
            </span>
            <span>
              Reverse: 1 {toCurrency} = {inverseRate} {fromCurrency}
            </span>
          </div>
          <span className="text-3xs text-text-faint">
            Formula: {amount.toLocaleString()} × {exchangeRate} = {convertedAmount.toLocaleString()}
          </span>
        </div>
      </div>
    </Card3D>
  );
};
