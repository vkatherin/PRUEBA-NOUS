import React, { useState, useEffect } from "react";
import { Badge, Button, Card, PageHeader, ProgressBar, SectionTitle, Modal, Field, Select, Input } from "@/components/ui";
import { evaluacionesApi, type Evaluacion, type EvaluacionDetalle, type EvaluadorDisponible, type ProyectoSinEvaluador } from "@/services/api";

function Rubrica({ evaluacionId, onBack }: { evaluacionId: number; onBack: () => void }) {
  const [evaluacion, setEvaluacion] = useState<EvaluacionDetalle | null>(null);
  const [scores, setScores] = useState<number[]>([]);
  const [criterios, setCriterios] = useState<{ id?: number; criterio?: string; puntaje_maximo?: number; puntaje_obtenido: number }[]>([]);
  const [observaciones, setObservaciones] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    evaluacionesApi.getById(evaluacionId)
      .then(data => {
        setEvaluacion(data);
        setObservaciones(data.observaciones || "");
        if (data.criterios && data.criterios.length > 0) {
          setCriterios(data.criterios);
          setScores(data.criterios.map(c => c.puntaje_obtenido));
        } else {
          // Fallback to default
          const defaultCriterios = [
            { criterio: "Pertinencia y problema de investigación", puntaje_maximo: 25, puntaje_obtenido: 0 },
            { criterio: "Calidad metodológica", puntaje_maximo: 25, puntaje_obtenido: 0 },
            { criterio: "Impacto y resultados esperados", puntaje_maximo: 20, puntaje_obtenido: 0 },
            { criterio: "Viabilidad técnica y financiera", puntaje_maximo: 20, puntaje_obtenido: 0 },
            { criterio: "Experiencia del equipo investigador", puntaje_maximo: 10, puntaje_obtenido: 0 },
          ];
          setCriterios(defaultCriterios);
          setScores(defaultCriterios.map(() => 0));
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, [evaluacionId]);

  const handleScoreChange = (index: number, val: number) => {
    const newScores = [...scores];
    newScores[index] = val;
    setScores(newScores);
  };

  const total = scores.reduce((sum, score) => sum + score, 0);

  const handleSubmit = async () => {
    if (!evaluacion) return;
    setSaving(true);
    try {
      const payloadCriterios = criterios.map((c, i) => ({
        ...c,
        puntaje_obtenido: scores[i]
      }));
      await evaluacionesApi.calificar(evaluacionId, {
        puntaje_total: total,
        observaciones,
        criterios: payloadCriterios
      });
      onBack();
    } catch (e) {
      console.error(e);
      alert("Error al enviar evaluación");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-center">Cargando...</div>;
  if (!evaluacion) return <div className="p-6 text-center">Evaluación no encontrada</div>;

  return <div className="p-6 max-w-[1000px] mx-auto space-y-5">
    <button onClick={onBack} className="text-sm text-theme-primary font-medium">← Volver a evaluaciones</button>
    <PageHeader title="Rúbrica de evaluación" subtitle={`EVA-${evaluacion.id.toString().padStart(3, '0')} · ${evaluacion.proyecto}`} breadcrumb={["NOUS", "Evaluaciones", "Rúbrica"]} />
    
    <div className="mb-2">
      {evaluacion.documento_url ? (
        <a href={evaluacion.documento_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-theme-border rounded-lg text-sm text-theme-primary font-medium hover:bg-white/10 transition-colors">
          📄 Ver Documento: {evaluacion.documento_nombre || "Anexo del Proyecto"}
        </a>
      ) : (
        <span className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-theme-border rounded-lg text-sm text-theme-text-muted">
          📄 El proyecto aún no tiene un documento anexo subido
        </span>
      )}
    </div>

    <Card>
      <div className="flex items-center justify-between mb-5">
        <div><SectionTitle>Evaluación técnica</SectionTitle><p className="text-xs text-theme-text-muted">Asigna una calificación de 0 a 100 en cada criterio.</p></div>
        <div className="text-right"><p className="text-xs text-theme-text-muted">Puntaje final</p><p className="text-3xl font-bold text-theme-primary">{total.toFixed(1)} / 100</p></div>
      </div>
      <div className="space-y-5">
        {criterios.map((criterio, index) => <div key={criterio.id || criterio.criterio}>
          <div className="flex justify-between gap-4 mb-2">
            <label className="text-sm font-semibold text-theme-text-main">{criterio.criterio}</label>
            <span className="text-xs text-theme-text-muted">Max {criterio.puntaje_maximo} · {scores[index]}</span>
          </div>
          <input type="range" min="0" max={criterio.puntaje_maximo} value={scores[index]} onChange={(e) => handleScoreChange(index, Number(e.target.value))} className="w-full accent-[var(--theme-primary)]" />
          <ProgressBar value={(scores[index] / (criterio.puntaje_maximo || 1)) * 100} color={((scores[index] / (criterio.puntaje_maximo || 1)) * 100) >= 70 ? "green" : "gold"} />
        </div>)}
      </div>
      <textarea className="w-full mt-6 border border-theme-border rounded-xl p-3 text-sm min-h-24" placeholder="Observaciones y recomendaciones para el postulante..." value={observaciones} onChange={e => setObservaciones(e.target.value)} />
      <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-theme-border">
        <Button variant="primary" onClick={handleSubmit} disabled={saving}>{saving ? "Enviando..." : "Enviar evaluación"}</Button>
      </div>
    </Card>
  </div>;
}

export function Evaluaciones({ user }: { user?: any }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [evaluaciones, setEvaluaciones] = useState<Evaluacion[]>([]);
  const [loading, setLoading] = useState(true);

  const [modalAsignarOpen, setModalAsignarOpen] = useState(false);
  const [evaluadores, setEvaluadores] = useState<EvaluadorDisponible[]>([]);
  const [proyectos, setProyectos] = useState<ProyectoSinEvaluador[]>([]);
  
  const [asigProyectoId, setAsigProyectoId] = useState("");
  const [asigEvaluadorId, setAsigEvaluadorId] = useState("");
  const [asigTipo, setAsigTipo] = useState("");
  const [asigFechaLimite, setAsigFechaLimite] = useState("");
  const [savingAsig, setSavingAsig] = useState(false);

  const canAsignar = user?.permisos?.includes('evaluaciones.asignar');

  const cargarDatos = () => {
    setLoading(true);
    evaluacionesApi.getAll()
      .then(setEvaluaciones)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const openAsignarModal = async () => {
    try {
      const [evals, proys] = await Promise.all([
        evaluacionesApi.getEvaluadoresDisponibles(),
        evaluacionesApi.getProyectosSinEvaluador()
      ]);
      setEvaluadores(evals);
      setProyectos(proys);
      setAsigProyectoId("");
      setAsigEvaluadorId("");
      setAsigTipo("");
      setAsigFechaLimite("");
      setModalAsignarOpen(true);
    } catch (e) {
      console.error(e);
      alert("Error al cargar datos para asignar");
    }
  };

  const handleAsignar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!asigProyectoId || !asigEvaluadorId || !asigTipo) return;
    setSavingAsig(true);
    try {
      await evaluacionesApi.asignar({
        proyecto_id: Number(asigProyectoId),
        evaluador_id: Number(asigEvaluadorId),
        tipo: asigTipo,
        fecha_limite: asigFechaLimite || undefined
      });
      setModalAsignarOpen(false);
      cargarDatos();
    } catch (err: any) {
      alert(err.message || "Error al asignar evaluador");
    } finally {
      setSavingAsig(false);
    }
  };

  if (selectedId !== null) return <Rubrica evaluacionId={selectedId} onBack={() => { setSelectedId(null); cargarDatos(); }} />;

  const pendientes = evaluaciones.filter(e => e.estado === 'pendiente' && (!e.fecha_limite || new Date(e.fecha_limite) >= new Date())).length;
  // For badge state:
  const getBadgeEstado = (e: Evaluacion): "pending" | "active" | "closed" => {
    if (e.estado === "completada") return "closed";
    if (e.fecha_limite && new Date(e.fecha_limite) < new Date()) return "active"; // vencida / urg
    return "pending";
  };

  const completadas = evaluaciones.filter(e => e.estado === 'completada').length;

  return <div className="p-6 max-w-[1200px] mx-auto space-y-5">
    <PageHeader 
      title="Evaluaciones" 
      subtitle="Propuestas asignadas para revisión y calificación" 
      breadcrumb={["NOUS", "Evaluaciones"]} 
      actions={
        canAsignar ? (
          <Button variant="primary" onClick={openAsignarModal}>+ Asignar Evaluador</Button>
        ) : undefined
      }
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <Card><p className="text-2xl font-bold text-theme-primary">{pendientes}</p><p className="text-sm text-theme-text-muted">Pendientes</p></Card>
      <Card><p className="text-2xl font-bold text-[#D97706]">{evaluaciones.length - pendientes - completadas}</p><p className="text-sm text-theme-text-muted">En progreso / Vencidas</p></Card>
      <Card><p className="text-2xl font-bold text-emerald-600">{completadas}</p><p className="text-sm text-theme-text-muted">Completadas</p></Card>
    </div>
    <Card padding={false}>
      <div className="px-5 py-4 border-b border-theme-border">
        <h2 className="text-sm font-semibold text-theme-text-main">Evaluaciones asignadas</h2>
      </div>
      {loading ? (
        <div className="p-5 text-sm text-theme-text-muted">Cargando...</div>
      ) : evaluaciones.length === 0 ? (
        <div className="p-5 text-sm text-theme-text-muted">No hay evaluaciones asignadas.</div>
      ) : (
        evaluaciones.map((item) => (
          <div key={item.id} className="flex flex-wrap items-center gap-4 px-5 py-4 border-b border-theme-border last:border-0">
            <div className="flex-1 min-w-60">
              <p className="text-xs font-mono text-theme-text-muted">EVA-{item.id.toString().padStart(3, '0')} · {item.convocatoria}</p>
              <p className="text-sm font-semibold text-theme-text-main">{item.proyecto}</p>
              <p className="text-xs text-theme-text-muted">
                Evaluador: {item.evaluador_nombre} {item.fecha_limite ? `| Límite: ${new Date(item.fecha_limite).toLocaleDateString('es-CO')}` : ''}
              </p>
            </div>
            <Badge variant={getBadgeEstado(item)} />
            <Button variant={item.estado === "completada" ? "outline" : "primary"} size="sm" onClick={() => setSelectedId(item.id)}>
              {item.estado === "completada" ? "Ver resultado" : "Evaluar propuesta"}
            </Button>
          </div>
        ))
      )}
    </Card>

    {/* MODAL ASIGNAR EVALUADOR */}
    {modalAsignarOpen && (
      <Modal open={true} title="Asignar Evaluador" onClose={() => setModalAsignarOpen(false)} size="md">
        <form onSubmit={handleAsignar} className="space-y-4">
          <Field label="Proyecto" required>
            <Select 
              value={asigProyectoId} 
              onChange={setAsigProyectoId} 
              options={[
                { value: "", label: "Seleccionar proyecto" },
                ...proyectos.map(p => ({ value: p.id.toString(), label: `${p.codigo_unico || `PRY-${p.id}`} - ${p.titulo}` }))
              ]} 
            />
          </Field>
          <Field label="Evaluador" required>
            <Select 
              value={asigEvaluadorId} 
              onChange={setAsigEvaluadorId} 
              options={[
                { value: "", label: "Seleccionar evaluador" },
                ...evaluadores.map(e => ({ value: e.id.toString(), label: e.nombre_completo }))
              ]} 
            />
          </Field>
          <Field label="Tipo de evaluación" required>
            <Select 
              value={asigTipo} 
              onChange={setAsigTipo} 
              options={[
                { value: "", label: "Seleccionar tipo" },
                { value: "protocolo_60pts", label: "Protocolo 60pts" },
                { value: "sustentacion_40pts", label: "Sustentación 40pts" },
                { value: "poster", label: "Póster" }
              ]} 
            />
          </Field>
          <Field label="Fecha límite (opcional)">
            <Input type="date" value={asigFechaLimite} onChange={setAsigFechaLimite} />
          </Field>
          <div className="flex justify-end gap-2 pt-2 border-t border-theme-border">
            <Button variant="ghost" type="button" onClick={() => setModalAsignarOpen(false)}>Cancelar</Button>
            <Button variant="primary" type="submit" disabled={savingAsig || !asigProyectoId || !asigEvaluadorId || !asigTipo}>
              {savingAsig ? "Asignando..." : "Asignar evaluador"}
            </Button>
          </div>
        </form>
      </Modal>
    )}
  </div>;
}