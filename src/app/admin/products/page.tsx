"use client";

import { useState } from "react";
import { useAdminProducts } from "./_hooks/useAdminProducts";
import { useAdminCategories } from "../categories/_hooks/useAdminCategories";
import { ProductDialog } from "./_components/ProductDialog";
import { AdminPageHeader } from "../_components/AdminPageHeader";
import type { AdminProduct } from "@/lib/api-types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default function ProductsPage() {
  const products = useAdminProducts();
  const { categories } = useAdminCategories();
  const [editing, setEditing] = useState<AdminProduct | "new" | null>(null);

  return (
    <div className="p-6 lg:p-8">
      <AdminPageHeader
        title="Products"
        subtitle="Manage menu, prices & tax"
        actionLabel="Add Product"
        onAction={() => setEditing("new")}
      />

      <div className="mb-4 flex gap-3">
        <Input
          placeholder="Search products…"
          value={products.q}
          onChange={(e) => {
            products.setPage(1);
            products.setQ(e.target.value);
          }}
          className="max-w-xs"
        />
        <select
          value={products.categoryId ?? ""}
          onChange={(e) => {
            products.setPage(1);
            products.setCategoryId(e.target.value || null);
          }}
          className="rounded-lg border border-gray-200 px-3 py-2 text-sm"
        >
          <option value="">All categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {products.loading && <p className="text-sm text-gray-400">Loading…</p>}
      {products.error && (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          {products.error} — <button onClick={products.refetch} className="underline">retry</button>
        </p>
      )}

      {!products.loading && !products.error && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">Tax %</TableHead>
                <TableHead className="text-center">Kitchen</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {products.data.map((p) => (
                <TableRow key={p.id} className={p.active ? "" : "opacity-50"}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1.5">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: p.category?.color }} />
                      {p.category?.name ?? "—"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">₹{parseFloat(p.price).toFixed(2)}</TableCell>
                  <TableCell className="text-right">{parseFloat(p.tax).toFixed(0)}%</TableCell>
                  <TableCell className="text-center">{p.sendToKitchen ? "✓" : "—"}</TableCell>
                  <TableCell className="text-center">{p.active ? "✓" : "—"}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={() => setEditing(p)}>Edit</Button>{" "}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (!confirm(`Delete "${p.name}"?`)) return;
                        try {
                          await products.remove(p.id);
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
              {products.data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-sm text-gray-400">
                    No products.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {editing && (
        <ProductDialog
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onCreate={async (body) => {
            await products.create(body);
            setEditing(null);
          }}
          onUpdate={async (id, body) => {
            await products.update(id, body);
            setEditing(null);
          }}
        />
      )}
    </div>
  );
}
