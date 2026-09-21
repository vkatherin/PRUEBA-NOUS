import React, { useState } from "react";
import { Avatar } from "./ui";
import type { UsuarioMe } from "../services/api";

interface Notification {
  id: number;
  title: string;
  desc: string;
  time: string;
  read: boolean;
  type: "info" | "warning" | "success";
}

const NOTIFICATIONS: Notification[] = [
  { id: 1, title: "Nueva convocatoria publicada", desc: "Convocatoria 2025-II ahora está abierta", time: "Hace 10 min", read: false, type: "info" },
  { id: 2, title: "Informe vencido", desc: "Proyecto ECOINV-2024 requiere informe de avance", time: "Hace 2 hrs", read: false, type: "warning" },
  { id: 3, title: "Producto aprobado", desc: "Artículo enviado a Scopus fue validado", time: "Hace 1 día", read: false, type: "success" },
  { id: 4, title: "Evaluación pendiente", desc: "3 proyectos esperan asignación de evaluador", time: "Hace 2 días", read: true, type: "warning" },
];

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard General",
  convocatorias: "Convocatorias",
  evaluaciones: "Evaluaciones",
  proyectos: "Gestión de Proyectos",
  seguimiento: "Seguimiento de Actividades",
  financiero: "Gestión Financiera",
  documentos: "Gestión Documental",
  productos: "Productos de Investigación",
  reportes: "Reportes e Indicadores",
  grupos: "Grupos de Investigación",
  semilleros: "Semilleros de Investigación",
  movilidad: "Movilidad Académica",
  integraciones: "Integraciones Institucionales",
  administracion: "Administración del Sistema",
};

export function Header({ activePage, onNavigate, onSearch, onLogout, user }: { activePage: string; onNavigate?: (page: string) => void; onSearch?: (q: string) => void; onLogout?: () => void; user?: UsuarioMe | null }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [search, setSearch] = useState("");
  const unread = NOTIFICATIONS.filter((n) => !n.read).length;

  const typeColors = { info: "#2563EB", warning: "#D97706", success: "var(--theme-primary)" };
  const typeBg = { info: "#EFF6FF", warning: "#FFFBEB", success: "#EBF5EF" };

  const userName = user?.nombre || "Usuario NOUS";
  const userRole = user?.roles?.[0] || "Sin Rol";
  const userEmail = user?.correo || "";

  return (
    <header className="h-16 bg-theme-bg-card border-b border-theme-border flex items-center gap-4 px-6 flex-shrink-0">
      {/* Breadcrumb title */}
      <div className="flex-1 min-w-0">
        <h2 className="text-base font-semibold text-theme-text-main truncate">{pageTitles[activePage] ?? "NOUS"}</h2>
        <p className="text-xs text-theme-text-muted">Vicerrectoría de Investigación e Innovación</p>
      </div>

      {/* Search */}
      <div className="relative hidden sm:block w-64">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-theme-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          className="w-full pl-9 pr-4 py-2 text-sm bg-theme-bg-main border border-transparent rounded-lg text-theme-text-main placeholder-[#9BAD9F] focus:outline-none focus:border-theme-primary focus:bg-theme-bg-card"
          placeholder="Buscar en NOUS..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onSearch?.(e.target.value);
          }}
        />
      </div>

      {/* Notifications */}
      <div className="relative">
        <button
          onClick={() => setNotifOpen(!notifOpen)}
          className="relative w-10 h-10 rounded-xl flex items-center justify-center text-theme-text-muted hover:bg-theme-bg-main hover:text-theme-text-main"
        >
          <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold leading-none">
              {unread}
            </span>
          )}
        </button>

        {notifOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setNotifOpen(false)} />
            <div className="absolute right-0 top-12 w-80 bg-theme-bg-card rounded-xl border border-theme-border shadow-xl z-40 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-theme-border">
                <span className="text-sm font-semibold text-theme-text-main">Notificaciones</span>
                <span className="text-xs text-theme-primary font-medium cursor-pointer hover:underline">Marcar todas como leídas</span>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {NOTIFICATIONS.map((n) => (
                  <div
                    key={n.id}
                    className={`flex gap-3 px-4 py-3 border-b border-theme-border cursor-pointer hover:bg-[#FAFAFA] ${!n.read ? "bg-theme-bg-main" : ""}`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ backgroundColor: typeBg[n.type] }}
                    >
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: typeColors[n.type] }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-theme-text-main leading-tight">{n.title}</p>
                      <p className="text-xs text-theme-text-muted mt-0.5 leading-snug">{n.desc}</p>
                      <p className="text-xs text-theme-text-muted mt-1">{n.time}</p>
                    </div>
                    {!n.read && <div className="w-2 h-2 rounded-full bg-theme-primary mt-2 flex-shrink-0" />}
                  </div>
                ))}
              </div>
              <div className="px-4 py-2.5">
                <button className="text-xs text-theme-primary font-medium hover:underline">Ver todas las notificaciones →</button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Help */}
      <button className="w-10 h-10 rounded-xl flex items-center justify-center text-theme-text-muted hover:bg-theme-bg-main hover:text-theme-text-main">
        <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <circle cx="12" cy="12" r="10" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01" />
        </svg>
      </button>

      {/* User menu */}
      <div className="relative">
        <div className="flex items-center gap-2 cursor-pointer group" onClick={() => setUserOpen(!userOpen)}>
          <Avatar name={userName} size="sm" />
          <div className="hidden lg:block">
            <p className="text-xs font-semibold text-theme-text-main leading-tight capitalize">{userRole}</p>
            <p className="text-xs text-theme-text-muted leading-tight truncate w-32">{userName}</p>
          </div>
          <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="text-theme-text-muted ml-1">
            <path strokeLinecap="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {userOpen && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setUserOpen(false)} />
            <div className="absolute right-0 top-12 w-56 bg-theme-bg-card rounded-xl border border-theme-border shadow-xl z-40 overflow-hidden">
              <div className="px-4 py-3 border-b border-theme-border bg-theme-bg-main">
                <p className="text-sm font-bold text-theme-text-main truncate">{userName}</p>
                <p className="text-xs text-theme-text-muted truncate">{userEmail}</p>
              </div>
              {[
                { label: "Mi perfil", id: "perfil", icon: "👤" },
                { label: "Preferencias", id: "preferencias", icon: "⚙️" },
                { label: "Ayuda y soporte", id: "ayuda", icon: "❓" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setUserOpen(false);
                    if (item.id !== "ayuda" && onNavigate) onNavigate(item.id);
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-theme-text-main hover:bg-theme-bg-main text-left"
                >
                  <span>{item.icon}</span>
                  {item.label}
                </button>
              ))}
              <div className="border-t border-theme-border">
                <button
                  onClick={() => { setUserOpen(false); onLogout?.(); }}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 text-left"
                >
                  <span>🚪</span>
                  Cerrar sesión
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  );
}
