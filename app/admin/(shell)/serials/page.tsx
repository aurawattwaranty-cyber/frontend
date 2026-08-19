import type { Metadata } from "next";
import { SerialListView } from "@/components/admin/serials/SerialListView";

export const metadata: Metadata = {
  title: "Serial Numbers",
  robots: { index: false },
};

export default function AdminSerialsPage() {
  return <SerialListView />;
}
