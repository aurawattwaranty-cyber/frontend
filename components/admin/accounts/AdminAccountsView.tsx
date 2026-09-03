"use client";

import { useState } from "react";
import type { AdminUser } from "@/lib/types";
import {
  authorizeAdminUser,
  createAdminUser,
  getAdminUsers,
} from "@/lib/services/auth";
import { useAsync, useMutation } from "@/lib/hooks/useAsync";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Alert, EmptyState, TableSkeleton } from "@/components/ui/Feedback";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { ShieldCheckIcon } from "@/components/icons";
import { useToast } from "@/components/ui/Toast";

export function AdminAccountsView() {
  const toast = useToast();
  const users = useAsync<AdminUser[]>(getAdminUsers, []);
  const create = useMutation(createAdminUser);
  const authorize = useMutation(authorizeAdminUser);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const account = await create.run({ name, email, password, role: "admin" });
    if (!account) return;
    setName("");
    setEmail("");
    setPassword("");
    await users.refresh();
    toast.success("Account created", "The account is pending authorization.");
  }

  async function handleAuthorization(user: AdminUser, active: boolean) {
    const updated = await authorize.run(user.id, active);
    if (!updated) return;
    await users.refresh();
    toast.success(active ? "Account authorized" : "Account deactivated", updated.email);
  }

  return (
    <>
      <AdminPageHeader
        title="Admin Accounts"
        description="Create staff accounts and authorize who can access the admin portal."
      />

      <Card className="mb-5">
        <CardHeader
          title="Create an account"
          description="New accounts stay locked until an authorized admin approves them."
        />
        <CardBody>
          <form onSubmit={handleCreate} className="grid gap-4 sm:grid-cols-2" noValidate>
            <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} required />
            <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
            <Input label="Temporary password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} hint="At least 10 characters." required />
            {create.error ? <Alert tone="danger" className="sm:col-span-2">{create.error}</Alert> : null}
            <div className="sm:col-span-2">
              <Button type="submit" loading={create.pending}>Create pending account</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardHeader title="Account access" description="Only authorized accounts can sign in." />
        {users.initialLoading ? <TableSkeleton rows={4} columns={4} /> : users.error ? (
          <CardBody><Alert tone="danger">{users.error}</Alert></CardBody>
        ) : users.data?.length ? (
          <ul className="divide-y divide-line">
            {users.data.map((user) => (
              <li key={user.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
                <div className="min-w-0">
                  <p className="font-medium text-ink">{user.name}</p>
                  <p className="text-[13px] text-muted">{user.email} · {user.role}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={user.active ? "success" : "warning"}>{user.active ? "Authorized" : "Pending"}</Badge>
                  <Button
                    size="sm"
                    variant={user.active ? "secondary" : "primary"}
                    onClick={() => void handleAuthorization(user, !user.active)}
                    loading={authorize.pending}
                  >
                    {user.active ? "Deactivate" : "Authorize"}
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState icon={<ShieldCheckIcon />} title="No accounts found" description="Create an account above." />
        )}
        {authorize.error ? <CardBody><Alert tone="danger">{authorize.error}</Alert></CardBody> : null}
      </Card>
    </>
  );
}
