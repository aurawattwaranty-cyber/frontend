"use client";

import Link from "next/link";
import { useState } from "react";
import type { Paginated, SerialNumber, SerialStatus } from "@/lib/types";
import { getSerials } from "@/lib/services/serials";
import { useAsync, useDebounced, usePagination } from "@/lib/hooks/useAsync";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { SerialStatusBadge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Alert, EmptyState, TableSkeleton } from "@/components/ui/Feedback";
import {
  Pagination,
  Table,
  TableScroll,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/Table";
import { BarcodeIcon, PlusIcon, SearchIcon, UploadIcon } from "@/components/icons";
import { AddSerialModal } from "./AddSerialModal";
import { BulkImportModal } from "./BulkImportModal";
import { ProductModelsPanel } from "./ProductModelsPanel";

const FILTERS: { value: SerialStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "registered", label: "Registered" },
];

const PAGE_SIZE = 15;

type Tab = "serials" | "models";

export function SerialListView() {
  const [tab, setTab] = useState<Tab>("serials");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SerialStatus | "all">("all");
  const [addOpen, setAddOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);

  const debouncedSearch = useDebounced(search);
  const [page, setPage] = usePagination(`${debouncedSearch}|${status}`);

  const result = useAsync<Paginated<SerialNumber>>(
    () =>
      getSerials({
        search: debouncedSearch,
        status,
        page,
        pageSize: PAGE_SIZE,
      }),
    [debouncedSearch, status, page],
    { enabled: tab === "serials" },
  );

  const rows = result.data?.items ?? [];
  const filtersActive = Boolean(debouncedSearch) || status !== "all";

  return (
    <>
      <AdminPageHeader
        title="Serial Numbers"
        description="Manage the inventory of valid inverter serial numbers."
        actions={
          tab === "serials" ? (
            <>
              <Button
                variant="secondary"
                onClick={() => setImportOpen(true)}
                icon={<UploadIcon />}
              >
                Bulk Import
              </Button>
              <Button onClick={() => setAddOpen(true)} icon={<PlusIcon />}>
                Add Serial
              </Button>
            </>
          ) : null
        }
      />

      <div
        role="tablist"
        aria-label="Inventory sections"
        className="mb-5 inline-flex rounded-lg border border-line bg-surface p-1"
      >
        {(
          [
            { id: "serials", label: "Serial Numbers" },
            { id: "models", label: "Product Models" },
          ] as const
        ).map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            onClick={() => setTab(entry.id)}
            className={cn(
              "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
              tab === entry.id
                ? "bg-brand-500 text-white"
                : "text-ink-soft hover:bg-canvas",
            )}
          >
            {entry.label}
          </button>
        ))}
      </div>

      {tab === "models" ? (
        <ProductModelsPanel />
      ) : (
        <Card>
          <CardBody className="flex flex-wrap items-center gap-3 border-b border-line">
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search serial or model..."
              aria-label="Search serial numbers"
              leading={<SearchIcon />}
              containerClassName="min-w-0 flex-1"
            />
            <div className="flex gap-1.5">
              {FILTERS.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setStatus(filter.value)}
                  aria-pressed={status === filter.value}
                  className={cn(
                    "rounded-lg border px-3 py-1.5 text-[13px] font-medium transition-colors",
                    status === filter.value
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-line-strong bg-surface text-ink-soft hover:bg-canvas",
                  )}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </CardBody>

          {result.initialLoading ? (
            <TableSkeleton rows={8} columns={5} />
          ) : result.error ? (
            <CardBody>
              <Alert tone="danger" title="Couldn't load serial numbers">
                {result.error}
              </Alert>
            </CardBody>
          ) : rows.length === 0 ? (
            <EmptyState
              icon={<BarcodeIcon />}
              title="No serial numbers available"
              description={
                filtersActive
                  ? "No serials match the current search or filter."
                  : "Add serials individually or import a sheet to get started."
              }
              action={
                filtersActive ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSearch("");
                      setStatus("all");
                    }}
                  >
                    Clear filters
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => setAddOpen(true)}>
                    Add Serial
                  </Button>
                )
              }
            />
          ) : (
            <>
              <TableScroll className="hidden sm:block">
                <Table className="min-w-[760px]">
                  <THead>
                    <TR>
                      <TH>Serial Number</TH>
                      <TH>Model Name</TH>
                      <TH>Capacity (kW)</TH>
                      <TH>Status</TH>
                      <TH>Added On</TH>
                      <TH className="text-right">Action</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {rows.map((serial) => (
                      <TR key={serial.id}>
                        <TD className="font-mono text-[12px] font-medium text-ink">
                          {serial.serial}
                        </TD>
                        <TD>{serial.modelName}</TD>
                        <TD className="tabular-nums">{serial.capacityKw}</TD>
                        <TD>
                          <SerialStatusBadge status={serial.status} />
                        </TD>
                        <TD className="whitespace-nowrap text-muted">
                          {formatDate(serial.addedAt)}
                        </TD>
                        <TD className="text-right">
                          {serial.status === "registered" && serial.warrantyId ? (
                            <Link
                              href={`/admin/warranties/${serial.warrantyId}`}
                              className="rounded text-[13px] font-medium text-brand-600 hover:underline"
                            >
                              View warranty
                            </Link>
                          ) : (
                            <Link
                              href={`/register?serial=${encodeURIComponent(serial.serial)}`}
                              className="rounded text-[13px] font-medium text-brand-600 hover:underline"
                            >
                              Register
                            </Link>
                          )}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </TableScroll>

              <ul className="divide-y divide-line sm:hidden">
                {rows.map((serial) => (
                  <li
                    key={serial.id}
                    className="flex items-start justify-between gap-3 px-5 py-3.5"
                  >
                    <div className="min-w-0">
                      <p className="font-mono text-[13px] font-medium text-ink">
                        {serial.serial}
                      </p>
                      <p className="mt-0.5 text-[12px] text-muted">
                        {serial.modelName} · {serial.capacityKw} kW
                      </p>
                      <p className="mt-0.5 text-[12px] text-faint">
                        Added {formatDate(serial.addedAt)}
                      </p>
                    </div>
                    <SerialStatusBadge status={serial.status} />
                  </li>
                ))}
              </ul>

              {result.data ? (
                <Pagination
                  page={result.data.page}
                  totalPages={result.data.totalPages}
                  total={result.data.total}
                  pageSize={result.data.pageSize}
                  onPageChange={setPage}
                  itemLabel="serials"
                />
              ) : null}
            </>
          )}
        </Card>
      )}

      {addOpen ? (
        <AddSerialModal
          onClose={() => setAddOpen(false)}
          onCreated={() => {
            setPage(1);
            result.refresh();
          }}
        />
      ) : null}
      {importOpen ? (
        <BulkImportModal
          onClose={() => setImportOpen(false)}
          onImported={() => {
            setPage(1);
            result.refresh();
          }}
        />
      ) : null}
    </>
  );
}
