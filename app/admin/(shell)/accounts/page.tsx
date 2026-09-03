import type { Metadata } from "next";
import { AdminAccountsView } from "@/components/admin/accounts/AdminAccountsView";

export const metadata: Metadata = {
  title: "Admin Accounts",
  robots: { index: false },
};

export default function AdminAccountsPage() {
  return <AdminAccountsView />;
}
