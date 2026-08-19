import { cn } from "@/lib/utils/cn";
import { CheckIcon } from "@/components/icons";

export const REGISTRATION_STEPS = [
  { id: "verify", label: "Verify" },
  { id: "details", label: "Details" },
  { id: "photos", label: "Photos" },
] as const;

export type RegistrationStepId = (typeof REGISTRATION_STEPS)[number]["id"];

export function RegistrationStepper({
  current,
  className,
}: {
  /** Index of the active step; pass `REGISTRATION_STEPS.length` once complete. */
  current: number;
  className?: string;
}) {
  return (
    <ol
      className={cn("flex items-start", className)}
      aria-label="Registration progress"
    >
      {REGISTRATION_STEPS.map((step, index) => {
        const done = index < current;
        const active = index === current;
        const isLast = index === REGISTRATION_STEPS.length - 1;

        return (
          <li
            key={step.id}
            className={cn("flex items-start", !isLast && "flex-1")}
            aria-current={active ? "step" : undefined}
          >
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  "flex h-7 w-7 items-center justify-center rounded-full border text-[12px] font-semibold transition-colors",
                  done && "border-success-line bg-success-bg text-success-fg",
                  active && "border-brand-500 bg-surface text-brand-600",
                  !done && !active && "border-line-strong bg-surface text-faint",
                )}
              >
                {done ? <CheckIcon className="text-sm" /> : index + 1}
              </span>
              <span
                className={cn(
                  "text-[12px] font-medium",
                  active ? "text-ink" : done ? "text-success-fg" : "text-faint",
                )}
              >
                {step.label}
              </span>
              <span className="sr-only">
                {done ? "completed" : active ? "current step" : "not started"}
              </span>
            </div>

            {!isLast ? (
              <span
                aria-hidden="true"
                className={cn(
                  "mx-2 mt-3.5 h-px flex-1 transition-colors sm:mx-3",
                  done ? "bg-success-line" : "bg-line-strong",
                )}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
