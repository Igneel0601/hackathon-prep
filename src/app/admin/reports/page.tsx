"use client";

import { AdminPageHeader } from "../_components/AdminPageHeader";
import { ComingSoon } from "../_components/ComingSoon";

export default function ReportsPage() {
  return (
    <div className="p-6 lg:p-8">
      <AdminPageHeader title="Reports" subtitle="Sales & insights" actionLabel="Add New" />
      <ComingSoon label="Reports" />
    </div>
  );
}
