"use client";

import { useState } from "react";
import { useAdminUsers } from "./_hooks/useAdminUsers";
import type { Role } from "@/lib/api-types";
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

export default function UsersPage() {
  const u = useAdminUsers();
  const [creating, setCreating] = useState(false);

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
          <h1 className="text-2xl font-bold text-gray-900">Users</h1>
          <p className="text-sm text-gray-500">Staff accounts & roles.</p>
        </div>
        <Button onClick={() => setCreating(true)}>+ New User</Button>
      </div>

      <Input
        placeholder="Search name or email…"
        value={u.q}
        onChange={(e) => { u.setPage(1); u.setQ(e.target.value); }}
        className="mb-4 max-w-xs"
      />

      {u.loading && <p className="text-sm text-gray-400">Loading…</p>}
      {u.error && <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{u.error}</p>}

      {!u.loading && !u.error && (
        <div className="rounded-xl border border-gray-200 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead className="text-center">Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {u.data.map((user) => (
                <TableRow key={user.id} className={user.active ? "" : "opacity-50"}>
                  <TableCell className="font-medium">{user.name ?? "—"}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${user.role === "ADMIN" ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-600"}`}>
                      {user.role}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{user.active ? "✓" : "—"}</TableCell>
                  <TableCell className="space-x-1 text-right">
                    <Button size="sm" variant="outline" onClick={() => {
                      const newRole: Role = user.role === "ADMIN" ? "EMPLOYEE" : "ADMIN";
                      if (confirm(`Change ${user.email} to ${newRole}?`)) void safe(() => u.update(user.id, { role: newRole }));
                    }}>Role</Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      const pw = prompt(`New password for ${user.email} (min 8):`);
                      if (pw) void safe(() => u.setPassword(user.id, pw).then(() => alert("Password updated")));
                    }}>Password</Button>
                    <Button size="sm" variant="outline" onClick={() => void safe(() => u.archive(user.id, !user.active))}>
                      {user.active ? "Archive" : "Restore"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => {
                      if (confirm(`Delete ${user.email}?`)) void safe(() => u.remove(user.id));
                    }}>Delete</Button>
                  </TableCell>
                </TableRow>
              ))}
              {u.data.length === 0 && (
                <TableRow><TableCell colSpan={5} className="text-center text-sm text-gray-400">No users.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {creating && (
        <UserDialog
          onClose={() => setCreating(false)}
          onSave={async (body) => { await u.create(body); setCreating(false); }}
        />
      )}
    </div>
  );
}

function UserDialog({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (body: { name: string; email: string; role: Role; password: string }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("EMPLOYEE");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>New User</DialogTitle></DialogHeader>
        <div className="flex flex-col gap-3">
          <div className="grid gap-1.5"><Label>Name</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="grid gap-1.5"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="grid gap-1.5">
            <Label>Role</Label>
            <select value={role} onChange={(e) => setRole(e.target.value as Role)} className="rounded-lg border border-gray-200 px-3 py-2 text-sm">
              <option value="EMPLOYEE">Employee (cashier)</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>
          <div className="grid gap-1.5"><Label>Password (min 8)</Label><Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} /></div>
          {err && <p className="text-sm text-red-600">{err}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            disabled={saving || !name.trim() || !email.trim() || password.length < 8}
            onClick={async () => {
              setErr(null);
              setSaving(true);
              try {
                await onSave({ name: name.trim(), email: email.trim(), role, password });
              } catch (e) {
                setErr(e instanceof Error ? e.message : "Save failed");
              } finally {
                setSaving(false);
              }
            }}
          >
            {saving ? "Saving…" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
