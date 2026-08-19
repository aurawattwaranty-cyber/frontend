"use client";

import type { WarrantyRegistration } from "@/lib/types";
import { formatCapacity, formatDate } from "@/lib/utils/format";
import { verificationUrl } from "@/lib/services/certificate";
import { WARRANTY_STATUS_META } from "@/components/ui/Badge";
import { Logo } from "@/components/Logo";
import { QrCode } from "./QrCode";

/**
 * Print-ready warranty certificate.
 *
 * The `print-sheet` class strips the frame when the browser prints, which is
 * how `downloadWarrantyCertificate` produces a PDF until the server-side
 * generator is connected.
 */
export function WarrantyCertificate({
  registration,
  issuedAt,
}: {
  registration: WarrantyRegistration;
  /** Defaults to the review date, falling back to the submission date. */
  issuedAt?: string;
}) {
  const verifyUrl = verificationUrl(registration.id);
  const issued = issuedAt ?? registration.reviewedAt ?? registration.submittedAt;
  const statusMeta = WARRANTY_STATUS_META[registration.status];

  return (
    <article className="print-sheet mx-auto w-full max-w-3xl overflow-hidden rounded-xl border border-line bg-surface shadow-card">
      <header className="flex flex-wrap items-start justify-between gap-4 bg-navy-900 px-6 py-6 sm:px-8">
        <div>
          <Logo tone="light" size="md" />
          <p className="mt-3 font-display text-xl font-bold tracking-tight text-white sm:text-2xl">
            Warranty Certificate
          </p>
          <p className="mt-1 text-[13px] text-white/60">
            Aurawatt Energy Systems · Hybrid Inverter Warranty
          </p>
        </div>
        <div className="text-right">
          <p className="text-[11px] font-medium tracking-wide text-white/50 uppercase">
            Warranty ID
          </p>
          <p className="font-mono text-2xl font-bold tracking-tight text-brand-400">
            {registration.id}
          </p>
        </div>
      </header>

      <div className="px-6 py-6 sm:px-8">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line pb-4">
          <div>
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
              Certificate Holder
            </p>
            <p className="mt-1 text-lg font-semibold text-ink">
              {registration.customer.fullName}
            </p>
          </div>
          <span
            className={`rounded-full border px-3 py-1 text-[12px] font-semibold ${
              registration.status === "active"
                ? "border-success-line bg-success-bg text-success-fg"
                : "border-line-strong bg-canvas text-muted"
            }`}
          >
            {statusMeta.label}
          </span>
        </div>

        <div className="grid gap-6 pt-5 sm:grid-cols-[1fr_auto]">
          <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
            <CertificateField label="Product" value={registration.modelName} />
            <CertificateField
              label="Capacity"
              value={formatCapacity(
                registration.capacityKw,
                registration.productType,
              )}
            />
            <CertificateField
              label="Serial Number"
              value={registration.serial}
              monospace
            />
            <CertificateField
              label="Installation Date"
              value={formatDate(registration.installation.installationDate)}
            />
            <CertificateField
              label="Warranty Start"
              value={formatDate(registration.warrantyStart)}
            />
            <CertificateField
              label="Warranty End"
              value={formatDate(registration.warrantyEnd)}
            />
            {registration.installation.batteryInstalled ? (
              <CertificateField
                label="Battery System"
                value={`${registration.installation.batteryModel ?? "—"}${
                  registration.installation.batterySerial
                    ? ` · ${registration.installation.batterySerial}`
                    : ""
                }`}
                className="sm:col-span-2"
              />
            ) : null}
            <CertificateField
              label="Installed By"
              value={registration.installer.companyName}
              className="sm:col-span-2"
            />
          </dl>

          <div className="flex flex-col items-center gap-2 justify-self-center rounded-lg border border-line bg-canvas-soft p-3 text-ink sm:justify-self-end">
            <QrCode
              value={verifyUrl}
              size={132}
              margin={2}
              title={`Verify warranty ${registration.id}`}
            />
            <p className="max-w-[132px] text-center text-[10px] leading-tight text-muted">
              Scan to verify this warranty
            </p>
          </div>
        </div>

        <footer className="mt-6 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
              Verification URL
            </p>
            <p className="mt-0.5 font-mono text-[11px] break-all text-ink-soft">
              {verifyUrl}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
              Issued On
            </p>
            <p className="mt-0.5 text-[13px] font-medium text-ink">
              {formatDate(issued)}
            </p>
          </div>
        </footer>

        <p className="mt-5 text-[11px] leading-relaxed text-faint">
          This certificate is issued by Aurawatt Energy Systems and is valid only
          for the serial number stated above. Coverage is subject to the Aurawatt
          hybrid inverter warranty terms, including correct installation by a
          certified partner and operation within the published specifications.
        </p>
      </div>
    </article>
  );
}

function CertificateField({
  label,
  value,
  monospace,
  className,
}: {
  label: string;
  value: string;
  monospace?: boolean;
  className?: string;
}) {
  return (
    <div className={className}>
      <dt className="text-[11px] font-medium tracking-wide text-muted uppercase">
        {label}
      </dt>
      <dd
        className={`mt-1 text-sm font-medium text-ink ${
          monospace ? "font-mono tracking-tight" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  );
}
