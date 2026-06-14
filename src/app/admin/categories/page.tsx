"use client";

import { useState } from "react";
import { useAdminCategories } from "./_hooks/useAdminCategories";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import type { AdminCategory } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function CategoriesPage() {
  const { categories, loading, error, refetch, create, update, remove } = useAdminCategories();
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);

  return (
    <div className="p-6 lg:p-8">
      <AdminPageHeader
        title="Categories"
        subtitle="Group products, set colours"
        actionLabel="Add New"
        onAction={() => setEditing("new")}
      />

      {loading && <p className="text-sm text-gray-400">Loading…</p>}
      {error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {error} — <button onClick={refetch} className="underline">retry</button>
        </p>
      )}

      {!loading && !error && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Color</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Products</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>
                    <span
                      className="inline-block h-5 w-5 rounded-full border"
                      style={{ backgroundColor: c.color }}
                    />
                  </TableCell>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.productCount}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setEditing(c)}>
                      Edit
                    </Button>{" "}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Delete "${c.name}"?`)) return;
                        try {
                          await remove(c.id);
                        } catch (e) {
                          alert(e instanceof Error ? e.message : "Delete failed");
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {categories.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-gray-400">
                    No categories yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && (
        <CategoryDialog
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSave={async (body) => {
            if (editing === "new") await create(body);
            else await update(editing.id, body);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}

function CategoryDialog({
  category,
  onClose,
  onSave,
}: {
  category: AdminCategory | null;
  onClose: () => void;
  onSave: (body: { name: string; color: string }) => Promise<void>;
}) {
  const [name, setName] = useState(category?.name ?? "");
  const [color, setColor] = useState(category?.color ?? "#6b7280");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{category ? "Edit Category" : "New Category"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4">
          <div className="grid gap-2">
            <Label htmlFor="cat-name">Name</Label>
            <Input id="cat-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="cat-color">Color</Label>
            <input
              id="cat-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-10 w-16 cursor-pointer rounded border border-gray-200"
            />
          </div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            disabled={saving || !name.trim()}
            onClick={async () => {
              setErr(null);
              setSaving(true);
              try {
                await onSave({ name: name.trim(), color });
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
