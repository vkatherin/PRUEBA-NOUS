import React, { useState, useEffect } from "react";
import { Badge, Button, Card, PageHeader, Modal, Field, Input, Textarea, Select, SectionTitle } from "@/components/ui";
import { convocatoriasApi, type Convocatoria } from "@/services/api";

const WIZARD_STEPS = [
  { id: 1, label: "Información General" },
  { id: 2, label: "Cronograma" },
  { id: 3, label: "Requisitos" },
  { id: 4, label: "Evaluación" },
  { id: 5, label: "Publicación" },
];

function mapEstadoConv(estado: string): "active" | "evaluation" | "closed" | "draft" {
  if (estado === 'activa')     return 'active';
  if (estado === 'evaluacion') return 'evaluation';
  if (estado === 'cerrada')    return 'closed';
  return 'draft';
}

function WizardModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(1);

  return (
    <Modal open={open} onClose={onClose} title="Nueva Convocatoria" size="xl">
      {/* Stepper */}
      <div className="flex items-center mb-6">
        {WIZARD_STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  s.id < step
                    ? "bg-[#1E6B3C] text-white"
                    : s.id === step
                    ? "bg-[#1E6B3C] text-white ring-4 ring-[#EBF5EF]"
                    : "bg-[#F2F5F3] text-[#9BAD9F]"
                }`}
              >
                {s.id < step ? "✓" : s.id}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  s.id === step ? "text-[#1E6B3C]" : s.id < step ? "text-[#1A2B22]" : "text-[#9BAD9F]"
                }`}
              >
                {s.label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${s.id < step ? "bg-[#1E6B3C]" : "bg-[#DDE4DF]"}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step content */}
      {step === 1 && (
        <div className="space-y-4">
          <SectionTitle>Información General de la Convocatoria</SectionTitle>
          <Field label="Nombre de la Convocatoria" required>
            <Input placeholder="Ej: Fondo de Investigación Institucional 2025-II" />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Tipo" required>
              <Select
                options={[
                  { value: "interna", label: "Interna" },
                  { value: "externa", label: "Externa" },
                  { value: "conjunta", label: "Conjunta" },
                ]}
                placeholder="Seleccionar tipo"
              />
            </Field>
            <Field label="Dirigida a" required>
              <Select
                options={[
                  { value: "docentes", label: "Docentes TC/MT" },
                  { value: "estudiantes", label: "Estudiantes" },
                  { value: "grupos", label: "Grupos de investigación" },
                  { value: "todos", label: "Toda la comunidad" },
                ]}
                placeholder="Público objetivo"
              />
            </Field>
          </div>
          <Field label="Descripción de la Convocatoria" required>
            <Textarea placeholder="Objetivo, alcance y descripción general..." rows={4} />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Presupuesto Total Disponible">
              <Input placeholder="Ej: 180000000" />
            </Field>
            <Field label="Número máximo de proyectos">
              <Input placeholder="Ej: 15" />
            </Field>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <SectionTitle>Cronograma de la Convocatoria</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Apertura de inscripciones", key: "apertura" },
              { label: "Cierre de inscripciones", key: "cierre" },
              { label: "Inicio evaluación", key: "eval_inicio" },
              { label: "Fin evaluación", key: "eval_fin" },
              { label: "Publicación de resultados", key: "resultados" },
              { label: "Inicio ejecución proyectos", key: "ejecucion" },
            ].map((item) => (
              <Field key={item.key} label={item.label} required>
                <Input type="date" />
              </Field>
            ))}
          </div>
          <div className="p-4 rounded-xl bg-[#EBF5EF] border border-[#C8E6D2]">
            <p className="text-sm font-medium text-[#1E6B3C] mb-1">Duración estimada</p>
            <p className="text-xs text-[#637068]">El cronograma permite 60 días para inscripciones, 30 días para evaluación y publicación en 7 días hábiles.</p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <SectionTitle>Requisitos y Documentación</SectionTitle>
          <div className="space-y-3">
            {[
              "Propuesta de investigación (formato institucional)",
              "Hoja de vida investigador principal (CvLAC)",
              "Aval del grupo de investigación",
              "Carta de compromiso del investigador",
              "Presupuesto detallado y justificado",
              "Cronograma de actividades",
            ].map((req, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-[#DDE4DF] bg-[#FAFFFE]">
                <input type="checkbox" defaultChecked className="accent-[#1E6B3C] w-4 h-4" />
                <span className="text-sm text-[#1A2B22]">{req}</span>
                <span className="ml-auto text-xs text-[#637068] bg-[#F2F5F3] px-2 py-1 rounded-lg">Obligatorio</span>
              </div>
            ))}
          </div>
          <button className="w-full py-2.5 border-2 border-dashed border-[#DDE4DF] rounded-xl text-sm text-[#637068] hover:border-[#1E6B3C] hover:text-[#1E6B3C] transition-colors">
            + Agregar requisito personalizado
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <SectionTitle>Configuración de Evaluación</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Modalidad de evaluación">
              <Select
                options={[
                  { value: "par", label: "Evaluación por pares" },
                  { value: "comite", label: "Comité evaluador" },
                  { value: "mixta", label: "Mixta" },
                ]}
                placeholder="Seleccionar modalidad"
              />
            </Field>
            <Field label="Evaluadores por proyecto">
              <Select
                options={[
                  { value: "1", label: "1 evaluador" },
                  { value: "2", label: "2 evaluadores" },
                  { value: "3", label: "3 evaluadores" },
                ]}
                placeholder="Número de evaluadores"
              />
            </Field>
          </div>
          <Field label="Criterios de evaluación">
            <div className="space-y-2">
              {[
                { criterio: "Pertinencia e impacto", peso: "25%" },
                { criterio: "Viabilidad metodológica", peso: "25%" },
                { criterio: "Trayectoria del equipo", peso: "20%" },
                { criterio: "Coherencia presupuestal", peso: "20%" },
                { criterio: "Productos esperados", peso: "10%" },
              ].map((c) => (
                <div key={c.criterio} className="flex items-center gap-3 p-3 rounded-xl border border-[#DDE4DF]">
                  <span className="text-sm text-[#1A2B22] flex-1">{c.criterio}</span>
                  <span className="text-xs font-bold text-[#1E6B3C] bg-[#EBF5EF] px-3 py-1 rounded-full">{c.peso}</span>
                </div>
              ))}
            </div>
          </Field>
          <Field label="Puntaje mínimo de aprobación">
            <Input placeholder="Ej: 70" />
          </Field>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <SectionTitle>Publicación y Difusión</SectionTitle>
          <div className="p-5 rounded-xl bg-[#FFF8E6] border border-[#FFE5A0]">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-[#D4930B] mb-1">Revisión antes de publicar</p>
                <p className="text-xs text-[#637068]">
                  Una vez publicada la convocatoria, los campos fundamentales no podrán modificarse. Revisa toda la información antes de continuar.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#1A2B22]">Resumen de la convocatoria</p>
            {[
              { label: "Nombre", value: "Fondo de Investigación Institucional 2025-II" },
              { label: "Tipo", value: "Interna · Docentes TC/MT" },
              { label: "Apertura", value: "01 Agosto 2025" },
              { label: "Cierre", value: "30 Septiembre 2025" },
              { label: "Presupuesto", value: "$180.000.000" },
              { label: "Documentos requeridos", value: "6 documentos obligatorios" },
            ].map((item) => (
              <div key={item.label} className="flex justify-between py-2 border-b border-[#F2F5F3]">
                <span className="text-xs text-[#637068]">{item.label}</span>
                <span className="text-xs font-semibold text-[#1A2B22]">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#EBF5EF]">
            <input type="checkbox" className="accent-[#1E6B3C] w-4 h-4" defaultChecked />
            <span className="text-xs text-[#637068]">
              Notificar automáticamente por correo a todos los investigadores activos
            </span>
          </div>
        </div>
      )}

      {/* Footer nav */}
      <div className="flex justify-between mt-6 pt-4 border-t border-[#DDE4DF]">
        <Button variant="ghost" onClick={step === 1 ? onClose : () => setStep(step - 1)}>
          {step === 1 ? "Cancelar" : "← Anterior"}
        </Button>
        <div className="flex gap-2">
          {step < 5 && (
            <Button variant="secondary" onClick={onClose}>Guardar Borrador</Button>
          )}
          {step < 5 ? (
            <Button variant="primary" onClick={() => setStep(step + 1)}>
              Siguiente →
            </Button>
          ) : (
            <Button variant="gold" onClick={onClose}>
              🚀 Publicar Convocatoria
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

export function Convocatorias() {
  const [showWizard, setShowWizard] = useState(false);
  const [selected, setSelected] = useState<Convocatoria | null>(null);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    convocatoriasApi.getAll()
      .then(setConvocatorias)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <PageHeader
        title="Convocatorias"
        subtitle="Gestión de convocatorias internas y externas de investigación"
        breadcrumb={["NOUS", "Convocatorias"]}
        actions={
          <Button variant="primary" onClick={() => setShowWizard(true)}>
            + Nueva Convocatoria
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Abiertas", value: convocatorias.filter(c => c.estado === 'activa').length, color: "#1E6B3C" },
          { label: "En evaluación", value: convocatorias.filter(c => c.estado === 'evaluacion').length, color: "#D97706" },
          { label: "Cerradas 2025", value: convocatorias.filter(c => c.estado === 'cerrada').length, color: "#9CA3AF" },
          { label: "Total inscritos", value: convocatorias.reduce((acc, curr) => acc + curr.inscritos, 0), color: "#2563EB" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#DDE4DF] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ backgroundColor: s.color + "15", color: s.color }}>
              {s.value}
            </div>
            <p className="text-sm text-[#637068] font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Cards */}
      <div className="space-y-4">
        {loading ? (
           <div className="p-8 text-center text-[#637068]">Cargando convocatorias...</div>
        ) : convocatorias.map((c) => (
          <Card key={c.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setSelected(c)}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-[#637068]">CONV-2025-{c.id.toString().padStart(3, '0')}</span>
                  <Badge variant={mapEstadoConv(c.estado)} />
                  <span className="text-xs bg-[#EBF5EF] text-[#1E6B3C] px-2 py-0.5 rounded-full font-medium">{c.tipo}</span>
                </div>
                <h3 className="text-base font-bold text-[#1A2B22] mb-1">{c.nombre}</h3>
                <p className="text-sm text-[#637068] mb-3">{c.descripcion}</p>
                <div className="flex flex-wrap gap-4 text-xs text-[#637068]">
                  <span>📅 Apertura: <strong className="text-[#1A2B22]">{c.apertura}</strong></span>
                  <span>🔒 Cierre: <strong className="text-[#1A2B22]">{c.cierre}</strong></span>
                  <span>👥 Inscritos: <strong className="text-[#1E6B3C]">{c.inscritos}</strong></span>
                  <span>⚖️ Evaluadores: <strong className="text-[#1A2B22]">{c.evaluadores}</strong></span>
                </div>
              </div>
              <div className="flex flex-col items-end gap-2 flex-shrink-0">
                <p className="text-xl font-bold text-[#1E6B3C]">{c.presupuesto}</p>
                <p className="text-xs text-[#637068]">Presupuesto total</p>
                <div className="flex gap-2 mt-2">
                  {mapEstadoConv(c.estado) === "active" && (
                    <>
                      <Button variant="outline" size="sm">Inscribir proyecto</Button>
                      <Button variant="primary" size="sm">Ver detalles</Button>
                    </>
                  )}
                  {mapEstadoConv(c.estado) === "evaluation" && (
                    <Button variant="secondary" size="sm">Ver evaluaciones</Button>
                  )}
                  {mapEstadoConv(c.estado) === "closed" && (
                    <Button variant="ghost" size="sm">Ver resultados</Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        ))}
        {(!loading && convocatorias.length === 0) && (
           <div className="p-8 text-center text-[#637068]">No hay convocatorias registradas.</div>
        )}
      </div>

      <WizardModal open={showWizard} onClose={() => setShowWizard(false)} />
    </div>
  );
}
