import React, { useState } from "react";
import { Badge, Button, Card, PageHeader, ProgressBar, Tabs } from "@/components/ui";

const ACTIVIDADES = [
  {
    id: 1, proyecto: "Modelación Hídrica de Cuencas", lider: "Carlos Mejía",
    actividades: [
      { nombre: "Revisión bibliográfica", inicio: 0, duracion: 2, avance: 100, estado: "closed" as const, responsable: "Carlos Mejía" },
      { nombre: "Levantamiento topográfico", inicio: 1, duracion: 2, avance: 100, estado: "closed" as const, responsable: "Luisa Álvarez" },
      { nombre: "Modelación HEC-HMS", inicio: 3, duracion: 3, avance: 65, estado: "active" as const, responsable: "Carlos Mejía" },
      { nombre: "Análisis de resultados", inicio: 5, duracion: 2, avance: 0, estado: "pending" as const, responsable: "Luisa Álvarez" },
      { nombre: "Redacción artículo", inicio: 7, duracion: 2, avance: 0, estado: "pending" as const, responsable: "Carlos Mejía" },
    ],
  },
  {
    id: 2, proyecto: "Inclusión Financiera Rural", lider: "Jorge Peña",
    actividades: [
      { nombre: "Diseño instrumento", inicio: 0, duracion: 2, avance: 100, estado: "closed" as const, responsable: "Jorge Peña" },
      { nombre: "Aplicación encuestas", inicio: 1, duracion: 3, avance: 80, estado: "active" as const, responsable: "Adriana López" },
      { nombre: "Análisis estadístico", inicio: 4, duracion: 2, avance: 20, estado: "active" as const, responsable: "Jorge Peña" },
      { nombre: "Informe final", inicio: 6, duracion: 2, avance: 0, estado: "pending" as const, responsable: "Adriana López" },
    ],
  },
  {
    id: 3, proyecto: "Producción Sostenible de Cacao", lider: "Ana Restrepo",
    actividades: [
      { nombre: "Caracterización predios", inicio: 0, duracion: 2, avance: 100, estado: "closed" as const, responsable: "Ana Restrepo" },
      { nombre: "Implementación BPA", inicio: 1, duracion: 4, avance: 100, estado: "closed" as const, responsable: "Equipo campo" },
      { nombre: "Monitoreo y seguimiento", inicio: 4, duracion: 3, avance: 95, estado: "active" as const, responsable: "Ana Restrepo" },
      { nombre: "Socialización resultados", inicio: 6, duracion: 1, avance: 0, estado: "pending" as const, responsable: "Ana Restrepo" },
    ],
  },
];

const MESES = ["Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov"];

const ALERTAS = [
  { proyecto: "TIC en Educación Básica", tipo: "warning" as const, msg: "Informe trimestral vencido hace 5 días", accion: "Subir informe" },
  { proyecto: "Salud Mental Universitaria", tipo: "info" as const, msg: "2 actividades próximas a iniciar esta semana", accion: "Ver actividades" },
  { proyecto: "Derecho Internacional", tipo: "warning" as const, msg: "Sin actividad registrada en los últimos 30 días", accion: "Registrar avance" },
];

function GanttChart() {
  return (
    <div className="overflow-x-auto">
      {/* Header meses */}
      <div className="min-w-[900px]">
        <div className="flex mb-2">
          <div className="w-56 flex-shrink-0" />
          <div className="flex-1 grid gap-0" style={{ gridTemplateColumns: `repeat(${MESES.length}, 1fr)` }}>
            {MESES.map((m) => (
              <div key={m} className="text-center text-xs font-semibold text-[#9BAD9F] py-1 border-l border-[#F2F5F3]">
                {m}
              </div>
            ))}
          </div>
        </div>

        {ACTIVIDADES.map((proyecto) => (
          <div key={proyecto.id} className="mb-4">
            {/* Project header row */}
            <div className="flex items-center mb-1">
              <div className="w-56 flex-shrink-0 pr-3">
                <p className="text-xs font-bold text-[#1E6B3C] truncate">{proyecto.proyecto}</p>
              </div>
              <div className="flex-1 h-px bg-[#EBF5EF]" />
            </div>

            {/* Activity rows */}
            {proyecto.actividades.map((act, i) => (
              <div key={i} className="flex items-center mb-1.5 group">
                <div className="w-56 flex-shrink-0 pr-3">
                  <p className="text-xs text-[#637068] truncate group-hover:text-[#1A2B22]">{act.nombre}</p>
                  <p className="text-xs text-[#9BAD9F] truncate">{act.responsable}</p>
                </div>
                <div className="flex-1 relative h-7" style={{ display: "grid", gridTemplateColumns: `repeat(${MESES.length}, 1fr)` }}>
                  {/* Grid lines */}
                  {MESES.map((_, j) => (
                    <div key={j} className="border-l border-[#F2F5F3] h-full" />
                  ))}
                  {/* Bar */}
                  <div
                    className="absolute top-1 bottom-1 rounded-full flex items-center overflow-hidden"
                    style={{
                      left: `${(act.inicio / MESES.length) * 100}%`,
                      width: `${(act.duracion / MESES.length) * 100}%`,
                      backgroundColor: act.estado === "closed" ? "#DDE4DF" : act.estado === "active" ? "#EBF5EF" : "#F2F5F3",
                      border: `1.5px solid ${act.estado === "closed" ? "#9BAD9F" : act.estado === "active" ? "#1E6B3C" : "#DDE4DF"}`,
                    }}
                  >
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${act.avance}%`,
                        backgroundColor: act.estado === "closed" ? "#9BAD9F" : act.estado === "active" ? "#1E6B3C" : "#F2A900",
                      }}
                    />
                    <span
                      className="absolute left-2 text-xs font-semibold truncate"
                      style={{ color: act.avance > 50 ? "white" : "#1A2B22", fontSize: "10px" }}
                    >
                      {act.nombre}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ))}

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#DDE4DF]">
          {[
            { color: "#1E6B3C", label: "Completado" },
            { color: "#F2A900", label: "En progreso" },
            { color: "#DDE4DF", label: "Pendiente" },
          ].map((l) => (
            <div key={l.label} className="flex items-center gap-1.5">
              <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: l.color }} />
              <span className="text-xs text-[#637068]">{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function KanbanView() {
  const columns = [
    {
      id: "pending",
      label: "Pendiente",
      color: "#9CA3AF",
      cards: [
        { nombre: "Análisis estadístico BIOAGRO", proyecto: "Producción Sostenible", fecha: "Sep 2025" },
        { nombre: "Redacción artículo HEC-HMS", proyecto: "Modelación Hídrica", fecha: "Nov 2025" },
        { nombre: "Informe final inclusión", proyecto: "Inclusión Financiera", fecha: "Oct 2025" },
        { nombre: "Diseño encuesta salud mental", proyecto: "Salud Mental", fecha: "Ago 2025" },
      ],
    },
    {
      id: "active",
      label: "En Progreso",
      color: "#F2A900",
      cards: [
        { nombre: "Modelación HEC-HMS cuencas", proyecto: "Modelación Hídrica", fecha: "Aug 2025" },
        { nombre: "Aplicación encuestas rurales", proyecto: "Inclusión Financiera", fecha: "Jul 2025" },
        { nombre: "Monitoreo cacao Bajo Cauca", proyecto: "Producción Sostenible", fecha: "Jul 2025" },
      ],
    },
    {
      id: "review",
      label: "En Revisión",
      color: "#2563EB",
      cards: [
        { nombre: "Levantamiento topográfico", proyecto: "Modelación Hídrica", fecha: "May 2025" },
        { nombre: "Implementación BPA", proyecto: "Producción Sostenible", fecha: "Jun 2025" },
      ],
    },
    {
      id: "closed",
      label: "Completado",
      color: "#1E6B3C",
      cards: [
        { nombre: "Revisión bibliográfica hídrica", proyecto: "Modelación Hídrica", fecha: "Mar 2025" },
        { nombre: "Diseño instrumento encuesta", proyecto: "Inclusión Financiera", fecha: "Mar 2025" },
        { nombre: "Caracterización predios cacao", proyecto: "Producción Sostenible", fecha: "Abr 2025" },
      ],
    },
  ];

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {columns.map((col) => (
        <div key={col.id} className="w-64 flex-shrink-0">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color }} />
            <span className="text-xs font-bold text-[#1A2B22] uppercase tracking-wide">{col.label}</span>
            <span className="ml-auto text-xs font-semibold text-[#637068] bg-[#F2F5F3] px-2 py-0.5 rounded-full">
              {col.cards.length}
            </span>
          </div>
          <div className="space-y-2">
            {col.cards.map((card, i) => (
              <div
                key={i}
                className="bg-white border border-[#DDE4DF] rounded-xl p-3 cursor-pointer hover:border-[#1E6B3C]/30 hover:shadow-sm transition-all"
              >
                <p className="text-xs font-semibold text-[#1A2B22] mb-1 leading-snug">{card.nombre}</p>
                <p className="text-xs text-[#637068]">{card.proyecto}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-[#9BAD9F]">Fin: {card.fecha}</span>
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: col.color }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function Seguimiento() {
  const [view, setView] = useState("gantt");

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title="Seguimiento de Actividades"
        subtitle="Control de ejecución y avance de actividades por proyecto"
        breadcrumb={["NOUS", "Seguimiento"]}
        actions={
          <>
            <Button variant="outline" size="sm">Exportar Gantt</Button>
            <Button variant="primary" size="sm">+ Nueva Actividad</Button>
          </>
        }
      />

      {/* Alerts */}
      <div className="space-y-2">
        {ALERTAS.map((a, i) => (
          <div
            key={i}
            className="flex items-center gap-3 px-4 py-3 rounded-xl border"
            style={{
              backgroundColor: a.tipo === "warning" ? "#FFFBEB" : "#EFF6FF",
              borderColor: a.tipo === "warning" ? "#FDE68A" : "#BFDBFE",
            }}
          >
            <span>{a.tipo === "warning" ? "⚠️" : "ℹ️"}</span>
            <div className="flex-1">
              <span className="text-xs font-bold text-[#1A2B22]">{a.proyecto}: </span>
              <span className="text-xs text-[#637068]">{a.msg}</span>
            </div>
            <button
              className="text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              style={{ backgroundColor: a.tipo === "warning" ? "#FDE68A" : "#BFDBFE", color: "#1A2B22" }}
            >
              {a.accion}
            </button>
          </div>
        ))}
      </div>

      {/* View toggle */}
      <div className="flex items-center justify-between">
        <Tabs
          tabs={[
            { id: "gantt", label: "Diagrama de Gantt", icon: <span>📊</span> },
            { id: "kanban", label: "Tablero Kanban", icon: <span>🗂️</span> },
          ]}
          active={view}
          onChange={setView}
        />

        <div className="flex gap-2">
          {["Todos los proyectos", "Solo activos", "Con alertas"].map((opt) => (
            <button
              key={opt}
              className="text-xs px-3 py-1.5 rounded-lg bg-white border border-[#DDE4DF] text-[#637068] hover:border-[#1E6B3C] hover:text-[#1E6B3C] transition-colors"
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <Card padding={false}>
        <div className="px-5 pt-5 pb-3 border-b border-[#DDE4DF] flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1A2B22]">
              {view === "gantt" ? "Diagrama de Gantt — Proyectos Activos 2025" : "Tablero de Actividades por Estado"}
            </h3>
            <p className="text-xs text-[#637068]">
              {view === "gantt" ? "Vista Feb 2025 — Nov 2025" : "Arrastrar tarjetas para actualizar estado"}
            </p>
          </div>
          <span className="text-xs text-[#9BAD9F]">Actualizado: hace 2 hrs</span>
        </div>
        <div className="p-5">
          {view === "gantt" ? <GanttChart /> : <KanbanView />}
        </div>
      </Card>

      {/* Activity table */}
      <Card padding={false}>
        <div className="px-5 py-4 border-b border-[#DDE4DF]">
          <h3 className="text-sm font-semibold text-[#1A2B22]">Actividades en Progreso</h3>
        </div>
        <div className="divide-y divide-[#F2F5F3]">
          {ACTIVIDADES.flatMap((p) =>
            p.actividades
              .filter((a) => a.estado === "active")
              .map((a, i) => (
                <div key={`${p.id}-${i}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFFFE]">
                  <div className="w-2 h-2 rounded-full bg-[#1E6B3C] flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A2B22]">{a.nombre}</p>
                    <p className="text-xs text-[#637068]">{p.proyecto} · {a.responsable}</p>
                  </div>
                  <Badge variant={a.estado} />
                  <div className="w-32">
                    <ProgressBar value={a.avance} color="green" />
                  </div>
                  <span className="text-sm font-bold text-[#1E6B3C] w-10 text-right">{a.avance}%</span>
                  <Button variant="ghost" size="sm">Actualizar</Button>
                </div>
              ))
          )}
        </div>
      </Card>
    </div>
  );
}
