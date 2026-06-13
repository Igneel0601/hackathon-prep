import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge class names with conflict resolution.
 * `clsx` handles conditional logic, `twMerge` dedupes conflicting Tailwind utilities
 * so a `className` passed via props can always override a component default.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
