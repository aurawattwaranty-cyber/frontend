"use client";

import Link from "next/link";
import { useState } from "react";
import type { SerialNumber } from "@/lib/types";
import { validateSerial } from "@/lib/services/serials";
import { toUserMessage } from "@/lib/services/errors";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { ChevronRightIcon } from "@/components/icons";

type SerialIssue =
  | { kind: "invalid"; message: string }
  | { kind: "registered"; message: string; warrantyId?: string };

export function SerialStep({
  initialSerial,
  onVerified,
}: {
  initialSerial: string;
  onVerified: (serial: SerialNumber) => void;
}) {
  const [value, setValue] = useState(initialSerial);
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [issue, setIssue] = useState<SerialIssue | null>(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIssue(null);

    if (!value.trim()) {
      setFieldError("Enter the serial number printed on your inverter.");
      return;
    }
    setFieldError(undefined);
    setChecking(true);

    try {
      const result = await validateSerial(value);
      if (result.status === "available" && result.serial) {
        onVerified(result.serial);
        return;
      }
      setIssue(
        result.status === "registered"
          ? {
              kind: "registered",
              message: result.message,
              warrantyId: result.existingWarrantyId,
            }
          : { kind: "invalid", message: result.message },
      );
    } catch (cause) {
      setIssue({ kind: "invalid", message: toUserMessage(cause) });
    } finally {
      setChecking(false);
    }
  }

  return (
    <Card>
      <CardBody className="sm:p-6">
        <h2 className="text-[17px] font-semibold text-ink">
          Verify Inverter Serial Number
        </h2>
        <p className="mt-1 text-[13px] text-muted">
          Enter the serial number found on the side of your Aurawatt inverter.
          If it is a recently installed unit, you can still continue with a new
          serial as long as the format matches.
        </p>

        <form onSubmit={handleSubmit} className="mt-5" noValidate>
          <Input
            label="Serial Number"
            name="serial"
            value={value}
          onChange={(event) => {
            setValue(event.target.value.toUpperCase());
            if (fieldError) setFieldError(undefined);
            if (issue) setIssue(null);
          }}
            placeholder="E.G. AW-8K-23X991"
            error={fieldError}
            monospace
            autoComplete="off"
            autoCapitalize="characters"
            spellCheck={false}
            autoFocus
            required
          />

          {issue ? (
            <Alert
              tone={issue.kind === "registered" ? "warning" : "danger"}
              className="mt-4"
              title={
                issue.kind === "registered"
                  ? "This inverter is already registered"
                  : "New serial needs a model"
              }
              action={
                issue.kind === "registered" ? (
                  <Link
                    href={
                      issue.warrantyId
                        ? `/status?id=${encodeURIComponent(issue.warrantyId)}`
                        : "/status"
                    }
                    className="text-[13px] font-semibold whitespace-nowrap underline underline-offset-4"
                  >
                    View status
                  </Link>
                ) : null
              }
              >
              {issue.message}
            </Alert>
          ) : null}

          <Button
            type="submit"
            size="lg"
            fullWidth
            className="mt-5"
            loading={checking}
            loadingText="Verifying serial…"
            disabled={!value.trim()}
            iconAfter={<ChevronRightIcon className="text-base" />}
          >
            Continue to Details
          </Button>
        </form>

        <p className="mt-4 text-center text-xs text-faint">
          The serial number is printed on the side label of the inverter, below
          the model name.
        </p>
      </CardBody>
    </Card>
  );
}

/** Compact summary of the verified unit, shown at the top of later steps. */
export function VerifiedSerialSummary({
  serial,
  onChange,
}: {
  serial: SerialNumber;
  onChange: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-success-line bg-success-bg px-4 py-3">
      <div className="min-w-0">
        <p className="font-mono text-[13px] font-semibold tracking-tight text-success-fg">
          {serial.serial}
        </p>
        <p className="mt-0.5 text-[13px] text-ink-soft">
          {serial.seriesName
            ? `Series: ${serial.seriesName}${serial.modelName ? ` · ${serial.modelName}` : ""}`
            : serial.modelName || "Model will be assigned during warranty activation"}
        </p>
      </div>
      <Button variant="ghost" size="sm" onClick={onChange}>
        Change serial
      </Button>
    </div>
  );
}
