import { forwardRef } from "react";
import { cn } from "@/lib/cn";
import { Spinner } from "./Spinner";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  leadingIcon?: React.ReactNode;
  trailingIcon?: React.ReactNode;
};

const base =
  "inline-flex items-center justify-center gap-2 font-medium rounded-md whitespace-nowrap " +
  "transition-[background-color,border-color,color,opacity,transform] duration-150 ease-out " +
  "active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-bg hover:bg-accent-2",
  secondary: "bg-bg-3 text-fg border border-border hover:border-border-2 hover:bg-bg-2",
  ghost: "bg-transparent text-fg-muted hover:bg-bg-3 hover:text-fg",
  danger: "bg-danger text-bg hover:opacity-90",
};

/* Mobile-first: base height clears the 2.75rem touch target; shrink on sm:. */
const sizes: Record<Size, string> = {
  sm: "h-11 px-3 text-sm sm:h-9",
  md: "h-11 px-4 text-sm sm:h-10",
  lg: "h-12 px-5 text-base sm:h-11",
};

const iconBox = "[&_svg]:size-4 [&_svg]:shrink-0";

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    leadingIcon,
    trailingIcon,
    disabled,
    className,
    children,
    ...rest
  },
  ref
) {
  return (
    <button
      ref={ref}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(base, variants[variant], sizes[size], iconBox, className)}
      {...rest}
    >
      {loading ? (
        <Spinner className="size-4" />
      ) : (
        leadingIcon && <span className="inline-flex">{leadingIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && trailingIcon && <span className="inline-flex">{trailingIcon}</span>}
    </button>
  );
});
