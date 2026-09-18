import React, { useState, useEffect, useCallback } from "react";
import { Sidebar, type Page } from "./components/Sidebar";
import { Header } from "./components/Header";
import { ErrorBoundary } from "./components/ErrorBoundary";

import { Login } from "./pages/Login";
import { Dashboard } from "./pages/Dashboard";
import { Proyectos } from "./pages/Proyectos";
import { Convocatorias } from "./pages/Convocatorias";
import { Evaluaciones } from "./pages/Evaluaciones";
import { Seguimiento } from "./pages/Seguimiento";
import { Financiero } from "./pages/Financiero";
import { Reportes } from "./pages/Reportes";
import { Semilleros } from "./pages/Semilleros";
import { Administracion } from "./pages/Administracion";
import { Documentos, Productos, Grupos, Movilidad, Integraciones } from "./pages/OtrasPages";

import { authApi, setToken, clearToken, type UsuarioMe } from "./services/api";

// ── Modal de seleccion de rol post-Google OAuth ───────────────────────────────
function SelectorRolModal({
  tempToken,
  soloDocente = false,
  onConfirm,
}: {
  tempToken: string;
  soloDocente?: boolean;
  onConfirm: () => void;
}) {
  const [rolSeleccionado, setRolSeleccionado] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const TODAS_OPCIONES = [
    {
      id: "estudiante",
      titulo: "Estudiante Investigador",
      desc: "Soy estudiante y participare en semilleros o proyectos de investigacion.",
      icon: "🎓",
      color: "#D97706",
    },
    {
      id: "docente",
      titulo: "Docente / Investigador",
      desc: "Soy docente y lidero o participo en proyectos de investigacion.",
      icon: "🔬",
      color: "#1E6B3C",
    },
    {
      id: "evaluador",
      titulo: "Evaluador",
      desc: "Participo como evaluador en convocatorias y procesos de revision.",
      icon: "⭐",
      color: "#2563EB",
    },
    {
      id: "sin_rol",
      titulo: "Continuar sin rol",
      desc: "Accedere al sistema sin un rol asignado (solo lectura limitada).",
      icon: "👤",
      color: "#9CA3AF",
    },
  ];

  // Docentes solo ven sus dos opciones de rol de sesion
  const OPCIONES_DOCENTE = [
    {
      id: "docente",
      titulo: "Docente / Investigador",
      desc: "Entrar como docente investigador en esta sesion.",
      icon: "🔬",
      color: "#1E6B3C",
    },
    {
      id: "evaluador",
      titulo: "Evaluador",
      desc: "Entrar como evaluador de convocatorias en esta sesion.",
      icon: "⭐",
      color: "#2563EB",
    },
  ];

  const OPCIONES = soloDocente ? OPCIONES_DOCENTE : TODAS_OPCIONES;

  const handleConfirmar = async () => {
    if (!rolSeleccionado) return;
    setLoading(true);
    setError(null);
    try {
      const resp = await authApi.seleccionarRol(rolSeleccionado, tempToken);
      setToken(resp.token);
      onConfirm();
    } catch (err: any) {
      setError(err.message || "Error al asignar el rol");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(22,61,39,0.75)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#fff" }}
      >
        <div
          className="px-8 pt-8 pb-6 text-center"
          style={{ background: "linear-gradient(135deg, #163D27 0%, #1E6B3C 100%)" }}
        >
          <div
            className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-2xl"
            style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
          >
            {soloDocente ? "🔄" : "🏛️"}
          </div>
          <h2 className="text-xl font-bold text-white mb-1">
            {soloDocente ? "¿Con qué rol ingresarás hoy?" : "¡Bienvenido a NOUS!"}
          </h2>
          <p className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
            {soloDocente
              ? "Selecciona el rol con el que trabajaras en esta sesion"
              : "Selecciona tu rol en la institucion para personalizar tu experiencia"}
          </p>
        </div>

        <div className="p-6 space-y-3">
          {OPCIONES.map((op) => (
            <button
              key={op.id}
              onClick={() => setRolSeleccionado(op.id)}
              className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150"
              style={{
                borderColor: rolSeleccionado === op.id ? op.color : "#DDE4DF",
                backgroundColor: rolSeleccionado === op.id ? op.color + "10" : "#FAFFFE",
                transform: rolSeleccionado === op.id ? "scale(1.01)" : "scale(1)",
              }}
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                style={{ backgroundColor: op.color + "15" }}
              >
                {op.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-sm font-semibold"
                  style={{ color: rolSeleccionado === op.id ? op.color : "#1A2B22" }}
                >
                  {op.titulo}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#637068" }}>
                  {op.desc}
                </p>
              </div>
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all"
                style={{
                  borderColor: rolSeleccionado === op.id ? op.color : "#DDE4DF",
                  backgroundColor: rolSeleccionado === op.id ? op.color : "transparent",
                }}
              >
                {rolSeleccionado === op.id && (
                  <svg width={10} height={10} viewBox="0 0 10 10" fill="none">
                    <path
                      d="M2 5l2.5 2.5L8 3"
                      stroke="white"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
            </button>
          ))}

          {error && (
            <p className="text-xs text-red-600 text-center pt-1">{error}</p>
          )}
        </div>

        <div
          className="px-6 pb-6 pt-2 flex justify-end gap-3 border-t"
          style={{ borderColor: "#F2F5F3" }}
        >
          <button
            onClick={handleConfirmar}
            disabled={!rolSeleccionado || loading}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
            style={{
              backgroundColor: rolSeleccionado ? "#1E6B3C" : "#9CA3AF",
              cursor: rolSeleccionado && !loading ? "pointer" : "not-allowed",
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? "Procesando..." : "Continuar al sistema →"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [user, setUser] = useState<UsuarioMe | null>(null);
  const [activePage, setActivePage] = useState<Page>("dashboard");
  const [elegirRolTempToken, setElegirRolTempToken] = useState<string | null>(null);
  const [esDocenteLogin, setEsDocenteLogin] = useState(false);

  // ── Manejo de logout ──────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignorar errores de red al cerrar sesion
    } finally {
      clearToken();
      setUser(null);
      setIsLoggedIn(false);
    }
  }, []);

  const getFirstAllowedPage = (u: UsuarioMe): Page => {
    const permisos = u.permisos || [];
    const isAdmin = u.roles?.some(r => r === "administrador" || r === "Super Administrador");
    const has = (m: string) => permisos.includes(`${m}.leer`) || isAdmin;

    if (has("dashboard")) return "dashboard";
    if (has("convocatorias")) return "convocatorias";
    if (has("proyectos")) return "proyectos";
    if (has("evaluaciones")) return "evaluaciones";
    if (has("semilleros")) return "semilleros";
    if (isAdmin || has("usuarios")) return "administracion";
    return "dashboard"; // fallback
  };

  // ── Manejo de login exitoso (local o registro) ────────────────────────────
  const handleLogin = useCallback(async () => {
    try {
      const u = await authApi.getMe();
      setUser(u);
      setActivePage(getFirstAllowedPage(u));
    } catch {
      // Si getMe falla no bloqueamos el acceso
    } finally {
      setIsLoggedIn(true);
    }
  }, []);

  // ── Verificacion de sesion al montar ─────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken    = params.get("token");
    const mfaRequired = params.get("mfaRequired");
    const errorParam  = params.get("error");
    const elegirRol   = params.get("elegirRol");
    const tempToken   = params.get("tempToken");

    if (urlToken) {
      setToken(urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (errorParam) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsLoggedIn(false);
      return;
    }

    if (mfaRequired) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsLoggedIn(false);
      return;
    }

    // Usuario sin roles o docente redirigido para elegir rol tras Google OAuth
    if (elegirRol === "true" && tempToken) {
      const esDocente = params.get("esDocente") === "true";
      window.history.replaceState({}, document.title, window.location.pathname);
      setElegirRolTempToken(tempToken);
      setEsDocenteLogin(esDocente);
      setIsLoggedIn(false);
      return;
    }

    authApi
      .getMe()
      .then((u) => {
        setUser(u);
        setActivePage(getFirstAllowedPage(u));
        setIsLoggedIn(true);
      })
      .catch(() => {
        clearToken();
        setUser(null);
        setIsLoggedIn(false);
      });
  }, []);

  // ── Escuchar evento de sesion expirada ────────────────────────────────────
  useEffect(() => {
    const onExpired = () => {
      clearToken();
      setUser(null);
      setIsLoggedIn(false);
    };
    window.addEventListener("nous:session-expired", onExpired);
    return () => window.removeEventListener("nous:session-expired", onExpired);
  }, []);

  // ── Pantalla de carga ─────────────────────────────────────────────────────
  if (isLoggedIn === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F2F5F3" }}
      >
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-10 h-10" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="#1E6B3C" strokeWidth="4" />
            <path className="opacity-75" fill="#1E6B3C" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: "#637068" }}>Verificando sesion...</p>
        </div>
      </div>
    );
  }

  // ── Modal de seleccion de rol (post Google OAuth) ─────────────────────────
  if (!isLoggedIn && elegirRolTempToken) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F2F5F3" }}
      >
        <SelectorRolModal
          tempToken={elegirRolTempToken}
          soloDocente={esDocenteLogin}
          onConfirm={() => {
            setElegirRolTempToken(null);
            setEsDocenteLogin(false);
            handleLogin();
          }}
        />
      </div>
    );
  }

  // ── Pantalla de login ─────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  // ── App principal ─────────────────────────────────────────────────────────
  function renderPage() {
    switch (activePage) {
      case "dashboard":        return <Dashboard onNavigate={setActivePage} />;
      case "convocatorias":   return <Convocatorias user={user} />;
      case "evaluaciones":    return <Evaluaciones user={user} />;
      case "proyectos":       return <Proyectos user={user} />;
      case "seguimiento":     return <Seguimiento />;
      case "financiero":      return <Financiero />;
      case "documentos":      return <Documentos />;
      case "productos":       return <Productos />;
      case "reportes":        return <Reportes />;
      case "grupos":          return <Grupos />;
      case "semilleros":      return <Semilleros user={user} />;
      case "movilidad":       return <Movilidad />;
      case "integraciones":   return <Integraciones />;
      case "administracion":  return <Administracion />;
      default:                return <Dashboard onNavigate={setActivePage} />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F2F5F3" }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} user={user} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header activePage={activePage} onLogout={handleLogout} user={user} />
        <main className="flex-1 overflow-y-auto relative" style={{ backgroundColor: "#F2F5F3" }}>
          <ErrorBoundary>
            {renderPage()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
