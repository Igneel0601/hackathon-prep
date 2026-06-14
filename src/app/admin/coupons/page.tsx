"use client";

import { AdminPageHeader } from "../_components/AdminPageHeader";
import { ComingSoon } from "../_components/ComingSoon";

export default function CouponsPage() {
  return (
    <div className="p-6 lg:p-8">
      <AdminPageHeader title="Coupons & Promos" subtitle="Discounts & offers" actionLabel="Add New" />
      <ComingSoon label="Coupons & Promos" />
    </div>
  );
}
