import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type SpinnerProps = React.HTMLAttributes<SVGSVGElement> & {
  /** Tailwind size utility, e.g. `size-4` (default), `size-6`. */
  className?: string;
  label?: string;
};

/** Indeterminate loading indicator. Size with a `size-*` utility on `className`. */
export function Spinner({ className, label = "Loading", ...props }: SpinnerProps) {
  return (
    <Loader2
      role="status"
      aria-label={label}
      className={cn("size-4 animate-spin text-current", className)}
      {...props}
    />
  );
}
