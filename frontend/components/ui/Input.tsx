import { InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string[];
  hint?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, id, className = "", ...rest }, ref) => {
    const inputId = id ?? rest.name;
    const hasError = error && error.length > 0;

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-slate-700"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError ? "true" : undefined}
          aria-describedby={
            hasError
              ? `${inputId}-error`
              : hint
                ? `${inputId}-hint`
                : undefined
          }
          className={[
            "block w-full rounded-md border px-3 py-2 text-sm text-slate-900",
            "placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-offset-1",
            hasError
              ? "border-rose-400 focus:ring-rose-500"
              : "border-slate-300 focus:ring-indigo-500",
            className,
          ].join(" ")}
          {...rest}
        />
        {hasError && (
          <ul
            id={`${inputId}-error`}
            role="alert"
            className="space-y-0.5"
            aria-live="polite"
          >
            {error!.map((e) => (
              <li key={e} className="text-xs text-rose-600">
                {e}
              </li>
            ))}
          </ul>
        )}
        {hint && !hasError && (
          <p id={`${inputId}-hint`} className="text-xs text-slate-500">
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export default Input;
