import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/cn";

export type EmptyStateProps = React.HTMLAttributes<HTMLDivElement> & {
  icon?: LucideIcon;
  title: string;
  description?: string;
  /** Action slot — typically a Button. */
  action?: React.ReactNode;
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  ...rest
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed " +
          "border-border bg-bg-2/50 px-6 py-12 text-center",
        className
      )}
      {...rest}
    >
      {Icon && (
        <span className="flex size-12 items-center justify-center rounded-pill bg-bg-3 text-fg-muted">
          <Icon className="size-6" aria-hidden />
        </span>
      )}
      <div className="flex flex-col gap-1">
        <h3 className="text-base font-semibold text-fg">{title}</h3>
        {description && (
          <p className="mx-auto max-w-sm text-sm text-fg-muted text-pretty">{description}</p>
        )}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}
