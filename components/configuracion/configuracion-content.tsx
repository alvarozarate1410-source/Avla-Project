"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Camera, Loader2, CheckCircle2, AlertCircle, Users2, Plug, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@/components/layout/user-context";

function initials(name: string) {
  return name.split(" ").map((s) => s[0]).slice(0, 2).join("").toUpperCase();
}

const MAX_AVATAR_BYTES = 1_500_000;

export function ConfiguracionContent() {
  const user = useUser();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [nombre, setNombre] = useState(user.nombre);
  const [nombreStatus, setNombreStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordStatus, setPasswordStatus] = useState<"idle" | "saving" | "ok" | "error">("idle");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleSaveNombre() {
    if (!nombre.trim() || nombre.trim() === user.nombre) return;
    setNombreStatus("saving");
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre: nombre.trim() }),
      });
      if (!res.ok) throw new Error();
      setNombreStatus("ok");
      router.refresh();
    } catch {
      setNombreStatus("error");
    }
  }

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarError(null);

    if (!file.type.startsWith("image/")) {
      setAvatarError("Selecciona un archivo de imagen.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setAvatarError("La imagen debe pesar menos de 1.5 MB.");
      return;
    }

    setAvatarUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatarUrl: dataUrl }),
      });
      if (!res.ok) throw new Error();
      router.refresh();
    } catch {
      setAvatarError("No se pudo subir la imagen. Intenta nuevamente.");
    } finally {
      setAvatarUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function handleChangePassword() {
    setPasswordError(null);
    if (newPassword.length < 6) {
      setPasswordError("La nueva contraseña debe tener al menos 6 caracteres.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Las contraseñas no coinciden.");
      return;
    }

    setPasswordStatus("saving");
    try {
      const res = await fetch("/api/auth/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPasswordError(data.error ?? "No se pudo cambiar la contraseña.");
        setPasswordStatus("error");
        return;
      }
      setPasswordStatus("ok");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch {
      setPasswordStatus("error");
      setPasswordError("Hubo un problema de conexión.");
    }
  }

  return (
    <main className="noise-veil flex-1 px-6 py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Perfil</CardTitle>
            <CardDescription>Tu nombre y foto se muestran en el workspace y en los expedientes que trabajas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-2">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16">
                  {user.avatarUrl && <AvatarImage src={user.avatarUrl} alt={user.nombre} />}
                  <AvatarFallback className="text-lg">{initials(user.nombre)}</AvatarFallback>
                </Avatar>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={avatarUploading}
                  className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full brand-gradient text-white shadow-[var(--shadow-sm)]"
                  aria-label="Cambiar foto de perfil"
                >
                  {avatarUploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Camera className="h-3.5 w-3.5" />}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              </div>
              <div>
                <p className="text-sm font-medium">{user.nombre}</p>
                <p className="text-xs text-[var(--muted)]">{user.rol}</p>
                <p className="text-xs text-[var(--muted)]">@{user.username}</p>
                {avatarError && <p className="mt-1 text-xs text-[var(--danger)]">{avatarError}</p>}
              </div>
            </div>

            <div className="flex items-end gap-2">
              <div className="flex-1 space-y-1.5">
                <label htmlFor="nombre" className="text-xs font-medium text-[var(--muted)]">Nombre completo</label>
                <Input id="nombre" value={nombre} onChange={(e) => { setNombre(e.target.value); setNombreStatus("idle"); }} />
              </div>
              <Button onClick={handleSaveNombre} disabled={nombreStatus === "saving" || !nombre.trim() || nombre.trim() === user.nombre}>
                {nombreStatus === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
                {nombreStatus === "ok" && <CheckCircle2 className="h-4 w-4" />}
                Guardar
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Contraseña</CardTitle>
            <CardDescription>Cambia tu contraseña de acceso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-2">
            <div className="space-y-1.5">
              <label htmlFor="currentPassword" className="text-xs font-medium text-[var(--muted)]">Contraseña actual</label>
              <Input id="currentPassword" type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="newPassword" className="text-xs font-medium text-[var(--muted)]">Nueva contraseña</label>
                <Input id="newPassword" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label htmlFor="confirmNewPassword" className="text-xs font-medium text-[var(--muted)]">Confirmar contraseña</label>
                <Input id="confirmNewPassword" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
            </div>

            {passwordError && (
              <div className="flex items-center gap-2 rounded-lg bg-[var(--danger-bg)] px-3 py-2 text-xs text-[var(--danger)]">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {passwordError}
              </div>
            )}
            {passwordStatus === "ok" && (
              <div className="flex items-center gap-2 rounded-lg bg-[var(--success-bg)] px-3 py-2 text-xs text-[var(--success)]">
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                Contraseña actualizada.
              </div>
            )}

            <div className="flex justify-end">
              <Button onClick={handleChangePassword} disabled={passwordStatus === "saving" || !currentPassword || !newPassword}>
                {passwordStatus === "saving" && <Loader2 className="h-4 w-4 animate-spin" />}
                Actualizar contraseña
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Administración del workspace</CardTitle>
            <CardDescription>Con un solo usuario esto no es prioridad — queda listo para cuando el equipo crezca.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Users2 className="h-4 w-4 text-[var(--muted)]" />
                <p className="text-sm font-medium">Usuarios y permisos</p>
                <Badge variant="outline">Próximamente</Badge>
              </div>
              <p className="text-xs leading-relaxed text-[var(--muted)]">
                Invitar Ejecutivos, Practicantes y Jefes Comerciales al workspace, y definir qué puede ver o editar cada rol.
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 p-4">
              <div className="mb-2 flex items-center gap-2">
                <Plug className="h-4 w-4 text-[var(--muted)]" />
                <p className="text-sm font-medium">Integraciones externas</p>
                <Badge variant="outline">Próximamente</Badge>
              </div>
              <p className="text-xs leading-relaxed text-[var(--muted)]">
                Conectar SUNAT, OSCE y Equifax cuando estas entidades habiliten consultas automatizadas sin CAPTCHA.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--surface-2)]/40 px-4 py-3 text-xs text-[var(--muted)]">
          <ShieldCheck className="h-4 w-4 shrink-0 text-[var(--success)]" />
          Este es un prototipo: las cuentas viven en memoria del servidor y se reinician si el servicio se reinicia. Para
          producción, esto se conecta a una base de datos real.
        </div>
      </div>
    </main>
  );
}
