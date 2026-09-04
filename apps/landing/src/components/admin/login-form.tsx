"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from "@photobooth/ui";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      password,
      redirect: false,
    });
    if (res?.error) {
      setError("Contraseña incorrecta");
      setLoading(false);
    } else {
      router.push(searchParams.get("callbackUrl") ?? "/admin");
      router.refresh();
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle className="text-center">Panel Birdcam</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="password"
            placeholder="Contraseña del operador"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoFocus
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading || !password}>
            {loading ? "Entrando…" : "Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
