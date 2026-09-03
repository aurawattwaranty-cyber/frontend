"use client";

import Link from "next/link";
import { useState } from "react";
import { requestAdminAccess } from "@/lib/services/auth";
import { useMutation } from "@/lib/hooks/useAsync";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";

export function RequestAccessForm() {
  const create = useMutation(requestAdminAccess);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    const account = await create.run({ name, email, password, role: "admin" });
    if (account) setSubmitted(true);
  }

  if (submitted) {
    return (
      <Card className="mt-6">
        <CardBody>
          <Alert tone="success" title="Request submitted">
            Your account is pending authorization. An admin must approve it before login.
          </Alert>
          <Link href="/admin/login" className="mt-4 block text-center text-[13px] font-semibold text-brand-600 hover:underline">
            Return to admin login
          </Link>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card className="mt-6">
      <CardBody>
        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          {create.error ? <Alert tone="danger">{create.error}</Alert> : null}
          <Input label="Full name" value={name} onChange={(event) => setName(event.target.value)} required />
          <Input label="Email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Input label="Password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} hint="At least 10 characters." required />
          <p className="rounded-lg border border-line bg-canvas-soft px-3 py-2.5 text-[13px] text-muted">
            Access type: <span className="font-medium text-ink">Admin</span>
          </p>
          <Button type="submit" loading={create.pending}>Submit access request</Button>
        </form>
      </CardBody>
    </Card>
  );
}
