"use client";

import Link from "next/link";
import type { DashboardStats, WarrantyRegistration } from "@/lib/types";
import {
  getDashboardStats,
  getRecentRegistrations,
} from "@/lib/services/warranties";
import { useAsync } from "@/lib/hooks/useAsync";
import { formatDate } from "@/lib/utils/format";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { StatCard } from "@/components/admin/StatCard";
import { WarrantyStatusBadge } from "@/components/ui/Badge";
import { buttonClasses } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import {
  Alert,
  CardSkeleton,
  EmptyState,
  TableSkeleton,
} from "@/components/ui/Feedback";
import {
  Table,
  TableScroll,
  TBody,
  TD,
  TH,
  THead,
  TR,
} from "@/components/ui/Table";
import {
  ArrowRightIcon,
  BarcodeIcon,
  CheckCircleIcon,
  ClockIcon,
  FileTextIcon,
  PackageIcon,
  XCircleIcon,
} from "@/components/icons";

export function AdminDashboard() {
  const stats = useAsync<DashboardStats>(() => getDashboardStats(), []);
  const recent = useAsync<WarrantyRegistration[]>(
    () => getRecentRegistrations(5),
    [],
  );

  return (
    <>
      <AdminPageHeader
        title="Dashboard"
        description="Overview of warranty registrations and serial numbers."
      />

      {stats.error ? (
        <Alert tone="danger" title="Couldn't load dashboard figures" className="mb-5">
          {stats.error}
        </Alert>
      ) : null}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.initialLoading || !stats.data ? (
          Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))
        ) : (
          <>
            <StatCard
              label="Total Registrations"
              value={stats.data.totalRegistrations}
              icon={<FileTextIcon />}
              tone="brand"
              href="/admin/warranties"
            />
            <StatCard
              label="Pending Review"
              value={stats.data.pendingReview}
              icon={<ClockIcon />}
              tone="warning"
              href="/admin/warranties?status=pending"
            />
            <StatCard
              label="Active Warranties"
              value={stats.data.activeWarranties}
              icon={<CheckCircleIcon />}
              tone="success"
              href="/admin/warranties?status=active"
            />
            <StatCard
              label="Rejected"
              value={stats.data.rejected}
              icon={<XCircleIcon />}
              tone="danger"
              href="/admin/warranties?status=rejected"
            />
          </>
        )}
      </div>

      {stats.data && stats.data.correctionRequired > 0 ? (
        <Alert
          tone="info"
          className="mt-4"
          action={
            <Link
              href="/admin/warranties?status=correction"
              className="text-[13px] font-semibold whitespace-nowrap underline underline-offset-4"
            >
              Review
            </Link>
          }
        >
          {stats.data.correctionRequired} registration
          {stats.data.correctionRequired === 1 ? " is" : "s are"} waiting on a
          customer correction.
        </Alert>
      ) : null}

      <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Card>
          <CardHeader
            title="Recent Registrations"
            description="Latest warranty submissions requiring attention."
            action={
              <Link
                href="/admin/warranties"
                className={buttonClasses("secondary", "sm")}
              >
                View All
              </Link>
            }
          />
          {recent.initialLoading ? (
            <TableSkeleton rows={4} columns={5} />
          ) : recent.error ? (
            <CardBody>
              <Alert tone="danger">{recent.error}</Alert>
            </CardBody>
          ) : (recent.data ?? []).length === 0 ? (
            <EmptyState
              icon={<FileTextIcon />}
              title="No warranty registrations found"
              description="Submissions from the public registration form will appear here."
            />
          ) : (
            <>
              {/* Desktop table */}
              <TableScroll className="hidden sm:block">
                <Table className="min-w-[560px]">
                  <THead>
                    <TR>
                      <TH>ID / Serial</TH>
                      <TH>Customer</TH>
                      <TH>Date</TH>
                      <TH>Status</TH>
                      <TH className="text-right">Action</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {(recent.data ?? []).map((registration) => (
                      <TR key={registration.id}>
                        <TD>
                          <span className="block font-medium text-ink">
                            #{registration.id}
                          </span>
                          <span className="block font-mono text-[12px] text-muted">
                            {registration.serial}
                          </span>
                        </TD>
                        <TD>{registration.customer.fullName}</TD>
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
                            Review
                            <ArrowRightIcon className="text-sm" />
                          </Link>
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </TableScroll>

              {/* Mobile cards */}
              <ul className="divide-y divide-line sm:hidden">
                {(recent.data ?? []).map((registration) => (
                  <li key={registration.id}>
                    <Link
                      href={`/admin/warranties/${registration.id}`}
                      className="flex items-start justify-between gap-3 px-5 py-3.5"
                    >
                      <span className="min-w-0">
                        <span className="block text-[13px] font-medium text-ink">
                          #{registration.id} · {registration.customer.fullName}
                        </span>
                        <span className="mt-0.5 block font-mono text-[12px] text-muted">
                          {registration.serial}
                        </span>
                        <span className="mt-0.5 block text-[12px] text-muted">
                          {formatDate(registration.submittedAt)}
                        </span>
                      </span>
                      <WarrantyStatusBadge status={registration.status} />
                    </Link>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card as="aside" className="h-fit">
          <CardHeader title="Serial Inventory" />
          <CardBody className="flex flex-col gap-3">
            {stats.initialLoading || !stats.data ? (
              <>
                <CardSkeleton className="border-0 p-0 shadow-none" />
                <CardSkeleton className="border-0 p-0 shadow-none" />
              </>
            ) : (
              <>
                <InventoryRow
                  icon={<BarcodeIcon />}
                  tone="info"
                  label="Available"
                  hint="Ready to register"
                  value={stats.data.serialsAvailable}
                />
                <InventoryRow
                  icon={<PackageIcon />}
                  tone="success"
                  label="Registered"
                  hint="In use"
                  value={stats.data.serialsRegistered}
                />
              </>
            )}
            <Link
              href="/admin/serials"
              className={buttonClasses("secondary", "md", "mt-1 w-full")}
            >
              Manage Serials
            </Link>
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function InventoryRow({
  icon,
  tone,
  label,
  hint,
  value,
}: {
  icon: React.ReactNode;
  tone: "info" | "success";
  label: string;
  hint: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-base ${
          tone === "info"
            ? "bg-info-bg text-info-fg"
            : "bg-success-bg text-success-fg"
        }`}
      >
        {icon}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-ink">{label}</span>
        <span className="block text-[12px] text-muted">{hint}</span>
      </span>
      <span className="font-display text-lg font-bold tabular-nums text-ink">
        {value}
      </span>
    </div>
  );
}
