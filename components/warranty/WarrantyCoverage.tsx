import type { WarrantyRegistration } from "@/lib/types";
import { getWarrantyValidity } from "@/lib/warranty/dates";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * Coverage window with elapsed-term indicator. Shown wherever an activated or
 * expired warranty is displayed.
 */
export function WarrantyCoverage({
  registration,
  className,
}: {
  registration: WarrantyRegistration;
  className?: string;
}) {
  if (!registration.warrantyStart || !registration.warrantyEnd) return null;

  const validity = getWarrantyValidity(
    registration.warrantyStart,
    registration.warrantyEnd,
  );

  return (
    <div
      className={cn(
        "rounded-lg border border-line bg-canvas-soft p-4",
        className,
      )}
    >
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
            Warranty Start
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {formatDate(registration.warrantyStart)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
            Warranty End
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {formatDate(registration.warrantyEnd)}
          </p>
        </div>
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={validity.percentElapsed}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Warranty term elapsed"
      >
        <div
          className={cn(
            "h-full rounded-full",
            validity.isActive ? "bg-success-fg" : "bg-faint",
          )}
          style={{ width: `${validity.percentElapsed}%` }}
        />
      </div>

      <p className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[12px]">
        <span
          className={cn(
            "font-medium",
            validity.isActive ? "text-success-fg" : "text-muted",
          )}
        >
          {validity.label}
        </span>
        {registration.warrantyMonths ? (
          <span className="text-muted">
            {registration.warrantyMonths} month term
          </span>
        ) : null}
      </p>
    </div>
  );
}
