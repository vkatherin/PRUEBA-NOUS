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

import { authApi, setToken, clearToken } from "./services/api";

export default function App() {
  // null = verificando, true = autenticado, false = no autenticado
  const [isLoggedIn, setIsLoggedIn] = useState<boolean | null>(null);
  const [activePage, setActivePage] = useState<Page>("dashboard");

  // ── Manejo de logout ──────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignorar errores de red al cerrar sesión
    } finally {
      clearToken();
      setIsLoggedIn(false);
    }
  }, []);

  // ── Verificación de sesión al montar ─────────────────────────────────────
  useEffect(() => {
    // 1. Detectar token proveniente del callback OAuth (?token=xxx)
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    const mfaRequired = params.get("mfaRequired");
    const errorParam  = params.get("error");

    if (urlToken) {
      setToken(urlToken);
      // Limpiar query string de la URL sin recargar la página
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (errorParam) {
      // El OAuth falló — mostrar login limpio
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsLoggedIn(false);
      return;
    }

    if (mfaRequired) {
      // Redirigido desde OAuth con MFA pendiente — el Login.tsx lo maneja
      window.history.replaceState({}, document.title, window.location.pathname);
      setIsLoggedIn(false);
      return;
    }

    // 2. Verificar sesión existente llamando a /api/auth/me
    authApi
      .getMe()
      .then(() => setIsLoggedIn(true))
      .catch(() => {
        clearToken();
        setIsLoggedIn(false);
      });
  }, []);

  // ── Escuchar evento de sesión expirada ────────────────────────────────────
  useEffect(() => {
    const onExpired = () => {
      clearToken();
      setIsLoggedIn(false);
    };
    window.addEventListener("nous:session-expired", onExpired);
    return () => window.removeEventListener("nous:session-expired", onExpired);
  }, []);

  // ── Pantalla de carga mientras se verifica la sesión ─────────────────────
  if (isLoggedIn === null) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F2F5F3" }}
      >
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin w-10 h-10" viewBox="0 0 24 24" fill="none">
            <circle
              className="opacity-25"
              cx="12" cy="12" r="10"
              stroke="#1E6B3C" strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="#1E6B3C"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <p className="text-sm font-medium" style={{ color: "#637068" }}>
            Verificando sesión...
          </p>
        </div>
      </div>
    );
  }

  // ── Pantalla de login ─────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return <Login onLogin={() => setIsLoggedIn(true)} />;
  }

  // ── App principal ─────────────────────────────────────────────────────────
  function renderPage() {
    switch (activePage) {
      case "dashboard":
        return <Dashboard onNavigate={setActivePage} />;
      case "convocatorias":
        return <Convocatorias />;
      case "evaluaciones":
        return <Evaluaciones />;
      case "proyectos":
        return <Proyectos />;
      case "seguimiento":
        return <Seguimiento />;
      case "financiero":
        return <Financiero />;
      case "documentos":
        return <Documentos />;
      case "productos":
        return <Productos />;
      case "reportes":
        return <Reportes />;
      case "grupos":
        return <Grupos />;
      case "semilleros":
        return <Semilleros />;
      case "movilidad":
        return <Movilidad />;
      case "integraciones":
        return <Integraciones />;
      case "administracion":
        return <Administracion />;
      default:
        return <Dashboard onNavigate={setActivePage} />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ backgroundColor: "#F2F5F3" }}>
      <Sidebar activePage={activePage} onNavigate={setActivePage} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header activePage={activePage} onLogout={handleLogout} />
        <main
          className="flex-1 overflow-y-auto relative"
          style={{ backgroundColor: "#F2F5F3" }}
        >
          <ErrorBoundary>
            {renderPage()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
