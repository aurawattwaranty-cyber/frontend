"use client";

import Link from "next/link";
import type { WarrantyRegistration } from "@/lib/types";
import { getWarrantyStatus } from "@/lib/services/warranties";
import { useAsync } from "@/lib/hooks/useAsync";
import { formatCapacity, formatDate } from "@/lib/utils/format";
import { getWarrantyValidity } from "@/lib/warranty/dates";
import { WARRANTY_STATUS_META } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Feedback";
import {
  AlertTriangleIcon,
  CheckIcon,
  ClockIcon,
  ShieldCheckIcon,
  XCircleIcon,
} from "@/components/icons";

/**
 * Public QR destination. Optimised for a phone camera scan: one clear verdict,
 * the facts that prove it, and nothing that identifies the customer beyond the
 * covered equipment.
 */
export function VerificationCard({ warrantyId }: { warrantyId: string }) {
  const lookup = useAsync<WarrantyRegistration>(
    () => getWarrantyStatus(warrantyId),
    [warrantyId],
  );

  if (lookup.initialLoading) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-10" aria-hidden="true">
          <Skeleton className="h-14 w-14 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="mt-4 h-40 w-full" />
        </CardBody>
      </Card>
    );
  }

  if (lookup.error || !lookup.data) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 px-5 py-10 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-danger-bg text-2xl text-danger-fg">
            <XCircleIcon />
          </span>
          <h1 className="font-display text-xl font-bold">Warranty Not Found</h1>
          <p className="max-w-sm text-[13px] leading-relaxed text-muted">
            No Aurawatt warranty is registered under ID{" "}
            <span className="font-mono font-semibold">{warrantyId}</span>. Check
            the code on the certificate, or look the warranty up manually.
          </p>
          <Link href="/status" className={buttonClasses("secondary", "md", "mt-2")}>
            Check another warranty
          </Link>
        </CardBody>
      </Card>
    );
  }

  const registration = lookup.data;
  const meta = WARRANTY_STATUS_META[registration.status];
  const isVerified = registration.status === "active";
  const validity =
    registration.warrantyStart && registration.warrantyEnd
      ? getWarrantyValidity(registration.warrantyStart, registration.warrantyEnd)
      : null;

  const verdict = isVerified
    ? {
        title: "Warranty Verified",
        icon: <CheckIcon strokeWidth={2.5} />,
        wrap: "bg-success-bg text-success-fg",
      }
    : registration.status === "expired"
      ? {
          title: "Warranty Expired",
          icon: <ClockIcon />,
          wrap: "bg-canvas text-muted",
        }
      : registration.status === "rejected"
        ? {
            title: "Not Covered",
            icon: <XCircleIcon />,
            wrap: "bg-danger-bg text-danger-fg",
          }
        : {
            title: "Awaiting Activation",
            icon: <AlertTriangleIcon />,
            wrap: "bg-warning-bg text-warning-fg",
          };

  return (
    <Card className="animate-fade-up">
      <CardBody className="px-5 py-7 sm:px-7">
        <div className="flex flex-col items-center text-center">
          <span
            className={`flex h-14 w-14 items-center justify-center rounded-full text-2xl ${verdict.wrap}`}
          >
            {verdict.icon}
          </span>
          <h1 className="mt-4 font-display text-xl font-bold tracking-tight sm:text-2xl">
            {verdict.title}
          </h1>
          <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted">
            {meta.description}
          </p>
          {validity ? (
            <p
              className={`mt-2 text-[13px] font-semibold ${
                validity.isActive ? "text-success-fg" : "text-muted"
              }`}
            >
              {validity.label}
            </p>
          ) : null}
        </div>

        <dl className="mt-6 divide-y divide-line rounded-lg border border-line">
          <VerifyRow label="Warranty ID" value={`#${registration.id}`} monospace />
          <VerifyRow label="Product" value={registration.modelName} />
          <VerifyRow
            label="Serial Number"
            value={registration.serial}
            monospace
          />
          <VerifyRow
            label="Capacity"
            value={formatCapacity(
              registration.capacityKw,
              registration.productType,
            )}
          />
          <VerifyRow
            label="Warranty Start"
            value={formatDate(registration.warrantyStart)}
          />
          <VerifyRow
            label="Warranty End"
            value={formatDate(registration.warrantyEnd)}
          />
          <VerifyRow label="Current Status" value={meta.label} />
        </dl>

        <p className="mt-5 flex items-center justify-center gap-1.5 text-[12px] text-faint">
          <ShieldCheckIcon className="text-sm" />
          Verified by Aurawatt Warranty System
        </p>
      </CardBody>
    </Card>
  );
}

function VerifyRow({
  label,
  value,
  monospace,
}: {
  label: string;
  value: string;
  monospace?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd
        className={`text-right text-[13px] font-medium text-ink ${
          monospace ? "font-mono tracking-tight" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
