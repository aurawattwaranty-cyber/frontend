"use client";

import { useRef, useState } from "react";
import type { DragEvent } from "react";
import type { BulkImportPreview, BulkImportResult } from "@/lib/types";
import {
  BULK_IMPORT_COLUMNS,
  BULK_IMPORT_TEMPLATE,
  bulkImportSerials,
  parseBulkImportFile,
} from "@/lib/services/serials";
import { toUserMessage } from "@/lib/services/errors";
import { useMutation } from "@/lib/hooks/useAsync";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Feedback";
import { Modal } from "@/components/ui/Modal";
import {
  Table,
  TableScroll,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/Table";
import { useToast } from "@/components/ui/Toast";
import { CheckCircleIcon, DownloadIcon, UploadIcon } from "@/components/icons";

type Stage = "select" | "preview" | "done";

/**
 * Rendered only while open — unmounting on close resets the wizard, so there is
 * no state-syncing effect here.
 */
export function BulkImportModal({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: () => void;
}) {
  const toast = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("select");
  const [dragging, setDragging] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<BulkImportPreview | null>(null);
  const [result, setResult] = useState<BulkImportResult | null>(null);

  const importRows = useMutation(bulkImportSerials);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setParseError(null);
    setParsing(true);
    try {
      const parsed = await parseBulkImportFile(file);
      setPreview(parsed);
      setStage("preview");
    } catch (cause) {
      setParseError(toUserMessage(cause));
    } finally {
      setParsing(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function onDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    setDragging(false);
    if (!parsing) void handleFile(event.dataTransfer.files?.[0]);
  }

  async function handleImport() {
    if (!preview) return;
    const outcome = await importRows.run(preview);
    if (outcome) {
      setResult(outcome);
      setStage("done");
      onImported();
      toast.success(
        "Import complete",
        `${outcome.imported} serial${outcome.imported === 1 ? "" : "s"} added to inventory.`,
      );
    }
  }

  function downloadTemplate() {
    const blob = new Blob([BULK_IMPORT_TEMPLATE], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "aurawatt-serial-import-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <Modal
      open
      onClose={onClose}
      title="Bulk import serial numbers"
      description="Upload a sheet of serial numbers to add them to inventory in one go."
      size="lg"
      busy={importRows.pending}
      footer={
        stage === "preview" ? (
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setStage("select");
                setPreview(null);
              }}
              disabled={importRows.pending}
            >
              Choose another file
            </Button>
            <Button
              onClick={() => void handleImport()}
              loading={importRows.pending}
              disabled={!preview || preview.validCount === 0}
            >
              Import {preview?.validCount ?? 0} serial
              {preview?.validCount === 1 ? "" : "s"}
            </Button>
          </>
        ) : (
          <Button variant={stage === "done" ? "primary" : "secondary"} onClick={onClose}>
            {stage === "done" ? "Done" : "Cancel"}
          </Button>
        )
      }
    >
      {stage === "select" ? (
        <div className="flex flex-col gap-4">
          <div
            onDragOver={(event) => {
              event.preventDefault();
              if (!parsing) setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            className={cn(
              "flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-10 text-center transition-colors",
              dragging
                ? "border-brand-400 bg-brand-50"
                : "border-line-strong bg-canvas-soft",
            )}
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-surface text-lg text-faint shadow-card">
              <UploadIcon />
            </span>
            <p className="text-[13px] text-ink-soft">
              Drag your file here, or
            </p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => inputRef.current?.click()}
              loading={parsing}
              loadingText="Validating…"
            >
              Select file
            </Button>
            <p className="text-xs text-faint">CSV, XLSX or XLS · up to 2 MB</p>
          </div>

          {parseError ? (
            <Alert tone="danger" title="That file couldn't be validated">
              {parseError}
            </Alert>
          ) : null}

          <div className="rounded-lg border border-line bg-canvas-soft px-4 py-3">
            <p className="text-[13px] font-medium text-ink">Expected format</p>
            <p className="mt-1 text-[12px] leading-relaxed text-muted">
              The first row must be a header row with these columns:
            </p>
            <p className="mt-1.5 font-mono text-[12px] break-words text-ink-soft">
              {BULK_IMPORT_COLUMNS.join(", ")}
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={downloadTemplate}
              icon={<DownloadIcon />}
              className="mt-2 -ml-3"
            >
              Download CSV template
            </Button>
          </div>

          <input
            ref={inputRef}
            type="file"
            accept=".csv,.tsv,.txt,.xlsx,.xls"
            className="sr-only"
            aria-label="Select a serial number file"
            onChange={(event) => void handleFile(event.target.files?.[0])}
          />
        </div>
      ) : null}

      {stage === "preview" && preview ? (
        <div className="flex flex-col gap-4">
          {importRows.error ? (
            <Alert tone="danger">{importRows.error}</Alert>
          ) : null}

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-[13px] font-medium text-ink">
                {preview.fileName}
              </p>
              <p className="text-[12px] text-muted">
                {preview.rows.length} row{preview.rows.length === 1 ? "" : "s"} found
              </p>
            </div>
            <div className="flex gap-2">
              <Badge tone="success">{preview.validCount} valid</Badge>
              {preview.invalidCount > 0 ? (
                <Badge tone="danger">{preview.invalidCount} with errors</Badge>
              ) : null}
            </div>
          </div>

          {preview.invalidCount > 0 ? (
            <Alert tone="warning">
              Rows with errors are skipped. Everything else is imported.
            </Alert>
          ) : null}

          <TableScroll className="rounded-lg border border-line">
            <Table className="min-w-[560px]">
              <THead>
                <TR>
                  <TH>Row</TH>
                  <TH>Serial Number</TH>
                  <TH>Model</TH>
                  <TH>Status</TH>
                </TR>
              </THead>
              <TBody>
                {preview.rows.slice(0, 50).map((row) => (
                  <TR key={row.rowNumber}>
                    <TD className="text-muted tabular-nums">{row.rowNumber}</TD>
                    <TD className="font-mono text-[12px]">{row.serial || "—"}</TD>
                    <TD>{row.modelName || "—"}</TD>
                    <TD>
                      {row.valid ? (
                        <Badge tone="success">Ready</Badge>
                      ) : (
                        <Badge tone="danger">{row.error}</Badge>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableScroll>

          {preview.rows.length > 50 ? (
            <p className="text-center text-[12px] text-muted">
              Showing the first 50 rows of {preview.rows.length}.
            </p>
          ) : null}
        </div>
      ) : null}

      {stage === "done" && result ? (
        <div className="flex flex-col items-center gap-3 py-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success-bg text-2xl text-success-fg">
            <CheckCircleIcon />
          </span>
          <p className="text-[15px] font-semibold text-ink">Import complete</p>
          <p className="text-[13px] text-muted">
            {result.imported} serial{result.imported === 1 ? "" : "s"} added
            {result.failed > 0 ? ` · ${result.failed} skipped` : ""}.
          </p>

          {result.errors.length > 0 ? (
            <div className="mt-2 w-full rounded-lg border border-line bg-canvas-soft px-4 py-3 text-left">
              <p className="text-[12px] font-medium text-ink">Skipped rows</p>
              <ul className="mt-1.5 flex flex-col gap-1">
                {result.errors.slice(0, 8).map((error) => (
                  <li key={error.rowNumber} className="text-[12px] text-muted">
                    Row {error.rowNumber}
                    {error.serial ? ` (${error.serial})` : ""} — {error.error}
                  </li>
                ))}
                {result.errors.length > 8 ? (
                  <li className="text-[12px] text-faint">
                    …and {result.errors.length - 8} more
                  </li>
                ) : null}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </Modal>
  );
}
