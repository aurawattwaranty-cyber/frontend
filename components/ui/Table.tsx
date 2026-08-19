"use client";

import type { ReactNode, ThHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";
import { ChevronDownIcon, ChevronUpIcon } from "@/components/icons";
import { Button } from "./Button";

export type SortDirection = "asc" | "desc";

export function TableScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  // Wide tables scroll inside their own container so the page never does.
  return (
    <div className={cn("scrollbar-thin w-full overflow-x-auto", className)}>
      {children}
    </div>
  );
}

export function Table({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <table className={cn("w-full min-w-[640px] border-collapse", className)}>
      {children}
    </table>
  );
}

export function THead({ children }: { children: ReactNode }) {
  return (
    <thead className="border-b border-line bg-canvas-soft">{children}</thead>
  );
}

export function TBody({ children }: { children: ReactNode }) {
  return <tbody className="divide-y divide-line">{children}</tbody>;
}

export function TR({
  children,
  className,
  interactive,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  onClick?: () => void;
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        interactive && "cursor-pointer transition-colors hover:bg-canvas-soft",
        className,
      )}
    >
      {children}
    </tr>
  );
}

export function TH({
  children,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      scope="col"
      className={cn(
        "px-4 py-2.5 text-left text-[12px] font-medium whitespace-nowrap text-muted",
        className,
      )}
      {...props}
    >
      {children}
    </th>
  );
}

export function SortableTH({
  children,
  active,
  direction,
  onSort,
  className,
}: {
  children: ReactNode;
  active: boolean;
  direction: SortDirection;
  onSort: () => void;
  className?: string;
}) {
  return (
    <TH className={cn("p-0", className)} aria-sort={active ? (direction === "asc" ? "ascending" : "descending") : "none"}>
      <button
        type="button"
        onClick={onSort}
        className={cn(
          "flex w-full items-center gap-1 px-4 py-2.5 text-left text-[12px] font-medium transition-colors hover:text-ink",
          active ? "text-ink" : "text-muted",
        )}
      >
        {children}
        <span className={cn("text-[11px]", active ? "opacity-100" : "opacity-0")}>
          {direction === "asc" ? <ChevronUpIcon /> : <ChevronDownIcon />}
        </span>
      </button>
    </TH>
  );
}

export function TD({
  children,
  className,
  colSpan,
}: {
  children: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      className={cn("px-4 py-3 align-middle text-[13px] text-ink-soft", className)}
    >
      {children}
    </td>
  );
}

export function Pagination({
  page,
  totalPages,
  total,
  pageSize,
  onPageChange,
  itemLabel = "records",
  className,
}: {
  page: number;
  totalPages: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-3 border-t border-line px-5 py-3",
        className,
      )}
    >
      <p className="text-[13px] text-muted">
        {total === 0
          ? `No ${itemLabel}`
          : `Showing ${first} to ${last} of ${total} ${itemLabel}`}
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          Previous
        </Button>
        <span className="px-1 text-[13px] text-muted tabular-nums">
          {page} / {totalPages}
        </span>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
