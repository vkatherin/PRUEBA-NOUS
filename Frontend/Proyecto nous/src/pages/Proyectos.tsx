import React, { useState, useEffect, useCallback } from "react";
import {
  Badge, Button, Card, PageHeader, SearchBar, Table, Modal,
  Field, Input, Select, Textarea, ProgressBar, Tabs, SectionTitle, Avatar,
} from "@/components/ui";
import { getProyectos, crearProyecto, type Proyecto } from "@/services/api";



const TABS = [
  { id: "info", label: "Información" },
  { id: "equipo", label: "Equipo" },
  { id: "cronograma", label: "Cronograma" },
  { id: "productos", label: "Productos" },
  { id: "riesgos", label: "Riesgos e impactos" },
  { id: "documentos", label: "Documentos" },
];

const PARTICIPANTES = [
  { nombre: "Carlos Mejía Hernández", rol: "Investigador Principal", dedicacion: "20 hrs/sem", vinculacion: "TC" },
  { nombre: "Luisa Álvarez Gómez", rol: "Co-investigadora", dedicacion: "10 hrs/sem", vinculacion: "TC" },
  { nombre: "Sebastián Ortiz", rol: "Auxiliar de Investigación", dedicacion: "20 hrs/sem", vinculacion: "Estudiante" },
  { nombre: "Diana Martínez", rol: "Auxiliar de Campo", dedicacion: "20 hrs/sem", vinculacion: "Estudiante" },
];

const ACTIVIDADES = [
  { nombre: "Revisión y análisis bibliográfico", responsable: "Carlos Mejía", inicio: "Feb 2025", fin: "Mar 2025", estado: "closed" as const, avance: 100 },
  { nombre: "Levantamiento topográfico de cuencas", responsable: "Luisa Álvarez", inicio: "Mar 2025", fin: "May 2025", estado: "closed" as const, avance: 100 },
  { nombre: "Modelación hidrológica HEC-HMS", responsable: "Carlos Mejía", inicio: "May 2025", fin: "Aug 2025", estado: "active" as const, avance: 65 },
  { nombre: "Análisis de resultados y validación", responsable: "Luisa Álvarez", inicio: "Aug 2025", fin: "Oct 2025", estado: "pending" as const, avance: 0 },
  { nombre: "Redacción de artículo científico", responsable: "Carlos Mejía", inicio: "Oct 2025", fin: "Dec 2025", estado: "pending" as const, avance: 0 },
];

const RUBROS = [
  { rubro: "Personal (honorarios investigadores)", aprobado: 22500000, ejecutado: 16875000, saldo: 5625000 },
  { rubro: "Equipos y materiales de laboratorio", aprobado: 8000000, ejecutado: 8000000, saldo: 0 },
  { rubro: "Salidas de campo y transporte", aprobado: 5000000, ejecutado: 3750000, saldo: 1250000 },
  { rubro: "Publicación y difusión", aprobado: 3500000, ejecutado: 0, saldo: 3500000 },
  { rubro: "Imprevistos (5%)", aprobado: 3500000, ejecutado: 1400000, saldo: 2100000 },
];

function formatCOP(n: number) {
  return "$" + (n / 1000000).toFixed(2) + "M";
}

interface ProyectoItem {
  id: string;
  nombre: string;
  lider: string;
  grupo: string;
  facultad: string;
  inicio: string;
  fin: string;
  presupuesto: string;
  avance: number;
  estado: "active" | "evaluation" | "closed" | "draft" | "pending";
  tipo: string;
}

function DetalleProyecto({ proyecto, onBack }: { proyecto: ProyectoItem; onBack: () => void }) {
  const [tab, setTab] = useState("info");

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
            <span className="text-xs font-mono text-[#637068]">{proyecto.id}</span>
            <Badge variant={proyecto.estado} />
            <span className="text-xs bg-[#EBF5EF] text-[#1E6B3C] px-2 py-0.5 rounded-full font-medium">{proyecto.tipo}</span>
          </div>
          <h1 className="text-xl font-bold text-[#1A2B22] mt-1">{proyecto.nombre}</h1>
        </div>
        <div className="ml-auto flex gap-2">
          <Button variant="outline" size="sm">Exportar PDF</Button>
          <Button variant="primary" size="sm">Editar Proyecto</Button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Investigador Principal", value: proyecto.lider, sub: proyecto.facultad },
          { label: "Grupo de Investigación", value: proyecto.grupo, sub: "Clasificado B" },
          { label: "Vigencia", value: `${proyecto.inicio} — ${proyecto.fin}`, sub: "12 meses" },
          { label: "Presupuesto Total", value: proyecto.presupuesto, sub: `${proyecto.avance}% ejecutado` },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#DDE4DF] rounded-xl p-4">
            <p className="text-xs text-[#637068] mb-0.5">{s.label}</p>
            <p className="text-sm font-bold text-[#1A2B22]">{s.value}</p>
            <p className="text-xs text-[#1E6B3C] mt-0.5 font-medium">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Progress */}
      <Card>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-[#1A2B22]">Avance General del Proyecto</span>
          <span className="text-sm font-bold text-[#1E6B3C]">{proyecto.avance}%</span>
        </div>
        <ProgressBar value={proyecto.avance} color="green" />
        <p className="text-xs text-[#637068] mt-2">Último reporte: agosto 2025 — En tiempo según cronograma</p>
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
                Este proyecto busca desarrollar modelos hidrológicos de alta resolución para las principales cuencas del departamento de Córdoba,
                Colombia. La investigación integra datos satelitales, estaciones hidrométricas y técnicas de geoprocesamiento para generar información
                estratégica sobre disponibilidad hídrica, vulnerabilidad ante eventos extremos y planificación territorial sostenible.
              </p>
            </Card>
            <Card>
              <SectionTitle>Participantes</SectionTitle>
              <div className="space-y-3">
                {PARTICIPANTES.map((p) => (
                  <div key={p.nombre} className="flex items-center gap-3 py-2 border-b border-[#F2F5F3] last:border-0">
                    <Avatar name={p.nombre} size="sm" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-[#1A2B22]">{p.nombre}</p>
                      <p className="text-xs text-[#637068]">{p.rol} · {p.dedicacion} · {p.vinculacion}</p>
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
                  { label: "Área del Conocimiento", value: "Ingeniería Civil y Ambiental" },
                  { label: "Línea de Investigación", value: "Gestión de Recursos Hídricos" },
                  { label: "Programa", value: "Ing. Civil" },
                  { label: "Facultad", value: "Ingeniería" },
                  { label: "Convocatoria", value: "FII 2025-I" },
                  { label: "Código SIGP", value: proyecto.id },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-xs text-[#9BAD9F] font-medium uppercase tracking-wide">{item.label}</p>
                    <p className="text-sm text-[#1A2B22] font-medium mt-0.5">{item.value}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      )}

      {tab === "equipo" && (
        <Card padding={false}>
          <div className="px-5 py-4 flex items-center justify-between border-b border-[#DDE4DF]">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Plan de Actividades</h3>
            <Button variant="primary" size="sm">+ Nueva Actividad</Button>
          </div>
          <div className="divide-y divide-[#F2F5F3]">
            {ACTIVIDADES.map((a, i) => (
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
                    <Badge variant={a.estado} />
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
                {RUBROS.map((r, i) => {
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
                <tr className="bg-[#F8FAFB]">
                  <td className="py-3 px-5 text-sm font-bold text-[#1A2B22]">TOTAL</td>
                  <td className="py-3 px-4 text-right font-bold text-[#1A2B22]">
                    {formatCOP(RUBROS.reduce((s, r) => s + r.aprobado, 0))}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#1E6B3C]">
                    {formatCOP(RUBROS.reduce((s, r) => s + r.ejecutado, 0))}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-[#637068]">
                    {formatCOP(RUBROS.reduce((s, r) => s + r.saldo, 0))}
                  </td>
                  <td className="py-3 px-4">
                    <ProgressBar value={78} color="green" />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === "cronograma" && (
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-[#DDE4DF] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Cronograma de Actividades — Vista Gantt</h3>
            <Button variant="outline" size="sm">Exportar PNG</Button>
          </div>
          <div className="p-5 overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="flex mb-2">
                <div className="w-48 flex-shrink-0" />
                {["Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"].map((m) => (
                  <div key={m} className="flex-1 text-center text-xs font-semibold text-[#9BAD9F] border-l border-[#F2F5F3] py-1">{m}</div>
                ))}
              </div>
              {ACTIVIDADES.map((act, i) => (
                <div key={i} className="flex items-center mb-2 group">
                  <div className="w-48 flex-shrink-0 pr-3">
                    <p className="text-xs font-medium text-[#1A2B22] truncate">{act.nombre}</p>
                    <p className="text-xs text-[#9BAD9F] truncate">{act.responsable}</p>
                  </div>
                  <div className="flex-1 relative h-8" style={{ display:"grid", gridTemplateColumns:"repeat(11,1fr)" }}>
                    {Array(11).fill(0).map((_,j) => <div key={j} className="border-l border-[#F2F5F3] h-full"/>)}
                    <div className="absolute top-1 bottom-1 rounded-full overflow-hidden flex items-center"
                      style={{ left:`${(i*9)%100}%`, width:`${18+(i%3)*9}%`,
                        backgroundColor: act.avance===100?"#DDE4DF": act.avance>0?"#EBF5EF":"#F2F5F3",
                        border:`1.5px solid ${act.avance===100?"#9BAD9F": act.avance>0?"#1E6B3C":"#DDE4DF"}`
                      }}>
                      <div className="h-full rounded-full" style={{ width:`${act.avance}%`, backgroundColor: act.avance===100?"#9BAD9F":"#1E6B3C" }}/>
                      <span className="absolute left-2 text-xs font-medium truncate text-white" style={{fontSize:10}}>{act.nombre}</span>
                    </div>
                  </div>
                  <div className="w-10 text-right text-xs font-bold text-[#1E6B3C]">{act.avance}%</div>
                </div>
              ))}
              <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[#DDE4DF]">
                {[{c:"#1E6B3C",l:"En progreso"},{c:"#9BAD9F",l:"Completado"},{c:"#DDE4DF",l:"Pendiente"}].map(l=>(
                  <div key={l.l} className="flex items-center gap-1.5">
                    <div className="w-3 h-2 rounded-sm" style={{backgroundColor:l.c}}/>
                    <span className="text-xs text-[#637068]">{l.l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {tab === "documentos" && (
        <Card padding={false}>
          <div className="px-5 py-4 border-b border-[#DDE4DF] flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#1A2B22]">Repositorio Documental del Proyecto</h3>
            <Button variant="primary" size="sm">+ Subir Documento</Button>
          </div>
          <div className="divide-y divide-[#F2F5F3]">
            {[
              { nombre:"Propuesta_INV-2025-047_v3.pdf", tipo:"Propuesta", fecha:"15 Jul 2025", size:"2.4 MB", icon:"📋", color:"#1E6B3C" },
              { nombre:"Acta_Inicio_INV-2025-047.pdf", tipo:"Acta", fecha:"05 Feb 2025", size:"0.5 MB", icon:"📝", color:"#D4930B" },
              { nombre:"Informe_Avance_Q1_2025.pdf", tipo:"Informe", fecha:"31 Mar 2025", size:"1.8 MB", icon:"📊", color:"#2563EB" },
              { nombre:"Evidencias_Campo_Mayo2025.zip", tipo:"Evidencia", fecha:"31 May 2025", size:"45 MB", icon:"🗂️", color:"#7C3AED" },
              { nombre:"Informe_Avance_Q2_2025.pdf", tipo:"Informe", fecha:"30 Jun 2025", size:"2.1 MB", icon:"📊", color:"#2563EB" },
              { nombre:"Aval_Grupo_GIDEMA_2025.pdf", tipo:"Aval", fecha:"20 Ene 2025", size:"0.3 MB", icon:"✅", color:"#059669" },
            ].map((doc, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFFFE] group">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base flex-shrink-0" style={{ backgroundColor: doc.color+"15" }}>
                  {doc.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A2B22] truncate">{doc.nombre}</p>
                  <p className="text-xs text-[#637068]">{doc.fecha} · {doc.size}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full hidden sm:block" style={{ backgroundColor:doc.color+"15", color:doc.color }}>{doc.tipo}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="outline" size="sm">Descargar</Button>
                  <Button variant="ghost" size="sm">Ver</Button>
                </div>
              </div>
            ))}
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
            {[
              { titulo:"Análisis hidrológico de cuencas del Caribe colombiano", tipo:"Artículo científico", revista:"Ingeniería e Investigación (Scopus Q3)", anio:2024, estado:"published" as const, icon:"📰", color:"#1E6B3C" },
              { titulo:"Hidrología Digital v2.0 — Software de modelación HEC-HMS", tipo:"Software", revista:"Registro SIC Colombia", anio:2025, estado:"pending" as const, icon:"💻", color:"#0891B2" },
              { titulo:"Gestión del agua en cuencas andinas: perspectiva territorial", tipo:"Ponencia", revista:"Congreso Internacional Hidrología Andina, Medellín 2025", anio:2025, estado:"active" as const, icon:"🎤", color:"#D97706" },
            ].map((prod, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4 hover:bg-[#FAFFFE]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor:prod.color+"15" }}>{prod.icon}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1A2B22]">{prod.titulo}</p>
                  <p className="text-xs text-[#637068]">{prod.revista} · {prod.anio}</p>
                </div>
                <span className="text-xs font-semibold px-2.5 py-1 rounded-full hidden lg:block" style={{ backgroundColor:prod.color+"15", color:prod.color }}>{prod.tipo}</span>
                <Badge variant={prod.estado} />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "riesgos" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <Card><SectionTitle>Riesgos identificados</SectionTitle><div className="space-y-3">{[
            ["Retraso en trabajo de campo", "Medio", "Planificar jornadas alternas y seguimiento semanal"],
            ["Disponibilidad de datos hidrométricos", "Bajo", "Coordinar acceso con entidades territoriales"],
            ["Impacto ambiental de la investigación", "Bajo", "Aplicar protocolo de manejo responsable de muestras"],
          ].map(([nombre, nivel, control]) => <div key={nombre} className="p-3 rounded-lg bg-[#F8FAFB] border border-[#DDE4DF]"><div className="flex justify-between gap-3"><p className="text-sm font-semibold text-[#1A2B22]">{nombre}</p><Badge variant={nivel === "Medio" ? "pending" : "active"}>{nivel}</Badge></div><p className="text-xs text-[#637068] mt-1">Mitigación: {control}</p></div>)}</div></Card>
          <Card><SectionTitle>Impactos esperados</SectionTitle><p className="text-sm text-[#637068] leading-relaxed">El proyecto fortalecerá la gestión sostenible del recurso hídrico y entregará información útil para la planificación territorial y la prevención de eventos extremos en Córdoba.</p><div className="mt-4 space-y-2 text-sm text-[#1A2B22]"><p>✓ Impacto científico: modelo hidrológico validado</p><p>✓ Impacto social: información para comunidades rurales</p><p>✓ Impacto ambiental: apoyo a decisiones de conservación</p></div></Card>
        </div>
      )}
    </div>
  );
}

function NuevoProyectoModal({ open, onClose, onSuccess }: { open: boolean; onClose: () => void; onSuccess?: () => void }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ nombre: "", tipo: "", facultad: "", lider: "", convocatoria: "", objetivo: "" });
  const f = (k: keyof typeof form) => (v: string) => setForm({ ...form, [k]: v });
  const steps = ["Identificación", "Equipo", "Metodología", "Cronograma", "Revisión"];

  const handleRegistrar = async () => {
    if (!form.nombre.trim()) return;
    setLoading(true);
    try {
      await crearProyecto({
        titulo: form.nombre,
        tipo_proyecto: form.tipo || "Investigación",
        objetivos: form.objetivo,
        fecha_inicio: new Date().toISOString().slice(0, 10),
        investigador_principal_id: 1,
      });
      setStep(1);
      setForm({ nombre: "", tipo: "", facultad: "", lider: "", convocatoria: "", objetivo: "" });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error al registrar proyecto:", err);
    } finally {
      setLoading(false);
    }
  };

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
          {step < 5 ? <Button variant="primary" onClick={() => setStep(step + 1)}>Continuar</Button> : <Button variant="primary" disabled={loading} onClick={handleRegistrar}>{loading ? "Registrando..." : "Registrar proyecto"}</Button>}
        </div>
      </div>
    </Modal>
  );
}

export function Proyectos() {
  const [listaProyectos, setListaProyectos] = useState<Proyecto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [estadoFilter, setEstadoFilter] = useState("all");
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null);
  const [showModal, setShowModal] = useState(false);

  const cargarProyectos = useCallback(() => {
    setLoading(true);
    getProyectos()
      .then((data) => setListaProyectos(data ?? []))
      .catch((err) => console.error("Error al cargar proyectos:", err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargarProyectos(); }, [cargarProyectos]);

  // Helper: map DB estado → badge variant
  const estadoBadge = (estado: string): "active" | "evaluation" | "closed" | "draft" | "pending" => {
    if (estado === "activo" || estado === "en_ejecucion" || estado === "aprobado") return "active";
    if (estado === "en_evaluacion")                                                 return "evaluation";
    if (estado === "finalizado" || estado === "cancelado")                          return "closed";
    if (estado === "borrador")                                                       return "draft";
    return "pending";
  };

  const fmtPesos = (v?: number) => v ? `$${(v / 1e6).toFixed(1)}M` : "$0";
  const fmtFecha = (d?: string) => d ? new Date(d).toLocaleDateString("es-CO", { month: "short", year: "numeric" }) : "—";

  if (selectedProyecto) {
    // Build a ProyectoItem-like object for the detail view
    const asItem = {
      id: selectedProyecto.codigo_unico || `INV-${selectedProyecto.id}`,
      nombre: selectedProyecto.titulo,
      lider: selectedProyecto.investigador_principal || "—",
      grupo: selectedProyecto.linea_investigacion || "—",
      facultad: selectedProyecto.facultad || "—",
      inicio: fmtFecha(selectedProyecto.fecha_inicio),
      fin: "—",
      presupuesto: fmtPesos(selectedProyecto.valor_total),
      avance: selectedProyecto.avance ?? 0,
      estado: estadoBadge(selectedProyecto.estado) as "active" | "evaluation" | "closed" | "draft" | "pending",
      tipo: selectedProyecto.tipo_proyecto || "Investigación",
    };
    return <DetalleProyecto proyecto={asItem} onBack={() => setSelectedProyecto(null)} />;
  }

  const filtered = listaProyectos.filter((p) => {
    const matchSearch =
      p.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (p.investigador_principal ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.linea_investigacion ?? "").toLowerCase().includes(search.toLowerCase());
    const badgeEstado = estadoBadge(p.estado);
    const matchEstado = estadoFilter === "all" || badgeEstado === estadoFilter;
    return matchSearch && matchEstado;
  });

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

  const rows = filtered.map((p) => ({
    id: <span className="font-mono text-xs text-[#637068]">{p.codigo_unico || `#${p.id}`}</span>,
    nombre: (
      <div className="max-w-xs">
        <p className="text-sm font-semibold text-[#1A2B22] truncate">{p.titulo}</p>
        <p className="text-xs text-[#637068]">{p.tipo_proyecto} · {p.facultad || p.convocatoria || "—"}</p>
      </div>
    ),
    lider: (
      <div className="flex items-center gap-2">
        <Avatar name={p.investigador_principal || "?"} size="sm" />
        <span className="text-sm text-[#1A2B22]">{p.investigador_principal || "—"}</span>
      </div>
    ),
    grupo: <span className="text-xs font-semibold text-[#1E6B3C] bg-[#EBF5EF] px-2 py-1 rounded-lg">{p.linea_investigacion || "—"}</span>,
    vigencia: <span className="text-xs text-[#637068]">{fmtFecha(p.fecha_inicio)} → {p.duracion_meses ? `${p.duracion_meses} meses` : "—"}</span>,
    presupuesto: <span className="text-sm font-semibold text-[#1A2B22]">{fmtPesos(p.valor_total)}</span>,
    avance: (
      <div className="w-32">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-[#637068]">Avance</span>
          <span className="text-xs font-semibold text-[#1E6B3C]">{p.avance ?? 0}%</span>
        </div>
        <ProgressBar value={p.avance ?? 0} color={(p.avance ?? 0) >= 80 ? "green" : (p.avance ?? 0) >= 50 ? "gold" : "blue"} />
      </div>
    ),
    estado: <Badge variant={estadoBadge(p.estado)} />,
    acciones: (
      <div className="flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); setSelectedProyecto(p); }}
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
        subtitle={`${filtered.length} proyectos encontrados`}
        breadcrumb={["NOUS", "Proyectos"]}
        actions={
          <>
            <Button variant="outline" size="sm">Exportar</Button>
            <Button variant="primary" size="sm" onClick={() => setShowModal(true)}>
              + Nuevo Proyecto
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Total Registrados", value: listaProyectos.length, color: "#1E6B3C" },
          { label: "Activos",           value: listaProyectos.filter((p) => estadoBadge(p.estado) === "active").length, color: "#1E6B3C" },
          { label: "En Evaluación",     value: listaProyectos.filter((p) => estadoBadge(p.estado) === "evaluation").length, color: "#D97706" },
          { label: "Cerrados",          value: listaProyectos.filter((p) => estadoBadge(p.estado) === "closed").length, color: "#9CA3AF" },
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
        {filtered.length > 0 ? (
          <Table
            columns={cols}
            rows={rows}
            onRowClick={(_, i) => setSelectedProyecto(filtered[i])}
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

      <NuevoProyectoModal open={showModal} onClose={() => setShowModal(false)} onSuccess={cargarProyectos} />
    </div>
  );
}
