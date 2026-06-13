import { cn } from "@/lib/cn";

export type PageHeaderProps = React.HTMLAttributes<HTMLElement> & {
  title: string;
  subtitle?: string;
  /** Actions stack under the title on mobile, sit inline on sm:. */
  actions?: React.ReactNode;
};

export function PageHeader({ title, subtitle, actions, className, ...rest }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
        className
      )}
      {...rest}
    >
      <div className="flex min-w-0 flex-col gap-1">
        <h1 className="text-2xl font-semibold tracking-tight text-fg text-balance">{title}</h1>
        {subtitle && <p className="text-sm text-fg-muted text-pretty">{subtitle}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
          {actions}
        </div>
      )}
    </header>
  );
}
