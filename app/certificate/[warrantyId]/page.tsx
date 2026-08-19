import type { Metadata } from "next";
import { Suspense } from "react";
import { CertificateView } from "@/components/warranty/CertificateView";
import { Skeleton } from "@/components/ui/Feedback";

export async function generateMetadata({
  params,
}: PageProps<"/certificate/[warrantyId]">): Promise<Metadata> {
  const { warrantyId } = await params;
  return {
    title: `Warranty certificate ${warrantyId}`,
    robots: { index: false },
  };
}

export default async function CertificatePage({
  params,
}: PageProps<"/certificate/[warrantyId]">) {
  const { warrantyId } = await params;

  return (
    <div className="flex flex-1 flex-col bg-canvas py-6 sm:py-10">
      <Suspense
        fallback={
          <Skeleton className="mx-auto h-[520px] w-full max-w-3xl rounded-xl" />
        }
      >
        <CertificateView warrantyId={warrantyId} />
      </Suspense>
    </div>
  );
}
