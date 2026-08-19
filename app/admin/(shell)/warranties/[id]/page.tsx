import type { Metadata } from "next";
import { WarrantyDetailView } from "@/components/admin/warranties/WarrantyDetailView";

export async function generateMetadata({
  params,
}: PageProps<"/admin/warranties/[id]">): Promise<Metadata> {
  const { id } = await params;
  return { title: `Record #${id}`, robots: { index: false } };
}

export default async function AdminWarrantyDetailPage({
  params,
}: PageProps<"/admin/warranties/[id]">) {
  const { id } = await params;
  return <WarrantyDetailView warrantyId={id} />;
}
