import React, { useState } from "react";

type Page =
  | "dashboard"
  | "convocatorias"
  | "evaluaciones"
  | "proyectos"
  | "seguimiento"
  | "financiero"
  | "documentos"
  | "productos"
  | "reportes"
  | "grupos"
  | "semilleros"
  | "movilidad"
  | "integraciones"
  | "administracion"
  | "perfil"
  | "preferencias";

interface NavItem {
  id: Page;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  children?: { id: Page; label: string }[];
}

const Icon = ({ path, size = 18 }: { path: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={path} />
  </svg>
);

const NAV_ITEMS: NavItem[] = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: <Icon path="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10" />,
  },
  {
    id: "convocatorias",
    label: "Convocatorias",
    icon: <Icon path="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />,
    badge: "3",
  },
  {
    id: "proyectos",
    label: "Gestión de Proyectos",
    icon: <Icon path="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />,
    badge: "12",
  },
  {
    id: "evaluaciones",
    label: "Evaluaciones",
    icon: <Icon path="M9 11l3 3L22 4 M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />,
    badge: "4",
  },
  {
    id: "seguimiento",
    label: "Seguimiento",
    icon: <Icon path="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />,
  },
  {
    id: "financiero",
    label: "Gestión Financiera",
    icon: <Icon path="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
  },
  {
    id: "documentos",
    label: "Gestión Documental",
    icon: <Icon path="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />,
  },
  {
    id: "productos",
    label: "Productos de Invest.",
    icon: <Icon path="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />,
  },
  {
    id: "reportes",
    label: "Reportes e Indicadores",
    icon: <Icon path="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  },
  {
    id: "grupos",
    label: "Grupos de Investigación",
    icon: <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  },
  {
    id: "semilleros",
    label: "Semilleros",
    icon: <Icon path="M12 3v1m0 16v1M4.22 4.22l.707.707M18.364 18.364l.707.707M1 12h1M21 12h1M4.22 19.78l.707-.707M18.364 5.636l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />,
  },
  {
    id: "movilidad",
    label: "Movilidad Académica",
    icon: <Icon path="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />,
  },
  {
    id: "integraciones",
    label: "Integraciones",
    icon: <Icon path="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  },
  {
    id: "administracion",
    label: "Asignación de Roles",
    icon: <Icon path="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />,
  },
];

import type { UsuarioMe } from "../services/api";

export function Sidebar({
  activePage,
  onNavigate,
  user,
  theme,
  setTheme,
}: {
  activePage: Page;
  onNavigate: (page: Page) => void;
  user?: UsuarioMe | null;
  theme?: string;
  setTheme?: (theme: string) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  const permisos = user?.permisos || [];
  const isAdmin = user?.roles?.some(r => r === "administrador" || r === "Super Administrador");

  const hasPermiso = (modulo: string) => permisos.includes(`${modulo}.leer`) || isAdmin;

  const topItems = NAV_ITEMS.slice(0, 8).filter(item => {
    switch (item.id) {
      case "dashboard": return hasPermiso("dashboard");
      case "convocatorias": return hasPermiso("convocatorias");
      case "proyectos": return hasPermiso("proyectos");
      case "evaluaciones": return hasPermiso("evaluaciones");
      case "seguimiento": return hasPermiso("proyectos"); // Asociado a proyectos
      case "financiero": return isAdmin; // Provisionalmente solo admin
      case "documentos": return isAdmin || hasPermiso("proyectos") || hasPermiso("evaluaciones");
      case "productos": return isAdmin || hasPermiso("proyectos");
      default: return true;
    }
  });

  let bottomItems = NAV_ITEMS.slice(8).filter(item => {
    switch (item.id) {
      case "semilleros": return hasPermiso("semilleros");
      case "administracion": return hasPermiso("usuarios") || isAdmin;
      case "reportes": return isAdmin || hasPermiso("dashboard");
      case "grupos": return isAdmin || hasPermiso("proyectos");
      case "movilidad": return isAdmin;
      case "integraciones": return isAdmin;
      default: return true;
    }
  });

  return (
    <aside
      className="flex flex-col h-screen flex-shrink-0 transition-all duration-300"
      style={{
        width: collapsed ? "64px" : "256px",
        backgroundColor: "var(--theme-primary)",
        borderRight: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      {/* Logo area */}
      <div className="flex items-center gap-3 px-4 py-5 border-b relative" style={{ borderColor: "rgba(255,255,255,0.08)", minHeight: "72px" }}>
        <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-theme-bg-card flex items-center justify-center p-0.5">
          <img src="/logo.png" alt="CUS Logo" className="w-full h-full object-contain" />
        </div>
        {!collapsed && (
          <div className="min-w-0 pr-6">
            <p className="text-white font-bold text-sm leading-tight">NOUS</p>
            <p className="text-xs leading-tight" style={{ color: "var(--theme-accent)" }}>
              VRI · Católica del Sur
            </p>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3.5 top-7 w-7 h-7 rounded-full flex items-center justify-center z-50 border shadow-sm transition-transform hover:scale-110"
          style={{ 
            backgroundColor: "var(--theme-primary)", 
            borderColor: "rgba(255,255,255,0.2)",
            color: "var(--theme-accent)" 
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d={collapsed ? "M9 18l6-6-6-6" : "M15 18l-6-6 6-6"} />
          </svg>
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2">
        {!collapsed && (
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
            Principal
          </p>
        )}
        {topItems.map((item) => (
          <NavLink key={item.id} item={item} active={activePage === item.id} collapsed={collapsed} onClick={() => onNavigate(item.id)} />
        ))}

        <div className="my-3 mx-2 h-px" style={{ backgroundColor: "rgba(255,255,255,0.08)" }} />

        {!collapsed && (
          <p className="px-3 mb-2 text-xs font-semibold uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>
            Comunidad
          </p>
        )}
        {bottomItems.map((item) => (
          <NavLink key={item.id} item={item} active={activePage === item.id} collapsed={collapsed} onClick={() => onNavigate(item.id)} />
        ))}
      </nav>

      {/* Theme Selector Popover */}
      {setTheme && (
        <div className="px-3 pb-3 relative">
          {showThemeMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-full px-3 z-50">
              <div className="bg-[#1A2B22] border border-[#2A4232] rounded-xl shadow-xl overflow-hidden py-1">
                <button
                  onClick={() => { setTheme("light"); setShowThemeMenu(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-white/10 ${theme === 'light' ? 'text-white font-bold' : 'text-gray-300'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-[#16683B] border border-white/20"></span>
                  {!collapsed && "Institucional"}
                </button>
                <button
                  onClick={() => { setTheme("dark"); setShowThemeMenu(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-white/10 ${theme === 'dark' ? 'text-white font-bold' : 'text-gray-300'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-[#111111] border border-gray-600"></span>
                  {!collapsed && "Oscuro"}
                </button>
                <button
                  onClick={() => { setTheme("slate"); setShowThemeMenu(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-white/10 ${theme === 'slate' ? 'text-white font-bold' : 'text-gray-300'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-[#0F172A] border border-gray-600"></span>
                  {!collapsed && "Acero"}
                </button>
                <button
                  onClick={() => { setTheme("executive"); setShowThemeMenu(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-white/10 ${theme === 'executive' ? 'text-white font-bold' : 'text-gray-300'}`}
                >
                  <span className="w-4 h-4 rounded-full bg-[#E2E8F0] border border-gray-400"></span>
                  {!collapsed && "Marfil"}
                </button>
              </div>
            </div>
          )}
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className={`w-full flex items-center ${collapsed ? 'justify-center' : 'gap-3 px-3'} py-2 rounded-lg transition-all hover:bg-white/10`}
            style={{ color: "rgba(255,255,255,0.7)", backgroundColor: "rgba(255,255,255,0.04)" }}
            title="Cambiar apariencia"
          >
            <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 2.69l5.66 4.2c3.27 2.42 4.09 7.02 1.83 10.45A8 8 0 0112 21.31 8 8 0 014.51 17.34c-2.26-3.43-1.44-8.03 1.83-10.45z" />
            </svg>
            {!collapsed && <span className="text-sm font-medium">Apariencia</span>}
          </button>
        </div>
      )}

      {/* User area */}
      <div className="p-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
        <div
          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer"
          style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ backgroundColor: "var(--theme-accent)", color: "var(--theme-primary)" }}
          >
            {user ? user.nombre_completo.substring(0,2).toUpperCase() : "US"}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-white text-xs font-semibold truncate">{user ? user.nombre_completo : "Usuario"}</p>
              <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.45)" }}>
                {user ? user.correo_institucional : ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}

function NavLink({
  item,
  active,
  collapsed,
  onClick,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg mb-0.5 text-left transition-all duration-150 group relative"
      style={{
        backgroundColor: active ? "var(--theme-accent)" : "transparent",
        color: active ? "var(--theme-primary)" : "rgba(255,255,255,0.72)",
      }}
      onMouseEnter={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "rgba(255,255,255,0.08)";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.95)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = "transparent";
          (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.72)";
        }
      }}
    >
      <span className="flex-shrink-0">{item.icon}</span>
      {!collapsed && (
        <>
          <span className="text-sm font-medium flex-1 truncate leading-snug">{item.label}</span>
          {item.badge && !active && (
            <span
              className="text-xs font-bold px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(242,169,0,0.25)", color: "var(--theme-accent)" }}
            >
              {item.badge}
            </span>
          )}
        </>
      )}
    </button>
  );
}

export type { Page };
