import React, { useState } from "react";
import logoImg from "@/imports/images__1_.jpg";
import { login } from "@/services/api";

export function Login({ onLogin }: { onLogin: () => void }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { usuario } = await login(email, password);
      sessionStorage.setItem("nous_user", JSON.stringify(usuario));
      onLogin();
    } catch (err: any) {
      setError(err.message || "Error al iniciar sesión");
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="min-h-screen flex" style={{ backgroundColor: "#F2F5F3" }}>
      {/* Left panel — brand */}
      <div
        className="hidden lg:flex flex-col justify-between w-[480px] flex-shrink-0 p-12"
        style={{ backgroundColor: "#163D27" }}
      >
        {/* Top logo */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center p-1.5">
            <img src={logoImg} alt="CUS Logo" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-white font-bold text-lg leading-tight">NOUS</p>
            <p className="text-xs" style={{ color: "#F2A900" }}>Sistema Integral de Gestión</p>
          </div>
        </div>

        {/* Center content */}
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

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Proyectos activos", value: "47" },
            { label: "Investigadores", value: "128" },
            { label: "Productos 2024", value: "89" },
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

        {/* Footer */}
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>
          © 2025 Fundación Universitaria Católica del Sur · Todos los derechos reservados
        </p>
      </div>

      {/* Right panel — form */}
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
              <p className="text-sm text-[#637068] mt-1">Ingresa tus credenciales institucionales para continuar</p>
            </div>

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
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm border border-[#DDE4DF] rounded-xl text-[#1A2B22] focus:outline-none focus:border-[#1E6B3C] focus:ring-2 focus:ring-[#1E6B3C]/20"
                    placeholder="usuario@cusur.edu.co"
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
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 text-sm border border-[#DDE4DF] rounded-xl text-[#1A2B22] focus:outline-none focus:border-[#1E6B3C] focus:ring-2 focus:ring-[#1E6B3C]/20"
                    placeholder="Contraseña"
                    required
                  />
                </div>
                <div className="flex justify-end mt-1.5">
                  <button type="button" className="text-xs text-[#1E6B3C] font-medium hover:underline">
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="remember"
                  className="w-4 h-4 rounded border-[#DDE4DF] accent-[#1E6B3C] cursor-pointer"
                  defaultChecked
                />
                <label htmlFor="remember" className="text-sm text-[#637068] cursor-pointer">
                  Recordar sesión por 30 días
                </label>
              </div>

              {error && (
                <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium"
                     style={{ backgroundColor: "rgba(220,38,38,0.08)", color: "#dc2626", border: "1px solid rgba(220,38,38,0.2)" }}>
                  <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10"/><path strokeLinecap="round" d="M12 8v4m0 4h.01"/>
                  </svg>
                  {error}
                </div>
              )}

              <button
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

            {/* SSO options */}
            <div className="mt-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px bg-[#DDE4DF]" />
                <span className="text-xs text-[#9BAD9F] font-medium">O ingresar con</span>
                <div className="flex-1 h-px bg-[#DDE4DF]" />
              </div>
              <button
                type="button"
                onClick={onLogin}
                className="w-full py-2.5 rounded-xl border border-[#DDE4DF] text-sm font-medium text-[#1A2B22] flex items-center justify-center gap-2 hover:bg-[#F2F5F3] transition-colors"
              >
                <svg width={18} height={18} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Google Workspace Institucional
              </button>
            </div>
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
