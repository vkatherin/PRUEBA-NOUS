import React, { useEffect, useState } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { KpiCard, Card, SectionTitle, Badge, Avatar, ProgressBar } from "@/components/ui";
import type { Page } from "@/components/Sidebar";
import { getDashboardStats, type DashboardStats } from "@/services/api";

const GREEN = "#1E6B3C";
const GOLD = "#F2A900";
const BLUE = "#2563EB";
const PURPLE = "#7C3AED";

const proyectosMes = [
  { mes: "Mar", activos: 38, cerrados: 4, nuevos: 6 },
  { mes: "Abr", activos: 41, cerrados: 3, nuevos: 8 },
  { mes: "May", activos: 44, cerrados: 5, nuevos: 7 },
  { mes: "Jun", activos: 43, cerrados: 2, nuevos: 5 },
  { mes: "Jul", activos: 45, cerrados: 4, nuevos: 9 },
  { mes: "Ago", activos: 47, cerrados: 6, nuevos: 11 },
];

const ejecucionFinanciera = [
  { mes: "Mar", aprobado: 280, ejecutado: 120 },
  { mes: "Abr", aprobado: 280, ejecutado: 165 },
  { mes: "May", aprobado: 310, ejecutado: 198 },
  { mes: "Jun", aprobado: 310, ejecutado: 234 },
  { mes: "Jul", aprobado: 380, ejecutado: 276 },
  { mes: "Ago", aprobado: 380, ejecutado: 312 },
];

const productosTipo = [
  { name: "Artículos", value: 28, color: GREEN },
  { name: "Ponencias", value: 19, color: GOLD },
  { name: "Libros/Cap.", value: 12, color: BLUE },
  { name: "Software", value: 8, color: PURPLE },
  { name: "Otros", value: 22, color: "#9CA3AF" },
];

const formatMillions = (v: number) => `$${v}M`;

const badgeEstado = (st?: string): "active" | "evaluation" | "closed" | "draft" | "pending" => {
  if (st === "activa" || st === "publicada" || st === "activo" || st === "aprobado") return "active";
  if (st === "en_evaluacion" || st === "evaluacion") return "evaluation";
  if (st === "cerrada" || st === "finalizado") return "closed";
  if (st === "borrador") return "draft";
  return "pending";
};

export function Dashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [stats, setStats] = useState<DashboardStats | null>(null);

  useEffect(() => {
    getDashboardStats()
      .then(setStats)
      .catch((e) => console.error("Error cargando stats:", e));
  }, []);

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* Welcome banner */}
      <div
        className="rounded-2xl p-6 flex items-center justify-between overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, #163D27 0%, #1E6B3C 60%, #2A8A50 100%)" }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor:"rgba(242,169,0,0.2)", color:"#F2A900" }}>
              ● Sistema activo
            </span>
            <span className="text-xs text-white/50">Lunes, 25 de agosto de 2025</span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Bienvenido al sistema NOUS 👋</h2>
          <p className="text-sm text-white/70">Tienes <strong className="text-white">{stats?.convocatoriasActivas ?? '...'} convocatorias activas</strong>, <strong className="text-white">{stats?.proyectos ?? '...'} proyectos</strong> registrados y <strong className="text-white">{stats?.semilleros ?? '...'} semilleros</strong> activos.</p>
        </div>
        <div className="hidden lg:flex items-center gap-3 relative z-10">
          <button
            onClick={() => onNavigate("convocatorias")}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ backgroundColor:"#F2A900", color:"#163D27" }}
          >
            Ver convocatorias →
          </button>
          <button
            onClick={() => onNavigate("reportes")}
            className="px-4 py-2 rounded-xl text-sm font-semibold border text-white transition-all"
            style={{ borderColor:"rgba(255,255,255,0.25)", backgroundColor:"rgba(255,255,255,0.08)" }}
          >
            Reportes institucionales
          </button>
        </div>
        {/* Decorative circles */}
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-10" style={{ background:"radial-gradient(circle, #F2A900, transparent)", transform:"translate(30%,-30%)" }} />
        <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full opacity-5" style={{ background:"radial-gradient(circle, white, transparent)", transform:"translateY(50%)" }} />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Proyectos Registrados"
          value={stats ? String(stats.proyectos) : "..."}
          sub="Total en la base de datos"
          trend={{ value: "Datos en tiempo real", up: true }}
          color="green"
          icon={
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
        />
        <KpiCard
          title="Convocatorias"
          value={stats ? String(stats.convocatorias) : "..."}
          sub={stats ? `${stats.convocatoriasActivas} activas actualmente` : "Cargando..."}
          trend={{ value: "+2 vs. mes anterior", up: true }}
          color="gold"
          icon={
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
        <KpiCard
          title="Investigadores Activos"
          value={stats ? String(stats.investigadores) : "..."}
          sub="Usuarios activos en el sistema"
          trend={{ value: "Datos en tiempo real", up: true }}
          color="blue"
          icon={
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4l3 3" />
            </svg>
          }
        />
        <KpiCard
          title="Semilleros"
          value={stats ? String(stats.semilleros) : "..."}
          sub="Semilleros de investigación"
          trend={{ value: "Datos en tiempo real", up: true }}
          color="purple"
          icon={
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
            </svg>
          }
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Proyectos chart */}
        <Card className="lg:col-span-2" padding={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#1A2B22]">Evolución de Proyectos</h3>
              <p className="text-xs text-[#637068]">Últimos 6 meses</p>
            </div>
            <button
              onClick={() => onNavigate("reportes")}
              className="text-xs text-[#1E6B3C] font-medium hover:underline"
            >
              Ver reporte completo →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={proyectosMes} margin={{ left: -10, right: 10, bottom: 0, top: 5 }} barCategoryGap="30%">
              <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F4F0" />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9BAD9F" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9BAD9F" }} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #DDE4DF", fontSize: 12, fontFamily: "Poppins" }}
                cursor={{ fill: "#F2F5F3" }}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Bar dataKey="activos" name="Activos" fill={GREEN} radius={[4, 4, 0, 0]} />
              <Bar dataKey="nuevos" name="Nuevos" fill={GOLD} radius={[4, 4, 0, 0]} />
              <Bar dataKey="cerrados" name="Cerrados" fill="#E5E7EB" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Products pie */}
        <Card padding={false}>
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Productos por Tipo</h3>
            <p className="text-xs text-[#637068]">Total: 89 productos 2025</p>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={productosTipo} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {productosTipo.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #DDE4DF", fontSize: 12, fontFamily: "Poppins" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="px-5 pb-5 space-y-1.5">
            {productosTipo.map((p) => (
              <div key={p.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="text-[#637068]">{p.name}</span>
                </div>
                <span className="font-semibold text-[#1A2B22]">{p.value}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Financial chart + convocatorias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Financial line chart */}
        <Card className="lg:col-span-2" padding={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-[#1A2B22]">Ejecución Financiera</h3>
              <p className="text-xs text-[#637068]">Presupuesto aprobado vs. ejecutado (millones COP)</p>
            </div>
            <button
              onClick={() => onNavigate("financiero")}
              className="text-xs text-[#1E6B3C] font-medium hover:underline"
            >
              Ver financiero →
            </button>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={ejecucionFinanciera} margin={{ left: -5, right: 15, bottom: 0, top: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F0" vertical={false} />
              <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9BAD9F" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9BAD9F" }} tickFormatter={formatMillions} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: "1px solid #DDE4DF", fontSize: 12, fontFamily: "Poppins" }}
                formatter={(v: any) => [`$${v}M`, ""]}
              />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              <Line
                type="monotone"
                dataKey="aprobado"
                name="Aprobado"
                stroke="#DDE4DF"
                strokeWidth={2.5}
                strokeDasharray="5 3"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ejecutado"
                name="Ejecutado"
                stroke={GREEN}
                strokeWidth={2.5}
                dot={{ r: 4, fill: GREEN, strokeWidth: 0 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Convocatorias */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Convocatorias Activas</h3>
            <button
              onClick={() => onNavigate("convocatorias")}
              className="text-xs text-[#1E6B3C] font-medium hover:underline"
            >
              Ver todas →
            </button>
          </div>
          <div className="space-y-3">
            {stats?.convocatoriasRecientes && stats.convocatoriasRecientes.length > 0 ? (
              stats.convocatoriasRecientes.map((c) => (
                <div key={c.id} onClick={() => onNavigate("convocatorias")} className="p-3 rounded-xl border border-[#DDE4DF] hover:border-[#1E6B3C]/30 cursor-pointer transition-colors">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <p className="text-xs font-semibold text-[#1A2B22] leading-snug flex-1">{c.nombre}</p>
                    <Badge variant={badgeEstado(c.estado)} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#637068]">Cierre: {c.cierre ? new Date(c.cierre).toLocaleDateString("es-CO") : "Sin fecha"}</span>
                    <span className="text-xs font-medium text-[#1E6B3C]">En vigencia</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#637068] py-4 text-center">No hay convocatorias activas en este momento</p>
            )}
          </div>
          <button
            onClick={() => onNavigate("convocatorias")}
            className="w-full mt-3 py-2.5 rounded-xl border-2 border-dashed border-[#DDE4DF] text-xs font-medium text-[#637068] hover:border-[#1E6B3C] hover:text-[#1E6B3C] transition-colors"
          >
            + Nueva convocatoria
          </button>
        </Card>
      </div>

      {/* Bottom: Top projects + Activity feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top projects */}
        <Card className="lg:col-span-2" padding={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Proyectos Destacados</h3>
            <button
              onClick={() => onNavigate("proyectos")}
              className="text-xs text-[#1E6B3C] font-medium hover:underline"
            >
              Ver todos →
            </button>
          </div>
          <div>
            {stats?.topProyectos && stats.topProyectos.length > 0 ? (
              stats.topProyectos.map((p, i) => (
                <div
                  key={p.id}
                  className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFFFE] cursor-pointer border-b border-[#F2F5F3] last:border-0"
                  onClick={() => onNavigate("proyectos")}
                >
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: GREEN }}
                  >
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm font-semibold text-[#1A2B22] truncate">{p.nombre}</p>
                      <Badge variant={badgeEstado(p.estado)} />
                    </div>
                    <div className="flex items-center gap-3">
                      <Avatar name={p.lider} size="sm" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-[#637068]">{p.lider} · {p.grupo}</span>
                          <span className="text-xs font-semibold text-[#1E6B3C]">{p.facultad}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#637068] py-8 text-center">No hay proyectos registrados en la base de datos</p>
            )}
          </div>
        </Card>

        {/* Activity feed */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Actividad Reciente</h3>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div className="space-y-4">
            {stats?.recentActivity && stats.recentActivity.length > 0 ? (
              stats.recentActivity.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <Avatar name={a.user} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A2B22] leading-snug">
                      <span className="text-[#1E6B3C]">{a.user}</span> {a.action}
                    </p>
                    <p className="text-xs text-[#637068] truncate mt-0.5">{a.project}</p>
                    <p className="text-xs text-[#9BAD9F] mt-0.5">{a.time}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#637068] py-6 text-center">No hay actividad reciente registrada</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick access modules */}
      <Card>
        <SectionTitle>Acceso Rápido por Módulo</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { page: "proyectos" as Page, label: "Proyectos", count: "47 activos", color: GREEN },
            { page: "convocatorias" as Page, label: "Convocatorias", count: "3 abiertas", color: GOLD },
            { page: "seguimiento" as Page, label: "Seguimiento", count: "12 alertas", color: "#DC2626" },
            { page: "financiero" as Page, label: "Financiero", count: "82% ejec.", color: BLUE },
            { page: "semilleros" as Page, label: "Semilleros", count: "8 grupos", color: PURPLE },
            { page: "reportes" as Page, label: "Reportes", count: "Actualizado hoy", color: "#0891B2" },
          ].map((m) => (
            <button
              key={m.page}
              onClick={() => onNavigate(m.page)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-[#DDE4DF] hover:border-opacity-60 hover:shadow-sm transition-all cursor-pointer text-center group"
              style={{ borderColor: m.color + "30" }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ backgroundColor: m.color + "15" }}
              >
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: m.color }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1A2B22]">{m.label}</p>
                <p className="text-xs text-[#637068] mt-0.5">{m.count}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
