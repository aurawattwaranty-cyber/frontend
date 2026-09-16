import type { WarrantyRegistration } from "@/lib/types";
import { getWarrantyValidity } from "@/lib/warranty/dates";
import { formatDate, formatWarrantyTerm } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

/**
 * Coverage window with elapsed-term indicator, one block per covered item.
 *
 * An installation can hold more than one warranted product, and they are not
 * covered for the same length — a battery commonly outlives the inverter it
 * was installed with — so each gets its own window rather than one merged one.
 */
function CoverageBlock({
  label,
  product,
  start,
  end,
  months,
}: {
  label: string;
  product?: string;
  start: string;
  end: string;
  months?: number;
}) {
  const validity = getWarrantyValidity(start, end);

  return (
    <div className="rounded-lg border border-line bg-canvas-soft p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
          {label}
        </p>
        {product ? (
          <p className="text-[12px] font-medium text-ink-soft">{product}</p>
        ) : null}
      </div>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
            Start
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {formatDate(start)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
            End
          </p>
          <p className="mt-0.5 text-sm font-semibold text-ink">
            {formatDate(end)}
          </p>
        </div>
      </div>

      <div
        className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line"
        role="progressbar"
        aria-valuenow={validity.percentElapsed}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`${label} term elapsed`}
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
        {months ? (
          <span className="text-muted">{formatWarrantyTerm(months)} term</span>
        ) : null}
      </p>
    </div>
  );
}

export function WarrantyCoverage({
  registration,
  className,
}: {
  registration: WarrantyRegistration;
  className?: string;
}) {
  if (!registration.warrantyStart || !registration.warrantyEnd) return null;

  const battery = registration.installation.batteryInstalled;
  const batteryStart = registration.batteryWarrantyStart;
  const batteryEnd = registration.batteryWarrantyEnd;
  const showBattery = battery && Boolean(batteryStart) && Boolean(batteryEnd);

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <CoverageBlock
        label={battery ? "Inverter warranty" : "Warranty"}
        product={battery ? registration.modelName : undefined}
        start={registration.warrantyStart}
        end={registration.warrantyEnd}
        months={registration.warrantyMonths}
      />
      {showBattery ? (
        <CoverageBlock
          label="Battery warranty"
          product={registration.installation.batteryModel}
          start={batteryStart as string}
          end={batteryEnd as string}
          months={registration.batteryWarrantyMonths}
        />
      ) : null}
    </div>
  );
}
