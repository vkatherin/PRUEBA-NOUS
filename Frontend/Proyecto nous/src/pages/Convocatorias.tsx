import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Badge, Button, Card, PageHeader, Modal, Field, Input, Textarea, Select, SectionTitle } from "@/components/ui";
import {
  authApi,
  getConvocatorias,
  crearConvocatoria,
  actualizarConvocatoria,
  publicarConvocatoria,
  getConvocatoriasExternas,
  crearConvocatoriaExterna,
  getConvocatoriasAlertas,
  inscribirseConvocatoria,
  getInscripcionesConvocatoria,
  TIPOS_INVESTIGACION,
  MAPA_TIPO_INVESTIGACION,
  type Convocatoria,
  type ConvocatoriaExterna,
  type AlertasConvocatorias,
  type Inscripcion,
} from "@/services/api";

// ─── Wizard steps ─────────────────────────────────────────────────────────────
const WIZARD_STEPS = [
  { id: 1, label: "Información General" },
  { id: 2, label: "Cronograma" },
  { id: 3, label: "Requisitos" },
  { id: 4, label: "Publicación" },
];

const REQUISITOS_DEFAULT = [
  "Propuesta de investigación (formato institucional)",
  "Hoja de vida investigador principal (CvLAC)",
  "Aval del programa",
  "Acuerdo de consentimiento",
  "Acuerdo de confidencialidad",
];

const OPCIONES_DIRIGIDA_A = [
  { value: "Docente", label: "Docente" },
  { value: "Estudiante", label: "Estudiante" },
  { value: "Administrativo", label: "Administrativo" },
];

interface WizardData {
  titulo: string;
  tipo: string;
  tipo_investigacion: string;
  dirigida: string;
  descripcion: string;
  fecha_apertura: string;
  fecha_cierre: string;
  fecha_resultados: string;
  requisitos: string[];
  notificar_investigadores: boolean;
}

const EMPTY_WIZARD: WizardData = {
  titulo: "", tipo: "", tipo_investigacion: "", dirigida: "", descripcion: "",
  fecha_apertura: "", fecha_cierre: "", fecha_resultados: "",
  requisitos: [...REQUISITOS_DEFAULT],
  notificar_investigadores: true,
};

// ─── WizardModal ──────────────────────────────────────────────────────────────
function WizardModal({
  open, onClose, onCreated,
}: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState(1);
  const [data, setData] = useState<WizardData>(EMPTY_WIZARD);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (field: keyof WizardData, value: string | boolean | string[]) => {
    setData((prev) => ({ ...prev, [field]: value }));
    if (typeof field === "string" && fieldErrors[field]) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const toggleRequisito = (req: string) => {
    const nuevos = data.requisitos.includes(req)
      ? data.requisitos.filter((r) => r !== req)
      : [...data.requisitos, req];
    set("requisitos", nuevos);
    if (nuevos.length > 0 && fieldErrors.requisitos) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.requisitos;
        return next;
      });
    }
  };

  const handleClose = () => {
    setStep(1);
    setData(EMPTY_WIZARD);
    setFieldErrors({});
    setGeneralError("");
    onClose();
  };

  const validateStep1 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!data.titulo || !data.titulo.trim()) {
      errs.titulo = "Este campo es obligatorio.";
    }
    if (!data.tipo || !data.tipo.trim()) {
      errs.tipo = "Selecciona una opción.";
    }
    if (data.tipo === "Externa" && (!data.tipo_investigacion || !data.tipo_investigacion.trim())) {
      errs.tipo_investigacion = "Selecciona el tipo de investigación para generar el código de la convocatoria.";
    }
    if (!data.dirigida || !data.dirigida.trim()) {
      errs.dirigida = "Selecciona a quién va dirigida la convocatoria.";
    } else if (!OPCIONES_DIRIGIDA_A.some((o) => o.value === data.dirigida.trim())) {
      errs.dirigida = "Selecciona una opción válida (Docente, Estudiante, Administrativo).";
    }
    if (!data.descripcion || !data.descripcion.trim()) {
      errs.descripcion = "Ingresa una descripción.";
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      if (errs.tipo_investigacion) {
        setGeneralError(errs.tipo_investigacion);
      } else {
        setGeneralError("Completa todos los campos obligatorios antes de continuar.");
      }
      return false;
    }
    setGeneralError("");
    return true;
  };

  const validateStep2 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!data.fecha_apertura) {
      errs.fecha_apertura = "Selecciona una fecha de apertura.";
    }
    if (!data.fecha_cierre) {
      errs.fecha_cierre = "Selecciona una fecha de cierre.";
    }
    if (data.fecha_apertura && data.fecha_cierre) {
      const fApertura = new Date(data.fecha_apertura);
      const fCierre = new Date(data.fecha_cierre);
      if (fCierre < fApertura) {
        errs.fecha_cierre = "La fecha de cierre no puede ser anterior a la fecha de apertura.";
      }
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setGeneralError("Completa todos los campos obligatorios antes de continuar.");
      return false;
    }
    setGeneralError("");
    return true;
  };

  const validateStep3 = (): boolean => {
    const errs: Record<string, string> = {};
    if (!data.requisitos || data.requisitos.length === 0) {
      errs.requisitos = "Debes seleccionar al menos un requisito para la convocatoria.";
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setGeneralError("Completa todos los campos obligatorios antes de continuar.");
      return false;
    }
    setGeneralError("");
    return true;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
    } else if (step === 2) {
      if (!validateStep2()) return;
    } else if (step === 3) {
      if (!validateStep3()) return;
    }
    setFieldErrors({});
    setGeneralError("");
    setStep((prev) => prev + 1);
  };

  const handlePublicar = async () => {
    if (!validateStep1()) {
      setStep(1);
      return;
    }
    if (!validateStep2()) {
      setStep(2);
      return;
    }
    if (!validateStep3()) {
      setStep(3);
      return;
    }

    setSaving(true);
    setGeneralError("");
    try {
      const payload: Partial<Convocatoria> = {
        titulo: data.titulo.trim(),
        tipo: data.tipo.trim(),
        tipo_investigacion: data.tipo === "Externa" ? data.tipo_investigacion.trim() : undefined,
        dirigida_a: data.dirigida.trim(),
        descripcion: data.descripcion.trim(),
        fecha_apertura: data.fecha_apertura,
        fecha_cierre: data.fecha_cierre,
        fecha_resultados: data.fecha_resultados || undefined,
        requisitos: data.requisitos.join("|"),
      };
      const { convocatoria } = await crearConvocatoria(payload);
      await publicarConvocatoria(convocatoria.id);
      onCreated();
      handleClose();
    } catch (e: unknown) {
      setGeneralError(e instanceof Error ? e.message : "Error al publicar la convocatoria");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Nueva Convocatoria" size="xl">
      <div className="flex items-center mb-6">
        {WIZARD_STEPS.map((s, i) => (
          <React.Fragment key={s.id}>
            <div className="flex items-center gap-2">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${s.id < step
                    ? "bg-[#1E6B3C] text-white"
                    : s.id === step
                      ? "bg-[#1E6B3C] text-white ring-4 ring-[#EBF5EF]"
                      : "bg-[#F2F5F3] text-[#9BAD9F]"
                  }`}
              >
                {s.id < step ? "✓" : s.id}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${s.id === step ? "text-[#1E6B3C]" : s.id < step ? "text-[#1A2B22]" : "text-[#9BAD9F]"
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

      {generalError && (
        <div className="mb-4 p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-medium flex items-center gap-2">
          <span className="text-base">⚠</span>
          <span>{generalError}</span>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <SectionTitle>Información General de la Convocatoria</SectionTitle>

          <div className="grid grid-cols-2 gap-4">
            <Field
              label="ID de la Convocatoria"
              hint={
                data.tipo === "Externa"
                  ? "Estructura externa: TIPO + E + AÑO + NNN"
                  : "Identificador único generado automáticamente"
              }
            >
              <Input
                value={
                  data.tipo === "Externa"
                    ? data.tipo_investigacion
                      ? `${MAPA_TIPO_INVESTIGACION[data.tipo_investigacion] || ""}E${new Date().getFullYear()}XXX (generado automáticamente)`
                      : "Selecciona el tipo de investigación para generar el código"
                    : "CONXX (generado automáticamente)"
                }
                disabled
              />
            </Field>

            <Field label="Tipo" required error={fieldErrors.tipo}>
              <Select
                options={[
                  { value: "Interna", label: "Interna" },
                  { value: "Externa", label: "Externa" },
                  { value: "Conjunta", label: "Conjunta" },
                ]}
                placeholder="Seleccionar tipo"
                value={data.tipo}
                hasError={!!fieldErrors.tipo}
                onChange={(v) => {
                  set("tipo", v);
                  if (v !== "Externa") {
                    set("tipo_investigacion", "");
                  }
                }}
              />
            </Field>
          </div>

          {data.tipo === "Externa" && (
            <Field
              label="Tipo de investigación"
              required
              error={fieldErrors.tipo_investigacion}
              hint="El código externo se construirá automáticamente a partir del tipo seleccionado (IC, IPD, IF, UE, SEM)"
            >
              <Select
                options={TIPOS_INVESTIGACION.map((t) => ({
                  value: t.label,
                  label: `${t.label} (${t.codigo})`,
                }))}
                placeholder="Selecciona el tipo de investigación..."
                value={data.tipo_investigacion}
                hasError={!!fieldErrors.tipo_investigacion}
                onChange={(v) => {
                  set("tipo_investigacion", v);
                  if (fieldErrors.tipo_investigacion) {
                    setFieldErrors((prev) => {
                      const next = { ...prev };
                      delete next.tipo_investigacion;
                      return next;
                    });
                  }
                }}
              />
            </Field>
          )}

          <Field label="Nombre de la Convocatoria" required error={fieldErrors.titulo}>
            <Input
              placeholder="Ej: Fondo de Investigación Institucional 2025-II"
              value={data.titulo}
              hasError={!!fieldErrors.titulo}
              onChange={(v) => set("titulo", v)}
            />
          </Field>

          <Field label="Dirigida a" required error={fieldErrors.dirigida}>
            <Select
              options={OPCIONES_DIRIGIDA_A}
              placeholder="Seleccionar público objetivo"
              value={data.dirigida}
              hasError={!!fieldErrors.dirigida}
              onChange={(v) => set("dirigida", v)}
            />
          </Field>

          <Field label="Descripción de la Convocatoria" required error={fieldErrors.descripcion}>
            <Textarea
              placeholder="Objetivo, alcance y descripción general..."
              rows={4}
              value={data.descripcion}
              hasError={!!fieldErrors.descripcion}
              onChange={(v) => set("descripcion", v)}
            />
          </Field>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <SectionTitle>Cronograma de la Convocatoria</SectionTitle>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Fecha de apertura *" required error={fieldErrors.fecha_apertura}>
              <Input
                type="date"
                value={data.fecha_apertura}
                hasError={!!fieldErrors.fecha_apertura}
                onChange={(v) => set("fecha_apertura", v)}
              />
            </Field>
            <Field label="Fecha de cierre *" required error={fieldErrors.fecha_cierre}>
              <Input
                type="date"
                value={data.fecha_cierre}
                hasError={!!fieldErrors.fecha_cierre}
                onChange={(v) => set("fecha_cierre", v)}
              />
            </Field>
            <Field label="Publicación de resultados">
              <Input
                type="date"
                value={data.fecha_resultados}
                onChange={(v) => set("fecha_resultados", v)}
              />
            </Field>
          </div>
          <div className="p-4 rounded-xl bg-[#EBF5EF] border border-[#C8E6D2]">
            <p className="text-sm font-medium text-[#1E6B3C] mb-1">Cronograma oficial</p>
            <p className="text-xs text-[#637068]">
              Asegúrate de que la fecha de cierre sea posterior a la de apertura para permitir el registro de propuestas.
            </p>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <SectionTitle>Requisitos y Documentación</SectionTitle>
          {fieldErrors.requisitos && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1">
              <span>⚠</span> {fieldErrors.requisitos}
            </p>
          )}
          <div className="space-y-3">
            {REQUISITOS_DEFAULT.map((req) => (
              <label key={req} className="flex items-center gap-3 p-3 rounded-xl border border-[#DDE4DF] bg-[#FAFFFE] cursor-pointer hover:bg-[#F2F5F3] transition-colors">
                <input
                  type="checkbox"
                  checked={data.requisitos.includes(req)}
                  onChange={() => toggleRequisito(req)}
                  className="accent-[#1E6B3C] w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-[#1A2B22]">{req}</span>
                <span className="ml-auto text-xs text-[#637068] bg-[#F2F5F3] px-2 py-1 rounded-lg">Obligatorio</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <SectionTitle>Publicación y Difusión</SectionTitle>
          <div className="p-5 rounded-xl bg-[#FFF8E6] border border-[#FFE5A0]">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-[#D4930B] mb-1">Revisión antes de publicar</p>
                <p className="text-xs text-[#637068]">
                  Verifica que todos los datos sean correctos. La convocatoria se registrará en el sistema.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-[#1A2B22]">Resumen de la convocatoria</p>
            {[
              { label: "ID", value: "CON (Se asignará automáticamente al guardar)" },
              { label: "Nombre", value: data.titulo || "—" },
              { label: "Tipo", value: data.tipo || "—" },
              { label: "Dirigida a", value: data.dirigida || "—" },
              { label: "Fecha de apertura", value: data.fecha_apertura || "—" },
              { label: "Fecha de cierre", value: data.fecha_cierre || "—" },
              { label: "Descripción", value: data.descripcion ? (data.descripcion.length > 70 ? data.descripcion.slice(0, 70) + "..." : data.descripcion) : "—" },
              { label: "Requisitos", value: `${data.requisitos.length} documentos obligatorios` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between py-2 border-b border-[#F2F5F3]">
                <span className="text-xs text-[#637068] font-medium">{item.label}</span>
                <span className="text-xs font-semibold text-[#1A2B22] text-right max-w-[60%] truncate">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-[#EBF5EF]">
            <input
              type="checkbox"
              className="accent-[#1E6B3C] w-4 h-4 cursor-pointer"
              checked={data.notificar_investigadores}
              onChange={(e) => set("notificar_investigadores", e.target.checked)}
            />
            <span className="text-xs text-[#637068]">
              Notificar automáticamente por correo a todos los investigadores activos
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-6 pt-4 border-t border-[#DDE4DF]">
        <Button variant="ghost" onClick={step === 1 ? handleClose : () => { setStep(step - 1); setGeneralError(""); }}>
          {step === 1 ? "Cancelar" : "← Anterior"}
        </Button>
        <div className="flex gap-2">
          {step < 4 ? (
            <Button variant="primary" onClick={handleNext}>
              Siguiente →
            </Button>
          ) : (
            <Button variant="gold" onClick={handlePublicar} disabled={saving}>
              {saving ? "Publicando..." : "🚀 Publicar Convocatoria"}
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
}

// ─── Edit Modal ───────────────────────────────────────────────────────────────
function EditModal({
  conv,
  onClose,
  onUpdated,
}: {
  conv: Convocatoria | null;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [formData, setFormData] = useState({
    titulo: "",
    tipo: "",
    dirigida_a: "",
    descripcion: "",
    fecha_apertura: "",
    fecha_cierre: "",
    requisitos: [] as string[],
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (conv) {
      setFormData({
        titulo: conv.titulo || "",
        tipo: conv.tipo || "Interna",
        dirigida_a: conv.dirigida_a || "Docente",
        descripcion: conv.descripcion || "",
        fecha_apertura: conv.fecha_apertura ? conv.fecha_apertura.slice(0, 10) : "",
        fecha_cierre: conv.fecha_cierre ? conv.fecha_cierre.slice(0, 10) : "",
        requisitos: conv.requisitos ? conv.requisitos.split("|") : [...REQUISITOS_DEFAULT],
      });
      setFieldErrors({});
      setGeneralError("");
    }
  }, [conv]);

  if (!conv) return null;

  const toggleRequisito = (req: string) => {
    setFormData((prev) => {
      const nuevos = prev.requisitos.includes(req)
        ? prev.requisitos.filter((r) => r !== req)
        : [...prev.requisitos, req];
      if (nuevos.length > 0 && fieldErrors.requisitos) {
        setFieldErrors((e) => {
          const next = { ...e };
          delete next.requisitos;
          return next;
        });
      }
      return { ...prev, requisitos: nuevos };
    });
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!formData.titulo || !formData.titulo.trim()) {
      errs.titulo = "Este campo es obligatorio.";
    }
    if (!formData.tipo || !formData.tipo.trim()) {
      errs.tipo = "Selecciona una opción.";
    }
    if (!formData.dirigida_a || !formData.dirigida_a.trim()) {
      errs.dirigida_a = "Selecciona a quién va dirigida la convocatoria.";
    } else if (!OPCIONES_DIRIGIDA_A.some((o) => o.value === formData.dirigida_a.trim())) {
      errs.dirigida_a = "Selecciona una opción válida (Docente, Estudiante, Administrativo).";
    }
    if (!formData.descripcion || !formData.descripcion.trim()) {
      errs.descripcion = "Ingresa una descripción.";
    }
    if (!formData.fecha_apertura) {
      errs.fecha_apertura = "Selecciona una fecha de apertura.";
    }
    if (!formData.fecha_cierre) {
      errs.fecha_cierre = "Selecciona una fecha de cierre.";
    }
    if (formData.fecha_apertura && formData.fecha_cierre) {
      const fApertura = new Date(formData.fecha_apertura);
      const fCierre = new Date(formData.fecha_cierre);
      if (fCierre < fApertura) {
        errs.fecha_cierre = "La fecha de cierre no puede ser anterior a la fecha de apertura.";
      }
    }
    if (formData.requisitos.length === 0) {
      errs.requisitos = "Debes seleccionar al menos un requisito para la convocatoria.";
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setGeneralError("Completa todos los campos obligatorios antes de continuar.");
      return false;
    }
    setGeneralError("");
    return true;
  };

  const handleGuardar = async () => {
    if (!validate()) return;
    setSaving(true);
    setGeneralError("");
    try {
      await actualizarConvocatoria(conv.id, {
        titulo: formData.titulo.trim(),
        tipo: formData.tipo.trim(),
        dirigida_a: formData.dirigida_a.trim(),
        descripcion: formData.descripcion.trim(),
        fecha_apertura: formData.fecha_apertura,
        fecha_cierre: formData.fecha_cierre,
        requisitos: formData.requisitos.join("|"),
      });
      onUpdated();
      onClose();
    } catch (e: unknown) {
      setGeneralError(e instanceof Error ? e.message : "Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const codigoDisplay = conv.codigo_con || conv.codigo || `CON${conv.id}`;

  return (
    <Modal open={!!conv} onClose={onClose} title={`Editar Convocatoria ${codigoDisplay}`} size="xl">
      <div className="space-y-4">
        {generalError && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-medium flex items-center gap-2">
            <span>⚠</span>
            <span>{generalError}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Field label="ID de la Convocatoria" hint="Identificador único inmutable">
            <Input value={codigoDisplay} disabled />
          </Field>
          <Field label="Tipo" required error={fieldErrors.tipo}>
            <Select
              options={[
                { value: "Interna", label: "Interna" },
                { value: "Externa", label: "Externa" },
                { value: "Conjunta", label: "Conjunta" },
              ]}
              placeholder="Seleccionar tipo"
              value={formData.tipo}
              hasError={!!fieldErrors.tipo}
              onChange={(v) => {
                setFormData((prev) => ({ ...prev, tipo: v }));
                if (fieldErrors.tipo) setFieldErrors((prev) => ({ ...prev, tipo: "" }));
              }}
            />
          </Field>
        </div>

        {conv.tipo_investigacion && (
          <Field label="Tipo de investigación" hint="Asociado al código de convocatoria (inmutable)">
            <Input value={conv.tipo_investigacion} disabled />
          </Field>
        )}

        <Field label="Nombre de la Convocatoria" required error={fieldErrors.titulo}>
          <Input
            placeholder="Ej: Fondo de Investigación Institucional 2025-II"
            value={formData.titulo}
            hasError={!!fieldErrors.titulo}
            onChange={(v) => {
              setFormData((prev) => ({ ...prev, titulo: v }));
              if (fieldErrors.titulo) setFieldErrors((prev) => ({ ...prev, titulo: "" }));
            }}
          />
        </Field>

        <Field label="Dirigida a" required error={fieldErrors.dirigida_a}>
          <Select
            options={OPCIONES_DIRIGIDA_A}
            placeholder="Seleccionar público objetivo"
            value={formData.dirigida_a}
            hasError={!!fieldErrors.dirigida_a}
            onChange={(v) => {
              setFormData((prev) => ({ ...prev, dirigida_a: v }));
              if (fieldErrors.dirigida_a) setFieldErrors((prev) => ({ ...prev, dirigida_a: "" }));
            }}
          />
        </Field>

        <Field label="Descripción de la Convocatoria" required error={fieldErrors.descripcion}>
          <Textarea
            placeholder="Objetivo, alcance y descripción general..."
            rows={3}
            value={formData.descripcion}
            hasError={!!fieldErrors.descripcion}
            onChange={(v) => {
              setFormData((prev) => ({ ...prev, descripcion: v }));
              if (fieldErrors.descripcion) setFieldErrors((prev) => ({ ...prev, descripcion: "" }));
            }}
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha de apertura *" required error={fieldErrors.fecha_apertura}>
            <Input
              type="date"
              value={formData.fecha_apertura}
              hasError={!!fieldErrors.fecha_apertura}
              onChange={(v) => {
                setFormData((prev) => ({ ...prev, fecha_apertura: v }));
                if (fieldErrors.fecha_apertura) setFieldErrors((prev) => ({ ...prev, fecha_apertura: "" }));
              }}
            />
          </Field>
          <Field label="Fecha de cierre *" required error={fieldErrors.fecha_cierre}>
            <Input
              type="date"
              value={formData.fecha_cierre}
              hasError={!!fieldErrors.fecha_cierre}
              onChange={(v) => {
                setFormData((prev) => ({ ...prev, fecha_cierre: v }));
                if (fieldErrors.fecha_cierre) setFieldErrors((prev) => ({ ...prev, fecha_cierre: "" }));
              }}
            />
          </Field>
        </div>

        <div>
          <p className="text-sm font-medium text-[#1A2B22] mb-2">Requisitos requeridos *</p>
          {fieldErrors.requisitos && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mb-2">
              <span>⚠</span> {fieldErrors.requisitos}
            </p>
          )}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {REQUISITOS_DEFAULT.map((req) => (
              <label key={req} className="flex items-center gap-3 p-2.5 rounded-lg border border-[#DDE4DF] bg-[#FAFFFE] cursor-pointer hover:bg-[#F2F5F3] text-sm">
                <input
                  type="checkbox"
                  checked={formData.requisitos.includes(req)}
                  onChange={() => toggleRequisito(req)}
                  className="accent-[#1E6B3C] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-[#1A2B22]">{req}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[#DDE4DF]">
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" onClick={handleGuardar} disabled={saving}>
          {saving ? "Guardando..." : "💾 Guardar Cambios"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────
function DetailModal({
  conv,
  onClose,
  onInscribirse,
}: {
  conv: Convocatoria | null;
  onClose: () => void;
  onInscribirse: (c: Convocatoria) => void;
}) {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loadingInscripciones, setLoadingInscripciones] = useState(false);

  useEffect(() => {
    if (conv?.id) {
      setLoadingInscripciones(true);
      getInscripcionesConvocatoria(conv.id)
        .then(setInscripciones)
        .catch((err) => console.error("Error al cargar inscripciones:", err))
        .finally(() => setLoadingInscripciones(false));
    } else {
      setInscripciones([]);
    }
  }, [conv?.id]);

  if (!conv) return null;

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "long", year: "numeric" }) : "—";

  const estadoLabel: Record<string, string> = {
    activa: "Activa", publicada: "Publicada",
    evaluacion: "En evaluación", cerrada: "Cerrada", borrador: "Borrador",
    objetada: "Objetada",
  };

  const codigoDisplay = conv.codigo_con || conv.codigo || `CON${conv.id}`;

  const rows = [
    { label: "ID", value: codigoDisplay },
    ...(conv.tipo_investigacion ? [{ label: "Tipo de investigación", value: conv.tipo_investigacion }] : []),
    { label: "Estado", value: estadoLabel[conv.estado] ?? conv.estado },
    { label: "Tipo", value: conv.tipo ?? "—" },
    { label: "Dirigida a", value: conv.dirigida_a ?? "—" },
    { label: "Apertura", value: formatDate(conv.fecha_apertura) },
    { label: "Cierre", value: formatDate(conv.fecha_cierre) },
    { label: "Creada por", value: conv.creado_por_nombre ?? "—" },
    { label: "Requisitos", value: conv.requisitos ? `${conv.requisitos.split("|").length} documentos` : "—" },
  ];

  return (
    <Modal open={!!conv} onClose={onClose} title={`Detalles de Convocatoria ${codigoDisplay}`} size="xl">
      <div className="space-y-5">
        <div className="p-4 rounded-xl bg-[#EBF5EF] border border-[#C8E6D2]">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono font-bold text-[#1E6B3C] bg-white px-2 py-0.5 rounded border border-[#C8E6D2]">
              {codigoDisplay}
            </span>
            {conv.tipo_investigacion && (
              <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-medium border border-purple-200">
                🔬 {conv.tipo_investigacion}
              </span>
            )}
            {conv.dirigida_a && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium border border-blue-200">
                🎯 {conv.dirigida_a}
              </span>
            )}
          </div>
          <h3 className="text-base font-bold text-[#1A2B22]">{conv.titulo}</h3>
          {conv.descripcion && <p className="text-sm text-[#637068] mt-1">{conv.descripcion}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col gap-0.5 p-3 rounded-xl border border-[#DDE4DF] bg-[#FAFFFE]">
              <span className="text-xs text-[#637068] font-medium">{r.label}</span>
              <span className="text-sm font-semibold text-[#1A2B22]">{r.value}</span>
            </div>
          ))}
        </div>
        {conv.observaciones_comite && (
          <div className="p-4 rounded-xl bg-[#FFF8E6] border border-[#FFE5A0]">
            <p className="text-xs font-semibold text-[#D4930B] mb-1">Observaciones del comité</p>
            <p className="text-sm text-[#1A2B22]">{conv.observaciones_comite}</p>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-[#DDE4DF] space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-[#1A2B22] flex items-center gap-2">
              <span>📋</span> Postulaciones / Anteproyectos inscritos
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#EBF5EF] text-[#1E6B3C] font-semibold border border-[#C8E6D2]">
                {inscripciones.length} / 50 cupos
              </span>
            </h4>
          </div>

          {loadingInscripciones ? (
            <div className="p-4 text-center text-xs text-[#637068] bg-[#FAFFFE] rounded-xl border border-[#DDE4DF]">
              Cargando inscripciones...
            </div>
          ) : inscripciones.length === 0 ? (
            <div className="p-4 text-center text-xs text-[#637068] bg-[#FAFFFE] rounded-xl border border-[#DDE4DF]">
              No hay postulaciones registradas aún en esta convocatoria.
            </div>
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {inscripciones.map((ins) => (
                <div
                  key={ins.id}
                  className="p-3.5 rounded-xl border border-[#DDE4DF] bg-white hover:border-[#C8E6D2] transition-colors space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-[#1A2B22]">
                        👤 {ins.usuario_nombre || `Usuario #${ins.usuario_id}`}
                      </p>
                      <p className="text-xs text-[#637068]">
                        {ins.usuario_correo} · Postulado el{" "}
                        {new Date(ins.fecha_inscripcion).toLocaleDateString("es-CO", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      ✓ {ins.estado || "Registrada"}
                    </span>
                  </div>

                  <div className="text-xs space-y-1 bg-[#FAFFFE] p-2.5 rounded-lg border border-[#E8EEEA]">
                    {ins.tipo_investigacion && (
                      <div>
                        <strong className="text-[#1A2B22]">Tipo de investigación: </strong>
                        <span className="text-[#1E6B3C] font-semibold">🔬 {ins.tipo_investigacion}</span>
                      </div>
                    )}
                    <div>
                      <strong className="text-[#1A2B22]">Resumen: </strong>
                      <span className="text-[#4B5563]">{ins.resumen_proyecto}</span>
                    </div>
                    <div>
                      <strong className="text-[#1A2B22]">Justificación: </strong>
                      <span className="text-[#4B5563]">{ins.justificacion}</span>
                    </div>
                  </div>

                  {ins.documentos_adjuntos && ins.documentos_adjuntos.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-bold text-[#1A2B22] uppercase tracking-wider">
                        Documentos adjuntos ({ins.documentos_adjuntos.length})
                      </p>
                      <div className="space-y-1.5">
                        {ins.documentos_adjuntos.map((doc, dIdx) => (
                          <div
                            key={doc.id || dIdx}
                            className="flex items-center justify-between p-2 rounded-lg bg-[#F7FAF8] border border-[#E1EAE4] text-xs"
                          >
                            <div className="flex flex-col truncate max-w-[260px]">
                              <span className="font-semibold text-[#1A2B22] text-[11px] truncate">
                                📋 {doc.requisito_nombre}
                              </span>
                              <span className="text-[11px] text-[#637068] truncate">
                                {doc.documento_nombre_original} ({(doc.documento_peso_bytes / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <a
                                href={doc.documento_ruta}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#1E6B3C] bg-[#EBF5EF] hover:bg-[#D9EFE1] border border-[#A7D7B5] rounded-md transition-colors"
                                title="Ver documento PDF"
                              >
                                <span>📄</span> Ver
                              </a>
                              <a
                                href={doc.documento_ruta}
                                download={doc.documento_nombre_original}
                                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-[#1E6B3C] hover:bg-[#17563A] border border-[#1E6B3C] rounded-md transition-colors"
                                title="Descargar documento PDF"
                              >
                                <span>⬇️</span> Descargar
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-[#9BAD9F] truncate max-w-[200px]">
                        📎 {ins.documento_nombre_original} ({(ins.documento_peso_bytes / 1024).toFixed(1)} KB)
                      </span>
                      <div className="flex items-center gap-2">
                        <a
                          href={ins.documento_ruta}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E6B3C] bg-[#EBF5EF] hover:bg-[#D9EFE1] border border-[#A7D7B5] rounded-lg transition-colors"
                          title="Ver anteproyecto en nueva pestaña"
                        >
                          <span>📄</span> Ver
                        </a>
                        <a
                          href={ins.documento_ruta}
                          download={ins.documento_nombre_original || "anteproyecto.pdf"}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#1E6B3C] hover:bg-[#17563A] border border-[#1E6B3C] rounded-lg transition-colors"
                          title="Descargar anteproyecto PDF"
                        >
                          <span>⬇️</span> Descargar
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between mt-6 pt-4 border-t border-[#DDE4DF]">
        <Button variant="ghost" onClick={onClose}>Cerrar</Button>
        <Button
          variant="primary"
          disabled={inscripciones.length >= 50}
          onClick={() => {
            onClose();
            onInscribirse(conv);
          }}
        >
          {inscripciones.length >= 50 ? "Cupo lleno (50/50)" : "📝 Inscribirse"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Modal de Inscripción a Convocatoria ──────────────────────────────────────
function InscripcionModal({
  conv,
  onClose,
  onInscrito,
}: {
  conv: Convocatoria | null;
  onClose: () => void;
  onInscrito: () => void;
}) {
  const [archivosRequisitos, setArchivosRequisitos] = useState<Record<string, File>>({});
  const [activeRequisitoForUpload, setActiveRequisitoForUpload] = useState<string | null>(null);
  const [tipoInvestigacion, setTipoInvestigacion] = useState("");
  const [resumen, setResumen] = useState("");
  const [justificacion, setJustificacion] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const singleFileInputRef = React.useRef<HTMLInputElement | null>(null);

  const listaRequisitos: string[] = useMemo(() => {
    if (!conv) return [...REQUISITOS_DEFAULT];
    if (conv.requisitos && conv.requisitos.trim().length > 0) {
      const parts = conv.requisitos.split("|").map((r) => r.trim()).filter(Boolean);
      if (parts.length > 0) return parts;
    }
    return [...REQUISITOS_DEFAULT];
  }, [conv?.requisitos]);

  useEffect(() => {
    if (conv) {
      setArchivosRequisitos({});
      setActiveRequisitoForUpload(null);
      setTipoInvestigacion("");
      setResumen("");
      setJustificacion("");
      setFieldErrors({});
      setGeneralError("");
      setSuccessMessage("");
      setSaving(false);
    }
  }, [conv]);

  if (!conv) return null;

  const handleSelectFileClick = (req: string) => {
    setActiveRequisitoForUpload(req);
    if (singleFileInputRef.current) {
      singleFileInputRef.current.value = "";
      singleFileInputRef.current.click();
    }
  };

  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected || !activeRequisitoForUpload) return;

    const isPdfExt = selected.name.toLowerCase().endsWith(".pdf");
    const isPdfMime = selected.type === "application/pdf" || selected.type === "";

    if (!isPdfExt || !isPdfMime) {
      setFieldErrors((prev) => ({
        ...prev,
        [activeRequisitoForUpload]: "Solo se permiten archivos en formato PDF.",
      }));
      return;
    }

    setArchivosRequisitos((prev) => ({
      ...prev,
      [activeRequisitoForUpload]: selected,
    }));

    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next[activeRequisitoForUpload];
      delete next.documentos;
      return next;
    });
    setGeneralError("");
  };

  const handleRemoveFile = (req: string) => {
    setArchivosRequisitos((prev) => {
      const next = { ...prev };
      delete next[req];
      return next;
    });
  };

  const handleEnviar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;

    const errors: Record<string, string> = {};
    const resumenTrim = resumen.trim();
    const justificacionTrim = justificacion.trim();

    if (!tipoInvestigacion.trim()) {
      errors.tipo_investigacion = "Selecciona el tipo de investigación.";
    }

    const faltantes = listaRequisitos.filter((req) => !archivosRequisitos[req]);
    if (faltantes.length > 0) {
      errors.documentos = `Debes adjuntar todos los ${listaRequisitos.length} documentos obligatorios en formato PDF.`;
      faltantes.forEach((req) => {
        errors[req] = "Este documento es obligatorio.";
      });
    }

    if (!resumenTrim) {
      errors.resumen = "El resumen del proyecto es obligatorio.";
    } else if (resumenTrim.length > 500) {
      errors.resumen = "El máximo permitido es de 500 caracteres.";
    }

    if (!justificacionTrim) {
      errors.justificacion = "La justificación es obligatoria.";
    } else if (justificacionTrim.length > 500) {
      errors.justificacion = "El máximo permitido es de 500 caracteres.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setGeneralError(Object.values(errors)[0]);
      return;
    }

    setFieldErrors({});
    setGeneralError("");
    setSaving(true);

    try {
      // ── FIX: usar el usuario real de la sesión JWT en vez de sessionStorage ──
      const me = await authApi.getMe();
      const usuarioId = me.id;

      const formData = new FormData();
      formData.append("usuario_id", usuarioId.toString());
      formData.append("convocatoria_id", conv.id.toString());
      formData.append("tipo_investigacion", tipoInvestigacion.trim());
      formData.append("resumen", resumenTrim);
      formData.append("justificacion", justificacionTrim);

      const requisitosInfo: Array<{ fieldname: string; requisito: string; filename: string }> = [];

      listaRequisitos.forEach((req, idx) => {
        const arch = archivosRequisitos[req];
        if (arch) {
          const fieldName = `doc_${idx}`;
          formData.append(fieldName, arch, arch.name);
          requisitosInfo.push({
            fieldname: fieldName,
            requisito: req,
            filename: arch.name,
          });
        }
      });

      const primerArchivo = archivosRequisitos[listaRequisitos[0]] || Object.values(archivosRequisitos)[0];
      if (primerArchivo) {
        formData.append("documento", primerArchivo, primerArchivo.name);
      }

      formData.append("requisitos_info", JSON.stringify(requisitosInfo));

      const res = await inscribirseConvocatoria(conv.id, formData);
      setSuccessMessage(res.mensaje || "Inscripción realizada correctamente.");
      onInscrito();

      setTimeout(() => {
        onClose();
      }, 1600);
    } catch (err: any) {
      const msg = err.message || "Error al procesar la inscripción";
      if (err.status === 409 || msg.includes("Ya tienes una inscripción")) {
        setGeneralError("Ya tienes una inscripción registrada para esta convocatoria.");
      } else if (err.campo) {
        setFieldErrors({ [err.campo]: msg });
        setGeneralError(msg);
      } else {
        setGeneralError(msg);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={!!conv} onClose={saving ? () => { } : onClose} title="INSCRIPCIÓN A LA CONVOCATORIA" size="lg">
      <form onSubmit={handleEnviar} className="space-y-5">
        <div className="p-3.5 rounded-xl bg-[#EBF5EF] border border-[#C8E6D2] flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-[#1E6B3C] bg-white px-2 py-0.5 rounded border border-[#C8E6D2] mr-2">
              {conv.codigo_con || conv.codigo || `CON${conv.id}`}
            </span>
            <span className="text-sm font-bold text-[#1A2B22]">{conv.titulo}</span>
          </div>
          <div className="flex items-center gap-2">
            {conv.tipo_investigacion && (
              <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-medium border border-purple-200">
                🔬 {conv.tipo_investigacion}
              </span>
            )}
            {conv.dirigida_a && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium border border-blue-200">
                🎯 {conv.dirigida_a}
              </span>
            )}
          </div>
        </div>

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-green-50 border border-green-300 text-green-800 text-sm font-medium flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span>{successMessage}</span>
          </div>
        )}

        {generalError && !successMessage && (
          <div className="p-3.5 rounded-xl bg-red-50 border border-red-300 text-red-700 text-sm font-medium flex items-center gap-2">
            <span className="text-lg">⚠</span>
            <span>{generalError}</span>
          </div>
        )}

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F4F6F5] border border-[#DDE4DF] text-xs text-[#526056]">
          <span className="text-sm shrink-0">ℹ️</span>
          <span>
            Los formatos de documentación los encuentras en el apartado de{" "}
            <strong className="text-[#1A2B22] font-semibold">Gestión Documental</strong>.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1A2B22] mb-1.5">
            Tipo de investigación <span className="text-red-500">*</span>
          </label>
          <select
            value={tipoInvestigacion}
            onChange={(e) => {
              setTipoInvestigacion(e.target.value);
              if (fieldErrors.tipo_investigacion) {
                setFieldErrors((prev) => {
                  const next = { ...prev };
                  delete next.tipo_investigacion;
                  return next;
                });
              }
              setGeneralError("");
            }}
            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors bg-[#FAFFFE] ${fieldErrors.tipo_investigacion
                ? "border-red-400 focus:border-red-500"
                : "border-[#DDE4DF] focus:border-[#1E6B3C]"
              }`}
          >
            <option value="">Selecciona el tipo de investigación...</option>
            {TIPOS_INVESTIGACION.map((t) => (
              <option key={t.codigo} value={t.label}>
                {t.label} ({t.codigo})
              </option>
            ))}
          </select>
          {fieldErrors.tipo_investigacion && (
            <p className="mt-1 text-xs text-red-600 font-medium">{fieldErrors.tipo_investigacion}</p>
          )}
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-semibold text-[#1A2B22]">
              Requisitos y Documentación requerida <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-[#637068] font-medium">
              {Object.keys(archivosRequisitos).length} de {listaRequisitos.length} adjuntos
            </span>
          </div>
          <p className="text-[11px] text-[#637068]">
            Adjunta en formato PDF cada uno de los documentos requeridos para postularte:
          </p>

          <input
            type="file"
            ref={singleFileInputRef}
            accept=".pdf,application/pdf"
            className="hidden"
            onChange={handleFilePicked}
          />

          <div className="space-y-2">
            {listaRequisitos.map((req, idx) => {
              const archivo = archivosRequisitos[req];
              const errorReq = fieldErrors[req];

              return (
                <div
                  key={req}
                  className={`p-3 rounded-xl border transition-all ${archivo
                      ? "bg-[#F3F9F5] border-[#A7D7B5]"
                      : errorReq
                        ? "bg-red-50/50 border-red-300"
                        : "bg-[#FAFFFE] border-[#DDE4DF] hover:border-[#B8C8BD]"
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${archivo ? "bg-[#1E6B3C] text-white" : "bg-[#E2ECE5] text-[#1E6B3C]"
                          }`}
                      >
                        {archivo ? "✓" : idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-[#1A2B22]">{req}</span>
                    </div>
                    <span className="text-[11px] font-medium text-[#637068] bg-[#EEF2F0] px-2 py-0.5 rounded-full shrink-0">
                      Obligatorio
                    </span>
                  </div>

                  {archivo ? (
                    <div className="flex items-center justify-between pl-7 pt-2 text-xs">
                      <div className="flex items-center gap-1.5 text-[#16512D] font-medium truncate max-w-[280px]">
                        <span>📄</span>
                        <span className="truncate">{archivo.name}</span>
                        <span className="text-[11px] text-[#637068] font-normal">
                          ({(archivo.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSelectFileClick(req)}
                          className="px-2.5 py-1 text-xs font-semibold text-[#1E6B3C] bg-white border border-[#C8D6CD] rounded-lg hover:bg-[#FAFFFE] shadow-sm transition-colors"
                        >
                          Cambiar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(req)}
                          className="px-2 py-1 text-xs font-semibold text-red-600 hover:text-red-700 transition-colors"
                          title="Quitar archivo"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pl-7 pt-2">
                      <span className="text-[11px] text-[#9BAD9F]">Solo formato PDF (máx. 15MB)</span>
                      <button
                        type="button"
                        onClick={() => handleSelectFileClick(req)}
                        className="px-3 py-1.5 text-xs font-semibold text-[#1E6B3C] bg-white border border-[#C8D6CD] rounded-lg hover:bg-[#EBF5EF] shadow-sm transition-colors inline-flex items-center gap-1.5"
                      >
                        <span>📎</span> Seleccionar archivo
                      </button>
                    </div>
                  )}

                  {errorReq && (
                    <p className="pl-7 mt-1.5 text-xs text-red-600 font-medium">
                      {errorReq}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

          {fieldErrors.documentos && (
            <p className="text-xs text-red-600 font-medium mt-1">
              {fieldErrors.documentos}
            </p>
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1A2B22] mb-1.5">
            Resumen del proyecto <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            maxLength={500}
            placeholder="Escribe aquí el resumen del proyecto..."
            value={resumen}
            onChange={(e) => {
              const val = e.target.value;
              if (val.length <= 500) {
                setResumen(val);
                if (fieldErrors.resumen) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.resumen;
                    return next;
                  });
                }
                setGeneralError("");
              }
            }}
            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors resize-none ${fieldErrors.resumen
                ? "border-red-400 bg-red-50/20 focus:border-red-500"
                : "border-[#DDE4DF] bg-[#FAFFFE] focus:border-[#1E6B3C]"
              }`}
          />
          <div className="flex justify-between items-center mt-1 text-xs">
            {fieldErrors.resumen ? (
              <span className="text-red-600 font-medium">{fieldErrors.resumen}</span>
            ) : (
              <span className="text-[#9BAD9F]">Síntesis del objetivo y alcance</span>
            )}
            <span
              className={`font-mono font-medium ${resumen.length >= 500 ? "text-amber-600 font-bold" : "text-[#637068]"
                }`}
            >
              {resumen.length} / 500 caracteres
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#1A2B22] mb-1.5">
            Justificación <span className="text-red-500">*</span>
          </label>
          <textarea
            rows={4}
            maxLength={500}
            placeholder="Escribe aquí la justificación del proyecto..."
            value={justificacion}
            onChange={(e) => {
              const val = e.target.value;
              if (val.length <= 500) {
                setJustificacion(val);
                if (fieldErrors.justificacion) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.justificacion;
                    return next;
                  });
                }
                setGeneralError("");
              }
            }}
            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors resize-none ${fieldErrors.justificacion
                ? "border-red-400 bg-red-50/20 focus:border-red-500"
                : "border-[#DDE4DF] bg-[#FAFFFE] focus:border-[#1E6B3C]"
              }`}
          />
          <div className="flex justify-between items-center mt-1 text-xs">
            {fieldErrors.justificacion ? (
              <span className="text-red-600 font-medium">{fieldErrors.justificacion}</span>
            ) : (
              <span className="text-[#9BAD9F]">Motivos e impacto esperado</span>
            )}
            <span
              className={`font-mono font-medium ${justificacion.length >= 500 ? "text-amber-600 font-bold" : "text-[#637068]"
                }`}
            >
              {justificacion.length} / 500 caracteres
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-[#DDE4DF]">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={saving}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            disabled={saving || !!successMessage}
          >
            {saving ? (
              <span className="flex items-center gap-2">
                <span className="animate-spin text-sm">⏳</span> Enviando inscripción...
              </span>
            ) : (
              "Enviar inscripción"
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

// ─── Modal Convocatoria Externa (RF-CON-04) ───────────────────────────────────
function ExternaModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [data, setData] = useState({
    titulo: "",
    entidad_externa: "",
    tipo_investigacion: "",
    fecha_apertura: "",
    fecha_cierre: "",
    descripcion: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (field: string, value: string) => setData((p) => ({ ...p, [field]: value }));

  const handleClose = () => {
    setData({
      titulo: "",
      entidad_externa: "",
      tipo_investigacion: "",
      fecha_apertura: "",
      fecha_cierre: "",
      descripcion: "",
    });
    setError("");
    onClose();
  };

  const handleGuardar = async () => {
    if (!data.titulo.trim()) { setError("El título es obligatorio."); return; }
    if (!data.tipo_investigacion || !data.tipo_investigacion.trim()) {
      setError("Selecciona el tipo de investigación para generar el código de la convocatoria.");
      return;
    }
    setSaving(true); setError("");
    try {
      await crearConvocatoriaExterna({
        ...data,
        titulo: data.titulo.trim(),
        tipo_investigacion: data.tipo_investigacion.trim(),
      });
      onCreated();
      handleClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const siglaPreview = data.tipo_investigacion ? MAPA_TIPO_INVESTIGACION[data.tipo_investigacion] : "";
  const codigoPreview = siglaPreview
    ? `${siglaPreview}E${new Date().getFullYear()}XXX (generado automáticamente)`
    : "Selecciona el tipo de investigación para generar el código";

  return (
    <Modal open={open} onClose={handleClose} title="Agregar Convocatoria Externa" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="ID de la Convocatoria" hint="Estructura externa: TIPO + E + AÑO + NNN">
            <Input value={codigoPreview} disabled />
          </Field>
          <Field label="Tipo de investigación" required hint="Determina el prefijo del código (IC, IPD, IF, UE, SEM)">
            <Select
              options={TIPOS_INVESTIGACION.map((t) => ({
                value: t.label,
                label: `${t.label} (${t.codigo})`,
              }))}
              placeholder="Selecciona el tipo de investigación..."
              value={data.tipo_investigacion}
              onChange={(v) => {
                set("tipo_investigacion", v);
                if (error) setError("");
              }}
            />
          </Field>
        </div>

        <Field label="Título de la Convocatoria" required>
          <Input placeholder="Ej: Convocatoria MinCiencias 2025" value={data.titulo} onChange={(v) => set("titulo", v)} />
        </Field>
        <Field label="Entidad Convocante">
          <Input placeholder="Ej: MinCiencias, Colciencias, ICETEX..." value={data.entidad_externa} onChange={(v) => set("entidad_externa", v)} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Fecha de Apertura">
            <Input type="date" value={data.fecha_apertura} onChange={(v) => set("fecha_apertura", v)} />
          </Field>
          <Field label="Fecha de Cierre">
            <Input type="date" value={data.fecha_cierre} onChange={(v) => set("fecha_cierre", v)} />
          </Field>
        </div>
        <Field label="Descripción">
          <Textarea placeholder="Descripción, alcance y requisitos..." rows={3} value={data.descripcion} onChange={(v) => set("descripcion", v)} />
        </Field>
        {error && <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-sm text-red-600">{error}</div>}
      </div>
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-[#DDE4DF]">
        <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleGuardar} disabled={saving}>
          {saving ? "Guardando..." : "Guardar Externa"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Tab: Alertas (RF-CON-03) ─────────────────────────────────────────────────
function AlertasTab() {
  const [alertas, setAlertas] = useState<AlertasConvocatorias | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getConvocatoriasAlertas()
      .then(setAlertas)
      .catch((e) => console.error("Error alertas:", e))
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  if (loading) return <div className="text-center py-12 text-[#637068]">Cargando alertas...</div>;
  if (!alertas) return <div className="text-center py-12 text-red-500">Error al cargar alertas.</div>;

  const { resumen, proximas_a_cerrar, proximas_a_abrir, vencidas_pendientes_cierre } = alertas;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Próximas a cerrar", value: resumen.proximas_a_cerrar_total, icon: "⏳", color: "#D97706", bg: "#FFF8E6" },
          { label: "Críticas (≤3 días)", value: resumen.criticas_3_dias, icon: "🚨", color: "#DC2626", bg: "#FEF2F2" },
          { label: "Próximas a abrir", value: resumen.proximas_a_abrir_total, icon: "📢", color: "#1E6B3C", bg: "#EBF5EF" },
          { label: "Vencidas pendientes", value: resumen.vencidas_pendientes_cierre, icon: "⚠️", color: "#7C3AED", bg: "#EDE9FE" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3 border" style={{ backgroundColor: s.bg, borderColor: s.color + "40" }}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-[#637068]">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {proximas_a_cerrar.length > 0 && (
        <div className="bg-white border border-[#DDE4DF] rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#FFF8E6] border-b border-[#FFE5A0]">
            <p className="text-sm font-semibold text-[#D4930B]">⏳ Próximas a cerrar</p>
          </div>
          <div className="divide-y divide-[#F2F5F3]">
            {proximas_a_cerrar.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1A2B22]">{c.titulo}</p>
                  <p className="text-xs text-[#637068]">Cierre: {formatDate(c.fecha_cierre)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {(c as any).nivel_alerta === "critica" && (
                    <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-full">🚨 Crítica</span>
                  )}
                  {(c as any).nivel_alerta === "urgente" && (
                    <span className="text-xs font-bold text-white bg-orange-500 px-2 py-1 rounded-full">⚡ Urgente</span>
                  )}
                  {(c as any).dias_restantes != null && (
                    <span className="text-xs text-[#637068]">{(c as any).dias_restantes} días</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {proximas_a_abrir.length > 0 && (
        <div className="bg-white border border-[#DDE4DF] rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#EBF5EF] border-b border-[#C8E6D2]">
            <p className="text-sm font-semibold text-[#1E6B3C]">📢 Próximas a abrir</p>
          </div>
          <div className="divide-y divide-[#F2F5F3]">
            {proximas_a_abrir.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1A2B22]">{c.titulo}</p>
                  <p className="text-xs text-[#637068]">Apertura: {formatDate(c.fecha_apertura)}</p>
                </div>
                <span className="text-xs bg-[#EBF5EF] text-[#1E6B3C] font-medium px-2 py-1 rounded-full">Próximamente</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {vencidas_pendientes_cierre.length > 0 && (
        <div className="bg-white border border-[#DDE4DF] rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#FEF2F2] border-b border-red-200">
            <p className="text-sm font-semibold text-red-600">⚠️ Vencidas pendientes de cierre</p>
          </div>
          <div className="divide-y divide-[#F2F5F3]">
            {vencidas_pendientes_cierre.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#1A2B22]">{c.titulo}</p>
                  <p className="text-xs text-[#637068]">Cerró: {formatDate(c.fecha_cierre)}</p>
                </div>
                <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-full">Vencida</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {proximas_a_cerrar.length === 0 && proximas_a_abrir.length === 0 && vencidas_pendientes_cierre.length === 0 && (
        <div className="text-center py-12 text-[#637068] bg-white rounded-xl border border-[#DDE4DF]">
          ✅ No hay alertas activas en este momento.
        </div>
      )}
    </div>
  );
}

// ─── Tab: Externas (RF-CON-04) ────────────────────────────────────────────────
function ExternasTab() {
  const [externas, setExternas] = useState<ConvocatoriaExterna[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const cargar = useCallback(() => {
    setLoading(true);
    getConvocatoriasExternas()
      .then(setExternas)
      .catch((e) => console.error("Error externas:", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";

  const filtradas = externas.filter((e) => {
    const cod = (e.codigo || e.codigo_ext || `EXT${e.id}`).toLowerCase();
    return (
      !search ||
      e.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (e.entidad_externa ?? "").toLowerCase().includes(search.toLowerCase()) ||
      cod.includes(search.toLowerCase()) ||
      (e.tipo_investigacion ?? "").toLowerCase().includes(search.toLowerCase())
    );
  });

  const vigenciaBadge = (e: ConvocatoriaExterna) => {
    if (e.estado_vigencia === "vigente") return <span className="text-xs font-bold text-white bg-[#1E6B3C] px-2 py-1 rounded-full">Vigente</span>;
    if (e.estado_vigencia === "cerrada") return <span className="text-xs font-bold text-[#637068] bg-[#F2F5F3] px-2 py-1 rounded-full">Cerrada</span>;
    return <span className="text-xs font-bold text-[#D97706] bg-[#FFF8E6] px-2 py-1 rounded-full">Sin fecha</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9BAD9F] text-sm">🔍</span>
          <input
            type="text"
            placeholder="Buscar por título, código o entidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-[#DDE4DF] rounded-xl bg-[#FAFFFE] focus:outline-none focus:border-[#1E6B3C] transition-colors"
          />
        </div>
        <Button variant="primary" onClick={() => setShowModal(true)}>+ Agregar Externa</Button>
      </div>

      {loading && <div className="text-center py-12 text-[#637068]">Cargando convocatorias externas...</div>}
      {!loading && filtradas.length === 0 && (
        <div className="text-center py-12 text-[#637068] bg-[#FAFFFE] rounded-xl border border-[#DDE4DF]">
          {externas.length === 0
            ? "No hay convocatorias externas registradas aún."
            : "No se encontraron resultados."}
        </div>
      )}
      {filtradas.map((e) => (
        <Card key={e.id} className="hover:shadow-md transition-shadow">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-mono font-bold text-[#1E6B3C] bg-[#EBF5EF] px-2.5 py-0.5 rounded-md border border-[#C8E6D2]">
                  {e.codigo || e.codigo_ext || `EXT${e.id}`}
                </span>
                {e.tipo_investigacion && (
                  <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-medium border border-purple-200">
                    🔬 {e.tipo_investigacion}
                  </span>
                )}
                {vigenciaBadge(e)}
                {e.entidad_externa && (
                  <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium border border-blue-200">
                    🏛️ {e.entidad_externa}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-[#1A2B22] mb-1">{e.titulo}</h3>
              {e.descripcion && <p className="text-xs text-[#637068] mb-2 line-clamp-2">{e.descripcion}</p>}
              <div className="flex flex-wrap gap-4 text-xs text-[#637068]">
                {e.fecha_apertura && <span>📅 Apertura: <strong className="text-[#1A2B22]">{formatDate(e.fecha_apertura)}</strong></span>}
                {e.fecha_cierre && <span>🔒 Cierre: <strong className="text-[#1A2B22]">{formatDate(e.fecha_cierre)}</strong></span>}
                {e.dias_restantes != null && e.dias_restantes > 0 && (
                  <span>⏱️ <strong className="text-[#D97706]">{e.dias_restantes} días restantes</strong></span>
                )}
              </div>
            </div>
          </div>
        </Card>
      ))}

      <ExternaModal open={showModal} onClose={() => setShowModal(false)} onCreated={cargar} />
    </div>
  );
}

// ─── Convocatorias Page ───────────────────────────────────────────────────────
type Tab = "internas" | "externas" | "alertas";
export function Convocatorias() {
  const [activeTab, setActiveTab] = useState<Tab>("internas");
  const [showWizard, setShowWizard] = useState(false);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Convocatoria | null>(null);
  const [editingConv, setEditingConv] = useState<Convocatoria | null>(null);
  const [inscribiendoConv, setInscribiendoConv] = useState<Convocatoria | null>(null);

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");
  const [filterTipo, setFilterTipo] = useState("todos");

  const cargar = useCallback(() => {
    setLoading(true);
    getConvocatorias()
      .then(setConvocatorias)
      .catch((e) => console.error("Error cargando convocatorias:", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const filtradas = convocatorias.filter((c) => {
    const matchSearch = !search || c.titulo.toLowerCase().includes(search.toLowerCase());
    const matchEstado = filterEstado === "todos" || c.estado === filterEstado;
    const matchTipo = filterTipo === "todos" || (c.tipo ?? "").toLowerCase() === filterTipo.toLowerCase();
    return matchSearch && matchEstado && matchTipo;
  });

  const estadoBadge = (estado: string): "active" | "evaluation" | "closed" | "draft" => {
    if (estado === "activa" || estado === "publicada") return "active";
    if (estado === "evaluacion") return "evaluation";
    if (estado === "cerrada") return "closed";
    return "draft";
  };

  const formatDate = (d: string | null | undefined) =>
    d ? new Date(d).toLocaleDateString("es-CO", { day: "2-digit", month: "short", year: "numeric" }) : "—";

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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Abiertas", value: convocatorias.filter(c => c.estado === "activa" || c.estado === "publicada").length, color: "#1E6B3C" },
          { label: "En evaluación", value: convocatorias.filter(c => c.estado === "evaluacion").length, color: "#D97706" },
          { label: "Cerradas", value: convocatorias.filter(c => c.estado === "cerrada").length, color: "#9CA3AF" },
          { label: "Total", value: convocatorias.length, color: "#2563EB" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-[#DDE4DF] rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: s.color + "15", color: s.color }}>
              {s.value}
            </div>
            <p className="text-sm text-[#637068] font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white border border-[#DDE4DF] rounded-xl overflow-hidden">
        <div className="flex border-b border-[#DDE4DF]">
          {([
            { id: "internas" as Tab, label: "Internas", icon: "🏫" },
            { id: "externas" as Tab, label: "Banco Externas", icon: "🌐" },
            { id: "alertas" as Tab, label: "Alertas", icon: "🔔" },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px ${activeTab === tab.id
                  ? "border-[#1E6B3C] text-[#1E6B3C] bg-[#EBF5EF]"
                  : "border-transparent text-[#637068] hover:text-[#1A2B22] hover:bg-[#F2F5F3]"
                }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
              {tab.id === "alertas" && (
                <span className="ml-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-bold">!</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-4">
          {activeTab === "externas" && <ExternasTab />}
          {activeTab === "alertas" && <AlertasTab />}
          {activeTab === "internas" && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9BAD9F] text-sm">🔍</span>
                  <input
                    type="text"
                    placeholder="Buscar convocatoria por nombre o código CON..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-[#DDE4DF] rounded-xl bg-[#FAFFFE] focus:outline-none focus:border-[#1E6B3C] transition-colors"
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {[
                    { value: "todos", label: "Todos" },
                    { value: "activa", label: "🟢 Activa" },
                    { value: "evaluacion", label: "🟡 Evaluación" },
                    { value: "cerrada", label: "⚫ Cerrada" },
                    { value: "borrador", label: "⚪ Borrador" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilterEstado(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterEstado === opt.value
                          ? "bg-[#1E6B3C] text-white"
                          : "bg-[#F2F5F3] text-[#637068] hover:bg-[#DDE4DF]"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-1">
                  {[
                    { value: "todos", label: "Tipo: Todos" },
                    { value: "interna", label: "Interna" },
                    { value: "externa", label: "Externa" },
                    { value: "conjunta", label: "Conjunta" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setFilterTipo(opt.value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filterTipo === opt.value
                          ? "bg-[#2563EB] text-white"
                          : "bg-[#F2F5F3] text-[#637068] hover:bg-[#DDE4DF]"
                        }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                {(search || filterEstado !== "todos" || filterTipo !== "todos") && (
                  <button
                    onClick={() => { setSearch(""); setFilterEstado("todos"); setFilterTipo("todos"); }}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    ✕ Limpiar filtros
                  </button>
                )}
              </div>

              {loading && (
                <div className="text-center py-12 text-[#637068]">Cargando convocatorias...</div>
              )}
              {!loading && filtradas.length === 0 && (
                <div className="text-center py-12 text-[#637068] bg-[#FAFFFE] rounded-xl border border-[#DDE4DF]">
                  {convocatorias.length === 0
                    ? "No hay convocatorias registradas aún."
                    : "No hay convocatorias que coincidan con los filtros aplicados."}
                </div>
              )}
              {filtradas.map((c) => (
                <Card key={c.id} className="hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-xs font-mono font-bold text-[#1E6B3C] bg-[#EBF5EF] px-2.5 py-0.5 rounded-md border border-[#C8E6D2]">
                          {c.codigo_con || c.codigo || `CON${c.id}`}
                        </span>
                        <Badge variant={estadoBadge(c.estado)} />
                        {c.tipo && (
                          <span className="text-xs bg-[#EBF5EF] text-[#1E6B3C] px-2.5 py-0.5 rounded-full font-medium">
                            {c.tipo}
                          </span>
                        )}
                        {c.tipo_investigacion && (
                          <span className="text-xs bg-purple-50 text-purple-700 px-2.5 py-0.5 rounded-full font-medium border border-purple-200">
                            🔬 {c.tipo_investigacion}
                          </span>
                        )}
                        {c.dirigida_a && (
                          <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full font-medium border border-blue-200">
                            🎯 {c.dirigida_a}
                          </span>
                        )}
                        {!c.aprobada_comite && (
                          <span className="text-xs bg-[#FFF8E6] text-[#D97706] px-2 py-0.5 rounded-full font-medium border border-[#FFE5A0]">
                            ⏳ Pendiente comité
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-[#1A2B22] mb-1">{c.titulo}</h3>
                      {c.descripcion && (
                        <p className="text-xs text-[#637068] mb-2 line-clamp-2 max-w-2xl">{c.descripcion}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-[#637068]">
                        <span>📅 Apertura: <strong className="text-[#1A2B22]">{formatDate(c.fecha_apertura)}</strong></span>
                        <span>🔒 Cierre: <strong className="text-[#1A2B22]">{formatDate(c.fecha_cierre)}</strong></span>
                        {c.creado_por_nombre && (
                          <span>👤 Creado por: <strong className="text-[#1A2B22]">{c.creado_por_nombre}</strong></span>
                        )}
                        <span>✅ Aprobada: <strong className="text-[#1A2B22]">{c.aprobada_comite ? "Sí" : "No"}</strong></span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingConv(c)}
                        >
                          ✏️ Editar
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setInscribiendoConv(c)}
                        >
                          📝 Inscribirse
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setSelected(c)}
                        >
                          Ver detalles
                        </Button>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <WizardModal open={showWizard} onClose={() => setShowWizard(false)} onCreated={cargar} />
      <DetailModal
        conv={selected}
        onClose={() => setSelected(null)}
        onInscribirse={(c) => {
          setSelected(null);
          setInscribiendoConv(c);
        }}
      />
      <InscripcionModal
        conv={inscribiendoConv}
        onClose={() => setInscribiendoConv(null)}
        onInscrito={cargar}
      />
      <EditModal
        conv={editingConv}
        onClose={() => setEditingConv(null)}
        onUpdated={cargar}
      />
    </div>
  );
}