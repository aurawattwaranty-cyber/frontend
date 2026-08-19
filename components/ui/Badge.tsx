import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";
import type { SerialStatus, WarrantyStatus } from "@/lib/types";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  PackageIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "@/components/icons";

export type BadgeTone =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "brand";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-canvas text-ink-soft border-line-strong",
  success: "bg-success-bg text-success-fg border-success-line",
  warning: "bg-warning-bg text-warning-fg border-warning-line",
  danger: "bg-danger-bg text-danger-fg border-danger-line",
  info: "bg-info-bg text-info-fg border-info-line",
  brand: "bg-brand-50 text-brand-600 border-brand-200",
};

export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: BadgeTone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] leading-5 font-medium whitespace-nowrap",
        TONES[tone],
        className,
      )}
    >
      {icon ? <span className="text-[13px]">{icon}</span> : null}
      {children}
    </span>
  );
}

interface StatusMeta {
  label: string;
  tone: BadgeTone;
  icon: ReactNode;
  /** Sentence describing the state, reused across public and admin screens. */
  description: string;
}

export const WARRANTY_STATUS_META: Record<WarrantyStatus, StatusMeta> = {
  pending: {
    label: "Pending Review",
    tone: "warning",
    icon: <ClockIcon />,
    description:
      "Your registration has been received and is waiting for an Aurawatt engineer to verify the submitted evidence.",
  },
  correction: {
    label: "Correction Required",
    tone: "info",
    icon: <AlertTriangleIcon />,
    description:
      "Our team needs something corrected before this warranty can be activated.",
  },
  active: {
    label: "Active",
    tone: "success",
    icon: <ShieldCheckIcon />,
    description: "This warranty is active and the equipment is covered.",
  },
  rejected: {
    label: "Rejected",
    tone: "danger",
    icon: <XCircleIcon />,
    description: "This registration was not approved.",
  },
  expired: {
    label: "Expired",
    tone: "neutral",
    icon: <ClockIcon />,
    description: "The warranty term for this product has ended.",
  },
};

export function WarrantyStatusBadge({
  status,
  className,
}: {
  status: WarrantyStatus;
  className?: string;
}) {
  const meta = WARRANTY_STATUS_META[status];
  return (
    <Badge tone={meta.tone} icon={meta.icon} className={className}>
      {meta.label}
    </Badge>
  );
}

const SERIAL_STATUS_META: Record<SerialStatus, StatusMeta> = {
  available: {
    label: "Available",
    tone: "success",
    icon: <CheckCircleIcon />,
    description: "Ready to register",
  },
  registered: {
    label: "Registered",
    tone: "neutral",
    icon: <PackageIcon />,
    description: "In use",
  },
};

export function SerialStatusBadge({ status }: { status: SerialStatus }) {
  const meta = SERIAL_STATUS_META[status];
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}
