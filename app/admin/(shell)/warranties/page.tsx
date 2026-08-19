import { Suspense } from "react";
import type { Metadata } from "next";
import { WarrantyListView } from "@/components/admin/warranties/WarrantyListView";
import { Skeleton } from "@/components/ui/Feedback";

export const metadata: Metadata = {
  title: "Warranty Registrations",
  robots: { index: false },
};

export default function AdminWarrantiesPage() {
  return (
    <Suspense
      fallback={
        <div aria-hidden="true" className="flex flex-col gap-5">
          <Skeleton className="h-9 w-64" />
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-96 w-full rounded-xl" />
        </div>
      }
    >
      <WarrantyListView />
    </Suspense>
  );
}
