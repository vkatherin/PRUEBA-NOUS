import React, { useState, useEffect } from "react";
import { Badge, Button, Card, PageHeader, ProgressBar, SectionTitle } from "@/components/ui";
import { getEvaluaciones, calificarEvaluacion, type Evaluacion, type CriterioEvaluacion } from "@/services/api";

const mapEstado = (estado: string): "active" | "pending" | "closed" => {
  if (estado === "en_progreso" || estado === "activo") return "active";
  if (estado === "completada" || estado === "finalizada") return "closed";
  return "pending";
};

function Rubrica({ evaluacion, onBack, onComplete }: { evaluacion: Evaluacion; onBack: () => void; onComplete: () => void }) {
  const criteriosIniciales = evaluacion.criterios && evaluacion.criterios.length > 0
    ? evaluacion.criterios
    : [
        { id: 1, evaluacion_id: evaluacion.id, criterio: "Pertinencia y problema de investigación", puntaje_maximo: 25, puntaje_obtenido: 20 },
        { id: 2, evaluacion_id: evaluacion.id, criterio: "Calidad metodológica", puntaje_maximo: 25, puntaje_obtenido: 20 },
        { id: 3, evaluacion_id: evaluacion.id, criterio: "Impacto y resultados esperados", puntaje_maximo: 20, puntaje_obtenido: 15 },
        { id: 4, evaluacion_id: evaluacion.id, criterio: "Viabilidad técnica y financiera", puntaje_maximo: 20, puntaje_obtenido: 15 },
        { id: 5, evaluacion_id: evaluacion.id, criterio: "Experiencia del equipo investigador", puntaje_maximo: 10, puntaje_obtenido: 8 },
      ];

  const [criterios, setCriterios] = useState<CriterioEvaluacion[]>(criteriosIniciales);
  const [observaciones, setObservaciones] = useState(evaluacion.observaciones || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(evaluacion.estado === "completada");

  const total = criterios.reduce((sum, c) => sum + Number(c.puntaje_obtenido || 0), 0);

  const handleGuardar = async () => {
    setSaving(true);
    try {
      await calificarEvaluacion(evaluacion.id, {
        puntaje_total: total,
        observaciones,
        criterios: criterios.map((c) => ({
          id: c.id,
          criterio: c.criterio,
          puntaje_obtenido: Number(c.puntaje_obtenido),
        })),
      });
      setSaved(true);
      onComplete();
    } catch (err) {
      console.error("Error al guardar evaluación:", err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-[1000px] mx-auto space-y-5">
      <button onClick={onBack} className="text-sm text-[#1E6B3C] font-medium">← Volver a evaluaciones</button>
      <PageHeader
        title="Rúbrica de evaluación"
        subtitle={`EVA-${evaluacion.id} · ${evaluacion.proyecto}`}
        breadcrumb={["NOUS", "Evaluaciones", `EVA-${evaluacion.id}`]}
      />
      <Card>
        <div className="flex items-center justify-between mb-5">
          <div>
            <SectionTitle>Evaluación técnica</SectionTitle>
            <p className="text-xs text-[#637068]">Evaluador: {evaluacion.evaluador_nombre} · Tipo: {evaluacion.tipo}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-[#637068]">Puntaje total</p>
            <p className="text-3xl font-bold text-[#1E6B3C]">{total.toFixed(1)} / 100</p>
          </div>
        </div>

        <div className="space-y-5">
          {criterios.map((criterio, index) => {
            const val = Number(criterio.puntaje_obtenido || 0);
            const max = Number(criterio.puntaje_maximo || 100);
            const pct = (val / max) * 100;
            return (
              <div key={criterio.id || index}>
                <div className="flex justify-between gap-4 mb-2">
                  <label className="text-sm font-semibold text-[#1A2B22]">{criterio.criterio}</label>
                  <span className="text-xs text-[#637068]">Máx: {max} pts · Obtenido: {val}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={max}
                  value={val}
                  onChange={(e) => {
                    const newVal = Number(e.target.value);
                    setCriterios((prev) => prev.map((item, i) => i === index ? { ...item, puntaje_obtenido: newVal } : item));
                  }}
                  className="w-full accent-[#1E6B3C]"
                />
                <ProgressBar value={pct} color={pct >= 70 ? "green" : "gold"} />
              </div>
            );
          })}
        </div>

        <textarea
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          className="w-full mt-6 border border-[#DDE4DF] rounded-xl p-3 text-sm min-h-24"
          placeholder="Observaciones y recomendaciones del evaluador para el proyecto..."
        />

        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-[#DDE4DF]">
          <Button variant="outline" onClick={onBack}>Regresar</Button>
          <Button variant="primary" disabled={saving} onClick={handleGuardar}>
            {saving ? "Guardando..." : saved ? "✓ Evaluación guardada" : "Enviar evaluación"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

export function Evaluaciones() {
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Evaluacion | null>(null);

  const cargar = () => {
    setLoading(true);
    getEvaluaciones()
      .then((data) => setEvaluaciones(data ?? []))
      .catch((err) => console.error("Error al cargar evaluaciones:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargar();
  }, []);

  if (selected) {
    return <Rubrica evaluacion={selected} onBack={() => setSelected(null)} onComplete={() => { cargar(); }} />;
  }

  const pendientes = evaluaciones.filter((e) => e.estado === "pendiente").length;
  const enProgreso = evaluaciones.filter((e) => e.estado === "en_progreso" || e.estado === "activo").length;
  const completadas = evaluaciones.filter((e) => e.estado === "completada" || e.estado === "finalizada").length;

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <PageHeader
        title="Evaluaciones"
        subtitle="Propuestas asignadas para revisión y calificación técnica"
        breadcrumb={["NOUS", "Evaluaciones"]}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[
          { label: "Pendientes", value: String(pendientes) },
          { label: "En progreso", value: String(enProgreso) },
          { label: "Completadas", value: String(completadas) },
        ].map((item) => (
          <Card key={item.label}>
            <p className="text-2xl font-bold text-[#1E6B3C]">{item.value}</p>
            <p className="text-sm text-[#637068]">{item.label}</p>
          </Card>
        ))}
      </div>

      <Card padding={false}>
        <div className="px-5 py-4 border-b border-[#DDE4DF]">
          <h2 className="text-sm font-semibold text-[#1A2B22]">Evaluaciones asignadas</h2>
        </div>
        {evaluaciones.length === 0 ? (
          <div className="p-8 text-center text-sm text-[#637068]">
            No hay evaluaciones asignadas en la base de datos.
          </div>
        ) : (
          evaluaciones.map((item) => (
            <div
              key={item.id}
              className="flex flex-wrap items-center gap-4 px-5 py-4 border-b border-[#F2F5F3] last:border-0"
            >
              <div className="flex-1 min-w-60">
                <p className="text-xs font-mono text-[#637068]">EVA-{item.id} · {item.convocatoria}</p>
                <p className="text-sm font-semibold text-[#1A2B22]">{item.proyecto}</p>
                <p className="text-xs text-[#637068]">
                  Fecha límite: {item.fecha_limite ? new Date(item.fecha_limite).toLocaleDateString("es-CO") : "Sin fecha"} · Tipo: {item.tipo}
                </p>
              </div>
              <Badge variant={mapEstado(item.estado)} />
              <Button
                variant={item.estado === "completada" ? "outline" : "primary"}
                size="sm"
                onClick={() => setSelected(item)}
              >
                {item.estado === "completada" ? "Ver resultado" : "Evaluar propuesta"}
              </Button>
            </div>
          ))
        )}
      </Card>
    </div>
  );
}