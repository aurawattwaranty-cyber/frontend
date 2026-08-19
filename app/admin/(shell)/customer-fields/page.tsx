import type { Metadata } from "next";
import { CustomerFieldsView } from "@/components/admin/customer-fields/CustomerFieldsView";

export const metadata: Metadata = {
  title: "Customer Fields",
  robots: { index: false },
};

export default function AdminCustomerFieldsPage() {
  return <CustomerFieldsView />;
}
