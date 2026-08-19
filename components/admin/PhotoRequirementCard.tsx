"use client";

import type { DragEvent } from "react";
import type { PhotoRequirement } from "@/lib/types";
import { cn } from "@/lib/utils/cn";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  ChevronDownIcon,
  ChevronUpIcon,
  GripIcon,
  PencilIcon,
  TrashIcon,
} from "@/components/icons";

export function PhotoRequirementCard({
  requirement,
  index,
  total,
  dragging,
  dropTarget,
  onEdit,
  onDelete,
  onMove,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  requirement: PhotoRequirement;
  index: number;
  total: number;
  dragging: boolean;
  dropTarget: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onMove: (direction: "up" | "down") => void;
  onDragStart: () => void;
  onDragOver: (event: DragEvent<HTMLLIElement>) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  return (
    <li
      draggable
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      className={cn(
        "flex items-start gap-3 rounded-xl border bg-surface px-4 py-3.5 shadow-card transition-colors",
        dragging && "opacity-50",
        dropTarget ? "border-brand-300 bg-brand-50" : "border-line",
      )}
    >
      <span
        aria-hidden="true"
        className="mt-0.5 cursor-grab text-base text-faint active:cursor-grabbing"
        title="Drag to reorder"
      >
        <GripIcon />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[14px] font-semibold text-ink">
            {requirement.label}
          </h3>
          {requirement.required ? null : <Badge tone="info">Optional</Badge>}
        </div>
        <p className="mt-1 text-[13px] leading-relaxed text-muted">
          {requirement.instructions}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        <button
          type="button"
          onClick={() => onMove("up")}
          disabled={index === 0}
          aria-label={`Move ${requirement.label} up`}
          className="rounded-md p-1.5 text-sm text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronUpIcon />
        </button>
        <button
          type="button"
          onClick={() => onMove("down")}
          disabled={index === total - 1}
          aria-label={`Move ${requirement.label} down`}
          className="rounded-md p-1.5 text-sm text-muted transition-colors hover:bg-canvas hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <ChevronDownIcon />
        </button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          icon={<PencilIcon />}
          aria-label={`Edit ${requirement.label}`}
          className="px-2"
        >
          <span className="sr-only sm:not-sr-only">Edit</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          icon={<TrashIcon />}
          aria-label={`Delete ${requirement.label}`}
          className="px-2 text-danger-fg hover:bg-danger-bg"
        />
      </div>
    </li>
  );
}
