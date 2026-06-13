import { forwardRef, useId } from "react";
import { cn } from "@/lib/cn";
import { Field, controlBase, controlBorder } from "./Field";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
  helper?: string;
  error?: string;
};

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, helper, error, id, required, disabled, rows = 4, className, ...rest },
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
      <textarea
        ref={ref}
        id={fieldId}
        rows={rows}
        required={required}
        disabled={disabled}
        aria-invalid={!!error || undefined}
        aria-describedby={describedBy}
        className={cn(controlBase, controlBorder(!!error), "resize-y leading-relaxed", className)}
        {...rest}
      />
    </Field>
  );
});
