import React, { useState } from "react";
import { Badge, Button, Card, PageHeader, ProgressBar, SectionTitle } from "@/components/ui";

const ASIGNADAS = [
  { id: "EVA-025", proyecto: "Modelación Hídrica de Cuencas en Córdoba", convocatoria: "FII 2025-I", fecha: "18 sep 2025", estado: "pending" as const },
  { id: "EVA-024", proyecto: "Inclusión Financiera en Comunidades Rurales", convocatoria: "FII 2025-I", fecha: "12 sep 2025", estado: "active" as const },
  { id: "EVA-023", proyecto: "Producción Sostenible de Cacao en el Bajo Cauca", convocatoria: "Investigación Aplicada 2025", fecha: "30 ago 2025", estado: "closed" as const },
];

const CRITERIOS = [
  { nombre: "Pertinencia y problema de investigación", peso: 25 },
  { nombre: "Calidad metodológica", peso: 25 },
  { nombre: "Impacto y resultados esperados", peso: 20 },
  { nombre: "Viabilidad técnica y financiera", peso: 20 },
  { nombre: "Experiencia del equipo investigador", peso: 10 },
];

function Rubrica({ onBack }: { onBack: () => void }) {
  const [scores, setScores] = useState(CRITERIOS.map(() => 0));
  const [saved, setSaved] = useState(false);
  const total = scores.reduce((sum, score, index) => sum + score * CRITERIOS[index].peso / 100, 0);

  return <div className="p-6 max-w-[1000px] mx-auto space-y-5">
    <button onClick={onBack} className="text-sm text-[#1E6B3C] font-medium">← Volver a evaluaciones</button>
    <PageHeader title="Rúbrica de evaluación" subtitle="EVA-025 · Modelación Hídrica de Cuencas en Córdoba" breadcrumb={["NOUS", "Evaluaciones", "Rúbrica"]} />
    <Card>
      <div className="flex items-center justify-between mb-5">
        <div><SectionTitle>Evaluación técnica</SectionTitle><p className="text-xs text-[#637068]">Asigna una calificación de 0 a 100 en cada criterio.</p></div>
        <div className="text-right"><p className="text-xs text-[#637068]">Puntaje final</p><p className="text-3xl font-bold text-[#1E6B3C]">{total.toFixed(1)}</p></div>
      </div>
      <div className="space-y-5">
        {CRITERIOS.map((criterio, index) => <div key={criterio.nombre}>
          <div className="flex justify-between gap-4 mb-2"><label className="text-sm font-semibold text-[#1A2B22]">{criterio.nombre}</label><span className="text-xs text-[#637068]">Peso {criterio.peso}% · {scores[index]}</span></div>
          <input type="range" min="0" max="100" value={scores[index]} onChange={(event) => setScores(scores.map((score, i) => i === index ? Number(event.target.value) : score))} className="w-full accent-[#1E6B3C]" />
          <ProgressBar value={scores[index]} color={scores[index] >= 70 ? "green" : "gold"} />
        </div>)}
      </div>
      <textarea className="w-full mt-6 border border-[#DDE4DF] rounded-xl p-3 text-sm min-h-24" placeholder="Observaciones y recomendaciones para el postulante..." />
      <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-[#DDE4DF]"><Button variant="outline">Guardar borrador</Button><Button variant="primary" onClick={() => setSaved(true)}>{saved ? "Evaluación guardada" : "Enviar evaluación"}</Button></div>
    </Card>
  </div>;
}

export function Evaluaciones({ user }: { user?: any }) {
  const [selected, setSelected] = useState(false);
  if (selected) return <Rubrica onBack={() => setSelected(false)} />;
  return <div className="p-6 max-w-[1200px] mx-auto space-y-5">
    <PageHeader title="Evaluaciones" subtitle="Propuestas asignadas para revisión y calificación" breadcrumb={["NOUS", "Evaluaciones"]} />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">{[{ label: "Pendientes", value: "1" }, { label: "En progreso", value: "1" }, { label: "Completadas", value: "1" }].map((item) => <Card key={item.label}><p className="text-2xl font-bold text-[#1E6B3C]">{item.value}</p><p className="text-sm text-[#637068]">{item.label}</p></Card>)}</div>
    <Card padding={false}><div className="px-5 py-4 border-b border-[#DDE4DF]"><h2 className="text-sm font-semibold text-[#1A2B22]">Evaluaciones asignadas</h2></div>{ASIGNADAS.map((item) => <div key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-4 border-b border-[#F2F5F3] last:border-0"><div className="flex-1 min-w-60"><p className="text-xs font-mono text-[#637068]">{item.id} · {item.convocatoria}</p><p className="text-sm font-semibold text-[#1A2B22]">{item.proyecto}</p><p className="text-xs text-[#637068]">Fecha límite: {item.fecha}</p></div><Badge variant={item.estado} /><Button variant={item.estado === "closed" ? "outline" : "primary"} size="sm" onClick={() => item.estado !== "closed" && setSelected(true)}>{item.estado === "closed" ? "Ver resultado" : "Evaluar propuesta"}</Button></div>)}</Card>
  </div>;
}