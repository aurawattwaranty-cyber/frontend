"use client";

import Link from "next/link";
import { useState } from "react";
import type { WarrantyRegistration } from "@/lib/types";
import {
  certificateUrl,
  downloadWarrantyCertificate,
  verificationPath,
} from "@/lib/services/certificate";
import { resubmitWarranty } from "@/lib/services/warranties";
import { useMutation } from "@/lib/hooks/useAsync";
import { formatCapacity, formatDate, formatDateTime } from "@/lib/utils/format";
import { WARRANTY_STATUS_META, WarrantyStatusBadge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, DetailRow } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";
import { DownloadIcon, QrIcon, RefreshIcon } from "@/components/icons";
import { QrCode } from "./QrCode";
import { WarrantyCoverage } from "./WarrantyCoverage";

export function WarrantyStatusResult({
  registration,
  onUpdated,
}: {
  registration: WarrantyRegistration;
  onUpdated?: () => void;
}) {
  const toast = useToast();
  const [resubmitOpen, setResubmitOpen] = useState(false);
  const [note, setNote] = useState("");

  const certificate = useMutation(downloadWarrantyCertificate);
  const resubmit = useMutation(resubmitWarranty);

  const meta = WARRANTY_STATUS_META[registration.status];
  const hasCertificate =
    registration.status === "active" || registration.status === "expired";

  async function handleDownload() {
    const result = await certificate.run(registration.id);
    if (result !== null) {
      toast.success(
        "Certificate ready",
        "Use your browser's print dialog to save it as a PDF.",
      );
    }
  }

  async function handleResubmit() {
    const updated = await resubmit.run(registration.id, note.trim() || undefined);
    if (updated) {
      setResubmitOpen(false);
      setNote("");
      toast.success(
        "Sent for review",
        "Your registration is back in the verification queue.",
      );
      onUpdated?.();
    }
  }

  return (
    <div className="animate-fade-up flex flex-col gap-5">
      <Card>
        <CardBody className="sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line pb-4">
            <div>
              <p className="text-[11px] font-medium tracking-wide text-muted uppercase">
                Warranty ID
              </p>
              <p className="mt-0.5 font-mono text-2xl font-bold tracking-tight text-ink">
                #{registration.id}
              </p>
            </div>
            <WarrantyStatusBadge status={registration.status} />
          </div>

          <p className="pt-4 text-[13px] leading-relaxed text-muted">
            {meta.description}
          </p>

          <dl className="grid gap-4 pt-4 sm:grid-cols-2">
            <DetailRow label="Serial Number" value={registration.serial} monospace />
            <DetailRow label="Product" value={registration.modelName} />
            <DetailRow
              label="Capacity"
              value={formatCapacity(
                registration.capacityKw,
                registration.productType,
              )}
            />
            <DetailRow
              label="Submitted On"
              value={formatDateTime(registration.submittedAt)}
            />
            {registration.status === "active" ||
            registration.status === "expired" ? (
              <DetailRow
                label="Customer"
                value={registration.customer.fullName}
              />
            ) : null}
            {registration.reviewedAt ? (
              <DetailRow
                label="Last Reviewed"
                value={formatDateTime(registration.reviewedAt)}
              />
            ) : null}
          </dl>

          {hasCertificate ? (
            <WarrantyCoverage registration={registration} className="mt-5" />
          ) : null}
        </CardBody>
      </Card>

      {registration.status === "correction" ? (
        <Card>
          <CardHeader
            title="Action required"
            description="Aurawatt needs the following corrected before your warranty can be activated."
          />
          <CardBody className="flex flex-col gap-4">
            <Alert tone="info" title="Message from the review team">
              {registration.decisionNote}
            </Alert>

            {registration.correctionItems?.length ? (
              <div>
                <p className="text-[13px] font-medium text-ink">
                  Items to correct
                </p>
                <ul className="mt-2 flex flex-col gap-1.5">
                  {registration.correctionItems.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[13px] text-ink-soft"
                    >
                      <span
                        aria-hidden="true"
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-info-fg"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setResubmitOpen(true)}
                icon={<RefreshIcon />}
              >
                Resubmit for review
              </Button>
              <Link
                href={`/register?serial=${encodeURIComponent(registration.serial)}`}
                className={buttonClasses("secondary", "md")}
              >
                Upload new photos
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {registration.status === "rejected" ? (
        <Card>
          <CardHeader title="Why this registration was rejected" />
          <CardBody className="flex flex-col gap-4">
            <Alert tone="danger" title="Rejection reason">
              {registration.decisionNote}
            </Alert>
            <p className="text-[13px] leading-relaxed text-muted">
              If you believe this decision is incorrect, contact Aurawatt support
              with your registration ID and the installer&apos;s details. The
              serial number has been returned to inventory, so a corrected
              registration can be submitted.
            </p>
            <div className="flex flex-wrap gap-2">
              <a
                href={`mailto:support@aurawatt.in?subject=${encodeURIComponent(
                  `Warranty registration #${registration.id} — review request`,
                )}`}
                className={buttonClasses("secondary", "md")}
              >
                Contact support
              </a>
              <Link
                href={`/register?serial=${encodeURIComponent(registration.serial)}`}
                className={buttonClasses("primary", "md")}
              >
                Start a new registration
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {hasCertificate ? (
        <Card>
          <CardHeader
            title="Certificate & verification"
            description={
              registration.status === "expired"
                ? "The warranty term has ended. Your certificate remains available for your records."
                : "Download your certificate or share the public verification link."
            }
          />
          <CardBody className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => void handleDownload()}
                loading={certificate.pending}
                loadingText="Preparing…"
                icon={<DownloadIcon />}
              >
                Download Certificate
              </Button>
              <Link
                href={certificateUrl(registration.id)}
                className={buttonClasses("secondary", "md")}
              >
                Preview certificate
              </Link>
              <Link
                href={verificationPath(registration.id)}
                className={buttonClasses("secondary", "md")}
              >
                <QrIcon />
                Public verification
              </Link>
            </div>

            <div className="flex shrink-0 flex-col items-center gap-1.5 self-center text-ink">
              <QrCode
                value={
                  typeof window === "undefined"
                    ? verificationPath(registration.id)
                    : `${window.location.origin}${verificationPath(registration.id)}`
                }
                size={96}
                title={`Verify warranty ${registration.id}`}
                className="rounded border border-line"
              />
              <span className="text-[11px] text-faint">Scan to verify</span>
            </div>
          </CardBody>
          {certificate.error ? (
            <div className="px-5 pb-4">
              <Alert tone="danger">{certificate.error}</Alert>
            </div>
          ) : null}
        </Card>
      ) : null}

      {registration.status === "pending" ? (
        <p className="text-center text-[13px] text-muted">
          Submitted {formatDate(registration.submittedAt)}. Verification usually
          completes within 3 working days.
        </p>
      ) : null}

      <Modal
        open={resubmitOpen}
        onClose={() => setResubmitOpen(false)}
        title="Resubmit for review"
        description="Confirm you have made the requested corrections."
        busy={resubmit.pending}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setResubmitOpen(false)}
              disabled={resubmit.pending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleResubmit()}
              loading={resubmit.pending}
            >
              Send for review
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-3">
          <Alert tone="info">{registration.decisionNote}</Alert>
          <Textarea
            label="Note for the review team"
            hint="Optional — tell us what you changed."
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="Re-uploaded the serial label photo in better lighting."
          />
          {resubmit.error ? <Alert tone="danger">{resubmit.error}</Alert> : null}
        </div>
      </Modal>
    </div>
  );
}
