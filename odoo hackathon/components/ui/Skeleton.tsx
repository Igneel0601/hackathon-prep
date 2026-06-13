import { cn } from "@/lib/cn";

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement>;

/**
 * Loading placeholder. Size it with width/height utilities on `className`,
 * e.g. `<Skeleton className="h-4 w-32" />`. Uses CSS pulse, not GSAP.
 */
export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-bg-3", className)}
      {...props}
    />
  );
}
