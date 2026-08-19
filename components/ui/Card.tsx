import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export function Card({
  className,
  children,
  as: Component = "section",
}: {
  className?: string;
  children: ReactNode;
  as?: "section" | "div" | "article" | "aside";
}) {
  return (
    <Component
      className={cn(
        "rounded-xl border border-line bg-surface shadow-card",
        className,
      )}
    >
      {children}
    </Component>
  );
}

export function CardHeader({
  title,
  description,
  action,
  className,
}: {
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4",
        className,
      )}
    >
      <div className="min-w-0">
        <h2 className="text-[15px] font-semibold text-ink">{title}</h2>
        {description ? (
          <p className="mt-0.5 text-[13px] text-muted">{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function CardBody({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("px-5 py-4", className)}>{children}</div>;
}

export function CardFooter({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <footer
      className={cn(
        "flex flex-wrap items-center justify-end gap-2 border-t border-line px-5 py-3.5",
        className,
      )}
    >
      {children}
    </footer>
  );
}

/** Label/value pair used throughout the detail and review screens. */
export function DetailRow({
  label,
  value,
  icon,
  monospace,
  className,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  monospace?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">
        {label}
      </dt>
      <dd
        className={cn(
          "flex items-start gap-2 text-sm text-ink",
          monospace && "font-mono tracking-tight",
        )}
      >
        {icon ? (
          <span className="mt-0.5 shrink-0 text-base text-faint">{icon}</span>
        ) : null}
        <span className="min-w-0 break-words">{value}</span>
      </dd>
    </div>
  );
}
