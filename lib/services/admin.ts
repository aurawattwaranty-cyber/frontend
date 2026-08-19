import { apiRequest } from "@/lib/api/client";
import { notifyApiRevision } from "@/lib/api/revision";

export async function resetDemoData(): Promise<void> {
  await apiRequest<{ ok: boolean }>("/admin/reset-demo", {
    method: "POST",
  });
  notifyApiRevision();
}
