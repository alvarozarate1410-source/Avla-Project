import { LayoutDashboard, FolderKanban, Users, BarChart3, LayoutTemplate, Settings2 } from "lucide-react";

export const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/expedientes", label: "Expedientes", icon: FolderKanban },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/reportes", label: "Reportes", icon: BarChart3 },
  { href: "/plantillas", label: "Plantillas", icon: LayoutTemplate },
  { href: "/configuracion", label: "Configuración", icon: Settings2 },
];
