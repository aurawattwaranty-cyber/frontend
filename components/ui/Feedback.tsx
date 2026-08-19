import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  InfoIcon,
  XCircleIcon,
} from "@/components/icons";

export type AlertTone = "info" | "success" | "warning" | "danger";

const ALERT_TONES: Record<AlertTone, { wrap: string; icon: ReactNode }> = {
  info: {
    wrap: "border-info-line bg-info-bg text-info-fg",
    icon: <InfoIcon />,
  },
  success: {
    wrap: "border-success-line bg-success-bg text-success-fg",
    icon: <CheckCircleIcon />,
  },
  warning: {
    wrap: "border-warning-line bg-warning-bg text-warning-fg",
    icon: <AlertTriangleIcon />,
  },
  danger: {
    wrap: "border-danger-line bg-danger-bg text-danger-fg",
    icon: <XCircleIcon />,
  },
};

export function Alert({
  tone = "info",
  title,
  children,
  action,
  className,
}: {
  tone?: AlertTone;
  title?: ReactNode;
  children?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  const meta = ALERT_TONES[tone];
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-3 text-[13px] leading-relaxed",
        meta.wrap,
        className,
      )}
    >
      <span className="mt-0.5 shrink-0 text-base">{meta.icon}</span>
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold">{title}</p> : null}
        {children ? <div className={cn(title && "mt-0.5")}>{children}</div> : null}
      </div>
      {action ? <div className="shrink-0 self-center">{action}</div> : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  compact,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 text-center",
        compact ? "px-4 py-8" : "px-6 py-14",
        className,
      )}
    >
      {icon ? (
        <span className="mb-1 flex h-11 w-11 items-center justify-center rounded-full bg-canvas text-xl text-faint">
          {icon}
        </span>
      ) : null}
      <p className="text-sm font-semibold text-ink">{title}</p>
      {description ? (
        <p className="max-w-sm text-[13px] text-muted">{description}</p>
      ) : null}
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("block rounded-md animate-shimmer", className)}
    />
  );
}

/** Placeholder rows matching the density of the admin tables. */
export function TableSkeleton({
  rows = 5,
  columns = 5,
}: {
  rows?: number;
  columns?: number;
}) {
  return (
    <div className="divide-y divide-line" aria-hidden="true">
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4 px-5 py-3.5"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: columns }).map((__, columnIndex) => (
            <Skeleton
              key={columnIndex}
              className={cn("h-4", columnIndex === 0 ? "w-28" : "w-20")}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-surface p-5 shadow-card",
        className,
      )}
      aria-hidden="true"
    >
      <Skeleton className="h-3.5 w-24" />
      <Skeleton className="mt-3 h-7 w-16" />
    </div>
  );
}

/** Announced to assistive tech while an async region is loading. */
export function LoadingRegion({ label }: { label: string }) {
  return (
    <span role="status" className="sr-only">
      {label}
    </span>
  );
}
