import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export type StatTone = "brand" | "warning" | "success" | "danger" | "info";

const TONES: Record<StatTone, string> = {
  brand: "bg-brand-50 text-brand-500",
  warning: "bg-warning-bg text-warning-fg",
  success: "bg-success-bg text-success-fg",
  danger: "bg-danger-bg text-danger-fg",
  info: "bg-info-bg text-info-fg",
};

export function StatCard({
  label,
  value,
  icon,
  tone = "brand",
  href,
  className,
}: {
  label: string;
  value: number | string;
  icon: ReactNode;
  tone?: StatTone;
  /** Turns the card into a filtered drill-down link. */
  href?: string;
  className?: string;
}) {
  const content = (
    <>
      <div className="min-w-0">
        <p className="text-[12px] font-medium text-muted">{label}</p>
        <p className="mt-1 font-display text-2xl font-bold tabular-nums text-ink">
          {value}
        </p>
      </div>
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base",
          TONES[tone],
        )}
      >
        {icon}
      </span>
    </>
  );

  const shell = cn(
    "flex items-start justify-between gap-3 rounded-xl border border-line bg-surface p-4 shadow-card",
    href && "transition-shadow hover:shadow-raised",
    className,
  );

  if (href) {
    return (
      <Link href={href} className={shell}>
        {content}
      </Link>
    );
  }

  return <div className={shell}>{content}</div>;
}
