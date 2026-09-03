"use client";

import { SeriesImportsView } from "./SeriesImportsView";
import { SerialInventoryView } from "./SerialInventoryView";
import { useState } from "react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export function SerialListView() {
  const [tab, setTab] = useState<"series" | "serials">("series");

  return (
    <>
      <AdminPageHeader
        title="Series and Serial No. Uploader"
        description="Create series and upload the serial numbers that belong to each one."
      />
      <div role="tablist" aria-label="Series and serial views" className="mb-5 inline-flex rounded-lg border border-line bg-surface p-1">
        {([
          { id: "series", label: "Series and Serial Uploader" },
          { id: "serials", label: "Serial Numbers" },
        ] as const).map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={tab === entry.id}
            onClick={() => setTab(entry.id)}
            className={tab === entry.id ? "rounded-md bg-brand-500 px-3 py-1.5 text-[13px] font-medium text-white" : "rounded-md px-3 py-1.5 text-[13px] font-medium text-ink-soft hover:bg-canvas"}
          >
            {entry.label}
          </button>
        ))}
      </div>
      {tab === "series" ? <SeriesImportsView /> : <SerialInventoryView />}
    </>
  );
}
