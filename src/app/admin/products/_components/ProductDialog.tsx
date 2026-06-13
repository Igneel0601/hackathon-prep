"use client";

import { useState } from "react";
import type { AdminCategory, AdminProduct } from "@/lib/api-types";
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

const NEW_CATEGORY = "__new__";

export function ProductDialog({
  product,
  categories,
  onClose,
  onCreate,
  onUpdate,
}: {
  product: AdminProduct | null;
  categories: AdminCategory[];
  onClose: () => void;
  onCreate: (body: Parameters<typeof import("@/lib/api-client").adminCreateProduct>[0]) => Promise<void>;
  onUpdate: (id: string, body: Parameters<typeof import("@/lib/api-client").adminUpdateProduct>[1]) => Promise<void>;
}) {
  const isEdit = !!product;
  const [name, setName] = useState(product?.name ?? "");
  const [price, setPrice] = useState(product?.price ?? "");
  const [tax, setTax] = useState(product?.tax ?? "5");
  const [unit, setUnit] = useState(product?.unit ?? "piece");
  const [description, setDescription] = useState(product?.description ?? "");
  const [sendToKitchen, setSendToKitchen] = useState(product?.sendToKitchen ?? true);
  const [active, setActive] = useState(product?.active ?? true);
  const [categoryId, setCategoryId] = useState(product?.categoryId ?? categories[0]?.id ?? NEW_CATEGORY);
  const [newCatName, setNewCatName] = useState("");
  const [newCatColor, setNewCatColor] = useState("#6b7280");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const creatingCategory = categoryId === NEW_CATEGORY;

  async function save() {
    setErr(null);
    setSaving(true);
    try {
      if (isEdit) {
        await onUpdate(product!.id, {
          name: name.trim(),
          price: Number(price),
          tax: Number(tax),
          unit,
          description: description.trim() || null,
          sendToKitchen,
          active,
          ...(categoryId !== NEW_CATEGORY ? { categoryId } : {}),
        });
      } else {
        await onCreate({
          name: name.trim(),
          price: Number(price),
          tax: Number(tax),
          unit,
          description: description.trim() || null,
          sendToKitchen,
          ...(creatingCategory
            ? { newCategory: { name: newCatName.trim(), color: newCatColor } }
            : { categoryId }),
        });
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Product" : "New Product"}</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-3">
          <Field label="Name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (₹)">
              <Input type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </Field>
            <Field label="Tax (%)">
              <Input type="number" min="0" step="0.01" value={tax} onChange={(e) => setTax(e.target.value)} />
            </Field>
          </div>
          <Field label="Unit">
            <Input value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="piece / kg / litre" />
          </Field>
          <Field label="Category">
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm"
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
              {!isEdit && <option value={NEW_CATEGORY}>+ New category…</option>}
            </select>
          </Field>
          {creatingCategory && !isEdit && (
            <div className="grid grid-cols-[1fr_auto] items-end gap-3 rounded-lg bg-gray-50 p-3">
              <Field label="New category name">
                <Input value={newCatName} onChange={(e) => setNewCatName(e.target.value)} />
              </Field>
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="h-10 w-12 cursor-pointer rounded border"
              />
            </div>
          )}
          <Field label="Description">
            <Input value={description} onChange={(e) => setDescription(e.target.value)} />
          </Field>
          <label className="flex items-center justify-between text-sm">
            <span>Send to kitchen (shows on KDS)</span>
            <Switch checked={sendToKitchen} onCheckedChange={setSendToKitchen} />
          </label>
          {isEdit && (
            <label className="flex items-center justify-between text-sm">
              <span>Active (available in POS)</span>
              <Switch checked={active} onCheckedChange={setActive} />
            </label>
          )}
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={saving || !name.trim() || !price || (creatingCategory && !newCatName.trim())}
            onClick={save}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
