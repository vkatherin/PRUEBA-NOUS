import React, { useState, useEffect, useCallback } from "react";
import './i18n';
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
import { MiPerfil } from "./pages/MiPerfil";
import { Preferencias } from "./pages/Preferencias";
import { Productos, Grupos, Movilidad, Integraciones } from "./pages/OtrasPages";
import { Documentos } from "./pages/Documentos";

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
      color: "var(--theme-primary)",
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
      color: "var(--theme-primary)",
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
          style={{ background: "linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary) 100%)" }}
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
              backgroundColor: rolSeleccionado ? "var(--theme-primary)" : "#9CA3AF",
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

// ── Modal de consentimiento de datos (Ley 1581 de 2012) ──────────────────────────────

const TEXTO_POLITICA = `De conformidad con lo establecido en la Ley 1581 de 2012, el Decreto 1377 de 2013 y demás normas que las modifiquen o complementen, la Fundación Universitaria Católica del Sur, con domicilio en Pasto, Nariño, actuando como Responsable del Tratamiento de Datos Personales, informa lo siguiente:

Sus datos personales serán recolectados, almacenados, usados y/o procesados en la plataforma NOUS con las siguientes finalidades:

• Gestionar su registro, autenticación y acceso al sistema.
• Administrar convocatorias, proyectos de investigación, semilleros y procesos de evaluación académica.
• Generar reportes institucionales y estadísticas de gestión de investigación.
• Contactarlo para notificaciones relacionadas con los procesos en los que participe.
• Dar cumplimiento a las obligaciones legales, contractuales y reglamentarias de la Institución.

Sus datos serán tratados de acuerdo con la Política de Tratamiento de Datos Personales de la Fundación Universitaria Católica del Sur.

Como Titular de los datos, usted tiene derecho a: conocer, actualizar y rectificar su información; solicitar prueba de la autorización otorgada; ser informado sobre el uso que se le ha dado a sus datos; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización y/o solicitar la supresión del dato, cuando no exista un deber legal o contractual que impida eliminarlo; y acceder de forma gratuita a sus datos personales.

Para ejercer estos derechos, puede escribir a practicante.inv1@unicatolicadelsur.edu.co (Área de Investigación).

Al hacer clic en “Acepto”, usted declara que ha leído y comprendido esta autorización, y que otorga su consentimiento libre, previo, expreso e informado para el tratamiento de sus datos personales conforme a lo aquí descrito.`;

function ConsentimientoModal({
  tempToken,
  onAceptar,
  onRechazar,
}: {
  tempToken: string;
  onAceptar: (resp: { token?: string; mfaRequired?: boolean; elegirRol?: boolean; tempToken?: string; esDocente?: boolean }) => void;
  onRechazar: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  const handleAceptar = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await authApi.aceptarDatos(tempToken);
      onAceptar(resp);
    } catch (err: any) {
      setError(err.message || "Error al registrar la aceptación");
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
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: "#fff" }}
      >
        {/* Encabezado */}
        <div
          className="px-8 pt-8 pb-6"
          style={{ background: "linear-gradient(135deg, var(--theme-primary) 0%, #1a5c35 100%)" }}
        >
          <div className="flex items-start gap-4">
            <div
              className="w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center text-2xl"
              style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
            >
              📄
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">
                AUTORIZACIÓN PARA EL TRATAMIENTO DE DATOS PERSONALES
              </h2>
              <p className="text-sm mt-1" style={{ color: "rgba(255,255,255,0.75)" }}>
                Fundación Universitaria Católica del Sur · Ley 1581 de 2012
              </p>
            </div>
          </div>
        </div>

        {/* Cuerpo con scroll */}
        <div className="px-8 py-5">
          <div
            className="rounded-xl p-4 text-sm leading-relaxed overflow-y-auto"
            style={{
              maxHeight: "320px",
              backgroundColor: "#F8FAF9",
              border: "1px solid #DDE4DF",
              color: "#2D3F35",
              whiteSpace: "pre-line",
            }}
          >
            {TEXTO_POLITICA}
          </div>

          {error && (
            <p className="text-xs text-red-600 mt-3 text-center">{error}</p>
          )}
        </div>

        {/* Botones */}
        <div
          className="px-8 pb-7 pt-2 flex flex-col-reverse sm:flex-row justify-end gap-3 border-t"
          style={{ borderColor: "#F2F5F3" }}
        >
          {/* No acepto */}
          <button
            id="btn-no-acepto-datos"
            type="button"
            onClick={onRechazar}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold border transition-all"
            style={{
              borderColor: "#DDE4DF",
              color: "#637068",
              backgroundColor: "#FAFFFE",
            }}
          >
            No acepto
          </button>

          {/* Acepto */}
          <button
            id="btn-acepto-datos"
            type="button"
            onClick={handleAceptar}
            disabled={loading}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all flex items-center gap-2"
            style={{
              backgroundColor: loading ? "#9BAD9F" : "var(--theme-primary)",
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? (
              <>
                <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Procesando...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                Acepto
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [isLoggedIn, setIsLoggedIn]                     = useState<boolean | null>(null);
  const [user, setUser]                                 = useState<UsuarioMe | null>(null);
  const [activePage, setActivePage]                     = useState<Page>("dashboard");
  const [elegirRolTempToken, setElegirRolTempToken]     = useState<string | null>(null);
  const [esDocenteLogin, setEsDocenteLogin]             = useState(false);
  const [datosPendientesTempToken, setDatosPendientesTempToken] = useState<string | null>(null);
  // Guarda el estado MFA/elegirRol que puede venir como respuesta de /aceptar-datos
  const [postConsentMfa, setPostConsentMfa]             = useState<{ tempToken: string } | null>(null);
  const [postConsentElegirRol, setPostConsentElegirRol] = useState<{ tempToken: string; esDocente: boolean } | null>(null);
  const [mensajeRechazo, setMensajeRechazo]             = useState<string | null>(null);

  // ── Multi-Theme ───────────────────────────────────────────────────────────
  const [theme, setTheme] = useState<string>(() => {
    return localStorage.getItem("theme") || "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

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

    // Gate: consentimiento de datos pendiente (viene de Google OAuth redirect)
    const datosPendientes = params.get("datosPendientes");
    if (datosPendientes === "true" && tempToken) {
      window.history.replaceState({}, document.title, window.location.pathname);
      setDatosPendientesTempToken(tempToken);
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

  // ── Escuchar eventos de flujo intermedio desde login local ────────────────
  useEffect(() => {
    // Login local devuelve datosPendientes: true → mostrar modal de consentimiento
    const onDatosPendientes = (e: Event) => {
      const { tempToken } = (e as CustomEvent).detail;
      setDatosPendientesTempToken(tempToken);
      setIsLoggedIn(false);
    };
    // Login local devuelve elegirRol: true → mostrar modal de rol
    const onElegirRol = (e: Event) => {
      const { tempToken, esDocente } = (e as CustomEvent).detail;
      setElegirRolTempToken(tempToken);
      setEsDocenteLogin(esDocente ?? false);
      setIsLoggedIn(false);
    };
    window.addEventListener("nous:datos-pendientes", onDatosPendientes);
    window.addEventListener("nous:elegir-rol", onElegirRol);
    return () => {
      window.removeEventListener("nous:datos-pendientes", onDatosPendientes);
      window.removeEventListener("nous:elegir-rol", onElegirRol);
    };
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
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="var(--theme-primary)" strokeWidth="4" />
            <path className="opacity-75" fill="var(--theme-primary)" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          <p className="text-sm font-medium" style={{ color: "#637068" }}>Verificando sesion...</p>
        </div>
      </div>
    );
  }

  // ── Modal de consentimiento de datos (antes de elegir rol) ─────────────────────────
  if (!isLoggedIn && datosPendientesTempToken && !postConsentMfa && !postConsentElegirRol) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "#F2F5F3" }}
      >
        {mensajeRechazo && (
          <div
            className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] px-5 py-3 rounded-xl text-sm font-medium shadow-lg"
            style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", color: "#DC2626" }}
          >
            {mensajeRechazo}
          </div>
        )}
        <ConsentimientoModal
          tempToken={datosPendientesTempToken}
          onAceptar={(resp) => {
            setDatosPendientesTempToken(null);
            setMensajeRechazo(null);
            if (resp.mfaRequired && resp.tempToken) {
              // Siguiente paso: MFA — pasar tempToken a Login via estado
              setPostConsentMfa({ tempToken: resp.tempToken });
            } else if (resp.elegirRol && resp.tempToken) {
              // Siguiente paso: elegir rol
              setElegirRolTempToken(resp.tempToken);
              setEsDocenteLogin(resp.esDocente ?? false);
            } else if (resp.token) {
              // Acceso directo
              setToken(resp.token);
              handleLogin();
            }
          }}
          onRechazar={() => {
            setDatosPendientesTempToken(null);
            setMensajeRechazo(
              "No es posible acceder al sistema sin aceptar la Autorización de Tratamiento de Datos Personales."
            );
          }}
        />
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
    return (
      <Login
        onLogin={handleLogin}
        initialMfaTempToken={postConsentMfa?.tempToken ?? null}
        onMfaDone={() => { setPostConsentMfa(null); }}
      />
    );
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
      case "documentos":      return <Documentos user={user} />;
      case "productos":       return <Productos />;
      case "reportes":        return <Reportes />;
      case "grupos":          return <Grupos />;
      case "semilleros":      return <Semilleros user={user} />;
      case "movilidad":       return <Movilidad />;
      case "integraciones":   return <Integraciones />;
      case "administracion":  return <Administracion />;
      case "perfil":          return <MiPerfil user={user} onUserUpdated={handleLogin} />;
      case "preferencias":    return <Preferencias onNavigate={(p) => setActivePage(p as Page)} />;
      default:                return <Dashboard onNavigate={setActivePage} />;
    }
  }

  return (
    <div className="flex h-screen overflow-hidden bg-theme-bg-main transition-colors duration-300">
      <Sidebar activePage={activePage} onNavigate={setActivePage} user={user} theme={theme} setTheme={setTheme} />
      <div className="flex flex-col flex-1 overflow-hidden min-w-0">
        <Header activePage={activePage} onNavigate={(p: string) => setActivePage(p as Page)} onLogout={handleLogout} user={user} />
        <main className="flex-1 overflow-y-auto relative bg-theme-bg-main transition-colors">
          <ErrorBoundary>
            {renderPage()}
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}
