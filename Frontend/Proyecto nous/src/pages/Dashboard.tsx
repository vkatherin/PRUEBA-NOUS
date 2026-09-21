import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { KpiCard, Card, SectionTitle, Badge, Avatar, ProgressBar } from "@/components/ui";
import { Calendar, Users, BarChart3, Clock, DollarSign, Layers, BookOpen } from "lucide-react";
import { dashboardApi, type DashboardKpis, type TopProyecto, type ActividadItem, type ConvocatoriaResumen, type EvolucionItem, type EjecucionItem, type ProductoTipo } from "@/services/api";
import { type Page } from "@/components/Sidebar";

const GREEN = "var(--theme-primary)";
const GOLD = "var(--theme-accent)";
const BLUE   = "#2563EB";
const PURPLE = "#7C3AED";

const COLORES_PRODUCTOS = [GREEN, GOLD, BLUE, PURPLE, "#9CA3AF", "#0891B2", "#DC2626"];

const formatMillions = (v: number) => `$${v}M`;

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 60) return `Hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `Hace ${h} hrs`;
  const d = Math.floor(h / 24);
  return d === 1 ? 'Ayer' : `Hace ${d} días`;
}

function mapEstadoConv(estado: string): "active" | "evaluation" | "closed" | "draft" {
  if (estado === 'activa')     return 'active';
  if (estado === 'evaluacion') return 'evaluation';
  if (estado === 'cerrada')    return 'closed';
  return 'draft';
}

function mapEstadoProy(estado: string): "active" | "evaluation" | "closed" | "draft" {
  if (estado === 'activo')    return 'active';
  if (estado === 'evaluacion')return 'evaluation';
  if (estado === 'cerrado')   return 'closed';
  return 'draft';
}

export function Dashboard({ onNavigate }: { onNavigate: (page: Page) => void }) {
  const [kpis,          setKpis]          = useState<DashboardKpis | null>(null);
  const [evolucion,     setEvolucion]     = useState<EvolucionItem[]>([]);
  const [ejecucion,     setEjecucion]     = useState<EjecucionItem[]>([]);
  const [productos,     setProductos]     = useState<ProductoTipo[]>([]);
  const [actividad,     setActividad]     = useState<ActividadItem[]>([]);
  const [topProyectos,  setTopProyectos]  = useState<TopProyecto[]>([]);
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaResumen[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);

  useEffect(() => {
    async function loadAll() {
      try {
        setLoading(true);
        // Simular tiempo de red
        await new Promise(r => setTimeout(r, 600));

        // Mock data for presentation
        const mockKpis = { proyectosActivos: 142, convocatoriasAbiertas: 4, presupuestoEjecutado: 4500000000, investigadoresActivos: 87 } as DashboardKpis;
        const mockEvolucion: any[] = [
          { mes: 'Ene', activos: 40, nuevos: 12, cerrados: 2 },
          { mes: 'Feb', activos: 50, nuevos: 15, cerrados: 5 },
          { mes: 'Mar', activos: 60, nuevos: 18, cerrados: 8 },
          { mes: 'Abr', activos: 70, nuevos: 22, cerrados: 12 },
          { mes: 'May', activos: 80, nuevos: 25, cerrados: 15 },
          { mes: 'Jun', activos: 90, nuevos: 28, cerrados: 18 },
        ];
        const mockEjecucion = [
          { mes: 'Ene', presupuesto: 500, ejecutado: 450 },
          { mes: 'Feb', presupuesto: 800, ejecutado: 750 },
          { mes: 'Mar', presupuesto: 1200, ejecutado: 1000 },
          { mes: 'Abr', presupuesto: 1500, ejecutado: 1350 },
          { mes: 'May', presupuesto: 2000, ejecutado: 1800 },
          { mes: 'Jun', presupuesto: 2500, ejecutado: 2400 },
        ] as EjecucionItem[];
        const mockProductos: ProductoTipo[] = [
          { name: 'Artículos Q1/Q2', value: 45 },
          { name: 'Libros de Investigación', value: 18 },
          { name: 'Patentes', value: 5 },
          { name: 'Prototipos', value: 12 },
          { name: 'Capítulos de Libro', value: 25 },
        ];
        const mockActividad: any[] = [
          { id: 1, user: 'Dra. María Fernanda López', description: 'Publicó la convocatoria "Fondo Semilla 2025"', time: new Date(Date.now() - 1000 * 60 * 30).toISOString() },
          { id: 2, user: 'Ing. Carlos Mejía', description: 'Registró avance del 85% en el proyecto "HidroSur"', time: new Date(Date.now() - 1000 * 60 * 120).toISOString() },
          { id: 3, user: 'Comité de Ética', description: 'Aprobó el anteproyecto "Bioeconomía Rural"', time: new Date(Date.now() - 1000 * 60 * 360).toISOString() },
          { id: 4, user: 'Sebastián Ortiz', description: 'Se inscribió en el semillero "Innovación IA"', time: new Date(Date.now() - 1000 * 60 * 600).toISOString() },
        ];
        const mockTopProyectos: any[] = [
          { id: 'PRY-101', nombre: 'Tratamiento Hídrico Inteligente para Comunidades del Sur', avance: 85, estado: 'activo', lider: 'Carlos Mejía', grupo: 'G-Hidro' },
          { id: 'PRY-108', nombre: 'Implementación de Bioeconomía en Cultivos de Cacao', avance: 72, estado: 'activo', lider: 'María López', grupo: 'BioSur' },
          { id: 'PRY-115', nombre: 'Modelos de IA para Detección Temprana de Enfermedades Tropicales', avance: 65, estado: 'activo', lider: 'Fernando Rojas', grupo: 'IA-Med' },
          { id: 'PRY-122', nombre: 'Nuevos Materiales Biodegradables a partir de Residuos de Palma', avance: 58, estado: 'activo', lider: 'Ana Castro', grupo: 'EcoMat' },
        ];
        const mockConvocatorias: any[] = [
          { id: 1, codigo: 'FII-2025-I', nombre: 'Fondo de Investigación Institucional 2025-I', cierre: new Date(Date.now() + 1000 * 60 * 60 * 24 * 15).toLocaleDateString("es-CO"), estado: 'activa', inscritos: 14 },
          { id: 2, codigo: 'MIN-2025', nombre: 'Convocatoria Nacional Minciencias - Innovación Abierta', cierre: new Date(Date.now() + 1000 * 60 * 60 * 24 * 32).toLocaleDateString("es-CO"), estado: 'activa', inscritos: 32 },
          { id: 3, codigo: 'SEM-2025', nombre: 'Apertura de Nuevos Semilleros de Investigación', cierre: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toLocaleDateString("es-CO"), estado: 'activa', inscritos: 8 },
        ];

        setKpis(mockKpis);
        setEvolucion(mockEvolucion);
        setEjecucion(mockEjecucion);
        setProductos(mockProductos.map((p, i) => ({ ...p, color: COLORES_PRODUCTOS[i % COLORES_PRODUCTOS.length] })));
        setActividad(mockActividad);
        setTopProyectos(mockTopProyectos);
        setConvocatorias(mockConvocatorias);
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadAll();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-theme-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-theme-text-muted">Cargando datos del dashboard…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <p className="text-sm font-semibold text-red-600">⚠️ Error al cargar datos</p>
          <p className="text-xs text-theme-text-muted">{error}</p>
          <p className="text-xs text-theme-text-muted">Asegúrate de que el backend esté corriendo en el puerto 4200</p>
        </div>
      </div>
    );
  }

  const totalProductos = productos.reduce((s, p) => s + p.value, 0);

  return (
    <div className="p-6 space-y-5 max-w-[1400px] mx-auto">

      {/* Welcome banner */}
      <div
        className="rounded-2xl p-6 flex items-center justify-between overflow-hidden relative"
        style={{ background: "linear-gradient(135deg, var(--theme-primary) 0%, var(--theme-primary) 60%, #2A8A50 100%)" }}
      >
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor:"rgba(242,169,0,0.2)", color:"var(--theme-accent)" }}>
              ● Sistema activo
            </span>
            <span className="text-xs text-white/50">
              {new Date().toLocaleDateString('es-CO', { weekday:'long', day:'numeric', month:'long', year:'numeric' })}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white mb-1">Buenos días, Administrador 👋</h2>
          <p className="text-sm text-white/70">
            Tienes <strong className="text-white">{kpis?.convocatoriasAbiertas} convocatorias activas</strong> y{" "}
            <strong className="text-white">{kpis?.proyectosActivos} proyectos activos</strong> en ejecución.
          </p>
        </div>
        <div className="hidden lg:flex items-center gap-3 relative z-10">
          <button
            onClick={() => onNavigate("convocatorias")}
            className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
            style={{ backgroundColor:"var(--theme-accent)", color:"var(--theme-primary)" }}
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
        <div className="absolute right-0 top-0 w-64 h-64 rounded-full opacity-10" style={{ background:"radial-gradient(circle, var(--theme-accent), transparent)", transform:"translate(30%,-30%)" }} />
        <div className="absolute right-20 bottom-0 w-32 h-32 rounded-full opacity-5" style={{ background:"radial-gradient(circle, white, transparent)", transform:"translateY(50%)" }} />
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Proyectos Activos"
          value={String(kpis?.proyectosActivos ?? 0)}
          sub={`De ${kpis?.proyectosTotal ?? 0} registrados`}
          trend={{ value: "Este año", up: true }}
          color="green"
          icon={
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
          }
        />
        <KpiCard
          title="Convocatorias Abiertas"
          value={String(kpis?.convocatoriasAbiertas ?? 0)}
          sub={`${kpis?.postulacionesTotales ?? 0} postulaciones totales`}
          trend={{ value: "Activas ahora", up: true }}
          color="gold"
          icon={
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          }
        />
        <KpiCard
          title="Ejecución Presupuestal"
          value={`${kpis?.ejecucionPct ?? 0}%`}
          sub={`$${((kpis?.presupuestoEjecutado ?? 0) / 1e6).toFixed(0)}M de $${((kpis?.presupuestoAprobado ?? 0) / 1e6).toFixed(0)}M ejecutados`}
          trend={{ value: "Del presupuesto total", up: true }}
          color="blue"
          icon={
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 8v4l3 3" />
            </svg>
          }
        />
        <KpiCard
          title="Productos Académicos"
          value={String(kpis?.productos ?? 0)}
          sub={`${kpis?.articulos ?? 0} artículos · ${kpis?.ponencias ?? 0} ponencias`}
          trend={{ value: "Registrados", up: true }}
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
              <h3 className="text-sm font-semibold text-theme-text-main">Evolución de Proyectos</h3>
              <p className="text-xs text-theme-text-muted">Últimos 6 meses</p>
            </div>
            <button onClick={() => onNavigate("reportes")} className="text-xs text-theme-primary font-medium hover:underline">
              Ver reporte completo →
            </button>
          </div>
          {evolucion.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={evolucion} margin={{ left: -10, right: 10, bottom: 0, top: 5 }} barCategoryGap="30%">
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#F0F4F0" />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9BAD9F" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9BAD9F" }} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #DDE4DF", fontSize: 12 }} cursor={{ fill: "#F2F5F3" }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Bar dataKey="activos"  name="Activos"  fill={GREEN} radius={[4,4,0,0]} />
                <Bar dataKey="nuevos"   name="Nuevos"   fill={GOLD}  radius={[4,4,0,0]} />
                <Bar dataKey="cerrados" name="Cerrados" fill="#E5E7EB" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-xs text-theme-text-muted">
              Sin datos de evolución disponibles
            </div>
          )}
        </Card>

        {/* Products pie */}
        <Card padding={false}>
          <div className="px-5 pt-5 pb-3">
            <h3 className="text-sm font-semibold text-theme-text-main">Productos por Tipo</h3>
            <p className="text-xs text-theme-text-muted">Total: {totalProductos} productos</p>
          </div>
          {productos.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={productos} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                    {productos.map((entry, i) => (
                      <Cell key={i} fill={(entry as any).color ?? COLORES_PRODUCTOS[i % COLORES_PRODUCTOS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #DDE4DF", fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="px-5 pb-5 space-y-1.5">
                {productos.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: (p as any).color ?? COLORES_PRODUCTOS[i % COLORES_PRODUCTOS.length] }} />
                      <span className="text-theme-text-muted">{p.name}</span>
                    </div>
                    <span className="font-semibold text-theme-text-main">{p.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-xs text-theme-text-muted">
              Sin productos registrados aún
            </div>
          )}
        </Card>
      </div>

      {/* Financial chart + convocatorias */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Financial line chart */}
        <Card className="lg:col-span-2" padding={false}>
          <div className="px-5 pt-5 pb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-theme-text-main">Ejecución Financiera</h3>
              <p className="text-xs text-theme-text-muted">Presupuesto aprobado vs. ejecutado (millones COP)</p>
            </div>
            <button onClick={() => onNavigate("financiero")} className="text-xs text-theme-primary font-medium hover:underline">
              Ver financiero →
            </button>
          </div>
          {ejecucion.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={ejecucion} margin={{ left: -5, right: 15, bottom: 0, top: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F0F4F0" vertical={false} />
                <XAxis dataKey="mes" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9BAD9F" }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9BAD9F" }} tickFormatter={formatMillions} />
                <Tooltip contentStyle={{ borderRadius: 10, border: "1px solid #DDE4DF", fontSize: 12 }} formatter={(v: any) => [`$${v}M`, ""]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
                <Line type="monotone" dataKey="aprobado"  name="Aprobado"  stroke="#DDE4DF" strokeWidth={2.5} strokeDasharray="5 3" dot={false} />
                <Line type="monotone" dataKey="ejecutado" name="Ejecutado" stroke={GREEN}   strokeWidth={2.5} dot={{ r: 4, fill: GREEN, strokeWidth: 0 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-xs text-theme-text-muted">
              Sin datos financieros disponibles
            </div>
          )}
        </Card>

        {/* Convocatorias */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-theme-text-main">Convocatorias Activas</h3>
            <button onClick={() => onNavigate("convocatorias")} className="text-xs text-theme-primary font-medium hover:underline">
              Ver todas →
            </button>
          </div>
          <div className="space-y-3">
            {convocatorias.map((c) => (
              <div key={c.id} className="p-3 rounded-xl border border-theme-border hover:border-theme-primary/30 cursor-pointer transition-colors">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="text-xs font-semibold text-theme-text-main leading-snug flex-1">{c.nombre}</p>
                  <Badge variant={mapEstadoConv(c.estado)} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-theme-text-muted">Cierre: {c.cierre}</span>
                  <span className="text-xs font-medium text-theme-primary">{c.inscritos} inscritos</span>
                </div>
              </div>
            ))}
            {convocatorias.length === 0 && (
              <p className="text-xs text-theme-text-muted text-center py-4">Sin convocatorias activas</p>
            )}
          </div>
          <button
            onClick={() => onNavigate("convocatorias")}
            className="w-full mt-3 py-2.5 rounded-xl border-2 border-dashed border-theme-border text-xs font-medium text-theme-text-muted hover:border-theme-primary hover:text-theme-primary transition-colors"
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
            <h3 className="text-sm font-semibold text-theme-text-main">Proyectos Destacados</h3>
            <button onClick={() => onNavigate("proyectos")} className="text-xs text-theme-primary font-medium hover:underline">
              Ver todos →
            </button>
          </div>
          <div>
            {topProyectos.map((p, i) => (
              <div
                key={p.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-theme-bg-main cursor-pointer border-b border-theme-border last:border-0"
                onClick={() => onNavigate("proyectos")}
              >
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: GREEN }}>
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-theme-text-main truncate">{p.nombre}</p>
                    <Badge variant={mapEstadoProy(p.estado)} />
                  </div>
                  <div className="flex items-center gap-3">
                    <Avatar name={p.lider} size="sm" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-theme-text-muted">{p.lider} · {p.grupo}</span>
                        <span className="text-xs font-semibold text-theme-primary">{Math.round(p.avance)}%</span>
                      </div>
                      <ProgressBar value={Math.round(p.avance)} color={p.avance >= 80 ? "green" : p.avance >= 50 ? "gold" : "blue"} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {topProyectos.length === 0 && (
              <p className="text-xs text-theme-text-muted text-center py-8">Sin proyectos activos</p>
            )}
          </div>
        </Card>

        {/* Activity feed */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-theme-text-main">Actividad Reciente</h3>
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          </div>
          <div className="space-y-4">
            {actividad.map((a, i) => (
              <div key={i} className="flex gap-3">
                <Avatar name={a.user} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-theme-text-main leading-snug">
                    <span className="text-theme-primary">{a.user}</span> {a.description}
                  </p>
                  <p className="text-xs text-theme-text-muted mt-0.5">{timeAgo(a.time)}</p>
                </div>
              </div>
            ))}
            {actividad.length === 0 && (
              <p className="text-xs text-theme-text-muted text-center py-4">Sin actividad reciente</p>
            )}
          </div>
        </Card>
      </div>

      {/* Quick access modules */}
      <Card>
        <SectionTitle>Acceso Rápido por Módulo</SectionTitle>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { page: "proyectos"     as Page, label: "Proyectos",     count: `${kpis?.proyectosActivos ?? 0} activos`,        color: GREEN  },
            { page: "convocatorias" as Page, label: "Convocatorias", count: `${kpis?.convocatoriasAbiertas ?? 0} abiertas`,  color: GOLD   },
            { page: "seguimiento"   as Page, label: "Seguimiento",   count: "Ver alertas",                                   color: "#DC2626" },
            { page: "financiero"    as Page, label: "Financiero",    count: `${kpis?.ejecucionPct ?? 0}% ejec.`,             color: BLUE   },
            { page: "semilleros"    as Page, label: "Semilleros",    count: "Ver grupos",                                    color: PURPLE },
            { page: "reportes"      as Page, label: "Reportes",      count: "Actualizado hoy",                               color: "#0891B2" },
          ].map((m) => (
            <button
              key={m.page}
              onClick={() => onNavigate(m.page)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-theme-border hover:border-opacity-60 hover:shadow-sm transition-all cursor-pointer text-center group"
              style={{ borderColor: m.color + "30" }}
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: m.color + "15" }}>
                <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: m.color }} />
              </div>
              <div>
                <p className="text-xs font-semibold text-theme-text-main">{m.label}</p>
                <p className="text-xs text-theme-text-muted mt-0.5">{m.count}</p>
              </div>
            </button>
          ))}
        </div>
      </Card>
    </div>
  );
}
