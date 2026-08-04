"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const DEMO_USERS = [
  { username: "mariana.torres", password: "avla2026", rol: "Ejecutivo Comercial" },
  { username: "diego.fernandez", password: "avla2026", rol: "Practicante Comercial" },
];

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo iniciar sesión.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Hubo un problema de conexión. Intenta nuevamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="noise-veil flex min-h-screen flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          {/* eslint-disable-next-line @next/next/no-img-element -- static brand mark, next/image's optimization pipeline is unneeded overhead for a fixed 48px icon */}
          <img src="/brand/avla-mark.png" alt="Avla" className="mb-4 h-12 w-12 rounded-2xl shadow-[0_8px_24px_-8px_var(--brand)]" />
          <h1 className="text-xl font-semibold tracking-tight">AVLA NEXUS</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Commercial Intelligence Workspace</p>
        </div>

        <Card className="glass-strong p-1">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="username" className="text-xs font-medium text-[var(--muted)]">
                  Usuario
                </label>
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="nombre.apellido"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-[var(--muted)]">
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <div className="flex items-center gap-2 rounded-lg bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger)]">
                  <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                  {error}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                Iniciar sesión
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-xs text-[var(--muted)]">
          ¿No tienes cuenta?{" "}
          <Link href="/registro" className="font-medium text-[var(--brand)] hover:underline">
            Crear cuenta
          </Link>
        </p>

        <div className="mt-5 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/50 p-4">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-[var(--muted)]">
            Usuarios de demostración
          </p>
          <ul className="space-y-1.5">
            {DEMO_USERS.map((u) => (
              <li key={u.username} className="flex items-center justify-between text-[11px]">
                <span className="text-[var(--foreground)]">
                  {u.username} <span className="text-[var(--muted)]">/ {u.password}</span>
                </span>
                <span className="text-[var(--muted)]">{u.rol}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  );
}
