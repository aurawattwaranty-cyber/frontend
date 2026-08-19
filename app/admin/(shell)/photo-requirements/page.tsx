import type { Metadata } from "next";
import { PhotoRequirementsView } from "@/components/admin/photo-requirements/PhotoRequirementsView";

export const metadata: Metadata = {
  title: "Photo Requirements",
  robots: { index: false },
};

export default function AdminPhotoRequirementsPage() {
  return <PhotoRequirementsView />;
}
