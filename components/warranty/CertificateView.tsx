"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { useSearchParams } from "next/navigation";
import type { WarrantyRegistration } from "@/lib/types";
import { getWarrantyStatus } from "@/lib/services/warranties";
import { useAsync } from "@/lib/hooks/useAsync";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert, Skeleton } from "@/components/ui/Feedback";
import { ArrowLeftIcon, DownloadIcon } from "@/components/icons";
import { WarrantyCertificate } from "./WarrantyCertificate";

export function CertificateView({ warrantyId }: { warrantyId: string }) {
  const searchParams = useSearchParams();
  const autoPrint = searchParams.get("print") === "1";
  const printed = useRef(false);

  const lookup = useAsync<WarrantyRegistration>(
    () => getWarrantyStatus(warrantyId),
    [warrantyId],
  );

  const registration = lookup.data;
  const printable =
    registration?.status === "active" || registration?.status === "expired";

  // Opened by `downloadWarrantyCertificate` — go straight to the print dialog
  // once the certificate has actually rendered.
  useEffect(() => {
    if (!autoPrint || !printable || printed.current) return;
    printed.current = true;
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, [autoPrint, printable]);

  if (lookup.initialLoading) {
    return (
      <Skeleton className="mx-auto h-[520px] w-full max-w-3xl rounded-xl" />
    );
  }

  if (lookup.error || !registration) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4">
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <h1 className="font-display text-xl font-bold">
              Certificate unavailable
            </h1>
            <p className="max-w-sm text-[13px] text-muted">
              {lookup.error ??
                "We couldn't find a warranty with that ID."}
            </p>
            <Link href="/status" className={buttonClasses("secondary", "md", "mt-2")}>
              Check warranty status
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  if (!printable) {
    return (
      <div className="mx-auto w-full max-w-3xl px-4">
        <Card>
          <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
            <h1 className="font-display text-xl font-bold">
              Certificate not issued yet
            </h1>
            <p className="max-w-md text-[13px] leading-relaxed text-muted">
              A warranty certificate is generated once Aurawatt has verified the
              registration and activated the warranty. Registration #
              {registration.id} is currently marked as{" "}
              <strong className="font-semibold">{registration.status}</strong>.
            </p>
            <Link
              href={`/status?id=${encodeURIComponent(registration.id)}`}
              className={buttonClasses("primary", "md", "mt-2")}
            >
              View registration status
            </Link>
          </CardBody>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4">
      <div className="print-hidden mb-4 flex flex-wrap items-center justify-between gap-3">
        <Link
          href={`/status?id=${encodeURIComponent(registration.id)}`}
          className={buttonClasses("ghost", "sm")}
        >
          <ArrowLeftIcon />
          Back to status
        </Link>
        <Button size="sm" onClick={() => window.print()} icon={<DownloadIcon />}>
          Print / Save as PDF
        </Button>
      </div>

      <WarrantyCertificate registration={registration} />

      <Alert tone="info" className="print-hidden mt-4">
        Choose <strong className="font-semibold">Save as PDF</strong> as the
        destination in the print dialog to keep a copy of this certificate.
      </Alert>
    </div>
  );
}
