import React, { useState, useEffect } from "react";
import { Badge, Button, Card, PageHeader, ProgressBar, Tabs, Avatar, Field, Input, Modal, Select, Textarea } from "@/components/ui";
import { getSemilleros, crearSemillero } from "@/services/api";

export type EstadoSemillero = "active" | "inactive" | "pending" | "closed";

export interface SemilleroItem {
  id: string;
  nombre: string;
  descripcion: string;
  lider: string;
  grupo: string;
  estado: EstadoSemillero;
  integrantes: number;
  proyectos: number;
}

const ESTUDIANTE = {
  nombre: "Sebastián Ortiz Herrera",
  programa: "Ingeniería Civil — Semestre 8",
  semillero: "HIDROSUR",
  lider: "Carlos Mejía",
  ingreso: "2023-02",
  trayectoria: [
    {
      fecha: "Feb 2023",
      tipo: "ingreso",
      titulo: "Vinculación al Semillero HIDROSUR",
      desc: "Integración formal al semillero de investigación en recursos hídricos, período 2023-I.",
      estado: "closed" as const,
    },
    {
      fecha: "Mar 2023",
      tipo: "formacion",
      titulo: "Curso: Fundamentos de Investigación Científica",
      desc: "Capacitación de 40 horas. Metodología, escritura académica y gestión de referencias.",
      estado: "closed" as const,
    },
    {
      fecha: "May 2023",
      tipo: "participacion",
      titulo: "Auxiliar en Proyecto INV-2023-012",
      desc: "Proyecto: Calidad del Agua en Cuencas del Departamento de Córdoba. Rol: Auxiliar de campo.",
      estado: "closed" as const,
    },
    {
      fecha: "Sep 2023",
      tipo: "evento",
      titulo: "Ponencia — Encuentro Regional de Semilleros",
      desc: "Presentación oral en el XVII Encuentro de Semilleros de Investigación — Red RREDSI, Montería.",
      estado: "closed" as const,
    },
    {
      fecha: "Nov 2023",
      tipo: "certificado",
      titulo: "Certificado de Joven Investigador",
      desc: "Reconocimiento institucional por producción y participación en semillero activo durante 2023.",
      estado: "closed" as const,
    },
    {
      fecha: "Feb 2024",
      tipo: "formacion",
      titulo: "Diplomado: Análisis de Datos con Python",
      desc: "72 horas. Análisis estadístico, visualización y ciencia de datos aplicada a investigación.",
      estado: "closed" as const,
    },
    {
      fecha: "May 2024",
      tipo: "participacion",
      titulo: "Co-investigador en INV-2024-031",
      desc: "Proyecto: Modelación de Cuencas Córdoba. Desarrollo del modelo HEC-HMS y análisis de resultados.",
      estado: "closed" as const,
    },
    {
      fecha: "Ago 2024",
      tipo: "movilidad",
      titulo: "Movilidad — Congreso Internacional de Hidrología",
      desc: "Participación en congreso internacional en Bogotá. Presentación de poster científico.",
      estado: "closed" as const,
    },
    {
      fecha: "Dic 2024",
      tipo: "producto",
      titulo: "Co-autor — Artículo en Revista Ingeniería e Investigación",
      desc: "Artículo científico indexado en Scopus Q3. DOI: 10.xxxx/rii.v44.n3.112.",
      estado: "closed" as const,
    },
    {
      fecha: "Feb 2025",
      tipo: "participacion",
      titulo: "Investigador en INV-2025-047 (Actual)",
      desc: "Participación activa en modelación hídrica avanzada. Avance: 78%.",
      estado: "active" as const,
    },
    {
      fecha: "Oct 2025",
      tipo: "formacion",
      titulo: "Curso: Machine Learning para Ciencias Ambientales",
      desc: "Inscrito. Pendiente iniciar en octubre 2025.",
      estado: "pending" as const,
    },
  ],
};

const PLANES_INICIALES = [
  { semillero: "HIDROSUR", periodo: "2025-I", estado: "active" as const, actividades: [
    { nombre: "Taller: Lectura crítica de artículos científicos", fecha: "15 Mar 2025", duracion: "4 hrs", completada: true },
    { nombre: "Curso: Gestión de referencias con Mendeley", fecha: "29 Mar 2025", duracion: "6 hrs", completada: true },
    { nombre: "Seminario: Metodología de investigación cuantitativa", fecha: "12 Abr 2025", duracion: "8 hrs", completada: true },
    { nombre: "Taller: Redacción de artículos científicos en inglés", fecha: "10 May 2025", duracion: "12 hrs", completada: false },
  ] },
  { semillero: "ECOFIN", periodo: "2025-I", estado: "active" as const, actividades: [
    { nombre: "Introducción a la investigación social cuantitativa", fecha: "20 Mar 2025", duracion: "6 hrs", completada: true },
    { nombre: "Taller de encuestas y diseño de instrumentos", fecha: "05 Abr 2025", duracion: "8 hrs", completada: true },
    { nombre: "Análisis de datos con SPSS", fecha: "24 May 2025", duracion: "16 hrs", completada: false },
  ] },
];

function SemilleroModal({ open, onClose, onCreate }: { open: boolean; onClose: () => void; onCreate: (nombre: string) => void }) {
  const [nombre, setNombre] = useState("");
  return <Modal open={open} onClose={onClose} title="Crear semillero" size="md"><div className="space-y-4"><Field label="Nombre del semillero" required><Input value={nombre} onChange={setNombre} placeholder="Ej: BIOINNOVA" /></Field><Field label="Descripción"><Textarea placeholder="Área y propósito del semillero" rows={3} /></Field><Field label="Grupo de investigación"><Select options={[{ value: "gidema", label: "GIDEMA" }, { value: "gicade", label: "GICADE" }, { value: "bioagro", label: "BIOAGRO" }]} placeholder="Seleccionar grupo" /></Field><div className="flex justify-end gap-2 pt-3 border-t border-[#DDE4DF]"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={() => { if (nombre.trim()) { onCreate(nombre.trim()); setNombre(""); } }}>Crear semillero</Button></div></div></Modal>;
}

function PlanModal({ open, onClose, onCreate, semilleros = [] }: { open: boolean; onClose: () => void; onCreate: (semillero: string, periodo: string) => void; semilleros?: SemilleroItem[] }) {
  const [semillero, setSemillero] = useState("");
  const [periodo, setPeriodo] = useState("");
  return <Modal open={open} onClose={onClose} title="Crear plan de formación" size="md"><div className="space-y-4"><Field label="Semillero" required><Select options={semilleros.map((item) => ({ value: item.nombre, label: item.nombre }))} value={semillero} onChange={setSemillero} placeholder="Seleccionar semillero" /></Field><Field label="Período académico" required><Input value={periodo} onChange={setPeriodo} placeholder="Ej: 2025-II" /></Field><Field label="Primera actividad"><Input placeholder="Nombre de la actividad" /></Field><div className="flex justify-end gap-2 pt-3 border-t border-[#DDE4DF]"><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="primary" onClick={() => { if (semillero && periodo.trim()) { onCreate(semillero, periodo.trim()); setSemillero(""); setPeriodo(""); } }}>Crear plan</Button></div></div></Modal>;
}

function DetalleSemillero({ semillero, onBack }: { semillero: SemilleroItem; onBack: () => void }) {
  return <div className="p-6 max-w-[1200px] mx-auto space-y-5">
    <button onClick={onBack} className="text-sm text-[#1E6B3C] font-medium">← Volver a semilleros</button>
    <PageHeader title={semillero.nombre} subtitle={semillero.descripcion} breadcrumb={["NOUS", "Semilleros", semillero.nombre]} actions={<Button variant="primary">Editar semillero</Button>} />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3"><Card><p className="text-xs text-[#637068]">Líder</p><p className="text-sm font-bold text-[#1A2B22]">{semillero.lider}</p></Card><Card><p className="text-xs text-[#637068]">Integrantes</p><p className="text-2xl font-bold text-[#1E6B3C]">{semillero.integrantes}</p></Card><Card><p className="text-xs text-[#637068]">Proyectos formativos</p><p className="text-2xl font-bold text-[#1E6B3C]">{semillero.proyectos}</p></Card></div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5"><Card><h2 className="text-sm font-semibold text-[#1A2B22] mb-4">Integrantes</h2>{["Sebastián Ortiz Herrera", "Diana Martínez", "Laura Gómez", "Mateo Ríos"].slice(0, semillero.integrantes > 4 ? 4 : semillero.integrantes).map((nombre, index) => <div key={nombre} className="flex items-center gap-3 py-3 border-b border-[#F2F5F3] last:border-0"><Avatar name={nombre} size="sm" /><div className="flex-1"><p className="text-sm font-medium text-[#1A2B22]">{nombre}</p><p className="text-xs text-[#637068]">{index === 0 ? "Coordinador estudiantil" : "Estudiante investigador"}</p></div><Badge variant="active">Activo</Badge></div>)}</Card><Card><h2 className="text-sm font-semibold text-[#1A2B22] mb-4">Cronograma de formación 2025</h2>{["Taller de metodología", "Lectura crítica de artículos", "Análisis de datos", "Presentación de resultados"].map((actividad, index) => <div key={actividad} className="flex gap-3 py-3 border-b border-[#F2F5F3] last:border-0"><span className="text-xs font-bold text-[#1E6B3C]">{index + 1}</span><div><p className="text-sm font-medium text-[#1A2B22]">{actividad}</p><p className="text-xs text-[#637068]">{["15 mar", "12 abr", "24 may", "07 jun"][index]} 2025 · 6 horas</p></div></div>)}</Card></div>
  </div>;
}

const tipoConfig: Record<string, { color: string; bg: string; icon: string; label: string }> = {
  ingreso: { color: "#1E6B3C", bg: "#EBF5EF", icon: "🎓", label: "Vinculación" },
  formacion: { color: "#2563EB", bg: "#EFF6FF", icon: "📚", label: "Formación" },
  participacion: { color: "#7C3AED", bg: "#F5F3FF", icon: "🔬", label: "Proyecto" },
  evento: { color: "#D97706", bg: "#FFFBEB", icon: "🎤", label: "Evento" },
  certificado: { color: "#F2A900", bg: "#FFF8E6", icon: "🏆", label: "Certificado" },
  movilidad: { color: "#0891B2", bg: "#ECFEFF", icon: "✈️", label: "Movilidad" },
  producto: { color: "#BE185D", bg: "#FDF2F8", icon: "📄", label: "Producto" },
};

function TrayectoriaTimeline() {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Student profile */}
      <div className="space-y-4">
        <Card>
          <div className="flex items-start gap-3 mb-4">
            <Avatar name={ESTUDIANTE.nombre} size="lg" />
            <div>
              <p className="font-bold text-sm text-[#1A2B22]">{ESTUDIANTE.nombre}</p>
              <p className="text-xs text-[#637068]">{ESTUDIANTE.programa}</p>
              <Badge variant="active" className="mt-1">Semillero Activo</Badge>
            </div>
          </div>
          <div className="space-y-2.5">
            {[
              { label: "Semillero", value: ESTUDIANTE.semillero },
              { label: "Docente líder", value: ESTUDIANTE.lider },
              { label: "Ingreso", value: ESTUDIANTE.ingreso },
              { label: "Tiempo en semillero", value: "2 años 6 meses" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-[#9BAD9F] font-medium uppercase tracking-wide">{item.label}</p>
                <p className="text-sm text-[#1A2B22] font-medium">{item.value}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <p className="text-sm font-semibold text-[#1A2B22] mb-3">Resumen de Trayectoria</p>
          <div className="grid grid-cols-2 gap-2">
            {[
              { icon: "🔬", label: "Proyectos", value: 3 },
              { icon: "📚", label: "Formaciones", value: 3 },
              { icon: "🎤", label: "Eventos", value: 2 },
              { icon: "📄", label: "Productos", value: 1 },
              { icon: "✈️", label: "Movilidades", value: 1 },
              { icon: "🏆", label: "Certificados", value: 1 },
            ].map((s) => (
              <div key={s.label} className="bg-[#F2F5F3] rounded-xl p-3 flex items-center gap-2">
                <span className="text-lg">{s.icon}</span>
                <div>
                  <p className="text-lg font-bold text-[#1A2B22] leading-none">{s.value}</p>
                  <p className="text-xs text-[#637068]">{s.label}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <div className="lg:col-span-2">
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-[#DDE4DF] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Línea de Tiempo Investigativa</h3>
            <Button variant="primary" size="sm">Exportar Certificado</Button>
          </div>
          <div className="px-5 py-5">
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-[#DDE4DF]" />

              <div className="space-y-5">
                {ESTUDIANTE.trayectoria.map((item, i) => {
                  const cfg = tipoConfig[item.tipo];
                  const isExpanded = expandedItem === i;
                  return (
                    <div key={i} className="flex gap-4 relative">
                      {/* Dot */}
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-base flex-shrink-0 relative z-10"
                        style={{ backgroundColor: cfg.bg, border: `2px solid ${cfg.color}` }}
                      >
                        {cfg.icon}
                      </div>

                      {/* Content */}
                      <div
                        className={`flex-1 p-3 rounded-xl border cursor-pointer transition-all ${
                          item.estado === "pending" ? "border-dashed border-[#DDE4DF] bg-[#FAFAFA]" : "border-[#DDE4DF] bg-white hover:border-[#1E6B3C]/30 hover:shadow-sm"
                        }`}
                        onClick={() => setExpandedItem(isExpanded ? null : i)}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span
                                className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                style={{ backgroundColor: cfg.bg, color: cfg.color }}
                              >
                                {cfg.label}
                              </span>
                              <Badge variant={item.estado} />
                            </div>
                            <p className="text-sm font-semibold text-[#1A2B22]">{item.titulo}</p>
                            {isExpanded && (
                              <p className="text-xs text-[#637068] mt-1 leading-relaxed">{item.desc}</p>
                            )}
                          </div>
                          <span className="text-xs text-[#9BAD9F] flex-shrink-0 mt-0.5">{item.fecha}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

export function Semilleros() {
  const [tab, setTab] = useState("grupos");
  const [semilleros, setSemilleros] = useState<SemilleroItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<SemilleroItem | null>(null);
  const [showSemilleroModal, setShowSemilleroModal] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planes, setPlanes] = useState(PLANES_INICIALES);

  const cargarSemilleros = () => {
    setLoading(true);
    getSemilleros()
      .then((data) => {
        if (data) {
          const fromDb = data.map((s) => ({
            id: s.codigo || `SEM-${String(s.id).padStart(3, "0")}`,
            nombre: s.nombre,
            descripcion: s.tema_interes || `Semillero adscrito al programa de ${s.programa || "investigación"}.`,
            lider: s.lider_profesor || s.lider_estudiante_nombre || "Por asignar",
            grupo: s.programa || "General",
            estado: (s.vobo_vicerrectoria === 1 ? "active" : "pending") as "active" | "pending",
            integrantes: s.integrantes ?? (Math.round(Number(s.horas_asignadas)) || 0),
            proyectos: 0,
          }));
          setSemilleros(fromDb);
        }
      })
      .catch((err) => console.error("Error al cargar semilleros:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarSemilleros();
  }, []);

  if (selected) return <DetalleSemillero semillero={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title="Semilleros de Investigación"
        subtitle="Formación investigativa estudiantil y trayectoria académica"
        breadcrumb={["NOUS", "Semilleros"]}
        actions={
          <Button variant="primary" onClick={() => setShowSemilleroModal(true)}>+ Crear Semillero</Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Semilleros Registrados", value: String(semilleros.length), sub: "En base de datos" },
          { label: "Semilleros Activos", value: String(semilleros.filter(s => s.estado === "active").length), sub: "Con aval institucional" },
          { label: "Estudiantes Vinculados", value: String(semilleros.reduce((acc, s) => acc + (s.integrantes || 0), 0)), sub: "Integrantes registrados" },
          { label: "Planes de Formación", value: String(planes.length), sub: "En seguimiento" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#DDE4DF] rounded-xl p-4">
            <p className="text-2xl font-bold text-[#1E6B3C]">{s.value}</p>
            <p className="text-sm font-medium text-[#1A2B22]">{s.label}</p>
            <p className="text-xs text-[#637068] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      <Tabs
        tabs={[
          { id: "grupos", label: "Semilleros Registrados" },
          { id: "trayectoria", label: "Trayectoria Estudiantil" },
          { id: "planes", label: "Planes de Formación" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "grupos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {semilleros.map((s) => (
            <Card key={s.id} onClick={() => setSelected(s)} className="hover:shadow-md transition-shadow cursor-pointer">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-base font-bold text-white"
                  style={{ backgroundColor: "#163D27" }}
                >
                  🌱
                </div>
                <Badge variant={s.estado} />
              </div>
              <h3 className="text-base font-bold text-[#1A2B22] mb-0.5">{s.nombre}</h3>
              <p className="text-xs text-[#637068] mb-3 leading-snug">{s.descripcion}</p>
              <div className="flex items-center gap-3 text-xs text-[#637068] mb-3">
                <div className="flex items-center gap-1">
                  <Avatar name={s.lider} size="sm" />
                  <span>{s.lider}</span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-[#F2F5F3]">
                <span className="text-xs font-semibold text-[#1E6B3C] bg-[#EBF5EF] px-2 py-1 rounded-lg">{s.grupo}</span>
                <div className="flex gap-3 text-xs text-[#637068]">
                  <span>👥 {s.integrantes} estudiantes</span>
                  <span>🔬 {s.proyectos} proyectos</span>
                </div>
              </div>
            </Card>
          ))}

          {/* Add card */}
          <button onClick={() => setShowSemilleroModal(true)} className="flex flex-col items-center justify-center py-8 border-2 border-dashed border-[#DDE4DF] rounded-xl hover:border-[#1E6B3C] hover:bg-[#FAFFFE] cursor-pointer transition-all">
            <div className="w-12 h-12 rounded-2xl bg-[#EBF5EF] flex items-center justify-center text-2xl mb-2">🌱</div>
            <p className="text-sm font-semibold text-[#1A2B22]">Crear nuevo semillero</p>
            <p className="text-xs text-[#637068] mt-0.5">Registrar grupo de investigación estudiantil</p>
          </button>
        </div>
      )}

      {tab === "trayectoria" && <TrayectoriaTimeline />}

      {tab === "planes" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setShowPlanModal(true)}>+ Crear Plan de Formación</Button>
          </div>
          {planes.map((plan)=>(
            <Card key={plan.semillero} padding={false}>
              <div className="px-5 py-4 border-b border-[#DDE4DF] flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-[#1A2B22]">Plan de Formación — Semillero {plan.semillero}</span>
                    <Badge variant={plan.estado} />
                  </div>
                  <p className="text-xs text-[#637068]">Período {plan.periodo} · {plan.actividades.filter(a=>a.completada).length}/{plan.actividades.length} actividades completadas</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowPlanModal(true)}>Editar Plan</Button>
              </div>
              <div className="divide-y divide-[#F2F5F3]">
                {plan.actividades.map((act,i)=>(
                  <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${act.completada?"bg-[#EBF5EF] text-[#1E6B3C]":"bg-[#F2F5F3] text-[#9BAD9F]"}`}>
                      {act.completada ? "✓" : i+1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1A2B22]">{act.nombre}</p>
                      <p className="text-xs text-[#637068]">{act.fecha} · {act.duracion}</p>
                    </div>
                    <Badge variant={act.completada ? "closed" : "pending"}>
                      {act.completada ? "Completada" : "Pendiente"}
                    </Badge>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      )}
      <SemilleroModal
        open={showSemilleroModal}
        onClose={() => setShowSemilleroModal(false)}
        onCreate={async (nombre) => {
          try {
            await crearSemillero({ nombre });
            cargarSemilleros();
          } catch (err) {
            console.error("Error al crear semillero:", err);
          }
          setShowSemilleroModal(false);
        }}
      />
      <PlanModal open={showPlanModal} onClose={() => setShowPlanModal(false)} semilleros={semilleros} onCreate={(semillero, periodo) => { setPlanes([...planes, { semillero, periodo, estado: "active" as const, actividades: [] }]); setShowPlanModal(false); }} />
    </div>
  );
}
