"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sparkles, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";

const ROLES = ["Practicante Comercial", "Ejecutivo Comercial", "Jefe Comercial"] as const;

export function RegisterForm() {
  const [nombre, setNombre] = useState("");
  const [username, setUsername] = useState("");
  const [rol, setRol] = useState<(typeof ROLES)[number]>("Practicante Comercial");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, username, password, rol }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "No se pudo crear la cuenta.");
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
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl brand-gradient text-white shadow-[0_8px_24px_-8px_var(--brand)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-semibold tracking-tight">Crear cuenta</h1>
          <p className="mt-1 text-sm text-[var(--muted)]">Únete al workspace de AVLA NEXUS</p>
        </div>

        <Card className="glass-strong p-1">
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label htmlFor="nombre" className="text-xs font-medium text-[var(--muted)]">
                  Nombre completo
                </label>
                <Input id="nombre" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez" required />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="username" className="text-xs font-medium text-[var(--muted)]">
                  Usuario
                </label>
                <Input
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="nombre.apellido"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="rol" className="text-xs font-medium text-[var(--muted)]">
                  Rol
                </label>
                <select
                  id="rol"
                  value={rol}
                  onChange={(e) => setRol(e.target.value as (typeof ROLES)[number])}
                  className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-2)] px-3 text-sm text-[var(--foreground)]"
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="text-xs font-medium text-[var(--muted)]">
                  Contraseña
                </label>
                <Input
                  id="password"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="confirmPassword" className="text-xs font-medium text-[var(--muted)]">
                  Confirmar contraseña
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
                Crear cuenta
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-5 text-center text-xs text-[var(--muted)]">
          ¿Ya tienes cuenta?{" "}
          <Link href="/login" className="font-medium text-[var(--brand)] hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </main>
  );
}
