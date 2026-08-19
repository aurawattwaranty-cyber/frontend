"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { login } from "@/lib/services/auth";
import { useMutation } from "@/lib/hooks/useAsync";
import { validateEmail } from "@/lib/validation";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Checkbox, Input } from "@/components/ui/Field";
import { Alert } from "@/components/ui/Feedback";
import { useToast } from "@/components/ui/Toast";
import { EyeIcon, EyeOffIcon } from "@/components/icons";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | undefined>();
  const [passwordError, setPasswordError] = useState<string | undefined>();

  const signIn = useMutation(login);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const nextEmailError = validateEmail(email);
    const nextPasswordError = password ? undefined : "Password is required.";
    setEmailError(nextEmailError);
    setPasswordError(nextPasswordError);
    if (nextEmailError || nextPasswordError) return;

    const user = await signIn.run({ email, password, remember });
    if (user) {
      toast.success(`Welcome back, ${user.name.split(" ")[0]}`);
      const next = searchParams.get("next");
      router.replace(next && next.startsWith("/admin") ? next : "/admin");
    }
  }

  return (
    <Card className="mt-6">
      <CardBody className="sm:p-6">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4" noValidate>
          {signIn.error ? (
            <Alert tone="danger" title="Sign in failed">
              {signIn.error}
            </Alert>
          ) : null}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (emailError) setEmailError(undefined);
            }}
            error={emailError}
            placeholder="admin@aurawatt.in"
            autoComplete="username"
            required
          />

          <Input
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              if (passwordError) setPasswordError(undefined);
            }}
            error={passwordError}
            autoComplete="current-password"
            required
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                className="rounded-md p-1.5 text-base text-muted transition-colors hover:text-ink"
              >
                {showPassword ? <EyeOffIcon /> : <EyeIcon />}
              </button>
            }
          />

          <Checkbox
            label="Remember me on this device"
            checked={remember}
            onChange={(event) => setRemember(event.target.checked)}
          />

          <Button
            type="submit"
            size="lg"
            fullWidth
            loading={signIn.pending}
            loadingText="Signing in…"
          >
            Login
          </Button>
        </form>

      </CardBody>
    </Card>
  );
}
