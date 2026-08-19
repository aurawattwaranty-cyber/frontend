"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { usePagination } from "@/lib/hooks/useAsync";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  Paginated,
  ProductModel,
  WarrantyRegistration,
  WarrantyStatus,
} from "@/lib/types";
import {
  getWarrantyRegistrations,
  type WarrantySortField,
} from "@/lib/services/warranties";
import { getProductModels } from "@/lib/services/products";
import { useAsync, useDebounced } from "@/lib/hooks/useAsync";
import { formatCapacity, formatDate } from "@/lib/utils/format";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { WarrantyStatusBadge } from "@/components/ui/Badge";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input, Select } from "@/components/ui/Field";
import { Alert, EmptyState, TableSkeleton } from "@/components/ui/Feedback";
import {
  Pagination,
  SortableTH,
  Table,
  TableScroll,
  TBody,
  TD,
  TH,
  THead,
  TR,
  type SortDirection,
} from "@/components/ui/Table";
import { ArrowRightIcon, FileTextIcon, SearchIcon } from "@/components/icons";

const STATUS_OPTIONS: { value: WarrantyStatus | "all"; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "pending", label: "Pending Review" },
  { value: "correction", label: "Correction Required" },
  { value: "active", label: "Active" },
  { value: "rejected", label: "Rejected" },
  { value: "expired", label: "Expired" },
];

const PAGE_SIZE = 10;

function isWarrantyStatus(value: string | null): value is WarrantyStatus {
  return (
    value === "pending" ||
    value === "correction" ||
    value === "active" ||
    value === "rejected" ||
    value === "expired"
  );
}

export function WarrantyListView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get("status");

  const [search, setSearch] = useState(searchParams.get("q") ?? "");
  const [status, setStatus] = useState<WarrantyStatus | "all">(
    isWarrantyStatus(statusParam) ? statusParam : "all",
  );
  const [modelId, setModelId] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sortBy, setSortBy] = useState<WarrantySortField>("submittedAt");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const debouncedSearch = useDebounced(search);
  const models = useAsync<ProductModel[]>(() => getProductModels(), []);

  // Any change to the result set shape sends the view back to page 1.
  const [page, setPage] = usePagination(
    [debouncedSearch, status, modelId, from, to, sortBy, sortDir].join("|"),
  );

  const filtersActive =
    Boolean(debouncedSearch) ||
    status !== "all" ||
    modelId !== "all" ||
    Boolean(from) ||
    Boolean(to);

  // Keep status shareable so dashboard drill-downs and refreshes agree.
  useEffect(() => {
    const query = new URLSearchParams();
    if (status !== "all") query.set("status", status);
    if (debouncedSearch) query.set("q", debouncedSearch);
    const next = query.toString();
    router.replace(next ? `/admin/warranties?${next}` : "/admin/warranties", {
      scroll: false,
    });
  }, [status, debouncedSearch, router]);

  const result = useAsync<Paginated<WarrantyRegistration>>(
    () =>
      getWarrantyRegistrations({
        search: debouncedSearch,
        status,
        modelId,
        from: from || undefined,
        to: to || undefined,
        sortBy,
        sortDir,
        page,
        pageSize: PAGE_SIZE,
      }),
    [debouncedSearch, status, modelId, from, to, sortBy, sortDir, page],
  );

  const modelOptions = useMemo(
    () => [
      { value: "all", label: "All models" },
      ...(models.data ?? []).map((model) => ({
        value: model.id,
        label: model.name,
      })),
    ],
    [models.data],
  );

  function toggleSort(field: WarrantySortField) {
    if (sortBy === field) {
      setSortDir((direction) => (direction === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortDir(field === "customer" ? "asc" : "desc");
    }
  }

  function resetFilters() {
    setSearch("");
    setStatus("all");
    setModelId("all");
    setFrom("");
    setTo("");
  }

  const rows = result.data?.items ?? [];

  return (
    <>
      <AdminPageHeader
        title="Warranty Registrations"
        description="Verify submitted registrations and manage warranty decisions."
      />

      <Card className="mb-5">
        <CardBody className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ID, serial, customer…"
            aria-label="Search registrations"
            leading={<SearchIcon />}
            containerClassName="sm:col-span-2 lg:col-span-1"
          />
          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(event) =>
              setStatus(event.target.value as WarrantyStatus | "all")
            }
            options={STATUS_OPTIONS}
          />
          <Select
            aria-label="Filter by model"
            value={modelId}
            onChange={(event) => setModelId(event.target.value)}
            options={modelOptions}
            disabled={models.loading}
          />
          <div className="flex items-end gap-2">
            <Input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              aria-label="Submitted from"
              containerClassName="flex-1"
              max={to || undefined}
            />
            <span className="pb-2.5 text-[13px] text-muted">to</span>
            <Input
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              aria-label="Submitted to"
              containerClassName="flex-1"
              min={from || undefined}
            />
          </div>
          {filtersActive ? (
            <div className="lg:col-span-4">
              <Button variant="ghost" size="sm" onClick={resetFilters}>
                Reset filters
              </Button>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card>
        {result.initialLoading ? (
          <TableSkeleton rows={6} columns={6} />
        ) : result.error ? (
          <CardBody>
            <Alert tone="danger" title="Couldn't load registrations">
              {result.error}
            </Alert>
          </CardBody>
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<FileTextIcon />}
            title="No warranty registrations found"
            description={
              filtersActive
                ? "No registrations match the current filters."
                : "Submissions from the public registration form will appear here."
            }
            action={
              filtersActive ? (
                <Button variant="secondary" size="sm" onClick={resetFilters}>
                  Reset filters
                </Button>
              ) : null
            }
          />
        ) : (
          <>
            <TableScroll className="hidden md:block">
              <Table className="min-w-[900px]">
                <THead>
                  <TR>
                    <SortableTH
                      active={sortBy === "id"}
                      direction={sortDir}
                      onSort={() => toggleSort("id")}
                    >
                      Warranty ID
                    </SortableTH>
                    <TH>Serial Number</TH>
                    <SortableTH
                      active={sortBy === "customer"}
                      direction={sortDir}
                      onSort={() => toggleSort("customer")}
                    >
                      Customer
                    </SortableTH>
                    <TH>Product</TH>
                    <TH>Model</TH>
                    <SortableTH
                      active={sortBy === "submittedAt"}
                      direction={sortDir}
                      onSort={() => toggleSort("submittedAt")}
                    >
                      Submitted
                    </SortableTH>
                    <TH>Status</TH>
                    <TH className="text-right">Action</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((registration) => (
                    <TR key={registration.id}>
                      <TD className="font-medium text-ink">
                        #{registration.id}
                      </TD>
                      <TD className="font-mono text-[12px]">
                        {registration.serial}
                      </TD>
                      <TD>{registration.customer.fullName}</TD>
                      <TD className="whitespace-nowrap">
                        {registration.productType === "battery"
                          ? "Battery"
                          : "Hybrid Inverter"}
                      </TD>
                      <TD>
                        <span className="block">{registration.modelName}</span>
                        <span className="block text-[12px] text-muted">
                          {formatCapacity(
                            registration.capacityKw,
                            registration.productType,
                          )}
                        </span>
                      </TD>
                      <TD className="whitespace-nowrap">
                        {formatDate(registration.submittedAt)}
                      </TD>
                      <TD>
                        <WarrantyStatusBadge status={registration.status} />
                      </TD>
                      <TD className="text-right">
                        <Link
                          href={`/admin/warranties/${registration.id}`}
                          className="inline-flex items-center gap-1 rounded text-[13px] font-medium text-brand-600 hover:underline"
                        >
                          {registration.status === "pending" ||
                          registration.status === "correction"
                            ? "Review"
                            : "View"}
                          <ArrowRightIcon className="text-sm" />
                        </Link>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </TableScroll>

            <ul className="divide-y divide-line md:hidden">
              {rows.map((registration) => (
                <li key={registration.id}>
                  <Link
                    href={`/admin/warranties/${registration.id}`}
                    className="flex flex-col gap-2 px-5 py-4"
                  >
                    <span className="flex items-start justify-between gap-3">
                      <span className="text-[13px] font-semibold text-ink">
                        #{registration.id}
                      </span>
                      <WarrantyStatusBadge status={registration.status} />
                    </span>
                    <span className="font-mono text-[12px] text-muted">
                      {registration.serial}
                    </span>
                    <span className="text-[13px] text-ink-soft">
                      {registration.customer.fullName} · {registration.modelName}
                    </span>
                    <span className="text-[12px] text-muted">
                      Submitted {formatDate(registration.submittedAt)}
                    </span>
                  </Link>
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
                itemLabel="registrations"
              />
            ) : null}
          </>
        )}
      </Card>

      <p className="mt-4 text-center text-[13px] text-muted md:hidden">
        <Link href="/admin" className={buttonClasses("ghost", "sm")}>
          Back to dashboard
        </Link>
      </p>
    </>
  );
}
