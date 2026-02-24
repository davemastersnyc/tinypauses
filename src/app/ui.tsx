import type { ReactNode } from "react";
import { AppNav } from "./app-nav";

type PageShellProps = {
  children: ReactNode;
  maxWidth?: "sm" | "md" | "lg";
};

export function PageShell({ children, maxWidth = "lg" }: PageShellProps) {
  const maxWidthClass =
    maxWidth === "sm"
      ? "max-w-md"
      : maxWidth === "md"
        ? "max-w-xl"
        : "max-w-3xl";

  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <main className={`mx-auto flex w-full flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8 ${maxWidthClass}`}>
        {children}
      </main>
      <footer className="border-t border-[color:var(--color-border-subtle)] py-3 text-center text-xs text-[color:var(--color-foreground)]/55">
        <a
          href="https://quietbranches.com"
          target="_blank"
          rel="noreferrer"
          className="hover:text-[color:var(--color-primary)]"
        >
          Quiet Branches Labs 2026
        </a>
      </footer>
    </div>
  );
}

type ButtonProps = {
  children: ReactNode;
  href?: string;
  type?: "button" | "submit";
  variant?: "primary" | "secondary" | "ghost";
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
};

export function BrandButton({
  children,
  href,
  type = "button",
  variant = "primary",
  fullWidth,
  disabled,
  onClick,
}: ButtonProps) {
  const base =
    "inline-flex shrink-0 items-center justify-center whitespace-nowrap rounded-[var(--radius-pill)] px-6 py-3 text-sm font-semibold leading-none transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[color:var(--color-accent)]";

  const variants: Record<NonNullable<ButtonProps["variant"]>, string> = {
    primary:
      "bg-[color:var(--color-accent)] text-slate-900 shadow-[var(--shadow-soft)] hover:bg-orange-500 disabled:bg-orange-300",
    secondary:
      "border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface)] text-[color:var(--color-primary)] hover:bg-[color:var(--color-surface-soft)] disabled:bg-[color:var(--color-surface-soft)]",
    ghost:
      "bg-transparent text-[color:var(--color-accent)] hover:bg-[color:var(--color-accent-soft)]",
  };

  const width = fullWidth ? "w-full" : "";

  if (href) {
    return (
      <a
        href={href}
        className={`${base} ${variants[variant]} ${width}`}
        aria-disabled={disabled}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${width} disabled:cursor-not-allowed`}
    >
      {children}
    </button>
  );
}

type PillProps = {
  children: ReactNode;
};

export function BrandPill({ children }: PillProps) {
  return (
    <p className="inline-flex items-center rounded-[var(--radius-pill)] bg-[color:var(--color-accent-soft)] px-4 py-1 text-xs font-medium uppercase tracking-wide text-[color:var(--color-ink-on-accent-soft)] shadow-sm ring-1 ring-[color:var(--color-accent)]/30 backdrop-blur">
      {children}
    </p>
  );
}

type CardProps = {
  children: ReactNode;
  tone?: "default" | "muted" | "accent";
};

export function BrandCard({ children, tone = "default" }: CardProps) {
  const toneClass =
    tone === "muted"
      ? "bg-[color:var(--color-surface-soft)]"
      : tone === "accent"
        ? "bg-[color:var(--color-accent-soft)]"
        : "bg-[color:var(--color-surface)]";

  return (
    <section
      className={`rounded-[var(--radius-card)] ${toneClass} p-6 shadow-[var(--shadow-soft)]`}
    >
      {children}
    </section>
  );
}

