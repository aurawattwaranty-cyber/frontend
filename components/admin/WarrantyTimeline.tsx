import type { WarrantyEvent, WarrantyEventType } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import {
  AlertTriangleIcon,
  CheckIcon,
  ClockIcon,
  FileTextIcon,
  RefreshIcon,
  ShieldCheckIcon,
  XIcon,
} from "@/components/icons";

const EVENT_STYLES: Record<
  WarrantyEventType,
  { icon: React.ReactNode; tone: string }
> = {
  submitted: { icon: <FileTextIcon />, tone: "bg-info-bg text-info-fg" },
  verified: { icon: <CheckIcon />, tone: "bg-info-bg text-info-fg" },
  correction: {
    icon: <AlertTriangleIcon />,
    tone: "bg-warning-bg text-warning-fg",
  },
  resubmitted: { icon: <RefreshIcon />, tone: "bg-info-bg text-info-fg" },
  approved: { icon: <CheckIcon />, tone: "bg-success-bg text-success-fg" },
  activated: {
    icon: <ShieldCheckIcon />,
    tone: "bg-success-bg text-success-fg",
  },
  rejected: { icon: <XIcon />, tone: "bg-danger-bg text-danger-fg" },
  expired: { icon: <ClockIcon />, tone: "bg-canvas text-muted" },
};

/** Basic chronological history of a registration. */
export function WarrantyTimeline({ events }: { events: WarrantyEvent[] }) {
  const ordered = [...events].sort((a, b) => a.at.localeCompare(b.at));

  return (
    <ol className="flex flex-col">
      {ordered.map((event, index) => {
        const style = EVENT_STYLES[event.type];
        const isLast = index === ordered.length - 1;

        return (
          <li key={event.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[13px]",
                  style.tone,
                )}
              >
                {style.icon}
              </span>
              {!isLast ? (
                <span aria-hidden="true" className="w-px flex-1 bg-line" />
              ) : null}
            </div>
            <div className={cn("min-w-0 flex-1", !isLast && "pb-4")}>
              <p className="text-[13px] font-medium text-ink">{event.label}</p>
              <p className="mt-0.5 text-[12px] text-muted">
                {formatDateTime(event.at)} · {event.actor}
              </p>
              {event.note ? (
                <p className="mt-1.5 rounded-md border border-line bg-canvas-soft px-2.5 py-1.5 text-[12px] leading-relaxed text-ink-soft">
                  {event.note}
                </p>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
