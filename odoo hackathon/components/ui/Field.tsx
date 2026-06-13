import { cn } from "@/lib/cn";

export type FieldProps = {
  /** Stable id linking label → control (and helper/error via aria). */
  id?: string;
  label?: string;
  helper?: string;
  error?: string;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  children: React.ReactNode;
};

/**
 * Wraps any control with a label and helper/error text. Pass the same `id` to
 * the control and set `aria-describedby={field.helperId}` for screen readers —
 * or just use the `label`/`helper`/`error` props baked into Input/Textarea/Select.
 */
export function Field({
  id,
  label,
  helper,
  error,
  required,
  disabled,
  className,
  children,
}: FieldProps) {
  const describedBy = error ? `${id}-error` : helper ? `${id}-helper` : undefined;

  return (
    <div className={cn("flex w-full flex-col gap-1.5", disabled && "opacity-60", className)}>
      {label && (
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
          {required && <span className="text-danger"> *</span>}
        </label>
      )}
      {children}
      {error ? (
        <p id={describedBy} className="text-xs text-danger">
          {error}
        </p>
      ) : helper ? (
        <p id={describedBy} className="text-xs text-fg-dim">
          {helper}
        </p>
      ) : null}
    </div>
  );
}

/** Shared styling for text-like inputs and the native select. */
export const controlBase =
  "w-full rounded-md bg-bg border text-fg placeholder:text-fg-dim " +
  "transition-[border-color,background-color] duration-150 ease-out " +
  "disabled:cursor-not-allowed disabled:opacity-60 " +
  "min-h-11 px-3 py-2 text-sm sm:min-h-10";

export const controlBorder = (error?: boolean) =>
  error ? "border-danger hover:border-danger" : "border-border hover:border-border-2";
