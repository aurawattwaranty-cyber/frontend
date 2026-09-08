"use client";

import { useMemo, useState } from "react";
import type { PhotoRequirement, ProductModel, WarrantyRegistration } from "@/lib/types";
import {
  approveWarranty,
  rejectWarranty,
  requestCorrection,
} from "@/lib/services/warranties";
import { getPhotoRequirements } from "@/lib/services/photo-requirements";
import { getProductModels } from "@/lib/services/products";
import { useAsync, useMutation } from "@/lib/hooks/useAsync";
import { calculateWarrantyPeriod, toIsoDate } from "@/lib/warranty/dates";
import { formatDate } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Checkbox, Input, Select, Textarea } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@/components/icons";

type OpenDialog = "approve" | "correction" | "reject" | null;

function getSeriesScopedModelOptions(
  models: ProductModel[] | null,
  seriesName: string | undefined,
  referenceModelId: string,
  referenceModelName: string,
  referenceSerial: string,
  productType: ProductModel["productType"],
): ProductModel[] {
  if (!models?.length) return [];

  const directReference = models.find(
    (model) =>
      (referenceModelId && model.id === referenceModelId) ||
      (referenceModelName && model.name === referenceModelName),
  );
  const activeModels = models.filter(
    (model) => model.active && model.productType === productType,
  );
  const serialKey = referenceSerial.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const serialReference = serialKey
    ? [...activeModels]
        .filter((model) => {
          const modelKey = model.name.toUpperCase().replace(/[^A-Z0-9]/g, "");
          return serialKey.startsWith(modelKey);
        })
        .sort((a, b) => b.name.length - a.name.length)[0]
    : undefined;
  const referenceModel = directReference ?? serialReference;
  const selectedSeries = seriesName || referenceModel?.series;

  if (!selectedSeries) {
    return activeModels;
  }

  return activeModels.filter(
    (model) => model.series.trim().toLowerCase() === selectedSeries.trim().toLowerCase(),
  );
}

export function ReviewActions({
  registration,
  onUpdated,
}: {
  registration: WarrantyRegistration;
  onUpdated: (updated: WarrantyRegistration) => void;
}) {
  const toast = useToast();
  const [dialog, setDialog] = useState<OpenDialog>(null);

  const requirements = useAsync<PhotoRequirement[]>(
    () => getPhotoRequirements(),
    [],
  );
  const models = useAsync<ProductModel[]>(
    () => getProductModels(),
    [],
  );

  const [modelName, setModelName] = useState(registration.modelName);
  const [batteryModel, setBatteryModel] = useState(
    registration.installation.batteryModel ?? "",
  );
  const [startDate, setStartDate] = useState(
    registration.installation.installationDate,
  );
  const [durationMonths, setDurationMonths] = useState<string>("");
  const [approveNote, setApproveNote] = useState("");

  const [correctionMessage, setCorrectionMessage] = useState("");
  const [correctionItems, setCorrectionItems] = useState<string[]>([]);
  const [rejectReason, setRejectReason] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();

  const approve = useMutation(approveWarranty);
  const correction = useMutation(requestCorrection);
  const reject = useMutation(rejectWarranty);

  const modelSeries = useMemo(
    () =>
      registration.seriesName ??
      models.data?.find(
        (model) =>
          (registration.modelId && model.id === registration.modelId) ||
          (registration.modelName && model.name === registration.modelName),
      )?.series ?? null,
    [models.data, registration.seriesName, registration.modelId, registration.modelName],
  );

  const modelOptions = useMemo(() => {
    const scopedModels = getSeriesScopedModelOptions(
      models.data,
      registration.seriesName,
      registration.modelId,
      registration.modelName,
      registration.serial,
      registration.productType,
    );
    const currentModelIsMissing =
      !!registration.modelName &&
      !registration.seriesName &&
      !scopedModels.some((model) => model.name === registration.modelName);

    return [
      ...(currentModelIsMissing
        ? [{ value: registration.modelName, label: registration.modelName }]
        : []),
      ...scopedModels.map((model) => ({
        value: model.name,
        label: `${model.name} · ${model.series}`,
      })),
    ];
  }, [
    models.data,
    registration.seriesName,
    registration.modelId,
    registration.modelName,
    registration.serial,
    registration.productType,
  ]);

  const batteryOptions = useMemo(
    () => {
      const scopedModels = getSeriesScopedModelOptions(
        models.data,
        registration.installation.batterySeriesName,
        "",
        registration.installation.batteryModel ?? "",
        registration.installation.batterySerial ?? "",
        "battery",
      );
      return scopedModels.map((model) => ({
        value: model.name,
        label: `${model.name} · ${model.series}`,
      }));
    },
    [
      models.data,
      registration.installation.batterySeriesName,
      registration.installation.batteryModel,
      registration.installation.batterySerial,
    ],
  );

  const effectiveMonths = durationMonths
    ? Number(durationMonths)
    : 60;

  const preview = useMemo(
    () =>
      startDate && effectiveMonths > 0
        ? calculateWarrantyPeriod(startDate, effectiveMonths)
        : null,
    [startDate, effectiveMonths],
  );

  function closeDialog() {
    setDialog(null);
    setFieldError(undefined);
    approve.clearError();
    correction.clearError();
    reject.clearError();
  }

  async function handleApprove() {
    if (!modelName.trim()) {
      setFieldError("Enter the model number shown on the side label.");
      return;
    }
    if (registration.installation.batteryInstalled && !batteryModel.trim()) {
      setFieldError("Select the battery model number shown on the battery label.");
      return;
    }
    const updated = await approve.run(registration.id, {
      modelName: modelName.trim(),
      batteryModel: registration.installation.batteryInstalled
        ? batteryModel.trim()
        : undefined,
      startDate,
      durationMonths: durationMonths ? Number(durationMonths) : undefined,
      note: approveNote.trim() || undefined,
    });
    if (updated) {
      closeDialog();
      onUpdated(updated);
      toast.success(
        "Warranty activated",
        `Covered until ${formatDate(updated.warrantyEnd)}.`,
      );
    }
  }

  async function handleCorrection() {
    const updated = await correction.run(registration.id, {
      message: correctionMessage,
      items: correctionItems,
    });
    if (updated) {
      closeDialog();
      setCorrectionMessage("");
      setCorrectionItems([]);
      onUpdated(updated);
      toast.success(
        "Correction requested",
        "The customer can now resubmit this registration.",
      );
    }
  }

  async function handleReject() {
    const updated = await reject.run(registration.id, rejectReason);
    if (updated) {
      closeDialog();
      setRejectReason("");
      onUpdated(updated);
      toast.info(
        "Registration rejected",
        "The serial number has been returned to inventory.",
      );
    }
  }

  const alreadyDecided =
    registration.status === "active" || registration.status === "expired";

  return (
    <>
      <Card>
        <CardHeader
          title="Verification decision"
          description={
            alreadyDecided
              ? "This warranty has been activated. Rejecting it will revoke the certificate."
              : "Check the side-label evidence, confirm the model, then record a decision."
          }
        />
        <CardBody className="flex flex-col gap-3">
          {registration.status === "correction" ? (
            <Alert tone="info" title="Waiting on the customer">
              A correction was requested{" "}
              {registration.reviewedAt
                ? `on ${formatDate(registration.reviewedAt)}`
                : ""}
              . You can still approve or reject this registration.
            </Alert>
          ) : null}

          <div className="flex flex-wrap gap-2">
            {!alreadyDecided ? (
              <Button
                onClick={() => setDialog("approve")}
                icon={<CheckCircleIcon />}
              >
                Approve &amp; Activate
              </Button>
            ) : null}
            {registration.status !== "rejected" ? (
              <>
                <Button
                  variant="secondary"
                  onClick={() => setDialog("correction")}
                  icon={<AlertTriangleIcon />}
                >
                  Request Correction
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => setDialog("reject")}
                  icon={<XCircleIcon />}
                  className="text-danger-fg"
                >
                  Reject
                </Button>
              </>
            ) : (
              <Button
                onClick={() => setDialog("approve")}
                icon={<CheckCircleIcon />}
              >
                Approve &amp; Activate
              </Button>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Approve + activate */}
      <Modal
        open={dialog === "approve"}
        onClose={closeDialog}
        title="Approve and activate warranty"
        description={
          modelSeries
            ? `Only ${modelSeries} models are shown here. Confirm the exact model from the side label and the warranty period will be calculated from the installation date.`
            : "Confirm the exact model from the side label and the warranty period will be calculated from the installation date."
        }
        busy={approve.pending}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeDialog}
              disabled={approve.pending}
            >
              Cancel
            </Button>
            <Button onClick={() => void handleApprove()} loading={approve.pending}>
              Approve &amp; Activate
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {approve.error ? <Alert tone="danger">{approve.error}</Alert> : null}

          <Select
            label="Model number"
            hint={
              modelSeries
                ? `Showing only models from ${modelSeries} based on the entered serial number.`
                : "Showing active models. The exact model number is printed on the product side label."
            }
            value={modelName}
            onChange={(event) => {
              setModelName(event.target.value);
              setFieldError(undefined);
            }}
            placeholder={models.loading ? "Loading models…" : "Select a model"}
            error={fieldError}
            options={modelOptions}
            disabled={models.loading}
            required
          />

          {registration.installation.batteryInstalled ? (
            <Select
              label="Battery model number"
              hint={
                registration.installation.batterySeriesName
                  ? `Showing only models from ${registration.installation.batterySeriesName}.`
                  : "Select the exact model number shown on the battery label."
              }
              value={batteryModel}
              onChange={(event) => {
                setBatteryModel(event.target.value);
                setFieldError(undefined);
              }}
              placeholder={
                models.loading ? "Loading battery models…" : "Select a battery model"
              }
              error={fieldError}
              options={batteryOptions}
              disabled={models.loading}
              required
            />
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Warranty start date"
              type="date"
              value={startDate}
              max={toIsoDate(new Date())}
              onChange={(event) => setStartDate(event.target.value)}
              hint="Defaults to the installation date."
            />
            <Input
              label="Warranty term (months)"
              type="number"
              min={1}
              max={360}
              value={durationMonths}
              onChange={(event) => setDurationMonths(event.target.value)}
              placeholder="60"
              hint="Leave blank to use the standard 60-month term."
            />
          </div>

          {preview ? (
            <div className="rounded-lg border border-success-line bg-success-bg px-4 py-3">
              <p className="text-[12px] font-medium tracking-wide text-success-fg uppercase">
                Calculated warranty period
              </p>
              <p className="mt-1 text-[13px] font-semibold text-ink">
                {formatDate(preview.start)} → {formatDate(preview.end)}
              </p>
              <p className="mt-0.5 text-[12px] text-ink-soft">
                {preview.durationMonths} month term
              </p>
            </div>
          ) : null}

          <Textarea
            label="Internal note"
            hint="Optional — recorded in the warranty history."
            value={approveNote}
            onChange={(event) => setApproveNote(event.target.value)}
            rows={2}
          />
        </div>
      </Modal>

      {/* Request correction */}
      <Modal
        open={dialog === "correction"}
        onClose={closeDialog}
        title="Request a correction"
        description="The customer is asked to fix these items and resubmit."
        busy={correction.pending}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeDialog}
              disabled={correction.pending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => void handleCorrection()}
              loading={correction.pending}
            >
              Send Correction Request
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {correction.error ? (
            <Alert tone="danger">{correction.error}</Alert>
          ) : null}

          <Textarea
            label="Message to the customer"
            value={correctionMessage}
            onChange={(event) => setCorrectionMessage(event.target.value)}
            placeholder="The serial number label photo is blurred. Please re-upload it in better lighting."
            rows={4}
            required
          />

          <fieldset>
            <legend className="text-[13px] font-medium text-ink-soft">
              Items to correct
            </legend>
            <p className="mt-0.5 mb-2 text-xs text-muted">
              Optional — listed for the customer on their status page.
            </p>
            <div className="flex flex-col gap-2">
              {(requirements.data ?? []).map((requirement) => (
                <Checkbox
                  key={requirement.id}
                  label={requirement.label}
                  checked={correctionItems.includes(requirement.label)}
                  onChange={(event) =>
                    setCorrectionItems((items) =>
                      event.target.checked
                        ? [...items, requirement.label]
                        : items.filter((item) => item !== requirement.label),
                    )
                  }
                />
              ))}
            </div>
          </fieldset>
        </div>
      </Modal>

      {/* Reject */}
      <Modal
        open={dialog === "reject"}
        onClose={closeDialog}
        title="Reject this registration"
        description="The serial number returns to inventory so a corrected registration can be submitted."
        busy={reject.pending}
        size="sm"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={closeDialog}
              disabled={reject.pending}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={() => void handleReject()}
              loading={reject.pending}
            >
              Reject registration
            </Button>
          </>
        }
      >
        <div className="flex flex-col gap-4">
          {reject.error ? <Alert tone="danger">{reject.error}</Alert> : null}
          <Alert tone="warning">
            This is shown to the customer on the public status page. Be specific
            and factual.
          </Alert>
          <Textarea
            label="Reason for rejection"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            placeholder="Registration submitted more than 180 days after the installation date."
            rows={4}
            required
          />
        </div>
      </Modal>
    </>
  );
}
