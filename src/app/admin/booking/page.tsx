"use client";

import { AdminPageHeader } from "../_components/AdminPageHeader";
import { ComingSoon } from "../_components/ComingSoon";

export default function BookingPage() {
  return (
    <div className="p-6 lg:p-8">
      <AdminPageHeader title="Floors & Tables" subtitle="Floor plan & seating" actionLabel="Add New" />
      <ComingSoon label="Floors & Tables" />
    </div>
  );
}
