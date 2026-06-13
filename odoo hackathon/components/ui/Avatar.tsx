"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

type Size = "sm" | "md" | "lg";

export type AvatarProps = React.HTMLAttributes<HTMLSpanElement> & {
  src?: string;
  alt?: string;
  /** Falls back to up to two initials when no image / image fails. */
  name?: string;
  size?: Size;
};

const sizes: Record<Size, string> = {
  sm: "size-8 text-xs",
  md: "size-10 text-sm",
  lg: "size-12 text-base",
};

function initials(name?: string) {
  if (!name) return "?";
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function Avatar({ src, alt, name, size = "md", className, ...rest }: AvatarProps) {
  const [errored, setErrored] = useState(false);
  const showImage = src && !errored;

  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-pill " +
          "bg-bg-3 border border-border font-medium text-fg-muted select-none",
        sizes[size],
        className
      )}
      {...rest}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={alt ?? name ?? ""}
          onError={() => setErrored(true)}
          className="size-full object-cover"
        />
      ) : (
        <span aria-hidden>{initials(name)}</span>
      )}
    </span>
  );
}
