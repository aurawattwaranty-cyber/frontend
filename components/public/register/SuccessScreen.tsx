"use client";

import Link from "next/link";
import type { WarrantyRegistration } from "@/lib/types";
import { formatDateTime } from "@/lib/utils/format";
import { WARRANTY_STATUS_META, WarrantyStatusBadge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardBody, DetailRow } from "@/components/ui/Card";
import { CheckIcon } from "@/components/icons";

export function SuccessScreen({
  registration,
}: {
  registration: WarrantyRegistration;
}) {
  return (
    <div className="animate-fade-up flex flex-col items-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-success-bg text-2xl text-success-fg">
        <CheckIcon strokeWidth={2.25} />
      </span>

      <h1 className="mt-5 text-center font-display text-2xl font-bold tracking-tight sm:text-[28px]">
        Warranty Registration Submitted
      </h1>
      <p className="mt-2 max-w-lg text-center text-[15px] leading-relaxed text-muted">
        Thank you. Your registration has been received and is now queued for
        verification by an Aurawatt engineer.
      </p>

      <Card className="mt-7 w-full">
        <CardBody className="sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
                Registration ID
              </p>
              <p className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-ink">
                #{registration.id}
              </p>
            </div>
            <WarrantyStatusBadge status={registration.status} />
          </div>

          <dl className="grid gap-4 pt-4 sm:grid-cols-2">
            <DetailRow
              label="Serial Number"
              value={registration.serial}
              monospace
            />
            <DetailRow label="Product" value={registration.modelName} />
            <DetailRow
              label="Submitted On"
              value={formatDateTime(registration.submittedAt)}
            />
            <DetailRow label="Customer" value={registration.customer.fullName} />
          </dl>

          <p className="mt-5 rounded-lg border border-warning-line bg-warning-bg px-4 py-3 text-[13px] leading-relaxed text-warning-fg">
            {WARRANTY_STATUS_META.pending.description} Keep registration ID{" "}
            <strong className="font-semibold">#{registration.id}</strong> safe —
            you will need it to check your status.
          </p>
        </CardBody>
      </Card>

      <div className="mt-6 flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
        <Link
          href={`/status?id=${encodeURIComponent(registration.id)}`}
          className={buttonClasses("primary", "lg")}
        >
          Check Warranty Status
        </Link>
        <Link href="/" className={buttonClasses("secondary", "lg")}>
          Back to Home
        </Link>
      </div>
    </div>
  );
}
