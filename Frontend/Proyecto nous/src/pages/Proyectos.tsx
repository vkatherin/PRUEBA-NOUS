import React, { useState, useEffect } from "react";
import {
  Badge, Button, Card, PageHeader, SearchBar, Table, Modal,
  Field, Input, Select, Textarea, ProgressBar, Tabs, SectionTitle, Avatar,
} from "@/components/ui";
import { proyectosApi, type Proyecto, type ProyectoDetalle, type UsuarioMe } from "@/services/api";

const TABS = [
  { id: "info", label: "Información" },
  { id: "equipo", label: "Equipo" },
  { id: "cronograma", label: "Cronograma" },
  { id: "productos", label: "Productos" },
  { id: "presupuesto", label: "Presupuesto" },
  { id: "riesgos", label: "Riesgos e impactos" },
];

function formatCOP(n: number) {
  return "$" + (n / 1000000).toFixed(2) + "M";
}

function mapEstadoProy(estado: string): "active" | "evaluation" | "closed" | "draft" {
  if (estado === 'activo')    return 'active';
  if (estado === 'evaluacion')return 'evaluation';
  if (estado === 'cerrado')   return 'closed';
  return 'draft';
}

function DetalleProyecto({ id, onBack, user }: { id: number; onBack: () => void; user?: UsuarioMe | null }) {
  const [tab, setTab] = useState("info");
  const [proyecto, setProyecto] = useState<ProyectoDetalle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    proyectosApi.getById(id)
      .then(setProyecto)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#1E6B3C] border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-[#637068]">Cargando detalle del proyecto…</p>
        </div>
      </div>
    );
  }

  if (error || !proyecto) {
    return (
      <div className="p-6 text-center">
        <p className="text-red-500 font-semibold mb-4">Error: {error || 'Proyecto no encontrado'}</p>
        <Button variant="outline" onClick={onBack}>Volver a Proyectos</Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-xl flex items-center justify-center border border-[#DDE4DF] text-[#637068] hover:bg-[#F2F5F3]"
        >
          <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" d="M15 18l-6-6 6-6" />
          </svg>
        </button>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#637068]">{proyecto.id_display}</span>
            <Badge variant={mapEstadoProy(proyecto.estado)} />
            <span className="text-xs bg-[#EBF5EF] text-[#1E6B3C] px-2 py-0.5 rounded-full font-medium">{proyecto.tipo}</span>
          </div>
          <h1 className="text-xl font-bold text-[#1A2B22] mt-1">{proyecto.nombre}</h1>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm">Exportar PDF</Button>
          {(user?.permisos?.includes('proyectos.editar') || user?.roles?.includes('administrador')) && (
            <Button variant="primary" size="sm">Editar Proyecto</Button>
          )}
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Investigador Principal", value: proyecto.lider, sub: proyecto.facultad },
          { label: "Grupo de Investigación", value: proyecto.grupo, sub: (proyecto as any).grupo_nombre || "Sin grupo" },
          { label: "Vigencia", value: `${proyecto.inicio} — ${proyecto.fin}`, sub: `${proyecto.duracion_meses} meses` },
          { label: "Presupuesto Total", value: proyecto.presupuesto, sub: `${Math.round(proyecto.avance)}% ejecutado` },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#DDE4DF] rounded-xl p-4">
            <p className="text-xs text-[#637068] mb-0.5">{s.label}</p>
            <p className="text-sm font-bold text-[#1A2B22]">{s.value}</p>
            <p className="text-xs text-[#1E6B3C] mt-0.5 font-medium truncate">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#1A2B22]">Avance General del Proyecto</span>
          <span className="text-sm font-bold text-[#1E6B3C]">{Math.round(proyecto.avance)}%</span>
        </div>
        <ProgressBar value={Math.round(proyecto.avance)} color="green" />
      </Card>

      {/* Tabs */}
      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {/* Tab content */}
      {tab === "info" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <SectionTitle>Descripción del Proyecto</SectionTitle>
              <p className="text-sm text-[#637068] leading-relaxed">
                {proyecto.resumen || "Sin descripción detallada disponible."}
              </p>
              {proyecto.objetivos && (
                <>
                  <h4 className="text-sm font-semibold text-[#1A2B22] mt-4 mb-2">Objetivos</h4>
                  <p className="text-sm text-[#637068] leading-relaxed">{proyecto.objetivos}</p>
                </>
              )}
            </Card>
            <Card>
              <SectionTitle>Participantes</SectionTitle>
              <div className="space-y-3">
                {proyecto.equipo?.map((p) => (
                  <div key={p.nombre} className="flex items-center gap-3 py-2 border-b border-[#F2F5F3] last:border-0">
                    <Avatar name={p.nombre} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1A2B22]">{p.nombre}</p>
                      <p className="text-xs text-[#637068]">{p.rol} · {p.dedicacion} hrs/sem · {p.vinculacion}</p>
                    </div>
                    <Badge variant="active">{p.vinculacion}</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </div>
          <div className="space-y-4">
            <Card>
              <SectionTitle>Clasificación</SectionTitle>
              <div className="space-y-3">
                {[
                  { label: "Lugar de Ejecución", value: proyecto.lugar_ejecucion },
                  { label: "Facultad", value: proyecto.facultad },
                  { label: "Código Interno", value: proyecto.id_display },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-[#9BAD9F] font-medium uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm text-[#1A2B22] font-medium mt-0.5">{item.value || "-"}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "equipo" && (
        <Card>
          <SectionTitle>Equipo del Proyecto</SectionTitle>
          <div className="space-y-3 mt-4">
            {proyecto.equipo?.map((p) => (
              <div key={p.nombre} className="flex items-center gap-3 py-2 border-b border-[#F2F5F3] last:border-0">
                <Avatar name={p.nombre} size="sm" />
                <div className="flex-1">
                  <p className="text-sm font-semibold text-[#1A2B22]">{p.nombre}</p>
                  <p className="text-xs text-[#637068]">{p.rol} · {p.dedicacion} hrs/sem · {p.vinculacion}</p>
                </div>
                <Badge variant="active">{p.vinculacion}</Badge>
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "cronograma" && (
        <Card padding={false}>
          <div className="px-5 py-4 flex items-center justify-between border-b border-[#DDE4DF]">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Plan de Actividades</h3>
            <Button variant="primary" size="sm">+ Nueva Actividad</Button>
          </div>
          <div className="divide-y divide-[#F2F5F3]">
            {proyecto.cronograma?.map((a, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    a.avance === 100 ? "bg-[#EBF5EF] text-[#1E6B3C]" : a.avance > 0 ? "bg-[#FFF8E6] text-[#D4930B]" : "bg-[#F2F5F3] text-[#9BAD9F]"
                  }`}
                >
                  {a.avance === 100 ? "✓" : i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-semibold text-[#1A2B22]">{a.nombre}</p>
                    <Badge variant={a.estado as any} />
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-[#637068]">{a.responsable}</span>
                    <span className="text-xs text-[#9BAD9F]">{a.inicio} → {a.fin}</span>
                    <div className="flex-1 flex items-center gap-2">
                      <ProgressBar value={a.avance} color={a.avance === 100 ? "green" : a.avance > 0 ? "gold" : "blue"} />
                      <span className="text-xs font-semibold text-[#1E6B3C] w-8 text-right">{a.avance}%</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {(!proyecto.cronograma || proyecto.cronograma.length === 0) && (
              <p className="p-5 text-sm text-[#637068] text-center">No hay cronograma registrado.</p>
            )}
          </div>
        </Card>
      )}

      {tab === "presupuesto" && (
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-[#DDE4DF]">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Ejecución Presupuestal por Rubro</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#DDE4DF]">
                  <th className="text-left py-3 px-5 text-xs font-semibold text-[#637068] uppercase tracking-wide">Rubro</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-[#637068] uppercase tracking-wide">Aprobado</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-[#637068] uppercase tracking-wide">Ejecutado</th>
                  <th className="text-right py-3 px-4 text-xs font-semibold text-[#637068] uppercase tracking-wide">Saldo</th>
                  <th className="py-3 px-4 text-xs font-semibold text-[#637068] uppercase tracking-wide w-36">Ejecución</th>
                </tr>
              </thead>
              <tbody>
                {proyecto.rubros?.map((r, i) => {
                  const pct = r.aprobado > 0 ? Math.round((r.ejecutado / r.aprobado) * 100) : 0;
                  return (
                    <tr key={i} className="border-b border-[#F2F5F3] hover:bg-[#FAFFFE]">
                      <td className="py-3.5 px-5 text-[#1A2B22] font-medium text-sm">{r.rubro}</td>
                      <td className="py-3.5 px-4 text-right text-[#1A2B22]">{formatCOP(r.aprobado)}</td>
                      <td className="py-3.5 px-4 text-right font-semibold text-[#1E6B3C]">{formatCOP(r.ejecutado)}</td>
                      <td className="py-3.5 px-4 text-right text-[#637068]">{formatCOP(r.saldo)}</td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={pct} color={pct >= 80 ? "green" : pct >= 50 ? "gold" : "blue"} />
                          <span className="text-xs font-semibold text-[#1E6B3C] w-8">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {(!proyecto.rubros || proyecto.rubros.length === 0) && (
                  <tr><td colSpan={5} className="py-5 text-center text-sm text-[#637068]">Sin rubros registrados</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "productos" && (
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-[#DDE4DF] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Productos Derivados del Proyecto</h3>
            <Button variant="primary" size="sm">+ Registrar Producto</Button>
          </div>
          <div className="divide-y divide-[#F2F5F3]">
            {proyecto.productos?.map((prod, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFFFE]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 bg-[#EBF5EF]">📄</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A2B22]">{prod.titulo}</p>
                  <p className="text-xs text-[#637068]">{prod.fecha}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full hidden lg:block bg-[#EBF5EF] text-[#1E6B3C]">{prod.tipo}</span>
                <span className="text-xs text-gray-500">{prod.estado}</span>
              </div>
            ))}
            {(!proyecto.productos || proyecto.productos.length === 0) && (
              <p className="p-5 text-sm text-[#637068] text-center">No hay productos registrados.</p>
            )}
          </div>
        </Card>
      )}

      {tab === "riesgos" && (
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-[#DDE4DF]">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Riesgos Identificados</h3>
          </div>
          <div className="p-5 space-y-4">
            {proyecto.riesgos?.map((r, i) => (
              <div key={i} className="p-4 rounded-xl bg-[#F8FAFB] border border-[#DDE4DF]">
                <div className="flex items-center justify-between gap-4 mb-2">
                  <p className="text-sm font-semibold text-[#1A2B22]">{r.descripcion}</p>
                  <Badge variant={r.impacto === 'alto' ? 'draft' : 'active'} />
                </div>
                <p className="text-xs text-[#637068]">Mitigación: {r.mitigacion}</p>
              </div>
            ))}
            {(!proyecto.riesgos || proyecto.riesgos.length === 0) && (
              <p className="text-sm text-[#637068] text-center">Sin riesgos registrados.</p>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

function NuevoProyectoModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ nombre: "", tipo: "", facultad: "", lider: "", convocatoria: "", objetivo: "" });
  const f = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });
  const steps = ["Identificación", "Equipo", "Metodología", "Cronograma", "Revisión"];

  return (
    <Modal open={open} onClose={() => { setStep(1); onClose(); }} title="Registrar Nuevo Proyecto" size="lg">
      <div className="flex items-center gap-1 mb-6">{steps.map((label, index) => <React.Fragment key={label}><div className={`flex items-center gap-2 ${index + 1 <= step ? "text-[#1E6B3C]" : "text-[#9BAD9F]"}`}><span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${index + 1 <= step ? "bg-[#1E6B3C] text-white" : "bg-[#F2F5F3]"}`}>{index + 1}</span><span className="hidden sm:block text-xs font-semibold">{label}</span></div>{index < steps.length - 1 && <div className={`h-px flex-1 ${index + 1 < step ? "bg-[#1E6B3C]" : "bg-[#DDE4DF]"}`} />}</React.Fragment>)}</div>
      <div className="space-y-4">
        {step === 1 && <div className="grid grid-cols-1 gap-4">
          <Field label="Título del Proyecto" required>
            <Input placeholder="Nombre completo del proyecto de investigación" value={form.nombre} onChange={f("nombre")} />
          </Field>
          <Field label="Objetivo General" required><Textarea placeholder="Describir el objetivo principal del proyecto..." value={form.objetivo} onChange={f("objetivo")} rows={4} /></Field>
        </div>}
        {step === 2 && <div className="grid grid-cols-2 gap-4">
          <Field label="Investigador Principal" required><Input placeholder="Nombre del investigador líder" value={form.lider} onChange={f("lider")} /></Field>
          <Field label="Facultad" required><Select options={[{ value: "ing", label: "Ingeniería" }, { value: "econ", label: "Ciencias Económicas" }, { value: "agro", label: "Ciencias Agropecuarias" }, { value: "educ", label: "Educación" }, { value: "salud", label: "Ciencias de la Salud" }]} value={form.facultad} onChange={f("facultad")} placeholder="Seleccionar facultad" /></Field>
          <Field label="Grupo de investigación"><Input placeholder="Grupo al que pertenece" /></Field><Field label="Co-investigadores"><Input placeholder="Buscar integrantes" /></Field>
        </div>}
        {step === 3 && <div className="space-y-4"><Field label="Tipo de Proyecto" required><Select options={[{ value: "investigacion", label: "Investigación" }, { value: "aplicada", label: "Investigación Aplicada" }, { value: "formativa", label: "Investigación Formativa" }, { value: "innovacion", label: "Innovación y Desarrollo" }]} value={form.tipo} onChange={f("tipo")} placeholder="Seleccionar tipo" /></Field><Field label="Metodología"><Textarea placeholder="Describe el enfoque, métodos y técnicas del proyecto..." rows={5} /></Field></div>}
        {step === 4 && <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha de Inicio"><Input type="date" /></Field><Field label="Fecha de Fin"><Input type="date" /></Field><Field label="Presupuesto Solicitado"><Input placeholder="Ej: 42500000" /></Field><Field label="Convocatoria" required><Select options={[{ value: "fii2025", label: "FII 2025-II" }, { value: "semilleros", label: "Semilleros 2025" }, { value: "externa", label: "Financiación Externa" }]} value={form.convocatoria} onChange={f("convocatoria")} placeholder="Seleccionar convocatoria" /></Field>
        </div>}
        {step === 5 && <div className="rounded-xl bg-[#F8FAFB] border border-[#DDE4DF] p-4 space-y-3"><p className="text-sm font-bold text-[#1A2B22]">Revisa la información antes de registrar</p>{[["Título", form.nombre || "Sin diligenciar"], ["Investigador principal", form.lider || "Sin diligenciar"], ["Facultad", form.facultad || "Sin diligenciar"], ["Tipo", form.tipo || "Sin diligenciar"], ["Convocatoria", form.convocatoria || "Sin diligenciar"]].map(([label, value]) => <div key={label} className="flex justify-between gap-3 text-sm"><span className="text-[#637068]">{label}</span><strong className="text-[#1A2B22] text-right">{value}</strong></div>)}</div>}
        <div className="flex justify-end gap-3 pt-3 border-t border-[#DDE4DF]">
          {step > 1 && <Button variant="ghost" onClick={() => setStep(step - 1)}>Anterior</Button>}
          <Button variant="secondary" onClick={onClose}>Guardar borrador</Button>
          {step < 5 ? <Button variant="primary" onClick={() => setStep(step + 1)}>Continuar</Button> : <Button variant="primary" onClick={onClose}>Registrar proyecto</Button>}
        </div>
      </div>
    </Modal>
  );
}

const UI_TO_DB_ESTADO: Record<string, string> = {
  active: 'activo',
  evaluation: 'evaluacion',
  closed: 'cerrado',
  draft: 'borrador'
};

export function Proyectos({ user }: { user?: UsuarioMe | null }) {
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [selectedProyectoId, setSelectedProyectoId] = useState<number | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const params: any = {};
    if (estadoFilter !== 'all') params.estado = UI_TO_DB_ESTADO[estadoFilter];
    if (search) params.q = search;

    proyectosApi.getAll(params)
      .then(setProyectos)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, estadoFilter]);

  if (selectedProyectoId) {
    return <DetalleProyecto id={selectedProyectoId} onBack={() => setSelectedProyectoId(null)} user={user} />;
  }

  const cols = [
    { key: "id", label: "Código", width: "120px" },
    { key: "nombre", label: "Proyecto" },
    { key: "lider", label: "Investigador" },
    { key: "grupo", label: "Grupo" },
    { key: "vigencia", label: "Vigencia" },
    { key: "presupuesto", label: "Presupuesto" },
    { key: "avance", label: "Avance" },
    { key: "estado", label: "Estado" },
    { key: "acciones", label: "" },
  ];

  const rows = proyectos.map((p) => ({
    id: <span className="font-mono text-xs text-[#637068]">{p.id_display}</span>,
    nombre: (
      <div className="max-w-xs">
        <p className="text-sm font-semibold text-[#1A2B22] truncate">{p.nombre}</p>
        <p className="text-xs text-[#637068]">{p.tipo} · {p.facultad}</p>
      </div>
    ),
    lider: (
      <div className="flex items-center gap-2">
        <Avatar name={p.lider} size="sm" />
        <span className="text-sm text-[#1A2B22]">{p.lider}</span>
      </div>
    ),
    grupo: <span className="text-xs font-semibold text-[#1E6B3C] bg-[#EBF5EF] px-2 py-1 rounded-lg">{p.grupo || "N/A"}</span>,
    vigencia: <span className="text-xs text-[#637068]">{p.inicio} → {p.fin}</span>,
    presupuesto: <span className="text-sm font-semibold text-[#1A2B22]">{p.presupuesto}</span>,
    avance: (
      <div className="w-32">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-[#637068]">Avance</span>
          <span className="text-xs font-semibold text-[#1E6B3C]">{Math.round(p.avance)}%</span>
        </div>
        <ProgressBar value={Math.round(p.avance)} color={p.avance >= 80 ? "green" : p.avance >= 50 ? "gold" : "blue"} />
      </div>
    ),
    estado: <Badge variant={mapEstadoProy(p.estado)} />,
    acciones: (
      <div className="flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedProyectoId(p.id); }}
          className="px-3 py-1.5 text-xs font-medium text-[#1E6B3C] bg-[#EBF5EF] rounded-lg hover:bg-[#D4EBD9] transition-colors"
        >
          Ver detalle
        </button>
      </div>
    ),
  }));

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title="Gestión de Proyectos"
        subtitle={`${proyectos.length} proyectos encontrados`}
        breadcrumb={["NOUS", "Proyectos"]}
        actions={
          <>
            <Button variant="outline" size="sm">Exportar</Button>
            {(user?.permisos?.includes('proyectos.crear') || user?.roles?.includes('administrador')) && (
              <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
                + Nuevo Proyecto
              </Button>
            )}
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Registrados", value: proyectos.length, color: "#1E6B3C" },
          { label: "Activos", value: proyectos.filter((p) => p.estado === "activo").length, color: "#1E6B3C" },
          { label: "En Evaluación", value: proyectos.filter((p) => p.estado === "evaluacion").length, color: "#D97706" },
          { label: "Cerrados", value: proyectos.filter((p) => p.estado === "cerrado").length, color: "#9CA3AF" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#DDE4DF] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: s.color + "15" }}>
              <span className="text-xl font-bold" style={{ color: s.color }}>{s.value}</span>
            </div>
            <p className="text-sm text-[#637068] font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex-1 min-w-48">
            <SearchBar
              placeholder="Buscar por nombre, investigador, grupo..."
              value={search}
              onChange={setSearch}
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              { value: "all", label: "Todos" },
              { value: "active", label: "Activos" },
              { value: "evaluation", label: "En Evaluación" },
              { value: "draft", label: "Borrador" },
              { value: "closed", label: "Cerrados" },
            ].map((f) => (
              <button
                key={f.value}
                onClick={() => setEstadoFilter(f.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  estadoFilter === f.value
                    ? "bg-[#1E6B3C] text-white"
                    : "bg-[#F2F5F3] text-[#637068] hover:bg-[#DDE4DF]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card padding={false}>
        {loading ? (
          <div className="p-8 text-center text-[#637068]">Cargando proyectos...</div>
        ) : proyectos.length > 0 ? (
          <Table
            columns={cols}
            rows={rows}
            onRowClick={(_, i) => setSelectedProyectoId(proyectos[i].id)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-14 h-14 rounded-2xl bg-[#EBF5EF] flex items-center justify-center mb-3">
              <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="#1E6B3C" strokeWidth={1.5}>
                <path strokeLinecap="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-[#1A2B22]">No se encontraron proyectos</p>
            <p className="text-xs text-[#637068] mt-1">Intenta con otros filtros o crea un nuevo proyecto</p>
            <Button variant="primary" size="sm" className="mt-4" onClick={() => setShowModal(true)}>
              + Crear Primer Proyecto
            </Button>
          </div>
        )}
      </Card>

      <NuevoProyectoModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
