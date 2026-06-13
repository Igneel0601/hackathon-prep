"use client";

import { AdminPageHeader } from "../_components/AdminPageHeader";
import { ComingSoon } from "../_components/ComingSoon";

export default function UsersPage() {
  return (
    <div className="p-6 lg:p-8">
      <AdminPageHeader title="Users" subtitle="Staff & roles" actionLabel="Add New" />
      <ComingSoon label="Users" />
    </div>
  );
}
