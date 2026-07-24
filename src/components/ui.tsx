import type { ButtonHTMLAttributes, ReactNode } from 'react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

const VARIANTS: Record<Variant, string> = {
  primary:
    'bg-brand text-white hover:brightness-110 active:brightness-95 shadow-lg shadow-brand/30',
  secondary: 'bg-surface-2 text-text hover:bg-border border border-border',
  ghost: 'bg-transparent text-brand hover:bg-surface-2',
  danger: 'bg-danger text-white hover:brightness-110',
};

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  full?: boolean;
}

export function Button({ variant = 'secondary', full, className = '', ...props }: BtnProps) {
  return (
    <button
      {...props}
      className={`tap inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-base font-semibold transition disabled:opacity-40 disabled:pointer-events-none ${VARIANTS[variant]} ${full ? 'w-full' : ''} ${className}`}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="tap flex w-full items-center justify-between gap-4 rounded-2xl bg-surface px-4 py-3 text-left"
    >
      <span className="min-w-0">
        <span className="block font-medium text-text">{label}</span>
        {hint && <span className="block text-sm text-muted">{hint}</span>}
      </span>
      <span
        className={`relative h-7 w-12 flex-shrink-0 rounded-full transition ${checked ? 'bg-brand' : 'bg-border'}`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-all ${checked ? 'left-6' : 'left-1'}`}
        />
      </span>
    </button>
  );
}

export function PageHeader({ title, right }: { title: string; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <h1 className="text-2xl font-bold text-text">{title}</h1>
      {right}
    </div>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-border bg-surface p-4 ${className}`}>{children}</div>
  );
}
