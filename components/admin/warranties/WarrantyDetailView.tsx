"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { WarrantyRegistration } from "@/lib/types";
import { getWarrantyById } from "@/lib/services/warranties";
import {
  certificateUrl,
  downloadWarrantyCertificate,
  verificationPath,
} from "@/lib/services/certificate";
import { useAsync, useMutation } from "@/lib/hooks/useAsync";
import { formatCapacity, formatDate, formatDateTime } from "@/lib/utils/format";
import { WarrantyStatusBadge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, DetailRow } from "@/components/ui/Card";
import { Alert, Skeleton } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { PhotoGallery } from "@/components/admin/PhotoGallery";
import { WarrantyTimeline } from "@/components/admin/WarrantyTimeline";
import { WarrantyCoverage } from "@/components/warranty/WarrantyCoverage";
import {
  ArrowLeftIcon,
  BuildingIcon,
  CalendarIcon,
  DownloadIcon,
  MailIcon,
  MapPinIcon,
  PhoneIcon,
  QrIcon,
} from "@/components/icons";
import { ReviewActions } from "./ReviewActions";

export function WarrantyDetailView({ warrantyId }: { warrantyId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [override, setOverride] = useState<WarrantyRegistration | null>(null);

  const lookup = useAsync<WarrantyRegistration>(
    () => getWarrantyById(warrantyId),
    [warrantyId],
  );
  const certificate = useMutation(downloadWarrantyCertificate);

  const registration = override ?? lookup.data;

  if (lookup.initialLoading) {
    return (
      <div aria-hidden="true" className="flex flex-col gap-5">
        <Skeleton className="h-9 w-56" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-5">
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="h-56 w-full rounded-xl" />
          </div>
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (lookup.error || !registration) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-3 py-12 text-center">
          <h1 className="font-display text-xl font-bold">
            Registration not found
          </h1>
          <p className="max-w-sm text-[13px] text-muted">
            {lookup.error ??
              "This registration may have been removed from the system."}
          </p>
          <Link
            href="/admin/warranties"
            className={buttonClasses("secondary", "md", "mt-2")}
          >
            Back to registrations
          </Link>
        </CardBody>
      </Card>
    );
  }

  const { customer, installer, installation } = registration;
  const hasCertificate =
    registration.status === "active" || registration.status === "expired";

  async function handleDownload() {
    const result = await certificate.run(registration!.id);
    if (result !== null) {
      toast.success(
        "Certificate ready",
        "Use the print dialog to save it as a PDF.",
      );
    }
  }

  return (
    <div className="animate-fade-up">
      <div className="flex flex-wrap items-start gap-3 pb-5">
        <button
          type="button"
          onClick={() => router.push("/admin/warranties")}
          aria-label="Back to registrations"
          className="mt-1 rounded-lg border border-line-strong bg-surface p-2 text-base text-ink-soft transition-colors hover:bg-canvas"
        >
          <ArrowLeftIcon />
        </button>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-xl font-bold tracking-tight sm:text-2xl">
              Record #{registration.id}
            </h1>
            <WarrantyStatusBadge status={registration.status} />
          </div>
          <p className="mt-1 text-[13px] text-muted">
            Submitted on {formatDate(registration.submittedAt)}
            {registration.reviewedAt
              ? ` · last reviewed ${formatDateTime(registration.reviewedAt)}`
              : ""}
          </p>
        </div>
      </div>

      {registration.status === "correction" && registration.decisionNote ? (
        <Alert
          tone="info"
          title="Correction requested"
          className="mb-5"
        >
          {registration.decisionNote}
        </Alert>
      ) : null}

      {registration.status === "rejected" && registration.decisionNote ? (
        <Alert tone="danger" title="Rejection reason" className="mb-5">
          {registration.decisionNote}
        </Alert>
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        <div className="flex flex-col gap-5">
          <Card>
            <CardHeader title="Product Details" />
            <CardBody className="flex flex-col gap-4">
              <DetailRow
                label="Serial Number"
                value={registration.serial}
                monospace
              />
              <div className="grid grid-cols-2 gap-4">
                <DetailRow label="Model Name" value={registration.modelName} />
                <DetailRow
                  label="Capacity"
                  value={formatCapacity(
                    registration.capacityKw,
                    registration.productType,
                  )}
                />
              </div>
              {installation.batteryInstalled ? (
                <DetailRow
                  label="Battery"
                  value={`${installation.batteryModel ?? "—"}${
                    installation.batterySerial
                      ? ` · ${installation.batterySerial}`
                      : ""
                  }`}
                />
              ) : null}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Customer Info" />
            <CardBody className="flex flex-col gap-3">
              <p className="text-[15px] font-semibold text-ink">
                {customer.fullName}
              </p>
              <ContactLine icon={<PhoneIcon />}>
                <a
                  href={`tel:${customer.phone}`}
                  className="rounded hover:text-ink hover:underline"
                >
                  {customer.phone}
                </a>
              </ContactLine>
              <ContactLine icon={<MailIcon />}>
                <a
                  href={`mailto:${customer.email}`}
                  className="rounded break-all hover:text-ink hover:underline"
                >
                  {customer.email}
                </a>
              </ContactLine>
              <ContactLine icon={<MapPinIcon />}>
                {customer.address}
                <br />
                {customer.city}, {customer.state} {customer.pincode}
              </ContactLine>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Installer Info" />
            <CardBody className="flex flex-col gap-4">
              <DetailRow
                label="Installation Date"
                value={formatDate(installation.installationDate)}
                icon={<CalendarIcon className="text-brand-500" />}
              />
              <div className="border-t border-line pt-4">
                <p className="text-[14px] font-semibold text-ink">
                  {installer.companyName}
                </p>
                <p className="mt-0.5 text-[13px] text-muted">
                  {installer.contactName}
                </p>
                <div className="mt-3 flex flex-col gap-2.5">
                  <ContactLine icon={<PhoneIcon />}>
                    <a
                      href={`tel:${installer.contactNumber}`}
                      className="rounded hover:text-ink hover:underline"
                    >
                      {installer.contactNumber}
                    </a>
                  </ContactLine>
                  <ContactLine icon={<MailIcon />}>
                    <a
                      href={`mailto:${installer.email}`}
                      className="rounded break-all hover:text-ink hover:underline"
                    >
                      {installer.email}
                    </a>
                  </ContactLine>
                  {installer.installerId ? (
                    <ContactLine icon={<BuildingIcon />}>
                      <span className="font-mono">{installer.installerId}</span>
                    </ContactLine>
                  ) : null}
                </div>
              </div>
              <div className="border-t border-line pt-4">
                <DetailRow
                  label="Installation Address"
                  value={installation.installationAddress}
                />
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Warranty History" />
            <CardBody>
              <WarrantyTimeline events={registration.history} />
            </CardBody>
          </Card>
        </div>

        <div className="flex flex-col gap-5">
          <ReviewActions
            registration={registration}
            onUpdated={(updated) => {
              setOverride(updated);
              lookup.refresh();
            }}
          />

          {hasCertificate ? (
            <Card>
              <CardHeader
                title="Warranty & Certificate"
                description="Coverage calculated on activation."
              />
              <CardBody className="flex flex-col gap-4">
                <WarrantyCoverage registration={registration} />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => void handleDownload()}
                    loading={certificate.pending}
                    icon={<DownloadIcon />}
                  >
                    Download Certificate
                  </Button>
                  <Link
                    href={certificateUrl(registration.id)}
                    className={buttonClasses("secondary", "sm")}
                  >
                    Preview
                  </Link>
                  <Link
                    href={verificationPath(registration.id)}
                    className={buttonClasses("secondary", "sm")}
                  >
                    <QrIcon />
                    QR verification
                  </Link>
                </div>
                {certificate.error ? (
                  <Alert tone="danger">{certificate.error}</Alert>
                ) : null}
              </CardBody>
            </Card>
          ) : null}

          <Card>
            <CardHeader
              title="Installation Photos"
              description={`${registration.photos.length} photo${
                registration.photos.length === 1 ? "" : "s"
              } uploaded`}
            />
            <CardBody>
              <PhotoGallery photos={registration.photos} />
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ContactLine({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <p className="flex items-start gap-2 text-[13px] leading-relaxed text-ink-soft">
      <span className="mt-0.5 shrink-0 text-base text-faint">{icon}</span>
      <span className="min-w-0">{children}</span>
    </p>
  );
}
