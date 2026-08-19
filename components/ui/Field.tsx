"use client";

import { useId } from "react";
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronDownIcon } from "@/components/icons";

const CONTROL_BASE =
  "w-full rounded-lg border bg-surface text-sm text-ink placeholder:text-faint transition-colors disabled:cursor-not-allowed disabled:bg-canvas disabled:text-muted";
const CONTROL_IDLE = "border-line-strong hover:border-faint";
const CONTROL_ERROR = "border-danger-line bg-danger-bg/40";

interface FieldShellProps {
  id: string;
  label?: string;
  hint?: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Label + control + hint/error, wired up with the right aria attributes. */
export function FieldShell({
  id,
  label,
  hint,
  error,
  required,
  className,
  children,
}: FieldShellProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <label
          htmlFor={id}
          className="text-[13px] font-medium text-ink-soft"
        >
          {label}
          {required ? (
            <span className="ml-0.5 text-brand-500" aria-hidden="true">
              *
            </span>
          ) : null}
        </label>
      ) : null}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-danger-fg">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "size"> {
  label?: string;
  hint?: string;
  error?: string;
  /** Renders inside the control on the left. */
  leading?: ReactNode;
  trailing?: ReactNode;
  containerClassName?: string;
  monospace?: boolean;
}

export function Input({
  label,
  hint,
  error,
  leading,
  trailing,
  containerClassName,
  monospace,
  className,
  id,
  required,
  ...props
}: InputProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <div className="relative flex items-center">
        {leading ? (
          <span className="pointer-events-none absolute left-3 text-base text-faint">
            {leading}
          </span>
        ) : null}
        <input
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
          }
          className={cn(
            CONTROL_BASE,
            error ? CONTROL_ERROR : CONTROL_IDLE,
            "h-10 px-3",
            leading && "pl-9",
            trailing && "pr-10",
            monospace && "font-mono tracking-tight",
            className,
          )}
          {...props}
        />
        {trailing ? (
          <span className="absolute right-2 flex items-center">{trailing}</span>
        ) : null}
      </div>
    </FieldShell>
  );
}

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  hint?: string;
  error?: string;
  containerClassName?: string;
}

export function Textarea({
  label,
  hint,
  error,
  containerClassName,
  className,
  id,
  required,
  rows = 3,
  ...props
}: TextareaProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <textarea
        id={fieldId}
        rows={rows}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={
          error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
        }
        className={cn(
          CONTROL_BASE,
          error ? CONTROL_ERROR : CONTROL_IDLE,
          "resize-y px-3 py-2 leading-relaxed",
          className,
        )}
        {...props}
      />
    </FieldShell>
  );
}

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps
  extends Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> {
  label?: string;
  hint?: string;
  error?: string;
  options: SelectOption[];
  placeholder?: string;
  containerClassName?: string;
}

export function Select({
  label,
  hint,
  error,
  options,
  placeholder,
  containerClassName,
  className,
  id,
  required,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <FieldShell
      id={fieldId}
      label={label}
      hint={hint}
      error={error}
      required={required}
      className={containerClassName}
    >
      <div className="relative flex items-center">
        <select
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={
            error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined
          }
          className={cn(
            CONTROL_BASE,
            error ? CONTROL_ERROR : CONTROL_IDLE,
            "h-10 cursor-pointer appearance-none pr-9 pl-3",
            className,
          )}
          {...props}
        >
          {placeholder ? <option value="">{placeholder}</option> : null}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDownIcon className="pointer-events-none absolute right-3 text-base text-muted" />
      </div>
    </FieldShell>
  );
}

export interface CheckboxProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label: ReactNode;
  hint?: string;
}

export function Checkbox({ label, hint, id, className, ...props }: CheckboxProps) {
  const generatedId = useId();
  const fieldId = id ?? generatedId;

  return (
    <div className="flex items-start gap-2.5">
      <input
        id={fieldId}
        type="checkbox"
        className={cn(
          "mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-line-strong text-brand-500 accent-brand-500",
          className,
        )}
        {...props}
      />
      <div className="flex flex-col gap-0.5">
        <label
          htmlFor={fieldId}
          className="cursor-pointer text-[13px] leading-5 text-ink-soft"
        >
          {label}
        </label>
        {hint ? <p className="text-xs text-muted">{hint}</p> : null}
      </div>
    </div>
  );
}

export interface RadioCardOption {
  value: string;
  label: string;
  description?: string;
}

/** Segmented radio group used for short, mutually exclusive choices. */
export function RadioGroup({
  name,
  value,
  onChange,
  options,
  label,
  className,
}: {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioCardOption[];
  label?: string;
  className?: string;
}) {
  return (
    <fieldset className={cn("flex flex-col gap-1.5", className)}>
      {label ? (
        <legend className="mb-1.5 text-[13px] font-medium text-ink-soft">
          {label}
        </legend>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        {options.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-start gap-2.5 rounded-lg border px-3 py-2.5 transition-colors",
                checked
                  ? "border-brand-300 bg-brand-50"
                  : "border-line-strong bg-surface hover:border-faint",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-brand-500"
              />
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-medium text-ink">
                  {option.label}
                </span>
                {option.description ? (
                  <span className="text-xs text-muted">{option.description}</span>
                ) : null}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
