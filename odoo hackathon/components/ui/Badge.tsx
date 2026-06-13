import { cn } from "@/lib/cn";

type Tone = "neutral" | "success" | "warn" | "danger" | "accent";

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  tone?: Tone;
  /** Renders a small leading status dot. */
  dot?: boolean;
};

/*
 * Tokens have no tinted-surface utility, so tones use a token text color over a
 * neutral surface. `currentColor`-based borders keep them readable on any bg.
 */
const tones: Record<Tone, string> = {
  neutral: "bg-bg-3 text-fg-muted border-border",
  success: "bg-bg-3 text-success border-success/30",
  warn: "bg-bg-3 text-warn border-warn/30",
  danger: "bg-bg-3 text-danger border-danger/30",
  accent: "bg-bg-3 text-accent border-accent/30",
};

export function Badge({ tone = "neutral", dot = false, className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...rest}
    >
      {dot && <span className="size-1.5 rounded-pill bg-current" aria-hidden />}
      {children}
    </span>
  );
}
