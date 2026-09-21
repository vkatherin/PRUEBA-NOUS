import React, { useState } from "react";
import { Badge, Button, Card, PageHeader, Avatar } from "@/components/ui";


// ─── Productos de Investigación ───────────────────────────────────────────────
const PRODUCTOS = [
  { titulo: "Análisis hidrológico de cuencas del Caribe colombiano", tipo: "Artículo científico", autor: "Carlos Mejía et al.", revista: "Ingeniería e Investigación (Scopus Q3)", anio: 2024, estado: "published" as const },
  { titulo: "Economía solidaria y acceso a servicios financieros rurales en Córdoba", tipo: "Artículo científico", autor: "Jorge Peña, Adriana López", revista: "Cuadernos de Economía (SCIELO)", anio: 2024, estado: "published" as const },
  { titulo: "Buenas prácticas agrícolas para el cacao en el Bajo Cauca", tipo: "Libro", autor: "Ana Restrepo, Equipo BIOAGRO", revista: "Editorial CUSUR", anio: 2025, estado: "pending" as const },
  { titulo: "Memoria cultural del Sinú: identidades en transformación", tipo: "Capítulo de libro", autor: "María Torres Duarte", revista: "Universidad de Córdoba Press", anio: 2025, estado: "active" as const },
  { titulo: "Hidrología Digital v2.0 — Software de modelación", tipo: "Software", autor: "Carlos Mejía, Sebastián Ortiz", revista: "Registro SIC Colombia", anio: 2025, estado: "pending" as const },
  { titulo: "Gestión del agua en comunidades campesinas: una visión desde el territorio", tipo: "Ponencia", autor: "Carlos Mejía", revista: "Congreso Internacional Hidrología Andina — Medellín 2025", anio: 2025, estado: "active" as const },
];

const productoTipos: Record<string, { icon: string; color: string }> = {
  "Artículo científico": { icon: "📰", color: "var(--theme-primary)" },
  Libro: { icon: "📗", color: "#2563EB" },
  "Capítulo de libro": { icon: "📖", color: "#7C3AED" },
  Software: { icon: "💻", color: "#0891B2" },
  Ponencia: { icon: "🎤", color: "#D97706" },
};

export function Productos() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title="Productos de Investigación"
        subtitle="Registro de artículos, libros, software, ponencias y demás resultados"
        breadcrumb={["NOUS", "Productos"]}
        actions={<Button variant="primary">+ Registrar Producto</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { tipo: "Artículos", count: 28, icon: "📰", color: "var(--theme-primary)" },
          { tipo: "Libros/Cap.", count: 12, icon: "📗", color: "#2563EB" },
          { tipo: "Ponencias", count: 19, icon: "🎤", color: "#D97706" },
          { tipo: "Software", count: 8, icon: "💻", color: "#0891B2" },
          { tipo: "Otros", count: 22, icon: "🔬", color: "#7C3AED" },
        ].map((s) => (
          <div key={s.tipo} className="bg-theme-bg-card border border-theme-border rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-xl font-bold" style={{ color: s.color }}>{s.count}</p>
              <p className="text-xs text-theme-text-muted">{s.tipo}</p>
            </div>
          </div>
        ))}
      </div>

      <Card padding={false}>
        <div className="px-5 py-4 border-b border-theme-border">
          <h3 className="text-sm font-semibold text-theme-text-main">Productos Registrados</h3>
        </div>
        <div className="divide-y divide-[#F2F5F3]">
          {PRODUCTOS.map((p, i) => {
            const cfg = productoTipos[p.tipo] ?? { icon: "📄", color: "#9CA3AF" };
            return (
              <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-theme-bg-main">
                <div className="w-10 h-10 rounded-xl bg-theme-bg-main flex items-center justify-center text-lg flex-shrink-0">
                  {cfg.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-theme-text-main">{p.titulo}</p>
                  <p className="text-xs text-theme-text-muted">{p.autor} · {p.revista}</p>
                  <p className="text-xs text-theme-text-muted mt-0.5">{p.anio}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full hidden sm:block" style={{ backgroundColor: cfg.color + "15", color: cfg.color }}>
                  {p.tipo}
                </span>
                <Badge variant={p.estado} />
                <Button variant="ghost" size="sm">Ver</Button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

// ─── Grupos de Investigación ──────────────────────────────────────────────────
const GRUPOS = [
  { codigo: "COL0123456", nombre: "GIDEMA", fullName: "Grupo de Investigación en Desarrollo y Medio Ambiente", lider: "Carlos Mejía", categoria: "B", integrantes: 14, proyectos: 8, productos: 22 },
  { codigo: "COL0234567", nombre: "GICADE", fullName: "Grupo de Investigación en Ciencias Administrativas y del Desarrollo", lider: "Jorge Peña", categoria: "B", integrantes: 10, proyectos: 6, productos: 18 },
  { codigo: "COL0345678", nombre: "BIOAGRO", fullName: "Grupo de Biotecnología y Agroecología del Caribe", lider: "Ana Restrepo", categoria: "C", integrantes: 12, proyectos: 5, productos: 14 },
  { codigo: "COL0456789", nombre: "GIEIT", fullName: "Grupo de Investigación en Educación, Innovación y TIC", lider: "Pedro Serna", categoria: "C", integrantes: 8, proyectos: 4, productos: 11 },
  { codigo: "COL0567890", nombre: "GIHUCS", fullName: "Grupo de Investigación en Humanidades y Ciencias Sociales", lider: "María Torres", categoria: "C", integrantes: 7, proyectos: 4, productos: 9 },
  { codigo: "COL0678901", nombre: "GIPSIC", fullName: "Grupo de Investigación en Psicología y Salud Integral", lider: "Claudia Herrera", categoria: "D", integrantes: 5, proyectos: 3, productos: 7 },
];

const catColors: Record<string, string> = { A1: "var(--theme-primary)", A: "#2563EB", B: "#7C3AED", C: "#D97706", D: "#9CA3AF" };

export function Grupos() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title="Grupos de Investigación"
        subtitle="Gestión de grupos activos registrados ante MinCiencias"
        breadcrumb={["NOUS", "Grupos"]}
        actions={<Button variant="primary">+ Crear Grupo</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
        {GRUPOS.map((g) => (
          <Card key={g.codigo} className="hover:shadow-md transition-shadow cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white"
                style={{ backgroundColor: catColors[g.categoria] ?? "#9CA3AF" }}
              >
                Cat. {g.categoria}
              </div>
              <span className="text-xs font-mono text-theme-text-muted">{g.codigo}</span>
            </div>
            <h3 className="text-base font-bold text-theme-text-main mb-0.5">{g.nombre}</h3>
            <p className="text-xs text-theme-text-muted mb-3 leading-snug">{g.fullName}</p>
            <div className="flex items-center gap-2 mb-3">
              <Avatar name={g.lider} size="sm" />
              <span className="text-xs text-theme-text-muted">{g.lider}</span>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-theme-border text-xs text-theme-text-muted">
              <span>👥 {g.integrantes} integrantes</span>
              <span>🔬 {g.proyectos} proyectos</span>
              <span>📄 {g.productos} productos</span>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Movilidad Académica ──────────────────────────────────────────────────────
const MOVIL_SOLICITUDES = [
  { id:"MOV-2025-018", investigador:"Carlos Mejía Hernández", evento:"Congreso Internacional de Hidrología Andina", ciudad:"Medellín, Colombia", fechas:"22–25 Ago 2025", transporte:"$420.000", hospedaje:"$560.000", viaticos:"$480.000", inscripcion:"$390.000", total:"$1.850.000", estado:"active" as const, aval:"GIDEMA" },
  { id:"MOV-2025-017", investigador:"Ana Restrepo Arboleda", evento:"Simposio Iberoamericano Cacao Sostenible", ciudad:"Bogotá, Colombia", fechas:"10–12 Sep 2025", transporte:"$360.000", hospedaje:"$780.000", viaticos:"$560.000", inscripcion:"$400.000", total:"$2.100.000", estado:"pending" as const, aval:"BIOAGRO" },
  { id:"MOV-2025-016", investigador:"María Torres Duarte", evento:"Congreso Colombiano Ciencias Sociales", ciudad:"Barranquilla, Colombia", fechas:"15–17 Oct 2025", transporte:"$220.000", hospedaje:"$480.000", viaticos:"$360.000", inscripcion:"$140.000", total:"$1.200.000", estado:"pending" as const, aval:"GIHUCS" },
  { id:"MOV-2025-015", investigador:"Jorge Peña Alarcón", evento:"Congreso ALAFEC — Ciencias Contables", ciudad:"Lima, Perú", fechas:"03–05 Nov 2025", transporte:"$1.800.000", hospedaje:"$1.200.000", viaticos:"$900.000", inscripcion:"$650.000", total:"$4.550.000", estado:"evaluation" as const, aval:"GICADE" },
  { id:"MOV-2025-014", investigador:"Luisa Álvarez Gómez", evento:"IX Seminario Nacional de Hidrología", ciudad:"Manizales, Colombia", fechas:"28–30 Jul 2025", transporte:"$380.000", hospedaje:"$460.000", viaticos:"$320.000", inscripcion:"$200.000", total:"$1.360.000", estado:"closed" as const, aval:"GIDEMA" },
];

export function Movilidad() {
  const [selected, setSelected] = useState<typeof MOVIL_SOLICITUDES[0] | null>(null);

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title="Movilidad Académica"
        subtitle="Gestión de viajes, eventos y legalización de gastos de investigadores"
        breadcrumb={["NOUS", "Movilidad"]}
        actions={<Button variant="primary">+ Nueva Solicitud</Button>}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label:"Solicitudes 2025", value:"18", color:"var(--theme-primary)", icon:"✈️" },
          { label:"Aprobadas", value:"11", color:"var(--theme-primary)", icon:"✅" },
          { label:"Pendientes de aval", value:"5", color:"#D97706", icon:"⏳" },
          { label:"Inversión total", value:"$24.6M", color:"#2563EB", icon:"💰" },
        ].map(s=>(
          <div key={s.label} className="bg-theme-bg-card border border-theme-border rounded-xl p-4 flex items-center gap-3">
            <span className="text-3xl">{s.icon}</span>
            <div>
              <p className="text-xl font-bold" style={{color:s.color}}>{s.value}</p>
              <p className="text-xs text-theme-text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      <Card padding={false}>
        <div className="px-5 py-4 border-b border-theme-border">
          <h3 className="text-sm font-semibold text-theme-text-main">Solicitudes de Movilidad 2025</h3>
        </div>
        <div className="divide-y divide-[#F2F5F3]">
          {MOVIL_SOLICITUDES.map((sol)=>(
            <div key={sol.id} className="flex items-start gap-4 px-5 py-4 hover:bg-theme-bg-main cursor-pointer group" onClick={()=>setSelected(sol)}>
              <div className="w-10 h-10 rounded-xl bg-theme-primary/10 flex items-center justify-center text-xl flex-shrink-0">✈️</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-mono text-theme-text-muted">{sol.id}</span>
                  <Badge variant={sol.estado} />
                </div>
                <p className="text-sm font-bold text-theme-text-main">{sol.investigador}</p>
                <p className="text-sm text-theme-text-muted">{sol.evento}</p>
                <p className="text-xs text-theme-text-muted">{sol.ciudad} · {sol.fechas} · Aval: {sol.aval}</p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-base font-bold text-theme-primary">{sol.total}</p>
                <p className="text-xs text-theme-text-muted">Total solicitado</p>
                <div className="flex gap-1 mt-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  {sol.estado === "pending" && <Button variant="primary" size="sm">Aprobar aval</Button>}
                  <Button variant="outline" size="sm">Ver detalle</Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{backgroundColor:"rgba(0,0,0,0.4)"}} onClick={()=>setSelected(null)}>
          <div className="bg-theme-bg-card rounded-2xl shadow-2xl w-full max-w-lg" onClick={e=>e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-theme-border">
              <h2 className="text-base font-bold text-theme-text-main">Detalle de Solicitud — {selected.id}</h2>
              <button onClick={()=>setSelected(null)} className="w-8 h-8 rounded-lg flex items-center justify-center text-theme-text-muted hover:bg-theme-bg-main">✕</button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <p className="text-xs text-theme-text-muted uppercase font-semibold mb-1">Investigador</p>
                <div className="flex items-center gap-2">
                  <Avatar name={selected.investigador} size="sm" />
                  <p className="text-sm font-bold text-theme-text-main">{selected.investigador}</p>
                </div>
              </div>
              <div>
                <p className="text-xs text-theme-text-muted uppercase font-semibold mb-1">Evento</p>
                <p className="text-sm font-semibold text-theme-text-main">{selected.evento}</p>
                <p className="text-xs text-theme-text-muted">{selected.ciudad} · {selected.fechas}</p>
              </div>
              <div className="bg-theme-bg-main rounded-xl p-4">
                <p className="text-xs font-semibold text-theme-text-muted uppercase mb-3">Desglose presupuestal</p>
                <div className="space-y-2">
                  {[
                    { label:"Transporte", value:selected.transporte },
                    { label:"Hospedaje", value:selected.hospedaje },
                    { label:"Viáticos", value:selected.viaticos },
                    { label:"Inscripción", value:selected.inscripcion },
                  ].map(item=>(
                    <div key={item.label} className="flex justify-between text-sm">
                      <span className="text-theme-text-muted">{item.label}</span>
                      <span className="font-semibold text-theme-text-main">{item.value}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm font-bold pt-2 border-t border-theme-border">
                    <span className="text-theme-text-main">Total</span>
                    <span className="text-theme-primary">{selected.total}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <Button variant="ghost" className="flex-1" onClick={()=>setSelected(null)}>Cerrar</Button>
                {selected.estado === "pending" && (
                  <Button variant="primary" className="flex-1" onClick={()=>setSelected(null)}>Aprobar aval</Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Integraciones Institucionales ───────────────────────────────────────────
const INTEGRACIONES = [
  { nombre: "Google Workspace", desc: "Correo institucional, Drive, Calendar y Meet", icon: "🔗", estado: "active" as const, tipo: "Autenticación SSO + Drive" },
  { nombre: "Google Drive", desc: "Repositorio documental compartido con proyectos", icon: "📁", estado: "active" as const, tipo: "API Drive v3" },
  { nombre: "Moodle LMS", desc: "Plataforma de aprendizaje y cursos de formación", icon: "🎓", estado: "pending" as const, tipo: "API REST Moodle 4.x" },
  { nombre: "CvLAC — MinCiencias", desc: "Importación automática de hojas de vida investigadores", icon: "📋", estado: "pending" as const, tipo: "Consulta API Scienti" },
  { nombre: "GrupLAC — MinCiencias", desc: "Sincronización de grupos y clasificación vigente", icon: "👥", estado: "pending" as const, tipo: "Consulta API Scienti" },
  { nombre: "ERP Financiero", desc: "Integración con sistema financiero institucional", icon: "💼", estado: "inactive" as const, tipo: "API interna CUSUR" },
  { nombre: "Microsoft Teams", desc: "Notificaciones y alertas del sistema en Teams", icon: "📢", estado: "inactive" as const, tipo: "Webhook REST" },
];

export function Integraciones() {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title="Integraciones Institucionales"
        subtitle="Conexiones con sistemas externos y servicios de la Universidad"
        breadcrumb={["NOUS", "Integraciones"]}
        actions={<Button variant="outline">+ Nueva Integración</Button>}
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {INTEGRACIONES.map((integ) => (
          <Card key={integ.nombre} className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-theme-bg-main flex items-center justify-center text-2xl flex-shrink-0">
              {integ.icon}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-bold text-theme-text-main">{integ.nombre}</h3>
                <Badge variant={integ.estado} />
              </div>
              <p className="text-xs text-theme-text-muted mb-2">{integ.desc}</p>
              <span className="text-xs font-mono text-theme-text-muted bg-theme-bg-main px-2 py-0.5 rounded">{integ.tipo}</span>
            </div>
            <Button variant={integ.estado === "active" ? "outline" : "primary"} size="sm">
              {integ.estado === "active" ? "Configurar" : "Conectar"}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
