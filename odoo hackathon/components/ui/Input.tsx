import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";
import { Field, controlBase, controlBorder } from "./Field";

export type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> & {
  label?: string;
  helper?: string;
  error?: string;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, helper, error, id, required, disabled, className, ...rest },
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
      <input
        ref={ref}
        id={fieldId}
        required={required}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        className={cn(controlBase, controlBorder(!!error), className)}
        {...rest}
      />
    </Field>
  );
});
