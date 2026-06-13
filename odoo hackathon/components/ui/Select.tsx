import { forwardRef, useId } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";
import { Field, controlBase, controlBorder } from "./Field";

export type SelectOption = { value: string; label: string; disabled?: boolean };

export type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> & {
  label?: string;
  helper?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, helper, error, id, required, disabled, options, placeholder, className, ...rest },
  ref
) {
  const autoId = useId();
  const fieldId = id ?? autoId;
  const describedBy = error ? `${fieldId}-error` : helper ? `${fieldId}-helper` : undefined;

  return (
    <Field
      id={fieldId}
      label={label}
      helper={helper}
      error={error}
      required={required}
      disabled={disabled}
    >
      <div className="relative">
        <select
          ref={ref}
          id={fieldId}
          required={required}
          disabled={disabled}
          aria-invalid={!!error || undefined}
          aria-describedby={describedBy}
          defaultValue={placeholder ? "" : undefined}
          className={cn(
            controlBase,
            controlBorder(!!error),
            "appearance-none pr-10 cursor-pointer",
            className
          )}
          {...rest}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value} disabled={o.disabled}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-fg-dim"
        />
      </div>
    </Field>
  );
});
