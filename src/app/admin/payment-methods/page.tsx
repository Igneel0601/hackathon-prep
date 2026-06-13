"use client";

import { AdminPageHeader } from "../_components/AdminPageHeader";
import { ComingSoon } from "../_components/ComingSoon";

export default function PaymentMethodsPage() {
  return (
    <div className="p-6 lg:p-8">
      <AdminPageHeader title="Payment Methods" subtitle="Cash / Card / UPI" actionLabel="Add New" />
      <ComingSoon label="Payment Methods" />
    </div>
  );
}
