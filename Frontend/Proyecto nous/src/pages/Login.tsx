import React, { useState } from "react";
import logoImg from "@/imports/images__1_.jpg";
import { authApi, setToken } from "../services/api";

// ── Tipos de vista interna ────────────────────────────────────────────────────
type LoginView = "login" | "registro" | "mfa" | "reset-solicitud" | "reset-ok";

const DOMINIO = "unicatolicadelsur.edu.co";

export function Login({ onLogin }: { onLogin: () => void }) {
  const [view, setView] = useState<LoginView>("login");

  // Form local login
  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);

  // MFA
  const [mfaCode, setMfaCode]     = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);

  // Reset password
  const [resetEmail, setResetEmail] = useState("");

  // Registro
  const [regNombre,   setRegNombre]   = useState("");
  const [regEmail,    setRegEmail]    = useState("");
  const [regCedula,   setRegCedula]   = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm,  setRegConfirm]  = useState("");
  const [showRegPass, setShowRegPass] = useState(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const resetForm = () => {
    setError(null);
    setEmail(""); setPassword("");
    setRegNombre(""); setRegEmail(""); setRegCedula("");
    setRegPassword(""); setRegConfirm("");
    setMfaCode(""); setResetEmail("");
  };

  const goTo = (v: LoginView) => { resetForm(); setView(v); };

  // ── Login local ──────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const resp = await authApi.loginLocal(email, password);
      if (resp.mfaRequired && resp.tempToken) {
        setTempToken(resp.tempToken);
        setView("mfa");
      } else if (resp.token) {
        setToken(resp.token);
        onLogin();
      } else {
        setError("Respuesta inesperada del servidor");
      }
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };

  // ── Registro ─────────────────────────────────────────────────────────────────
  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (regPassword !== regConfirm) {
      setError("Las contraseñas no coinciden");
      return;
    }
    if (regPassword.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return;
    }

    setLoading(true);
    try {
      const resp = await authApi.registro({
        nombre_completo: regNombre,
        correo: regEmail,
        password: regPassword,
        cedula: regCedula || undefined,
      });
      if (resp.token) {
        setToken(resp.token);
        onLogin();
      } else {
        setError("Error inesperado al crear la cuenta");
      }
    } catch (err: any) {
      setError(err.message || "Error al registrarse");
    } finally {
      setLoading(false);
    }
  };

  // ── Verificación MFA ─────────────────────────────────────────────────────────
  const handleMfaVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (tempToken) {
        const prevToken = localStorage.getItem("nous_token");
        localStorage.setItem("nous_token", tempToken);
        try {
          const resp = await authApi.verifyMfa(mfaCode);
          setToken(resp.token);
          onLogin();
        } finally {
          if (prevToken) localStorage.setItem("nous_token", prevToken);
          else localStorage.removeItem("nous_token");
        }
      }
    } catch (err: any) {
      setError(err.message || "Código MFA inválido");
    } finally {
      setLoading(false);
    }
  };

  // ── Solicitud de reset ────────────────────────────────────────────────────────
  const handleResetSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await authApi.solicitarReset(resetEmail);
      setView("reset-ok");
    } catch (err: any) {
      setError(err.message || "Error al solicitar recuperación");
    } finally {
      setLoading(false);
    }
  };

  // ── Panel izquierdo (siempre igual) ──────────────────────────────────────────
  const leftPanel = (
    <div
      className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12"
      style={{ backgroundColor: "#163D27" }}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1.5">
          <img src={logoImg} alt="CUS Logo" className="w-full h-full object-contain" />
        </div>
        <div>
          <p className="text-white font-bold text-lg leading-tight">NOUS</p>
          <p className="text-xs" style={{ color: "#F2A900" }}>Sistema Integral de Gestión</p>
        </div>
      </div>

      <div>
        <div className="mb-8">
          <span
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ backgroundColor: "rgba(242,169,0,0.15)", color: "#F2A900" }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#F2A900]" />
            Vicerrectoría de Investigación e Innovación
          </span>
        </div>
        <h1 className="text-4xl font-bold text-white leading-tight mb-4">
          Gestión integral
          <br />
          <span style={{ color: "#F2A900" }}>de la investigación</span>
          <br />
          universitaria.
        </h1>
        <p className="text-base leading-relaxed" style={{ color: "rgba(255,255,255,0.6)" }}>
          Plataforma centralizada para administrar convocatorias, proyectos, seguimiento de actividades,
          gestión financiera y productos de investigación.
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Proyectos activos", value: "47" },
          { label: "Investigadores",    value: "128" },
          { label: "Productos 2024",    value: "89" },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl p-4"
            style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <p className="text-2xl font-bold text-white">{stat.value}</p>
            <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>{stat.label}</p>
          </div>
        ))}
      </div>

      <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
        © 2025 Fundación Universitaria Católica del Sur · Todos los derechos reservados
      </p>
    </div>
  );

  // ── Alerta de error ───────────────────────────────────────────────────────────
  const errorAlert = error && (
    <div
      className="flex items-start gap-2 p-3 rounded-xl text-sm mb-4"
      style={{ backgroundColor: "rgba(220,38,38,0.08)", border: "1px solid rgba(220,38,38,0.2)", color: "#dc2626" }}
    >
      <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <span>{error}</span>
    </div>
  );

  // ── Botón de Google ───────────────────────────────────────────────────────────
  const googleBtn = (
    <button
      id="btn-google-oauth"
      type="button"
      onClick={() => authApi.loginWithGoogle()}
      className="w-full py-2.5 rounded-xl border border-[#DDE4DF] text-sm font-medium text-[#1A2B22] flex items-center justify-center gap-2 hover:bg-[#F2F5F3] transition-colors"
    >
      <svg width={18} height={18} viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
      </svg>
      Continuar con Google
    </button>
  );

  // ── Vista: LOGIN ─────────────────────────────────────────────────────────────
  if (view === "login") {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: "#F2F5F3" }}>
        {leftPanel}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            {/* Mobile logo */}
            <div className="flex items-center gap-3 mb-10 lg:hidden">
              <div className="w-10 h-10 rounded-xl bg-white border border-[#DDE4DF] flex items-center justify-center p-1">
                <img src={logoImg} alt="CUS Logo" className="w-full h-full object-contain" />
              </div>
              <div>
                <p className="font-bold text-base text-[#1A2B22]">NOUS</p>
                <p className="text-xs text-[#637068]">Fundación Universitaria Católica del Sur</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-[#DDE4DF] shadow-lg p-8">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-[#1A2B22]">Bienvenido</h2>
                <p className="text-sm text-[#637068] mt-1">
                  Ingresa tus credenciales institucionales para continuar
                </p>
              </div>

              {errorAlert}

              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#1A2B22] mb-1.5">
                    Correo institucional
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAD9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-[#DDE4DF] rounded-xl text-[#1A2B22] focus:outline-none focus:border-[#1E6B3C] focus:ring-2 focus:ring-[#1E6B3C]/20"
                      placeholder={`usuario@${DOMINIO}`}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#1A2B22] mb-1.5">Contraseña</label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAD9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-[#DDE4DF] rounded-xl text-[#1A2B22] focus:outline-none focus:border-[#1E6B3C] focus:ring-2 focus:ring-[#1E6B3C]/20"
                      placeholder="Contraseña"
                    />
                  </div>
                  <div className="flex justify-end mt-1.5">
                    <button
                      type="button"
                      id="btn-olvide-password"
                      onClick={() => goTo("reset-solicitud")}
                      className="text-xs text-[#1E6B3C] font-medium hover:underline"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>
                </div>

                <button
                  id="btn-login-local"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2"
                  style={{ backgroundColor: loading ? "#9BAD9F" : "#1E6B3C" }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Iniciando sesión...
                    </>
                  ) : (
                    <>
                      Ingresar al sistema
                      <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </form>

              {/* SSO */}
              <div className="mt-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 h-px bg-[#DDE4DF]" />
                  <span className="text-xs text-[#9BAD9F] font-medium">O ingresar con</span>
                  <div className="flex-1 h-px bg-[#DDE4DF]" />
                </div>
                {googleBtn}
              </div>

              {/* Ir a registro */}
              <p className="text-center text-sm text-[#637068] mt-6">
                ¿No tienes cuenta?{" "}
                <button
                  id="btn-ir-registro"
                  type="button"
                  onClick={() => goTo("registro")}
                  className="text-[#1E6B3C] font-semibold hover:underline"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>

            <p className="text-center text-xs text-[#9BAD9F] mt-6">
              Sistema de uso exclusivo para personal autorizado de la VRI.{" "}
              <span className="text-[#1E6B3C] cursor-pointer hover:underline">Soporte técnico</span>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista: REGISTRO ──────────────────────────────────────────────────────────
  if (view === "registro") {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: "#F2F5F3" }}>
        {leftPanel}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl border border-[#DDE4DF] shadow-lg p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-[#1A2B22]">Crear cuenta</h2>
                <p className="text-sm text-[#637068] mt-1">
                  Usa tu correo institucional <span className="font-medium text-[#1A2B22]">@{DOMINIO}</span>
                </p>
              </div>

              {errorAlert}

              {/* Botón Google arriba en registro también */}
              <div className="mb-5">
                {googleBtn}
                <div className="flex items-center gap-3 mt-5 mb-1">
                  <div className="flex-1 h-px bg-[#DDE4DF]" />
                  <span className="text-xs text-[#9BAD9F] font-medium">O crear cuenta con correo</span>
                  <div className="flex-1 h-px bg-[#DDE4DF]" />
                </div>
              </div>

              <form onSubmit={handleRegistro} className="flex flex-col gap-4">
                {/* Nombre completo */}
                <div>
                  <label className="block text-sm font-medium text-[#1A2B22] mb-1.5">
                    Nombre completo <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAD9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <input
                      id="reg-nombre"
                      type="text"
                      value={regNombre}
                      onChange={(e) => setRegNombre(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-[#DDE4DF] rounded-xl text-[#1A2B22] focus:outline-none focus:border-[#1E6B3C] focus:ring-2 focus:ring-[#1E6B3C]/20"
                      placeholder="Ej: Juan Pérez García"
                      required
                    />
                  </div>
                </div>

                {/* Correo */}
                <div>
                  <label className="block text-sm font-medium text-[#1A2B22] mb-1.5">
                    Correo institucional <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAD9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      id="reg-email"
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-[#DDE4DF] rounded-xl text-[#1A2B22] focus:outline-none focus:border-[#1E6B3C] focus:ring-2 focus:ring-[#1E6B3C]/20"
                      placeholder={`usuario@${DOMINIO}`}
                      required
                    />
                  </div>
                </div>

                {/* Cédula (opcional) */}
                <div>
                  <label className="block text-sm font-medium text-[#1A2B22] mb-1.5">
                    Cédula <span className="text-[#9BAD9F] font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAD9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0" />
                    </svg>
                    <input
                      id="reg-cedula"
                      type="text"
                      value={regCedula}
                      onChange={(e) => setRegCedula(e.target.value.replace(/\D/g, ""))}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-[#DDE4DF] rounded-xl text-[#1A2B22] focus:outline-none focus:border-[#1E6B3C] focus:ring-2 focus:ring-[#1E6B3C]/20"
                      placeholder="Número de cédula"
                    />
                  </div>
                </div>

                {/* Contraseña */}
                <div>
                  <label className="block text-sm font-medium text-[#1A2B22] mb-1.5">
                    Contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAD9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <input
                      id="reg-password"
                      type={showRegPass ? "text" : "password"}
                      value={regPassword}
                      onChange={(e) => setRegPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-3 text-sm border border-[#DDE4DF] rounded-xl text-[#1A2B22] focus:outline-none focus:border-[#1E6B3C] focus:ring-2 focus:ring-[#1E6B3C]/20"
                      placeholder="Mínimo 8 caracteres"
                      required
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => setShowRegPass(!showRegPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9BAD9F] hover:text-[#637068]"
                    >
                      {showRegPass ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Confirmar contraseña */}
                <div>
                  <label className="block text-sm font-medium text-[#1A2B22] mb-1.5">
                    Confirmar contraseña <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAD9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <input
                      id="reg-confirm"
                      type={showRegPass ? "text" : "password"}
                      value={regConfirm}
                      onChange={(e) => setRegConfirm(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 text-sm border rounded-xl text-[#1A2B22] focus:outline-none focus:ring-2 ${
                        regConfirm && regConfirm !== regPassword
                          ? "border-red-400 focus:border-red-400 focus:ring-red-400/20"
                          : "border-[#DDE4DF] focus:border-[#1E6B3C] focus:ring-[#1E6B3C]/20"
                      }`}
                      placeholder="Repite la contraseña"
                      required
                    />
                  </div>
                  {regConfirm && regConfirm !== regPassword && (
                    <p className="text-xs text-red-500 mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>

                <button
                  id="btn-crear-cuenta"
                  type="submit"
                  disabled={loading || (!!regConfirm && regConfirm !== regPassword)}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 flex items-center justify-center gap-2 mt-1"
                  style={{ backgroundColor: loading ? "#9BAD9F" : "#1E6B3C" }}
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creando cuenta...
                    </>
                  ) : "Crear cuenta"}
                </button>
              </form>

              <p className="text-center text-sm text-[#637068] mt-5">
                ¿Ya tienes cuenta?{" "}
                <button
                  id="btn-ir-login"
                  type="button"
                  onClick={() => goTo("login")}
                  className="text-[#1E6B3C] font-semibold hover:underline"
                >
                  Iniciar sesión
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista: MFA ────────────────────────────────────────────────────────────────
  if (view === "mfa") {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: "#F2F5F3" }}>
        {leftPanel}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl border border-[#DDE4DF] shadow-lg p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(30,107,60,0.1)" }}>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#1E6B3C" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-[#1A2B22]">Verificación MFA</h2>
                  <p className="text-sm text-[#637068]">Ingresa el código de tu aplicación autenticadora</p>
                </div>
              </div>

              {errorAlert}

              <form onSubmit={handleMfaVerify} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#1A2B22] mb-1.5">
                    Código de verificación (6 dígitos)
                  </label>
                  <input
                    id="mfa-code-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{6}"
                    maxLength={6}
                    value={mfaCode}
                    onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))}
                    className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-[#DDE4DF] rounded-xl text-[#1A2B22] focus:outline-none focus:border-[#1E6B3C] focus:ring-2 focus:ring-[#1E6B3C]/20"
                    placeholder="000000"
                    required
                    autoFocus
                  />
                </div>
                <button
                  id="btn-mfa-verify"
                  type="submit"
                  disabled={loading || mfaCode.length !== 6}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200"
                  style={{ backgroundColor: (loading || mfaCode.length !== 6) ? "#9BAD9F" : "#1E6B3C" }}
                >
                  {loading ? "Verificando..." : "Verificar código"}
                </button>
                <button
                  type="button"
                  onClick={() => goTo("login")}
                  className="text-sm text-[#637068] hover:text-[#1A2B22] text-center transition-colors"
                >
                  ← Volver al login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista: RECUPERAR CONTRASEÑA ───────────────────────────────────────────────
  if (view === "reset-solicitud") {
    return (
      <div className="min-h-screen flex" style={{ backgroundColor: "#F2F5F3" }}>
        {leftPanel}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="bg-white rounded-2xl border border-[#DDE4DF] shadow-lg p-8">
              <div className="mb-6">
                <h2 className="text-xl font-bold text-[#1A2B22]">Recuperar contraseña</h2>
                <p className="text-sm text-[#637068] mt-1">
                  Ingresa tu correo institucional y recibirás instrucciones para restablecer tu contraseña.
                </p>
              </div>

              {errorAlert}

              <form onSubmit={handleResetSolicitud} className="flex flex-col gap-5">
                <div>
                  <label className="block text-sm font-medium text-[#1A2B22] mb-1.5">
                    Correo institucional
                  </label>
                  <div className="relative">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9BAD9F]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <input
                      id="reset-email-input"
                      type="email"
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 text-sm border border-[#DDE4DF] rounded-xl text-[#1A2B22] focus:outline-none focus:border-[#1E6B3C] focus:ring-2 focus:ring-[#1E6B3C]/20"
                      placeholder={`usuario@${DOMINIO}`}
                      required
                    />
                  </div>
                </div>
                <button
                  id="btn-solicitar-reset"
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200"
                  style={{ backgroundColor: loading ? "#9BAD9F" : "#1E6B3C" }}
                >
                  {loading ? "Enviando..." : "Enviar instrucciones"}
                </button>
                <button
                  type="button"
                  onClick={() => goTo("login")}
                  className="text-sm text-[#637068] hover:text-[#1A2B22] text-center transition-colors"
                >
                  ← Volver al login
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Vista: RESET OK ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F2F5F3" }}>
      {leftPanel}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-[#DDE4DF] shadow-lg p-8 text-center">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: "rgba(30,107,60,0.1)" }}>
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="#1E6B3C" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-[#1A2B22] mb-2">Solicitud enviada</h2>
            <p className="text-sm text-[#637068] mb-6">
              Si el correo <strong>{resetEmail}</strong> está registrado en el sistema, recibirás instrucciones para restablecer tu contraseña.
            </p>
            <button
              id="btn-volver-login"
              type="button"
              onClick={() => goTo("login")}
              className="w-full py-3 rounded-xl font-semibold text-white text-sm"
              style={{ backgroundColor: "#1E6B3C" }}
            >
              Volver al login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
