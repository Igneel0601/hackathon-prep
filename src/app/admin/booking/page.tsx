"use client";

import { useState } from "react";
import { useAdminFloors } from "./_hooks/useAdminFloors";
import type { AdminFloor, AdminTable } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TableEdit = { floorId: string; table: AdminTable | null };

export default function BookingPage() {
  const f = useAdminFloors();
  const [tableEdit, setTableEdit] = useState<TableEdit | null>(null);

  async function safe(fn: () => Promise<unknown>) {
    try {
      await fn();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Action failed");
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Floors &amp; Tables</h1>
          <p className="text-sm text-gray-500">Tables appear in the POS floor picker.</p>
        </div>
        <Button
          onClick={() => {
            const name = prompt("Floor name?");
            if (name?.trim()) void safe(() => f.createFloor(name.trim()));
          }}
        >
          + New Floor
        </Button>
      </div>

      {f.loading && <p className="text-sm text-gray-400">Loading…</p>}
      {f.error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{f.error}</p>}

      <div className="space-y-6">
        {f.floors.map((floor) => (
          <FloorBlock
            key={floor.id}
            floor={floor}
            onRenameFloor={() => {
              const name = prompt("Rename floor", floor.name);
              if (name?.trim()) void safe(() => f.updateFloor(floor.id, name.trim()));
            }}
            onDeleteFloor={() => {
              if (confirm(`Delete floor "${floor.name}"?`)) void safe(() => f.deleteFloor(floor.id));
            }}
            onAddTable={() => setTableEdit({ floorId: floor.id, table: null })}
            onEditTable={(t) => setTableEdit({ floorId: floor.id, table: t })}
            onDeleteTable={(t) => {
              if (confirm(`Delete table ${t.number}?`)) void safe(() => f.deleteTable(t.id));
            }}
          />
        ))}
        {!f.loading && f.floors.length === 0 && (
          <p className="text-sm text-gray-400">No floors yet — add one.</p>
        )}
      </div>

      {tableEdit && (
        <TableDialog
          table={tableEdit.table}
          onClose={() => setTableEdit(null)}
          onSave={async (vals) => {
            if (tableEdit.table) await f.updateTable(tableEdit.table.id, vals);
            else await f.createTable({ floorId: tableEdit.floorId, ...vals });
            setTableEdit(null);
          }}
        />
      )}
    </div>
  );
}

function FloorBlock({
  floor,
  onRenameFloor,
  onDeleteFloor,
  onAddTable,
  onEditTable,
  onDeleteTable,
}: {
  floor: AdminFloor;
  onRenameFloor: () => void;
  onDeleteFloor: () => void;
  onAddTable: () => void;
  onEditTable: (t: AdminTable) => void;
  onDeleteTable: (t: AdminTable) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="font-semibold text-gray-900">{floor.name}</h2>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onAddTable}>+ Table</Button>
          <Button size="sm" variant="outline" onClick={onRenameFloor}>Rename</Button>
          <Button size="sm" variant="outline" onClick={onDeleteFloor}>Delete</Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {floor.tables.map((t) => (
          <div
            key={t.id}
            className={`rounded-lg border p-3 text-center ${t.active ? "border-gray-200" : "border-gray-200 opacity-50"}`}
          >
            <p className="text-lg font-bold text-gray-900">#{t.number}</p>
            <p className="text-xs text-gray-500">{t.seats} seats{t.active ? "" : " · inactive"}</p>
            <div className="mt-2 flex justify-center gap-1">
              <button className="text-xs hover:underline" style={{ color: "#5C3020" }} onClick={() => onEditTable(t)}>edit</button>
              <button className="text-xs hover:underline" style={{ color: "#7A2E12" }} onClick={() => onDeleteTable(t)}>del</button>
            </div>
          </div>
        ))}
        {floor.tables.length === 0 && <p className="text-sm text-gray-400">No tables.</p>}
      </div>
    </div>
  );
}

function TableDialog({
  table,
  onClose,
  onSave,
}: {
  table: AdminTable | null;
  onClose: () => void;
  onSave: (vals: { number: number; seats: number; active: boolean }) => Promise<void>;
}) {
  const [number, setNumber] = useState(String(table?.number ?? ""));
  const [seats, setSeats] = useState(String(table?.seats ?? 4));
  const [active, setActive] = useState(table?.active ?? true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{table ? `Edit Table ${table.number}` : "New Table"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid gap-1.5">
            <Label>Table number</Label>
            <Input type="number" min="1" value={number} onChange={(e) => setNumber(e.target.value)} />
          </div>
          <div className="grid gap-1.5">
            <Label>Seats</Label>
            <Input type="number" min="1" value={seats} onChange={(e) => setSeats(e.target.value)} />
          </div>
          <label className="flex items-center justify-between text-sm">
            <span>Active</span>
            <Switch checked={active} onCheckedChange={setActive} />
          </label>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={saving || !number}
            onClick={async () => {
              setErr(null);
              setSaving(true);
              try {
                await onSave({ number: parseInt(number, 10), seats: parseInt(seats, 10) || 1, active });
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Save failed");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
