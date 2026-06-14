"use client";

// Dedicated table-selection screen. Its own route (not a modal over the home
// hero) so a fresh login, the "Tables" nav, and back-navigation from the order
// / orders screens all land here directly — no hero flash behind a popup.
import { useRouter } from "next/navigation";
import { FloorPickerModal } from "../order/_components/FloorPickerModal";
import { useTables } from "../order/_hooks/useTables";
import type { TableInfo } from "@/lib/api-types";

export default function TablesPage() {
  const router = useRouter();
  const { floors, loading } = useTables();

  function handleSelectTable(table: TableInfo) {
    router.push(`/order?tableId=${table.id}&n=${table.number}`);
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse 80% 70% at 50% 40%, rgba(13,5,2,0.82) 0%, rgba(13,5,2,0.94) 100%), url('/coffee-beans.jpg')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {loading ? (
        <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <p style={{ fontFamily: "var(--cafe-font-body)", fontSize: "0.9375rem", color: "rgba(250,243,232,0.55)" }}>
            Loading tables…
          </p>
        </div>
      ) : (
        <FloorPickerModal
          floors={floors}
          onClose={() => router.push("/")}
          onSelectTable={handleSelectTable}
        />
      )}
    </div>
  );
}
