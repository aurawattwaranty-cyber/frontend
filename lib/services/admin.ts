import { apiRequest } from "@/lib/api/client";
import { notifyApiRevision } from "@/lib/api/revision";

export async function resetDatabase(): Promise<void> {
  await apiRequest<{ ok: boolean }>("/admin/reset", {
    method: "POST",
  });
  notifyApiRevision();
}
