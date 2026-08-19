"use client";

import { useState } from "react";
import type { SerialNumber, WarrantyPhoto } from "@/lib/types";
import { formatCapacity, formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader, DetailRow } from "@/components/ui/Card";
import { Alert, EmptyState } from "@/components/ui/Feedback";
import { ConfirmDialog } from "@/components/ui/Modal";
import { EvidenceImage } from "@/components/ui/EvidenceImage";
import { ArrowLeftIcon, ImageIcon, PencilIcon } from "@/components/icons";
import type { DetailsFormValue } from "./DetailsStep";

export function ReviewStep({
  serial,
  details,
  photos,
  installationAddress,
  batteryModelName,
  onEditSerial,
  onEditDetails,
  onEditPhotos,
  onSubmit,
  submitting,
  error,
}: {
  serial: SerialNumber;
  details: DetailsFormValue;
  photos: WarrantyPhoto[];
  installationAddress: string;
  batteryModelName?: string;
  onEditSerial: () => void;
  onEditDetails: () => void;
  onEditPhotos: () => void;
  onSubmit: () => void;
  submitting: boolean;
  error: string | null;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const { customer, installer, installation } = details;

  return (
    <div className="flex flex-col gap-5">
      <Alert tone="info" title="Please check every detail before submitting">
        Once submitted, the registration is locked for review. An Aurawatt
        engineer verifies the evidence before your warranty is activated.
      </Alert>

      <Card>
        <CardHeader
          title="Product"
          action={<EditButton onClick={onEditSerial} label="Edit product" />}
        />
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-3">
            <DetailRow label="Serial Number" value={serial.serial} monospace />
            <DetailRow label="Model" value={serial.modelName} />
            <DetailRow
              label="Capacity"
              value={formatCapacity(serial.capacityKw, serial.productType)}
            />
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Customer"
          action={<EditButton onClick={onEditDetails} label="Edit customer details" />}
        />
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Name" value={customer.fullName} />
            <DetailRow label="Phone" value={customer.phone} />
            <DetailRow label="Email" value={customer.email} />
            <DetailRow
              label="Address"
              value={`${customer.address}, ${customer.city}, ${customer.state} ${customer.pincode}`}
            />
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Installer"
          action={<EditButton onClick={onEditDetails} label="Edit installer details" />}
        />
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailRow label="Installer / Company" value={installer.companyName} />
            <DetailRow label="Contact" value={`${installer.contactName} · ${installer.contactNumber}`} />
            <DetailRow label="Email" value={installer.email} />
            {installer.installerId ? (
              <DetailRow label="Installer ID" value={installer.installerId} monospace />
            ) : null}
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Installation"
          action={<EditButton onClick={onEditDetails} label="Edit installation details" />}
        />
        <CardBody>
          <dl className="grid gap-4 sm:grid-cols-2">
            <DetailRow
              label="Installation Date"
              value={formatDate(installation.installationDate)}
            />
            <DetailRow label="Installation Address" value={installationAddress} />
            <DetailRow
              label="Battery Installed"
              value={installation.batteryInstalled ? "Yes" : "No"}
            />
            {installation.batteryInstalled ? (
              <DetailRow
                label="Battery"
                value={`${batteryModelName ?? "—"} · ${installation.batterySerial}`}
              />
            ) : null}
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Photos"
          description={`${photos.length} photo${photos.length === 1 ? "" : "s"} attached`}
          action={<EditButton onClick={onEditPhotos} label="Edit photos" />}
        />
        <CardBody>
          {photos.length === 0 ? (
            <EmptyState
              icon={<ImageIcon />}
              title="No photos attached"
              description="Go back to the photo step to add installation evidence."
              compact
            />
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {photos.map((photo) => (
                <li
                  key={photo.requirementId}
                  className="overflow-hidden rounded-lg border border-line"
                >
                  <div className="aspect-4/3 bg-canvas">
                    <EvidenceImage
                      src={photo.url}
                      alt={`${photo.requirementLabel} evidence photo`}
                    />
                  </div>
                  <p className="truncate px-2.5 py-2 text-[12px] font-medium text-ink-soft">
                    {photo.requirementLabel}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {error ? (
        <Alert tone="danger" title="We couldn't submit your registration">
          {error}
        </Alert>
      ) : null}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button
          variant="secondary"
          size="lg"
          onClick={onEditPhotos}
          icon={<ArrowLeftIcon className="text-base" />}
        >
          Back
        </Button>
        <Button size="lg" onClick={() => setConfirmOpen(true)} loading={submitting}>
          Submit Warranty Registration
        </Button>
      </div>

      <ConfirmDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          onSubmit();
        }}
        title="Submit this registration?"
        description="Your details and photos will be sent to Aurawatt for verification."
        confirmLabel="Yes, submit"
        cancelLabel="Keep editing"
      >
        <dl className="flex flex-col gap-3">
          <DetailRow label="Serial Number" value={serial.serial} monospace />
          <DetailRow label="Customer" value={customer.fullName} />
          <DetailRow
            label="Installation Date"
            value={formatDate(installation.installationDate)}
          />
        </dl>
      </ConfirmDialog>
    </div>
  );
}

function EditButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      icon={<PencilIcon />}
      aria-label={label}
    >
      Edit
    </Button>
  );
}
