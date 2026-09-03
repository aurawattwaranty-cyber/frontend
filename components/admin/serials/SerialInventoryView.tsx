"use client";

import { useState } from "react";
import type { Paginated, SerialNumber, SerialStatus } from "@/lib/types";
import { getSerials } from "@/lib/services/serials";
import { useAsync, useDebounced, usePagination } from "@/lib/hooks/useAsync";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { SerialStatusBadge } from "@/components/ui/Badge";
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
import { BarcodeIcon, SearchIcon } from "@/components/icons";

const FILTERS: { value: SerialStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "available", label: "Available" },
  { value: "registered", label: "Registered" },
];

export function SerialInventoryView() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<SerialStatus | "all">("all");
  const debouncedSearch = useDebounced(search);
  const [page, setPage] = usePagination(`${debouncedSearch}|${status}`);
  const result = useAsync<Paginated<SerialNumber>>(
    () => getSerials({ search: debouncedSearch, status, page, pageSize: 25 }),
    [debouncedSearch, status, page],
  );
  const rows = result.data?.items ?? [];

  return (
    <Card>
      <CardBody className="flex flex-wrap items-center gap-3 border-b border-line">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search serial number..."
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

      {result.initialLoading ? <TableSkeleton rows={8} columns={6} /> : result.error ? (
        <CardBody><Alert tone="danger" title="Could not load serial numbers">{result.error}</Alert></CardBody>
      ) : rows.length === 0 ? (
        <EmptyState icon={<BarcodeIcon />} title="No serial numbers found" description="Uploaded serial numbers will appear here." />
      ) : (
        <>
          <TableScroll>
            <Table className="min-w-[760px]">
              <THead>
                <TR>
                  <TH>Serial Number</TH>
                  <TH>Series</TH>
                  <TH>Model</TH>
                  <TH>Status</TH>
                  <TH>Added On</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((serial) => (
                  <TR key={serial.id}>
                    <TD className="font-mono text-[12px] font-medium text-ink">{serial.serial}</TD>
                    <TD>{serial.seriesName || "—"}</TD>
                    <TD>{serial.modelName || "Not assigned"}</TD>
                    <TD><SerialStatusBadge status={serial.status} /></TD>
                    <TD className="whitespace-nowrap text-muted">{formatDate(serial.addedAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </TableScroll>
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
  );
}
