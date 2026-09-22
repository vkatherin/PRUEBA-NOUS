import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Badge, Button, Card, PageHeader, Modal, Field, Input, Textarea, Select, SectionTitle } from "@/components/ui";
import {
  authApi,
  getConvocatorias,
  crearConvocatoria,
  actualizarConvocatoria,
  publicarConvocatoria,
  eliminarConvocatoria,
  getConvocatoriasExternas,
  crearConvocatoriaExterna,
  eliminarConvocatoriaExterna,
  getConvocatoriasAlertas,
  inscribirseConvocatoria,
  getInscripcionesConvocatoria,
  getSemilleroExterno,
  guardarSemilleroExterno,
  getCatalogosSemillero,
  getIntegrantesSemillero,
  addIntegranteSemillero,
  deleteIntegranteSemillero,
  subirAsentimientoIntegrante,
  subirPlantillaAsentimiento,
  getInfoPlantillaAsentimiento,
  saveInfoGeneralSemillero,
  getInfoGeneralSemillero,
  saveContenidoSemillero,
  getContenidoSemillero,
  getResumenSemillero,
  enviarInscripcionExterna,
  guardarBorradorSemillero,
  getBorradorSemillero,
  getMisBorradores,
  getUsuarioActual,
  TIPOS_INVESTIGACION,
  MAPA_TIPO_INVESTIGACION,
  type Convocatoria,
  type UsuarioMe,
  type ConvocatoriaExterna,
  type AlertasConvocatorias,
  type Inscripcion,
  type SemilleroExterno,
  type IntegranteSemillero,
  type InfoGeneralSemillero,
  type ContenidoSemillero,
  type CatalogosSemillero,
  type ResumenInscripcionExterna,
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
  dirigida: string[];
  descripcion: string;
  fecha_apertura: string;
  fecha_cierre: string;
  fecha_resultados: string;
  requisitos: string[];
  notificar_investigadores: boolean;
}

const EMPTY_WIZARD: WizardData = {
  titulo: "", tipo: "", tipo_investigacion: "", dirigida: [], descripcion: "",
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

  const toggleDirigida = (opcion: string) => {
    const exists = data.dirigida.includes(opcion);
    let updated: string[];
    if (exists) {
      updated = data.dirigida.filter((item) => item !== opcion);
    } else {
      updated = [...data.dirigida, opcion];
    }
    set("dirigida", updated);
    if (updated.length > 0 && fieldErrors.dirigida) {
      setFieldErrors((prev) => {
        const next = { ...prev };
        delete next.dirigida;
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
    if (!data.dirigida || data.dirigida.length === 0) {
      errs.dirigida = "Selecciona a quién va dirigida la convocatoria (Docente, Estudiante, Administrativo).";
    } else if (data.dirigida.some((v) => !OPCIONES_DIRIGIDA_A.some((o) => o.value === v))) {
      errs.dirigida = "Selecciona opciones válidas (Docente, Estudiante, Administrativo).";
    }
    if (!data.descripcion || !data.descripcion.trim()) {
      errs.descripcion = "Ingresa una descripción.";
    }

    setFieldErrors(errs);
    if (Object.keys(errs).length > 0) {
      setGeneralError("Completa todos los campos obligatorios antes de continuar.");
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
        dirigida_a: data.dirigida.join(", "),
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
                    ? "bg-theme-primary text-white"
                    : s.id === step
                      ? "bg-theme-primary text-white ring-4 ring-[#EBF5EF]"
                      : "bg-theme-bg-main text-theme-text-muted"
                  }`}
              >
                {s.id < step ? "✓" : s.id}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${s.id === step ? "text-theme-primary" : s.id < step ? "text-theme-text-main" : "text-theme-text-muted"
                  }`}
              >
                {s.label}
              </span>
            </div>
            {i < WIZARD_STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${s.id < step ? "bg-theme-primary" : "bg-[#DDE4DF]"}`} />
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
                  ? "Estructura externa: EXTE + AÑO + NNN"
                  : "Identificador único generado automáticamente"
              }
            >
              <Input
                value={
                  data.tipo === "Externa"
                    ? `EXTE${new Date().getFullYear()}XXX (generado automáticamente)`
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

          <Field label="Nombre de la Convocatoria" required error={fieldErrors.titulo}>
            <Input
              placeholder="Ej: Fondo de Investigación Institucional 2025-II"
              value={data.titulo}
              hasError={!!fieldErrors.titulo}
              onChange={(v) => set("titulo", v)}
            />
          </Field>

          <Field
            label="Dirigida a"
            required
            error={fieldErrors.dirigida}
            hint="Selecciona las opciones a las que va dirigida (Docente, Estudiante, Administrativo)"
          >
            <div className="flex flex-wrap gap-2 pt-1">
              {OPCIONES_DIRIGIDA_A.map((opcion) => {
                const isSelected = data.dirigida.includes(opcion.value);
                return (
                  <button
                    key={opcion.value}
                    type="button"
                    onClick={() => toggleDirigida(opcion.value)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${
                      isSelected
                        ? "bg-theme-primary text-white border-theme-primary shadow-sm"
                        : "bg-theme-bg-card text-theme-text-main border-theme-border hover:border-theme-primary hover:bg-theme-bg-main"
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center text-xs ${
                        isSelected ? "bg-theme-bg-card text-theme-primary font-bold" : "border border-[#9BAD9F]"
                      }`}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                    {opcion.label}
                  </button>
                );
              })}
            </div>
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
          <div className="p-4 rounded-xl bg-theme-primary/10 border border-[#C8E6D2]">
            <p className="text-sm font-medium text-theme-primary mb-1">Cronograma oficial</p>
            <p className="text-xs text-theme-text-muted">
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
              <label key={req} className="flex items-center gap-3 p-3 rounded-xl border border-theme-border bg-theme-bg-main cursor-pointer hover:bg-theme-bg-main transition-colors">
                <input
                  type="checkbox"
                  checked={data.requisitos.includes(req)}
                  onChange={() => toggleRequisito(req)}
                  className="accent-[var(--theme-primary)] w-4 h-4 cursor-pointer"
                />
                <span className="text-sm text-theme-text-main">{req}</span>
                <span className="ml-auto text-xs text-theme-text-muted bg-theme-bg-main px-2 py-1 rounded-lg">Obligatorio</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {step === 4 && (
        <div className="space-y-4">
          <SectionTitle>Publicación y Difusión</SectionTitle>
          <div className="p-5 rounded-xl bg-theme-accent/10 border border-[#FFE5A0]">
            <div className="flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="text-sm font-semibold text-[#D4930B] mb-1">Revisión antes de publicar</p>
                <p className="text-xs text-theme-text-muted">
                  Verifica que todos los datos sean correctos. La convocatoria se registrará en el sistema.
                </p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-sm font-medium text-theme-text-main">Resumen de la convocatoria</p>
            {[
              { label: "ID",                 value: "CON (Se asignará automáticamente al guardar)" },
              { label: "Nombre",             value: data.titulo || "—" },
              { label: "Tipo",               value: data.tipo || "—" },
              { label: "Dirigida a",         value: Array.isArray(data.dirigida) ? (data.dirigida.length > 0 ? data.dirigida.join(", ") : "—") : (data.dirigida || "—") },
              { label: "Fecha de apertura",  value: data.fecha_apertura || "—" },
              { label: "Fecha de cierre",    value: data.fecha_cierre || "—" },
              { label: "Descripción",        value: data.descripcion ? (data.descripcion.length > 70 ? data.descripcion.slice(0, 70) + "..." : data.descripcion) : "—" },
              { label: "Requisitos",         value: `${data.requisitos.length} documentos obligatorios` },
            ].map((item) => (
              <div key={item.label} className="flex justify-between py-2 border-b border-theme-border">
                <span className="text-xs text-theme-text-muted font-medium">{item.label}</span>
                <span className="text-xs font-semibold text-theme-text-main text-right max-w-[60%] truncate">{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-theme-primary/10">
            <input
              type="checkbox"
              className="accent-[var(--theme-primary)] w-4 h-4 cursor-pointer"
              checked={data.notificar_investigadores}
              onChange={(e) => set("notificar_investigadores", e.target.checked)}
            />
            <span className="text-xs text-theme-text-muted">
              Notificar automáticamente por correo a todos los investigadores activos
            </span>
          </div>
        </div>
      )}

      <div className="flex justify-between mt-6 pt-4 border-t border-theme-border">
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
    dirigida_a: [] as string[],
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
        dirigida_a: conv.dirigida_a
          ? conv.dirigida_a.split(",").map((s) => s.trim()).filter(Boolean)
          : ["Docente"],
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

  const toggleDirigidaEdit = (opcion: string) => {
    setFormData((prev) => {
      const exists = prev.dirigida_a.includes(opcion);
      let updated: string[];
      if (exists) {
        updated = prev.dirigida_a.filter((item) => item !== opcion);
      } else {
        updated = [...prev.dirigida_a, opcion];
      }
      if (updated.length > 0 && fieldErrors.dirigida_a) {
        setFieldErrors((e) => {
          const next = { ...e };
          delete next.dirigida_a;
          return next;
        });
      }
      return { ...prev, dirigida_a: updated };
    });
  };

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
    if (formData.dirigida_a.length === 0) {
      errs.dirigida_a = "Selecciona a quién va dirigida la convocatoria (Docente, Estudiante, Administrativo).";
    } else if (formData.dirigida_a.some((v) => !OPCIONES_DIRIGIDA_A.some((o) => o.value === v))) {
      errs.dirigida_a = "Selecciona opciones válidas (Docente, Estudiante, Administrativo).";
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
        dirigida_a: formData.dirigida_a.join(", "),
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

        <Field
          label="Dirigida a"
          required
          error={fieldErrors.dirigida_a}
          hint="Selecciona las opciones a las que va dirigida (Docente, Estudiante, Administrativo)"
        >
          <div className="flex flex-wrap gap-2 pt-1">
            {OPCIONES_DIRIGIDA_A.map((opcion) => {
              const isSelected = formData.dirigida_a.includes(opcion.value);
              return (
                <button
                  key={opcion.value}
                  type="button"
                  onClick={() => toggleDirigidaEdit(opcion.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all flex items-center gap-2 border ${
                    isSelected
                      ? "bg-theme-primary text-white border-theme-primary shadow-sm"
                      : "bg-theme-bg-card text-theme-text-main border-theme-border hover:border-theme-primary hover:bg-theme-bg-main"
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded flex items-center justify-center text-xs ${
                      isSelected ? "bg-theme-bg-card text-theme-primary font-bold" : "border border-[#9BAD9F]"
                    }`}
                  >
                    {isSelected ? "✓" : ""}
                  </span>
                  {opcion.label}
                </button>
              );
            })}
          </div>
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
          <p className="text-sm font-medium text-theme-text-main mb-2">Requisitos requeridos *</p>
          {fieldErrors.requisitos && (
            <p className="text-xs text-red-600 font-medium flex items-center gap-1 mb-2">
              <span>⚠</span> {fieldErrors.requisitos}
            </p>
          )}
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {REQUISITOS_DEFAULT.map((req) => (
              <label key={req} className="flex items-center gap-3 p-2.5 rounded-lg border border-theme-border bg-theme-bg-main cursor-pointer hover:bg-theme-bg-main text-sm">
                <input
                  type="checkbox"
                  checked={formData.requisitos.includes(req)}
                  onChange={() => toggleRequisito(req)}
                  className="accent-[var(--theme-primary)] w-4 h-4 cursor-pointer"
                />
                <span className="text-xs text-theme-text-main">{req}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-theme-border">
        <Button variant="ghost" onClick={onClose} disabled={saving}>Cancelar</Button>
        <Button variant="primary" onClick={handleGuardar} disabled={saving}>
          {saving ? "Guardando..." : "💾 Guardar Cambios"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Modal Detalle Completo de Inscripción ─────────────────────────────────────
function DetalleInscripcionModal({
  inscripcion,
  convocatoria,
  onClose,
}: {
  inscripcion: Inscripcion | null;
  convocatoria?: Convocatoria | null;
  onClose: () => void;
}) {
  if (!inscripcion) return null;

  const formatDate = (d: string | null | undefined) =>
    d
      ? new Date(d).toLocaleDateString("es-CO", {
          day: "2-digit",
          month: "long",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "—";

  const sem = inscripcion.semillero;
  const integrantes = inscripcion.integrantes || [];
  const info = inscripcion.info_general;
  const cont = inscripcion.contenido;
  const docs = inscripcion.documentos_adjuntos || [];

  return (
    <Modal
      open={!!inscripcion}
      onClose={onClose}
      title={`📋 Detalle de Postulación — ${inscripcion.usuario_nombre || `Usuario #${inscripcion.usuario_id}`}`}
      size="xl"
    >
      <div className="space-y-5 max-h-[75vh] overflow-y-auto pr-1">
        {/* Cabecera del postulante */}
        <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50/20 border border-[#C8E6D2] flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-theme-primary/10 text-theme-primary flex items-center justify-center text-2xl font-bold border border-[#A7D7B5]">
              👤
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-theme-text-main">
                  {inscripcion.usuario_nombre || `Usuario #${inscripcion.usuario_id}`}
                </h3>
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold border border-emerald-300">
                  ✓ {inscripcion.estado || "Registrada"}
                </span>
              </div>
              <p className="text-xs text-theme-text-muted mt-0.5">
                📧 {inscripcion.usuario_correo || "Sin correo"} {inscripcion.usuario_cedula ? `· CC: ${inscripcion.usuario_cedula}` : ""}
              </p>
              <p className="text-[11px] text-theme-text-muted">
                📅 Fecha de inscripción: <strong>{formatDate(inscripcion.fecha_inscripcion)}</strong>
              </p>
            </div>
          </div>
          {convocatoria && (
            <div className="text-right text-xs bg-white/80 p-2.5 rounded-lg border border-[#D5E8DC] shrink-0">
              <span className="text-theme-text-muted block text-[10px] uppercase font-bold tracking-wider">
                Convocatoria
              </span>
              <strong className="text-theme-primary font-bold">{convocatoria.codigo_con || convocatoria.codigo || `CON${convocatoria.id}`}</strong>
              <p className="text-[11px] text-theme-text-main truncate max-w-[200px]">{convocatoria.titulo}</p>
            </div>
          )}
        </div>

        {/* ── PASO 1: INFORMACIÓN DEL SEMILLERO E INSTITUCIÓN ── */}
        <div className="p-4 rounded-xl border border-theme-border bg-theme-bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <h4 className="text-xs font-bold text-theme-primary uppercase tracking-wider flex items-center gap-1.5">
              <span>🏛️</span> Paso 1 — Datos de la Institución y Semillero
            </h4>
            <span className="text-[11px] px-2 py-0.5 rounded bg-theme-bg-main border border-theme-border text-theme-text-muted">
              {sem?.procedencia || "Semillero externo"}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-2.5 rounded-lg bg-theme-bg-main border border-theme-border">
              <span className="text-theme-text-muted block text-[11px]">Nombre del Semillero:</span>
              <strong className="text-theme-text-main text-sm">{sem?.semillero_nombre || "—"}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-theme-bg-main border border-theme-border">
              <span className="text-theme-text-muted block text-[11px]">Institución de Procedencia:</span>
              <strong className="text-theme-text-main text-sm">{sem?.institucion_procedencia || "—"}</strong>
            </div>
            <div className="p-2.5 rounded-lg bg-theme-bg-main border border-theme-border">
              <span className="text-theme-text-muted block text-[11px]">Tipo de Institución:</span>
              <span className="text-theme-text-main font-semibold">{sem?.tipo_institucion || "—"}</span>
            </div>
            <div className="p-2.5 rounded-lg bg-theme-bg-main border border-theme-border">
              <span className="text-theme-text-muted block text-[11px]">Tipo de Investigación:</span>
              <span className="text-theme-primary font-semibold">🔬 {inscripcion.tipo_investigacion || "Investigación formativa"}</span>
            </div>
          </div>
        </div>

        {/* ── PASO 2: INTEGRANTES DEL SEMILLERO ── */}
        <div className="p-4 rounded-xl border border-theme-border bg-theme-bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <h4 className="text-xs font-bold text-theme-primary uppercase tracking-wider flex items-center gap-1.5">
              <span>👥</span> Paso 2 — Integrantes del Semillero ({integrantes.length})
            </h4>
          </div>

          {integrantes.length === 0 ? (
            <div className="p-3 text-center text-xs text-theme-text-muted bg-theme-bg-main rounded-lg border border-theme-border">
              Postulante individual: <strong>{inscripcion.usuario_nombre}</strong> ({inscripcion.usuario_correo})
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {integrantes.map((intg, idx) => (
                <div
                  key={intg.id || idx}
                  className="p-3 rounded-lg bg-theme-bg-main border border-theme-border space-y-1.5 text-xs hover:border-[#A7D7B5] transition-colors"
                >
                  <div className="flex items-start justify-between gap-1">
                    <strong className="text-theme-text-main text-xs">{intg.nombre_completo}</strong>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20 shrink-0">
                      {intg.rol}
                    </span>
                  </div>
                  <div className="text-[11px] text-theme-text-muted space-y-0.5">
                    <div>
                      <span>📄 Documento: </span>
                      <strong className="text-theme-text-main">{intg.tipo_documento} {intg.numero_documento}</strong>
                    </div>
                    <div>
                      <span>✉️ Email: </span>
                      <a href={`mailto:${intg.email}`} className="text-theme-primary hover:underline">{intg.email}</a>
                    </div>
                    <div className="pt-1.5 flex items-center justify-between border-t border-theme-border/60">
                      <span className="text-[11px] text-theme-text-muted">¿Mayor de edad?</span>
                      {intg.es_mayor_edad !== false ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✓ Sí (Mayor de edad)
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                          ⚠️ Menor de edad
                        </span>
                      )}
                    </div>
                    {intg.es_mayor_edad === false && (
                      <div className="p-2 rounded-lg bg-rose-50/60 border border-rose-200 text-[11px] flex items-center justify-between gap-1">
                        <span className="truncate text-rose-800 font-medium">
                          📄 {intg.asentimiento_nombre ? `Asentimiento: ${intg.asentimiento_nombre}` : "Asentimiento pendiente"}
                        </span>
                        {intg.asentimiento_ruta && (
                          <a
                            href={intg.asentimiento_ruta}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-0.5 rounded bg-white text-theme-primary font-bold border border-[#A7D7B5] hover:bg-emerald-50 shrink-0"
                          >
                            Ver
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ── PASO 3: INFORMACIÓN GENERAL DEL TRABAJO ── */}
        <div className="p-4 rounded-xl border border-theme-border bg-theme-bg-card space-y-3">
          <div className="border-b border-theme-border pb-2">
            <h4 className="text-xs font-bold text-theme-primary uppercase tracking-wider flex items-center gap-1.5">
              <span>📋</span> Paso 3 — Información General de la Propuesta
            </h4>
          </div>

          <div className="space-y-2.5 text-xs">
            <div>
              <span className="text-theme-text-muted block text-[11px] mb-0.5 font-semibold">Título del Trabajo:</span>
              <div className="p-3 rounded-lg bg-theme-bg-main border border-theme-border text-sm font-bold text-theme-text-main leading-snug">
                {info?.titulo_trabajo || inscripcion.resumen_proyecto || "—"}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-2.5 rounded-lg bg-theme-bg-main border border-theme-border">
                <span className="text-theme-text-muted block text-[11px] font-semibold">Línea de Investigación:</span>
                <span className="text-theme-primary font-semibold">{info?.linea_investigacion || "—"}</span>
              </div>
              <div className="p-2.5 rounded-lg bg-theme-bg-main border border-theme-border">
                <span className="text-theme-text-muted block text-[11px] font-semibold">Palabras Clave:</span>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(info?.palabras_clave || "—").split(/[,;]+/).map((tag, tIdx) => (
                    <span key={tIdx} className="px-2 py-0.5 rounded bg-theme-bg-card border border-theme-border text-[11px] text-theme-text-main">
                      #{tag.trim()}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <span className="text-theme-text-muted block text-[11px] mb-0.5 font-semibold">Resumen de la Propuesta:</span>
              <div className="p-3 rounded-lg bg-theme-bg-main border border-theme-border text-xs text-[#374151] leading-relaxed whitespace-pre-wrap">
                {info?.resumen || inscripcion.resumen_proyecto || "—"}
              </div>
            </div>
          </div>
        </div>

        {/* ── PASO 4: CONTENIDO DEL TRABAJO ── */}
        <div className="p-4 rounded-xl border border-theme-border bg-theme-bg-card space-y-3">
          <div className="border-b border-theme-border pb-2">
            <h4 className="text-xs font-bold text-theme-primary uppercase tracking-wider flex items-center gap-1.5">
              <span>🔬</span> Paso 4 — Contenido Detallado del Trabajo
            </h4>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <span className="text-theme-text-muted block text-[11px] mb-0.5 font-semibold">1. Planteamiento del Problema:</span>
              <div className="p-3 rounded-lg bg-theme-bg-main border border-theme-border text-xs text-[#374151] leading-relaxed whitespace-pre-wrap">
                {cont?.planteamiento_problema || inscripcion.justificacion || "—"}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <span className="text-theme-text-muted block text-[11px] mb-0.5 font-semibold">2. Objetivo General:</span>
                <div className="p-3 rounded-lg bg-theme-bg-main border border-theme-border text-xs text-[#374151] leading-relaxed whitespace-pre-wrap">
                  {cont?.objetivo_general || "—"}
                </div>
              </div>
              <div>
                <span className="text-theme-text-muted block text-[11px] mb-0.5 font-semibold">3. Objetivos Específicos:</span>
                <div className="p-3 rounded-lg bg-theme-bg-main border border-theme-border text-xs text-[#374151] leading-relaxed whitespace-pre-wrap">
                  {cont?.objetivos_especificos || "—"}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <span className="text-theme-text-muted block text-[11px] mb-0.5 font-semibold">4. Metodología:</span>
                <div className="p-3 rounded-lg bg-theme-bg-main border border-theme-border text-xs text-[#374151] leading-relaxed whitespace-pre-wrap">
                  {cont?.metodologia || "—"}
                </div>
              </div>
              <div>
                <span className="text-theme-text-muted block text-[11px] mb-0.5 font-semibold">5. Resultados Esperados:</span>
                <div className="p-3 rounded-lg bg-theme-bg-main border border-theme-border text-xs text-[#374151] leading-relaxed whitespace-pre-wrap">
                  {cont?.resultados_esperados || "—"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── PASO 5: DOCUMENTOS ADJUNTOS Y COMPROBANTES ── */}
        <div className="p-4 rounded-xl border border-theme-border bg-theme-bg-card space-y-3">
          <div className="flex items-center justify-between border-b border-theme-border pb-2">
            <h4 className="text-xs font-bold text-theme-primary uppercase tracking-wider flex items-center gap-1.5">
              <span>📁</span> Paso 5 — Documentación y Comprobantes Adjuntos
            </h4>
            <span className="text-[11px] font-semibold text-theme-text-muted">
              {docs.length > 0 ? `${docs.length} archivo(s)` : inscripcion.documento_nombre_original ? "1 archivo" : "Sin archivos"}
            </span>
          </div>

          {docs.length > 0 ? (
            <div className="space-y-2">
              {docs.map((doc, dIdx) => {
                const isComprobante = doc.requisito_nombre.toLowerCase().includes("comprobante");
                return (
                  <div
                    key={doc.id || dIdx}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                      isComprobante
                        ? "bg-[#F4F9F6] border-[#BBDDC7]"
                        : "bg-theme-bg-main border-theme-border"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate max-w-[340px] sm:max-w-md">
                      <span className="text-xl shrink-0">{isComprobante ? "💳" : "📄"}</span>
                      <div className="truncate text-xs">
                        <div className="flex items-center gap-1.5">
                          <strong className="text-theme-text-main font-bold truncate">
                            {doc.requisito_nombre}
                          </strong>
                          {isComprobante && (
                            <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-100 text-emerald-800 shrink-0">
                              Pago Verificado
                            </span>
                          )}
                        </div>
                        <p className="text-theme-text-muted text-[11px] truncate">
                          {doc.documento_nombre_original} · {(doc.documento_peso_bytes / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <a
                        href={doc.documento_ruta}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-theme-primary bg-theme-primary/10 hover:bg-[#D9EFE1] border border-[#A7D7B5] rounded-lg transition-colors"
                        title="Ver documento en nueva pestaña"
                      >
                        <span>👁️</span> Ver
                      </a>
                      <a
                        href={doc.documento_ruta}
                        download={doc.documento_nombre_original}
                        className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-theme-primary hover:bg-[#17563A] border border-theme-primary rounded-lg transition-colors"
                        title="Descargar documento"
                      >
                        <span>⬇️</span> Descargar
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : inscripcion.documento_ruta ? (
            <div className="flex items-center justify-between p-3 rounded-xl bg-theme-bg-main border border-theme-border text-xs">
              <div className="flex items-center gap-2.5 truncate max-w-md">
                <span className="text-xl">📄</span>
                <div className="truncate">
                  <strong className="text-theme-text-main block truncate">Documento Principal / Anteproyecto</strong>
                  <span className="text-[11px] text-theme-text-muted">
                    {inscripcion.documento_nombre_original} ({(inscripcion.documento_peso_bytes / 1024).toFixed(1)} KB)
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={inscripcion.documento_ruta}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-theme-primary bg-theme-primary/10 hover:bg-[#D9EFE1] border border-[#A7D7B5] rounded-lg transition-colors"
                >
                  <span>👁️</span> Ver
                </a>
                <a
                  href={inscripcion.documento_ruta}
                  download={inscripcion.documento_nombre_original || "anteproyecto.pdf"}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-white bg-theme-primary hover:bg-[#17563A] border border-theme-primary rounded-lg transition-colors"
                >
                  <span>⬇️</span> Descargar
                </a>
              </div>
            </div>
          ) : (
            <p className="text-xs text-theme-text-muted italic">No se adjuntaron documentos en esta postulación.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end items-center mt-5 pt-3 border-t border-theme-border">
        <Button variant="primary" onClick={onClose}>
          Cerrar Detalle
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
  onEliminar,
  user,
}: {
  conv: Convocatoria | null;
  onClose: () => void;
  onInscribirse: (c: Convocatoria) => void;
  onEliminar?: (c: Convocatoria) => void;
  user?: UsuarioMe | null;
}) {
  const [inscripciones, setInscripciones] = useState<Inscripcion[]>([]);
  const [loadingInscripciones, setLoadingInscripciones] = useState(false);
  const [selectedInscripcionDetalle, setSelectedInscripcionDetalle] = useState<Inscripcion | null>(null);

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

  const isRestrictedRole = user?.roles?.some(r => {
    const lower = r.toLowerCase();
    return lower.includes("estudiante") || lower.includes("docente") || lower.includes("investigador");
  });
  const isAdmin = user?.roles?.some(r => r === "administrador" || r === "Super Administrador");
  const canDelete = isAdmin || (!isRestrictedRole && user?.permisos?.includes('convocatorias.eliminar'));
  const canViewFiles = isAdmin || !isRestrictedRole;

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
        <div className="p-4 rounded-xl bg-theme-primary/10 border border-[#C8E6D2]">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-xs font-mono font-bold text-theme-primary bg-theme-bg-card px-2 py-0.5 rounded border border-[#C8E6D2]">
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
          <h3 className="text-base font-bold text-theme-text-main">{conv.titulo}</h3>
          {conv.descripcion && <p className="text-sm text-theme-text-muted mt-1">{conv.descripcion}</p>}
        </div>
        <div className="grid grid-cols-2 gap-3">
          {rows.map((r) => (
            <div key={r.label} className="flex flex-col gap-0.5 p-3 rounded-xl border border-theme-border bg-theme-bg-main">
              <span className="text-xs text-theme-text-muted font-medium">{r.label}</span>
              <span className="text-sm font-semibold text-theme-text-main">{r.value}</span>
            </div>
          ))}
        </div>
        {conv.observaciones_comite && (
          <div className="p-4 rounded-xl bg-theme-accent/10 border border-[#FFE5A0]">
            <p className="text-xs font-semibold text-[#D4930B] mb-1">Observaciones del comité</p>
            <p className="text-sm text-theme-text-main">{conv.observaciones_comite}</p>
          </div>
        )}

        {/* Sección de Plantilla de Asentimiento Informado */}
        <div className="p-3.5 rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50/50 to-teal-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="text-xl">📄</span>
            <div>
              <p className="font-bold text-theme-text-main">Formato de Asentimiento Informado (Menores de edad)</p>
              <p className="text-theme-text-muted text-[11px]">
                {conv.plantilla_asentimiento_nombre
                  ? `Archivo oficial configurado: ${conv.plantilla_asentimiento_nombre}`
                  : "Plantilla institucional estándar (HTML / PDF)"}
              </p>
            </div>
          </div>
          <a
            href={`http://localhost:4200/api/convocatorias/plantilla-asentimiento?convocatoria_id=${conv.id}&print=1`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-bold hover:bg-emerald-50 transition-colors shadow-2xs shrink-0"
          >
            <span>📥</span> Descargar plantilla
          </a>
        </div>

        <div className="mt-4 pt-4 border-t border-theme-border space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-theme-text-main flex items-center gap-2">
              <span>📋</span> Postulaciones / Anteproyectos inscritos
              <span className="text-xs px-2 py-0.5 rounded-full bg-theme-primary/10 text-theme-primary font-semibold border border-[#C8E6D2]">
                {inscripciones.length} / 50 cupos
              </span>
            </h4>
          </div>

          {loadingInscripciones ? (
            <div className="p-4 text-center text-xs text-theme-text-muted bg-theme-bg-main rounded-xl border border-theme-border">
              Cargando inscripciones...
            </div>
          ) : inscripciones.length === 0 ? (
            <div className="p-4 text-center text-xs text-theme-text-muted bg-theme-bg-main rounded-xl border border-theme-border">
              No hay postulaciones registradas aún en esta convocatoria.
            </div>
          ) : (
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {inscripciones.map((ins) => (
                <div
                  key={ins.id}
                  className="p-3.5 rounded-xl border border-theme-border bg-theme-bg-card hover:border-[#C8E6D2] transition-colors space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-bold text-theme-text-main">
                        👤 {ins.usuario_nombre || `Usuario #${ins.usuario_id}`}
                      </p>
                      <p className="text-xs text-theme-text-muted">
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
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setSelectedInscripcionDetalle(ins)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-theme-primary bg-theme-primary/10 hover:bg-[#D9EFE1] border border-[#A7D7B5] rounded-lg transition-all shadow-sm active:scale-95"
                        title="Ver información completa de la postulación"
                      >
                        <span>👁️</span> Ver detalle
                      </button>
                      <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                        ✓ {ins.estado || "Registrada"}
                      </span>
                    </div>
                  </div>

                  <div className="text-xs space-y-1 bg-theme-bg-main p-2.5 rounded-lg border border-[#E8EEEA]">
                    {ins.tipo_investigacion && (
                      <div>
                        <strong className="text-theme-text-main">Tipo de investigación: </strong>
                        <span className="text-theme-primary font-semibold">🔬 {ins.tipo_investigacion}</span>
                      </div>
                    )}
                    <div>
                      <strong className="text-theme-text-main">Resumen: </strong>
                      <span className="text-[#4B5563]">{ins.resumen_proyecto}</span>
                    </div>
                    <div>
                      <strong className="text-theme-text-main">Justificación: </strong>
                      <span className="text-[#4B5563]">{ins.justificacion}</span>
                    </div>
                  </div>

                  {ins.documentos_adjuntos && ins.documentos_adjuntos.length > 0 ? (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-[11px] font-bold text-theme-text-main uppercase tracking-wider">
                        Documentos adjuntos ({ins.documentos_adjuntos.length})
                      </p>
                      <div className="space-y-1.5">
                        {ins.documentos_adjuntos.map((doc, dIdx) => (
                          <div
                            key={doc.id || dIdx}
                            className="flex items-center justify-between p-2 rounded-lg bg-[#F7FAF8] border border-[#E1EAE4] text-xs"
                          >
                            <div className="flex flex-col truncate max-w-[260px]">
                              <span className="font-semibold text-theme-text-main text-[11px] truncate">
                                📋 {doc.requisito_nombre}
                              </span>
                              <span className="text-[11px] text-theme-text-muted truncate">
                                {doc.documento_nombre_original} ({(doc.documento_peso_bytes / 1024).toFixed(1)} KB)
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {canViewFiles && (
                                <>
                                  <a
                                    href={doc.documento_ruta}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-theme-primary bg-theme-primary/10 hover:bg-[#D9EFE1] border border-[#A7D7B5] rounded-md transition-colors"
                                    title="Ver documento PDF"
                                  >
                                    <span>📄</span> Ver
                                  </a>
                                  <a
                                    href={doc.documento_ruta}
                                    download={doc.documento_nombre_original}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-white bg-theme-primary hover:bg-[#17563A] border border-theme-primary rounded-md transition-colors"
                                    title="Descargar documento PDF"
                                  >
                                    <span>⬇️</span> Descargar
                                  </a>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-theme-text-muted truncate max-w-[200px]">
                        📎 {ins.documento_nombre_original} ({(ins.documento_peso_bytes / 1024).toFixed(1)} KB)
                      </span>
                      <div className="flex items-center gap-2">
                        {canViewFiles && (
                          <>
                            <a
                              href={ins.documento_ruta}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-theme-primary bg-theme-primary/10 hover:bg-[#D9EFE1] border border-[#A7D7B5] rounded-lg transition-colors"
                              title="Ver anteproyecto en nueva pestaña"
                            >
                              <span>📄</span> Ver
                            </a>
                            <a
                              href={ins.documento_ruta}
                              download={ins.documento_nombre_original || "anteproyecto.pdf"}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-theme-primary hover:bg-[#17563A] border border-theme-primary rounded-lg transition-colors"
                              title="Descargar anteproyecto PDF"
                            >
                              <span>⬇️</span> Descargar
                            </a>
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="flex justify-between items-center mt-6 pt-4 border-t border-theme-border">
        <div className="flex items-center gap-2">
          <Button variant="ghost" onClick={onClose}>Cerrar</Button>
          {onEliminar && canDelete && (
            <Button
              variant="outline"
              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
              onClick={() => {
                onClose();
                onEliminar(conv);
              }}
            >
              🗑️ Eliminar
            </Button>
          )}
        </div>
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

      {/* Modal de Detalle Completo de Inscripción */}
      <DetalleInscripcionModal
        inscripcion={selectedInscripcionDetalle}
        convocatoria={conv}
        onClose={() => setSelectedInscripcionDetalle(null)}
      />
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
  const [autorizaDatos, setAutorizaDatos] = useState(false);
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
      setAutorizaDatos(false);
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

    if (!autorizaDatos) {
      errors.autoriza_datos = "Debes autorizar el tratamiento de datos personales para continuar.";
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
        <div className="p-3.5 rounded-xl bg-theme-primary/10 border border-[#C8E6D2] flex items-center justify-between">
          <div>
            <span className="text-xs font-mono font-bold text-theme-primary bg-theme-bg-card px-2 py-0.5 rounded border border-[#C8E6D2] mr-2">
              {conv.codigo_con || conv.codigo || `CON${conv.id}`}
            </span>
            <span className="text-sm font-bold text-theme-text-main">{conv.titulo}</span>
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

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-[#F4F6F5] border border-theme-border text-xs text-[#526056]">
          <span className="text-sm shrink-0">ℹ️</span>
          <span>
            Los formatos de documentación los encuentras en el apartado de{" "}
            <strong className="text-theme-text-main font-semibold">Gestión Documental</strong>.
          </span>
        </div>

        <div>
          <label className="block text-xs font-semibold text-theme-text-main mb-1.5">
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
            className={`w-full px-3.5 py-2.5 text-sm rounded-xl border outline-none transition-colors bg-theme-bg-main ${fieldErrors.tipo_investigacion
                ? "border-red-400 focus:border-red-500"
                : "border-theme-border focus:border-theme-primary"
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
            <label className="block text-xs font-semibold text-theme-text-main">
              Requisitos y Documentación requerida <span className="text-red-500">*</span>
            </label>
            <span className="text-xs text-theme-text-muted font-medium">
              {Object.keys(archivosRequisitos).length} de {listaRequisitos.length} adjuntos
            </span>
          </div>
          <p className="text-[11px] text-theme-text-muted">
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
                        : "bg-theme-bg-main border-theme-border hover:border-[#B8C8BD]"
                    }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold ${archivo ? "bg-theme-primary text-white" : "bg-[#E2ECE5] text-theme-primary"
                          }`}
                      >
                        {archivo ? "✓" : idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-theme-text-main">{req}</span>
                    </div>
                    <span className="text-[11px] font-medium text-theme-text-muted bg-[#EEF2F0] px-2 py-0.5 rounded-full shrink-0">
                      Obligatorio
                    </span>
                  </div>

                  {archivo ? (
                    <div className="flex items-center justify-between pl-7 pt-2 text-xs">
                      <div className="flex items-center gap-1.5 text-[#16512D] font-medium truncate max-w-[280px]">
                        <span>📄</span>
                        <span className="truncate">{archivo.name}</span>
                        <span className="text-[11px] text-theme-text-muted font-normal">
                          ({(archivo.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleSelectFileClick(req)}
                          className="px-2.5 py-1 text-xs font-semibold text-theme-primary bg-theme-bg-card border border-[#C8D6CD] rounded-lg hover:bg-theme-bg-main shadow-sm transition-colors"
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
                      <span className="text-[11px] text-theme-text-muted">Solo formato PDF (máx. 15MB)</span>
                      <button
                        type="button"
                        onClick={() => handleSelectFileClick(req)}
                        className="px-3 py-1.5 text-xs font-semibold text-theme-primary bg-theme-bg-card border border-[#C8D6CD] rounded-lg hover:bg-theme-primary/10 shadow-sm transition-colors inline-flex items-center gap-1.5"
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
          <label className="block text-xs font-semibold text-theme-text-main mb-1.5">
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
                : "border-theme-border bg-theme-bg-main focus:border-theme-primary"
              }`}
          />
          <div className="flex justify-between items-center mt-1 text-xs">
            {fieldErrors.resumen ? (
              <span className="text-red-600 font-medium">{fieldErrors.resumen}</span>
            ) : (
              <span className="text-theme-text-muted">Síntesis del objetivo y alcance</span>
            )}
            <span
              className={`font-mono font-medium ${resumen.length >= 500 ? "text-amber-600 font-bold" : "text-theme-text-muted"
                }`}
            >
              {resumen.length} / 500 caracteres
            </span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-theme-text-main mb-1.5">
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
                : "border-theme-border bg-theme-bg-main focus:border-theme-primary"
              }`}
          />
          <div className="flex justify-between items-center mt-1 text-xs">
            {fieldErrors.justificacion ? (
              <span className="text-red-600 font-medium">{fieldErrors.justificacion}</span>
            ) : (
              <span className="text-theme-text-muted">Motivos e impacto esperado</span>
            )}
            <span
              className={`font-mono font-medium ${resumen.length >= 500 ? "text-amber-600 font-bold" : "text-theme-text-muted"
                }`}
            >
              {justificacion.length} / 500 caracteres
            </span>
          </div>
        </div>

        {/* ── Aviso y Autorización de Tratamiento de Datos Personales ── */}
        <div
          className={`p-4 rounded-xl border transition-all ${
            fieldErrors.autoriza_datos
              ? "bg-red-50/60 border-red-300"
              : "bg-[#F4F9F6] border-[#C8E6D2]"
          }`}
        >
          <div className="flex items-start gap-2.5">
            <span className="text-base text-theme-primary shrink-0 mt-0.5">🛡️</span>
            <div className="space-y-1.5 text-xs">
              <p className="font-bold text-theme-text-main">
                Aviso de Privacidad y Tratamiento de Datos Personales
              </p>
              <p className="text-[#4B5563] leading-relaxed text-[11px]">
                En cumplimiento de la Ley Estatutaria 1581 de 2012 y normas concordantes de Protección de Datos Personales (Habeas Data), le informamos que los datos y documentos suministrados serán tratados exclusivamente para el registro, validación, evaluación académica, seguimiento y trazabilidad institucional en el sistema NOUS.
              </p>
              <label className="flex items-start gap-2 pt-1.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={autorizaDatos}
                  onChange={(e) => {
                    setAutorizaDatos(e.target.checked);
                    if (e.target.checked && fieldErrors.autoriza_datos) {
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.autoriza_datos;
                        return next;
                      });
                      setGeneralError("");
                    }
                  }}
                  className="mt-0.5 w-4 h-4 rounded text-theme-primary border-gray-300 focus:ring-theme-primary accent-theme-primary shrink-0"
                />
                <span className="text-xs font-semibold text-theme-text-main leading-tight">
                  Autorizo de manera previa, libre, expresa e informada el tratamiento de mis datos personales para la postulación a esta convocatoria. <span className="text-red-500">*</span>
                </span>
              </label>
              {fieldErrors.autoriza_datos && (
                <p className="text-xs text-red-600 font-semibold pt-1">
                  ⚠️ {fieldErrors.autoriza_datos}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-theme-border">
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
    setSaving(true); setError("");
    try {
      await crearConvocatoriaExterna({
        ...data,
        titulo: data.titulo.trim(),
        tipo_investigacion: undefined,
      });
      onCreated();
      handleClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Agregar Convocatoria Externa" size="lg">
      <div className="space-y-4">
        <Field label="ID de la Convocatoria" hint="Identificador único generado automáticamente">
          <Input value={`EXTE${new Date().getFullYear()}XXX (generado automáticamente)`} disabled />
        </Field>

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
      <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-theme-border">
        <Button variant="ghost" onClick={handleClose}>Cancelar</Button>
        <Button variant="primary" onClick={handleGuardar} disabled={saving}>
          {saving ? "Guardando..." : "Guardar Externa"}
        </Button>
      </div>
    </Modal>
  );
}

// ─── Modal Administrador: Gestión de Plantilla de Asentimiento ───────────────
function GestionarPlantillaModal({
  open,
  onClose,
  convocatorias,
  convocatoriaSeleccionada,
}: {
  open: boolean;
  onClose: () => void;
  convocatorias: Convocatoria[];
  convocatoriaSeleccionada?: Convocatoria | null;
}) {
  const [convId, setConvId] = useState<string>(
    convocatoriaSeleccionada ? String(convocatoriaSeleccionada.id) : ""
  );
  const [info, setInfo] = useState<{ personalizada: boolean; nombre: string; ruta: string; peso_bytes?: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  const cargarInfo = useCallback(async (id?: number) => {
    setLoading(true);
    setError("");
    try {
      const data = await getInfoPlantillaAsentimiento(id);
      setInfo(data);
    } catch {
      setError("Error al consultar plantilla");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      const idNum = convId ? Number(convId) : convocatoriaSeleccionada?.id;
      if (convocatoriaSeleccionada && !convId) {
        setConvId(String(convocatoriaSeleccionada.id));
      }
      cargarInfo(idNum);
      setMensaje("");
      setError("");
    }
  }, [open, convId, convocatoriaSeleccionada, cargarInfo]);

  const handleSubirArchivo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError("");
    setMensaje("");
    try {
      const idNum = convId ? Number(convId) : undefined;
      const res = await subirPlantillaAsentimiento(file, idNum);
      setMensaje(`✅ Plantilla cargada exitosamente: ${res.plantilla_nombre}`);
      await cargarInfo(idNum);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al subir la plantilla");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Gestión de Formato / Plantilla de Asentimiento" size="lg">
      <div className="space-y-4">
        <p className="text-xs text-theme-text-muted leading-relaxed">
          Sube y administra el documento oficial (Word .docx, PDF, etc.) de <strong>Asentimiento y Consentimiento Informado</strong> que los postulantes externos deben descargar, diligenciar y adjuntar para estudiantes menores de edad.
        </p>

        <Field label="Ámbito de la plantilla">
          <select
            value={convId}
            onChange={(e) => {
              setConvId(e.target.value);
              cargarInfo(e.target.value ? Number(e.target.value) : undefined);
            }}
            className="w-full px-3 py-2 bg-theme-bg-main border border-theme-border rounded-xl text-sm text-theme-text-main focus:outline-none focus:ring-2 focus:ring-theme-primary"
          >
            <option value="">🌐 Plantilla Global Institucional (para todas las convocatorias)</option>
            {convocatorias.map((c) => (
              <option key={c.id} value={c.id}>
                {c.codigo_con || c.codigo ? `[${c.codigo_con || c.codigo}] ` : ""}{c.titulo} ({c.tipo})
              </option>
            ))}
          </select>
        </Field>

        <div className="p-4 rounded-xl bg-theme-bg-main border border-theme-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-theme-text-muted uppercase tracking-wider">Estado actual de la plantilla</span>
            {loading && <span className="text-xs text-theme-text-muted animate-pulse">Consultando...</span>}
          </div>

          {info && (
            <div className="flex items-start justify-between gap-3 p-3 bg-theme-bg-card rounded-lg border border-theme-border">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{info.personalizada ? "📄" : "⚙️"}</span>
                <div>
                  <p className="text-sm font-bold text-theme-text-main">{info.nombre}</p>
                  <p className="text-xs text-theme-text-muted">
                    {info.personalizada
                      ? `Archivo personalizado subido por el Administrador ${info.peso_bytes ? `(${(info.peso_bytes / 1024).toFixed(1)} KB)` : ""}`
                      : "Formato web interactivo predeterminado del sistema NOUS"}
                  </p>
                </div>
              </div>
              <a
                href={
                  convId
                    ? `http://localhost:4200/api/convocatorias/plantilla-asentimiento?convocatoria_id=${convId}&print=1`
                    : `http://localhost:4200/api/convocatorias/plantilla-asentimiento?print=1`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg bg-theme-bg-main border border-theme-border text-xs font-semibold text-theme-primary hover:bg-theme-primary/10 flex items-center gap-1 shrink-0"
              >
                <span>📥</span> Probar descarga
              </a>
            </div>
          )}
        </div>

        {/* Zona de carga de nuevo archivo */}
        <div className="p-4 rounded-xl border-2 border-dashed border-emerald-300/80 bg-emerald-50/40 text-center space-y-2">
          <div className="text-2xl">📤</div>
          <p className="text-sm font-bold text-theme-text-main">
            Cargar nuevo archivo de plantilla oficial
          </p>
          <p className="text-xs text-theme-text-muted max-w-md mx-auto">
            Formatos soportados: <strong>.pdf, .docx, .doc, .xlsx</strong> (Máx. 15 MB). Al subirlo, los participantes descargarán automáticamente este archivo.
          </p>
          <div className="pt-2">
            <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-theme-primary text-white font-bold text-xs hover:bg-[#17563A] transition-all cursor-pointer shadow-sm active:scale-95">
              <span>{uploading ? "⏳ Subiendo archivo..." : "Seleccionar y subir archivo"}</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,.xlsx"
                className="hidden"
                disabled={uploading}
                onChange={handleSubirArchivo}
              />
            </label>
          </div>
        </div>

        {mensaje && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center gap-2">
            <span>✅</span> {mensaje}
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs font-semibold text-red-600 flex items-center gap-2">
            <span>⚠️</span> {error}
          </div>
        )}
      </div>
      <div className="flex justify-end pt-4 border-t border-theme-border mt-4">
        <Button variant="primary" onClick={onClose}>Listo</Button>
      </div>
    </Modal>
  );
}

// ─── Tab: Alertas (RF-CON-03) ─────────────────────────────────────────────────
function AlertasTab({ user }: { user?: UsuarioMe | null }) {
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

  if (loading) return <div className="text-center py-12 text-theme-text-muted">Cargando alertas...</div>;
  if (!alertas) return <div className="text-center py-12 text-red-500">Error al cargar alertas.</div>;

  const { resumen, proximas_a_cerrar, proximas_a_abrir, vencidas_pendientes_cierre } = alertas;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Próximas a cerrar", value: resumen.proximas_a_cerrar_total, icon: "⏳", color: "#D97706", bg: "#FFF8E6" },
          { label: "Críticas (≤3 días)", value: resumen.criticas_3_dias, icon: "🚨", color: "#DC2626", bg: "#FEF2F2" },
          { label: "Próximas a abrir", value: resumen.proximas_a_abrir_total, icon: "📢", color: "var(--theme-primary)", bg: "#EBF5EF" },
          { label: "Vencidas pendientes", value: resumen.vencidas_pendientes_cierre, icon: "⚠️", color: "#7C3AED", bg: "#EDE9FE" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl p-4 flex items-center gap-3 border" style={{ backgroundColor: s.bg, borderColor: s.color + "40" }}>
            <span className="text-2xl">{s.icon}</span>
            <div>
              <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
              <p className="text-xs text-theme-text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {proximas_a_cerrar.length > 0 && (
        <div className="bg-theme-bg-card border border-theme-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-theme-accent/10 border-b border-[#FFE5A0]">
            <p className="text-sm font-semibold text-[#D4930B]">⏳ Próximas a cerrar</p>
          </div>
          <div className="divide-y divide-[#F2F5F3]">
            {proximas_a_cerrar.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-theme-text-main">{c.titulo}</p>
                  <p className="text-xs text-theme-text-muted">Cierre: {formatDate(c.fecha_cierre)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {(c as any).nivel_alerta === "critica" && (
                    <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-full">🚨 Crítica</span>
                  )}
                  {(c as any).nivel_alerta === "urgente" && (
                    <span className="text-xs font-bold text-white bg-orange-500 px-2 py-1 rounded-full">⚡ Urgente</span>
                  )}
                  {(c as any).dias_restantes != null && (
                    <span className="text-xs text-theme-text-muted">{(c as any).dias_restantes} días</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {proximas_a_abrir.length > 0 && (
        <div className="bg-theme-bg-card border border-theme-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-theme-primary/10 border-b border-[#C8E6D2]">
            <p className="text-sm font-semibold text-theme-primary">📢 Próximas a abrir</p>
          </div>
          <div className="divide-y divide-[#F2F5F3]">
            {proximas_a_abrir.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-theme-text-main">{c.titulo}</p>
                  <p className="text-xs text-theme-text-muted">Apertura: {formatDate(c.fecha_apertura)}</p>
                </div>
                <span className="text-xs bg-theme-primary/10 text-theme-primary font-medium px-2 py-1 rounded-full">Próximamente</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {vencidas_pendientes_cierre.length > 0 && (
        <div className="bg-theme-bg-card border border-theme-border rounded-xl overflow-hidden">
          <div className="px-4 py-3 bg-[#FEF2F2] border-b border-red-200">
            <p className="text-sm font-semibold text-red-600">⚠️ Vencidas pendientes de cierre</p>
          </div>
          <div className="divide-y divide-[#F2F5F3]">
            {vencidas_pendientes_cierre.map((c) => (
              <div key={c.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-theme-text-main">{c.titulo}</p>
                  <p className="text-xs text-theme-text-muted">Cerró: {formatDate(c.fecha_cierre)}</p>
                </div>
                <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded-full">Vencida</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {proximas_a_cerrar.length === 0 && proximas_a_abrir.length === 0 && vencidas_pendientes_cierre.length === 0 && (
        <div className="text-center py-12 text-theme-text-muted bg-theme-bg-card rounded-xl border border-theme-border">
          ✅ No hay alertas activas en este momento.
        </div>
      )}
    </div>
  );
}

// ─── Tab: Externas (RF-CON-04) ────────────────────────────────────────────────
function ExternasTab({ user }: { user?: UsuarioMe | null }) {
  const [externas, setExternas] = useState<ConvocatoriaExterna[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [deletingExterna, setDeletingExterna] = useState<ConvocatoriaExterna | null>(null);

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
    if (e.estado_vigencia === "vigente") return <span className="text-xs font-bold text-white bg-theme-primary px-2 py-1 rounded-full">Vigente</span>;
    if (e.estado_vigencia === "cerrada") return <span className="text-xs font-bold text-theme-text-muted bg-theme-bg-main px-2 py-1 rounded-full">Cerrada</span>;
    return <span className="text-xs font-bold text-[#D97706] bg-theme-accent/10 px-2 py-1 rounded-full">Sin fecha</span>;
  };

  const isEstudiante = user?.roles?.some(r => r.toLowerCase().includes("estudiante"));
  const isExternoRestrictivo = user?.roles?.some(r => r.toLowerCase().includes("externo")) && !user?.roles?.some(r => ["administrador", "admin", "directivos", "director_investigacion", "coordinador_investigacion", "docente"].includes(r.toLowerCase()));
  const puedeCrearExterna = !isExternoRestrictivo && !isEstudiante && (user?.permisos?.includes('convocatorias.crear') || user?.roles?.some(r => r.toLowerCase().includes('admin') || r.toLowerCase().includes('director') || r.toLowerCase().includes('coordinador')));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted text-sm">🔍</span>
          <input
            type="text"
            placeholder="Buscar por título, código o entidad..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-sm border border-theme-border rounded-xl bg-theme-bg-main focus:outline-none focus:border-theme-primary transition-colors"
          />
        </div>
        {puedeCrearExterna && (
          <Button variant="primary" onClick={() => setShowModal(true)}>+ Agregar Externa</Button>
        )}
      </div>

      {loading && <div className="text-center py-12 text-theme-text-muted">Cargando convocatorias externas...</div>}
      {!loading && filtradas.length === 0 && (
        <div className="text-center py-12 text-theme-text-muted bg-theme-bg-main rounded-xl border border-theme-border">
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
                <span className="text-xs font-mono font-bold text-theme-primary bg-theme-primary/10 px-2.5 py-0.5 rounded-md border border-[#C8E6D2]">
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
              <h3 className="text-base font-bold text-theme-text-main mb-1">{e.titulo}</h3>
              {e.descripcion && <p className="text-xs text-theme-text-muted mb-2 line-clamp-2">{e.descripcion}</p>}
              <div className="flex flex-wrap gap-4 text-xs text-theme-text-muted">
                {e.fecha_apertura && <span>📅 Apertura: <strong className="text-theme-text-main">{formatDate(e.fecha_apertura)}</strong></span>}
                {e.fecha_cierre && <span>🔒 Cierre: <strong className="text-theme-text-main">{formatDate(e.fecha_cierre)}</strong></span>}
                {e.dias_restantes != null && e.dias_restantes > 0 && (
                  <span>⏱️ <strong className="text-[#D97706]">{e.dias_restantes} días restantes</strong></span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {(user?.permisos?.includes('convocatorias.eliminar') || user?.roles?.includes('administrador')) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                  onClick={() => setDeletingExterna(e)}
                >
                  🗑️ Eliminar
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}

      <ExternaModal open={showModal} onClose={() => setShowModal(false)} onCreated={cargar} />
      <EliminarExternaModal
        conv={deletingExterna}
        onClose={() => setDeletingExterna(null)}
        onDeleted={cargar}
      />
    </div>
  );
}

// ─── Convocatorias Page ───────────────────────────────────────────────────────

// ─── Modal Semillero Externo — Formulario completo de 5 pasos ────────────────
const PASOS_SEMILLERO_EXTERNO = [
  { id: 1, label: "Semillero" },
  { id: 2, label: "Integrantes" },
  { id: 3, label: "Info general" },
  { id: 4, label: "Contenido" },
  { id: 5, label: "Envío final" },
];

// ─── Sub-componente: fila de integrante en tabla ─────────────────────────────
function FilaIntegrante({
  integrante,
  onEliminar,
  onToggleMayorEdad,
  onSubirAsentimiento,
  eliminando,
}: {
  integrante: IntegranteSemillero;
  onEliminar: (id: number) => void;
  onToggleMayorEdad?: (id: number, esMayor: boolean) => void;
  onSubirAsentimiento?: (id: number, file: File) => void;
  eliminando?: boolean;
}) {
  const esMayor = integrante.es_mayor_edad !== false;

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-theme-border bg-theme-bg-main hover:border-[#C8E6D2] transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-bold text-theme-text-main truncate">{integrante.nombre_completo}</p>
          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-theme-primary/10 text-theme-primary border border-theme-primary/20">
            {integrante.rol}
          </span>
        </div>
        <p className="text-xs text-theme-text-muted mt-0.5">
          {integrante.tipo_documento} {integrante.numero_documento} · {integrante.email}
          {integrante.telefono ? ` · Tel: ${integrante.telefono}` : ""}
        </p>
      </div>

      {/* Selector ¿Mayor de edad? y Asentimiento informado */}
      <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
        {/* Columna 1: ¿Mayor de edad? */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">
            ¿Mayor de edad?
          </span>
          <div className="inline-flex items-center rounded-full p-0.5 bg-theme-bg-card border border-theme-border">
            <button
              type="button"
              onClick={() => onToggleMayorEdad?.(integrante.id, true)}
              className={`px-3 py-0.5 text-xs rounded-full font-bold transition-all ${
                esMayor
                  ? "bg-emerald-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="Es mayor de edad (+18)"
            >
              Sí
            </button>
            <button
              type="button"
              onClick={() => onToggleMayorEdad?.(integrante.id, false)}
              className={`px-3 py-0.5 text-xs rounded-full font-bold transition-all ${
                !esMayor
                  ? "bg-rose-500 text-white shadow-sm"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              title="Es menor de edad (-18)"
            >
              No
            </button>
          </div>
        </div>

        {/* Columna 2: Asentimiento informado */}
        <div className="flex flex-col items-center gap-1 min-w-[120px]">
          <span className="text-[10px] font-bold text-theme-text-muted uppercase tracking-wider">
            Asentimiento
          </span>
          {esMayor ? (
            <div
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-dashed border-gray-200 bg-gray-50/50 text-gray-300 text-xs cursor-not-allowed select-none"
              title="No requiere asentimiento informado por ser mayor de edad"
            >
              <span>📤</span>
              <span className="text-[10px] font-semibold text-gray-400">No aplica</span>
            </div>
          ) : integrante.asentimiento_ruta ? (
            <div className="flex items-center gap-1.5">
              <a
                href={integrante.asentimiento_ruta}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-lg transition-colors"
                title={`Ver asentimiento cargado: ${integrante.asentimiento_nombre || "Archivo"}`}
              >
                <span>📄</span> Ver
              </a>
              <label className="cursor-pointer text-theme-primary hover:text-[#17563A] text-xs font-bold p-1 rounded hover:bg-theme-primary/10" title="Reemplazar archivo">
                <span>🔄</span>
                <input
                  type="file"
                  accept=".pdf,image/jpeg,image/png,image/webp,image/jpg"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f && onSubirAsentimiento) onSubirAsentimiento(integrante.id, f);
                  }}
                />
              </label>
            </div>
          ) : (
            <label className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-all shadow-sm active:scale-95">
              <span>📤</span>
              <span className="text-[11px]">Subir formato</span>
              <input
                type="file"
                accept=".pdf,image/jpeg,image/png,image/webp,image/jpg"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f && onSubirAsentimiento) onSubirAsentimiento(integrante.id, f);
                }}
              />
            </label>
          )}
        </div>

        {/* Columna 3: Eliminar */}
        <button
          onClick={() => onEliminar(integrante.id)}
          disabled={eliminando}
          className="text-red-400 hover:text-red-600 text-xs p-1.5 rounded-lg border border-red-200 hover:bg-red-50 transition-colors disabled:opacity-50 mt-4 sm:mt-0"
          title="Eliminar integrante de la lista"
        >
          🗑️
        </button>
      </div>
    </div>
  );
}

// ─── Stepper visual compartido ────────────────────────────────────────────────
function StepperHeader({
  pasoActual,
  pasosCompletados,
  onSelectPaso,
}: {
  pasoActual: number;
  pasosCompletados: Set<number>;
  onSelectPaso?: (p: number) => void;
}) {
  const maxCompletado = pasosCompletados.size > 0 ? Math.max(...Array.from(pasosCompletados)) : 0;
  return (
    <div className="flex items-center mb-5 overflow-x-auto pb-1">
      {PASOS_SEMILLERO_EXTERNO.map((paso, i) => {
        const completado = pasosCompletados.has(paso.id) && paso.id !== pasoActual;
        const activo = paso.id === pasoActual;
        const clickable = onSelectPaso && (pasosCompletados.has(paso.id) || paso.id === 1 || paso.id <= maxCompletado + 1);
        return (
          <React.Fragment key={paso.id}>
            <div
              className={`flex items-center gap-1.5 flex-shrink-0 transition-opacity ${clickable ? "cursor-pointer hover:opacity-80 select-none" : "opacity-75"}`}
              onClick={() => {
                if (clickable && onSelectPaso) onSelectPaso(paso.id);
              }}
              title={clickable ? `Ir al paso ${paso.id}: ${paso.label}` : undefined}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                completado ? "bg-theme-primary border-theme-primary text-white"
                  : activo ? "border-theme-primary text-theme-primary bg-theme-primary/10"
                  : "border-theme-border text-theme-text-muted bg-theme-bg-main"
              }`}>
                {completado ? "✓" : paso.id}
              </div>
              <span className={`text-xs font-medium hidden sm:block whitespace-nowrap ${
                completado ? "text-theme-primary" : activo ? "text-theme-primary font-semibold" : "text-theme-text-muted"
              }`}>{paso.label}</span>
            </div>
            {i < PASOS_SEMILLERO_EXTERNO.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1.5 min-w-[12px] ${completado ? "bg-theme-primary" : "bg-[#DDE4DF]"}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
function SemilleroExternoModal({
  conv, onClose, onGuardado, user,
}: {
  conv: Convocatoria | null;
  onClose: () => void;
  onGuardado: () => void;
  user?: UsuarioMe | null;
}) {
  // ── Estado global del wizard ──────────────────────────────────────────────
  const [paso, setPaso] = useState(1);
  const [pasosCompletados, setPasosCompletados] = useState<Set<number>>(new Set());
  const [catalogos, setCatalogos] = useState<CatalogosSemillero | null>(null);
  const [saving, setSaving] = useState(false);
  const [generalError, setGeneralError] = useState("");
  const [inscripcionEnviada, setInscripcionEnviada] = useState(false);

  // ── Estado Paso 1: Semillero ──────────────────────────────────────────────
  const [tiposInstitucion, setTiposInstitucion] = useState<string[]>([
    "Universidad", "Instituto Tecnológico", "Politécnico", "Fundación", "Centro de Investigación", "Empresa", "Otro",
  ]);
  const [tipoInstitucion, setTipoInstitucion] = useState("");
  const [institucionProcedencia, setInstitucionProcedencia] = useState("");
  const [semilleroNombre, setSemilleroNombre] = useState("");
  const [errores1, setErrores1] = useState<Record<string, string>>({});

  // ── Estado Paso 2: Integrantes ────────────────────────────────────────────
  const [integrantes, setIntegrantes] = useState<IntegranteSemillero[]>([]);
  const [mostrarFormIntegrante, setMostrarFormIntegrante] = useState(false);
  const [subiendoAsentimiento, setSubiendoAsentimiento] = useState(false);
  const [nuevoIntg, setNuevoIntg] = useState<{
    nombre_completo: string;
    tipo_documento: string;
    numero_documento: string;
    rol: string;
    email: string;
    telefono: string;
    es_mayor_edad: boolean;
    asentimiento_nombre?: string;
    asentimiento_ruta?: string;
    asentimiento_peso_bytes?: number;
  }>({
    nombre_completo: "",
    tipo_documento: "",
    numero_documento: "",
    rol: "",
    email: "",
    telefono: "",
    es_mayor_edad: true,
  });
  const [erroresIntg, setErroresIntg] = useState<Record<string, string>>({});

  // ── Estado Paso 3: Info general ───────────────────────────────────────────
  const [tituloTrabajo, setTituloTrabajo] = useState("");
  const [lineaInv, setLineaInv] = useState("");
  const [palabrasClave, setPalabrasClave] = useState("");
  const [resumenInfo, setResumenInfo] = useState("");
  const [errores3, setErrores3] = useState<Record<string, string>>({});

  // ── Estado Paso 4: Contenido ──────────────────────────────────────────────
  const [planteamiento, setPlanteamiento] = useState("");
  const [objetivoGral, setObjetivoGral] = useState("");
  const [objetivosEsp, setObjetivosEsp] = useState("");
  const [metodologia, setMetodologia] = useState("");
  const [resultados, setResultados] = useState("");
  const [errores4, setErrores4] = useState<Record<string, string>>({});

  // ── Estado Paso 5: Envío final ────────────────────────────────────────────
  const [docFinal, setDocFinal] = useState<File | null>(null);
  const [comprobantePago, setComprobantePago] = useState<File | null>(null);
  const [autorizaDatos, setAutorizaDatos] = useState(false);
  const [guardandoBorrador, setGuardandoBorrador] = useState(false);
  const [borradorGuardadoMensaje, setBorradorGuardadoMensaje] = useState("");
  const [borradorRecuperado, setBorradorRecuperado] = useState(false);

  // Estado plantilla oficial de asentimiento
  const [infoPlantilla, setInfoPlantilla] = useState<{ personalizada: boolean; nombre: string; ruta: string } | null>(null);
  const [subiendoPlantillaAdmin, setSubiendoPlantillaAdmin] = useState(false);
  const [mensajePlantillaAdmin, setMensajePlantillaAdmin] = useState("");

  const PROCEDENCIA_FIJA = "Semillero externo";
  const userActual = user || getUsuarioActual();
  const usuarioId = userActual?.id || 1;

  // ── Carga inicial de catálogos y datos previos si existen ─────────────────
  useEffect(() => {
    if (!conv) return;
    setPaso(1);
    setPasosCompletados(new Set());
    setSaving(false);
    setGeneralError("");
    setInscripcionEnviada(false);
    setAutorizaDatos(false);
    setGuardandoBorrador(false);
    setBorradorGuardadoMensaje("");
    setBorradorRecuperado(false);
    setTipoInstitucion("");
    setInstitucionProcedencia("");
    setSemilleroNombre("");
    setErrores1({});
    setIntegrantes([]);
    setMostrarFormIntegrante(false);
    setNuevoIntg({ nombre_completo: "", tipo_documento: "", numero_documento: "", rol: "", email: "", telefono: "", es_mayor_edad: true });
    setErroresIntg({});
    setTituloTrabajo("");
    setLineaInv("");
    setPalabrasClave("");
    setResumenInfo("");
    setErrores3({});
    setPlanteamiento("");
    setObjetivoGral("");
    setObjetivosEsp("");
    setMetodologia("");
    setResultados("");
    setErrores4({});
    setDocFinal(null);
    setComprobantePago(null);

    // Cargar información de la plantilla oficial
    getInfoPlantillaAsentimiento(conv.id)
      .then(setInfoPlantilla)
      .catch(() => null);

    // Cargar catálogos
    getCatalogosSemillero(conv.id)
      .then((catData) => {
        if (catData) setCatalogos(catData);
      })
      .catch(() => {});

    // Cargar tipos de institución
    getSemilleroExterno(conv.id, user?.id)
      .then((semData) => {
        if (semData.tipos_institucion && semData.tipos_institucion.length > 0) {
          setTiposInstitucion(semData.tipos_institucion);
        }
      })
      .catch(() => {});

    // Recuperar borrador activo si existe
    if (usuarioId) {
      getBorradorSemillero(conv.id, usuarioId)
        .then((bData) => {
          if (bData.ok && bData.tiene_borrador) {
            const completados = new Set<number>();

            if (bData.semillero) {
              setTipoInstitucion(bData.semillero.tipo_institucion || "");
              setInstitucionProcedencia(bData.semillero.institucion_procedencia || "");
              setSemilleroNombre(bData.semillero.semillero_nombre || "");
              if (bData.semillero.semillero_nombre) completados.add(1);
            }

            if (bData.integrantes && bData.integrantes.length > 0) {
              setIntegrantes(bData.integrantes);
              completados.add(2);
            }

            if (bData.info_general) {
              setTituloTrabajo(bData.info_general.titulo_trabajo || "");
              setLineaInv(bData.info_general.linea_investigacion || "");
              setPalabrasClave(bData.info_general.palabras_clave || "");
              setResumenInfo(bData.info_general.resumen || "");
              if (bData.info_general.titulo_trabajo) completados.add(3);
            }

            if (bData.contenido) {
              setPlanteamiento(bData.contenido.planteamiento_problema || "");
              setObjetivoGral(bData.contenido.objetivo_general || "");
              setObjetivosEsp(bData.contenido.objetivos_especificos || "");
              setMetodologia(bData.contenido.metodologia || "");
              setResultados(bData.contenido.resultados_esperados || "");
              if (bData.contenido.planteamiento_problema) completados.add(4);
            }

            setPasosCompletados(completados);
            setPaso(bData.ultimo_paso || 1);
            setBorradorRecuperado(true);
          }
        })
        .catch(() => {});
    }
  }, [conv]);

  if (!conv) return null;
  const codigoDisplay = conv.codigo_con || conv.codigo || `CON${conv.id}`;

  // ── Avanzar Paso 1 (Solo validación local) ──────────────────────────────────
  const avanzarPaso1 = () => {
    const errs: Record<string, string> = {};
    if (!tipoInstitucion.trim()) errs.tipo_institucion = "Selecciona el tipo de institución.";
    if (!institucionProcedencia.trim()) errs.institucion_procedencia = "La institución de procedencia es obligatoria.";
    if (!semilleroNombre.trim()) errs.semillero_nombre = "El nombre del semillero es obligatorio.";

    if (Object.keys(errs).length > 0) {
      setErrores1(errs);
      setGeneralError("Completa todos los campos obligatorios antes de continuar.");
      return;
    }
    setErrores1({});
    setGeneralError("");
    setPasosCompletados((p) => new Set([...p, 1]));
    setPaso(2);
  };

  // ── Manejo Paso 2: Integrantes (Solo local) ────────────────────────────────
  const agregarIntegrante = () => {
    const errs: Record<string, string> = {};
    if (!nuevoIntg.nombre_completo.trim()) errs.nombre_completo = "El nombre completo es obligatorio.";
    const numDocLimpio = nuevoIntg.numero_documento.trim();
    if (!numDocLimpio) {
      errs.numero_documento = "El número de documento es obligatorio.";
    } else if (!/^\d+$/.test(numDocLimpio)) {
      errs.numero_documento = "El número de documento solo debe contener números.";
    } else if (numDocLimpio.length < 5 || numDocLimpio.length > 15) {
      errs.numero_documento = "El número de documento debe tener entre 5 y 15 dígitos.";
    }

    const telLimpio = nuevoIntg.telefono.trim();
    if (telLimpio) {
      if (!/^\d+$/.test(telLimpio)) {
        errs.telefono = "El teléfono solo debe contener números.";
      } else if (telLimpio.length < 7 || telLimpio.length > 12) {
        errs.telefono = "El teléfono debe tener entre 7 y 12 dígitos.";
      }
    }

    if (!nuevoIntg.rol) errs.rol = "Selecciona el rol.";
    if (!nuevoIntg.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nuevoIntg.email)) {
      errs.email = "Ingresa un correo electrónico válido.";
    }

    if (Object.keys(errs).length > 0) {
      setErroresIntg(errs);
      return;
    }

    const nuevo: IntegranteSemillero = {
      id: Date.now(),
      nombre_completo: nuevoIntg.nombre_completo.trim(),
      tipo_documento: nuevoIntg.tipo_documento.trim(),
      numero_documento: nuevoIntg.numero_documento.trim(),
      rol: nuevoIntg.rol.trim(),
      email: nuevoIntg.email.trim(),
      telefono: nuevoIntg.telefono.trim() || undefined,
      es_mayor_edad: nuevoIntg.es_mayor_edad,
      asentimiento_nombre: nuevoIntg.asentimiento_nombre,
      asentimiento_ruta: nuevoIntg.asentimiento_ruta,
      asentimiento_peso_bytes: nuevoIntg.asentimiento_peso_bytes,
    };

    setIntegrantes((p) => [...p, nuevo]);
    setNuevoIntg({
      nombre_completo: "",
      tipo_documento: "",
      numero_documento: "",
      rol: "",
      email: "",
      telefono: "",
      es_mayor_edad: true,
    });
    setErroresIntg({});
    setMostrarFormIntegrante(false);
    setGeneralError("");
    setPasosCompletados((p) => new Set([...p, 2]));
  };

  const toggleMayorEdadIntegrante = (id: number, esMayor: boolean) => {
    setIntegrantes((prev) =>
      prev.map((it) => (it.id === id ? { ...it, es_mayor_edad: esMayor } : it))
    );
  };

  const subirAsentimientoFila = async (id: number, file: File) => {
    try {
      setGeneralError("");
      const res = await subirAsentimientoIntegrante(conv.id, file);
      if (res.ok) {
        setIntegrantes((prev) =>
          prev.map((it) =>
            it.id === id
              ? {
                  ...it,
                  es_mayor_edad: false,
                  asentimiento_nombre: res.asentimiento_nombre,
                  asentimiento_ruta: res.asentimiento_ruta,
                  asentimiento_peso_bytes: res.asentimiento_peso_bytes,
                }
              : it
          )
        );
      }
    } catch (err: any) {
      setGeneralError(err.message || "Error al subir el archivo de asentimiento.");
    }
  };

  const eliminarIntegrante = (id: number) => {
    setIntegrantes((p) => {
      const next = p.filter((i) => i.id !== id);
      if (next.length === 0) {
        setPasosCompletados((prev) => {
          const n = new Set(prev);
          n.delete(2);
          return n;
        });
      }
      return next;
    });
  };

  const avanzarPaso2 = () => {
    if (integrantes.length === 0) {
      setGeneralError("Debes agregar al menos un integrante al semillero para continuar.");
      return;
    }
    setGeneralError("");
    setPasosCompletados((p) => new Set([...p, 2]));
    setPaso(3);
  };

  // ── Avanzar Paso 3 (Solo validación local) ──────────────────────────────────
  const avanzarPaso3 = () => {
    const errs: Record<string, string> = {};
    if (!tituloTrabajo.trim()) errs.titulo_trabajo = "El título del trabajo es obligatorio.";
    if (!palabrasClave.trim()) errs.palabras_clave = "Las palabras clave son obligatorias.";
    if (!resumenInfo.trim()) errs.resumen = "El resumen es obligatorio.";
    else if (resumenInfo.trim().length > 500) errs.resumen = "El resumen no puede exceder 500 caracteres.";

    if (Object.keys(errs).length > 0) {
      setErrores3(errs);
      setGeneralError("Completa todos los campos obligatorios antes de continuar.");
      return;
    }
    setErrores3({});
    setGeneralError("");
    setPasosCompletados((p) => new Set([...p, 3]));
    setPaso(4);
  };

  // ── Avanzar Paso 4 (Solo validación local) ──────────────────────────────────
  const avanzarPaso4 = () => {
    const errs: Record<string, string> = {};
    if (!planteamiento.trim()) errs.planteamiento_problema = "El planteamiento del problema es obligatorio.";
    if (!objetivoGral.trim()) errs.objetivo_general = "El objetivo general es obligatorio.";
    if (!objetivosEsp.trim()) errs.objetivos_especificos = "Los objetivos específicos son obligatorios.";
    if (!metodologia.trim()) errs.metodologia = "La metodología es obligatoria.";
    if (!resultados.trim()) errs.resultados_esperados = "Los resultados esperados son obligatorios.";

    if (Object.keys(errs).length > 0) {
      setErrores4(errs);
      setGeneralError("Completa todos los campos obligatorios antes de continuar.");
      return;
    }
    setErrores4({});
    setGeneralError("");
    setPasosCompletados((p) => new Set([...p, 4]));
    setPaso(5);
  };

  // ── Guardar y Enviar Final (Paso 5: Guarda todo en la BD) ───────────────────
  const enviarFinal = async () => {
    if (!autorizaDatos) {
      setGeneralError("Debes aceptar la autorización de tratamiento de datos personales para formalizar la inscripción.");
      return;
    }

    if (!comprobantePago) {
      setGeneralError("El comprobante de pago de inscripción es obligatorio. Por favor adjunta el recibo o comprobante (PDF, JPG, PNG o WEBP).");
      return;
    }

    if (!docFinal) {
      setGeneralError("Debes adjuntar el documento de la propuesta de investigación o aval en formato PDF.");
      return;
    }

    const menorSinAsentimiento = integrantes.find(
      (it) => it.es_mayor_edad === false && !it.asentimiento_ruta && !it.asentimiento_nombre
    );
    if (menorSinAsentimiento) {
      setGeneralError(
        `El integrante menor de edad "${menorSinAsentimiento.nombre_completo || "sin nombre"}" debe tener cargado su formato de asentimiento informado. Por favor regresa al Paso 2 para adjuntarlo.`
      );
      return;
    }

    setSaving(true);
    setGeneralError("");
    try {
      const fd = new FormData();
      fd.append("usuario_id", usuarioId.toString());
      fd.append(
        "semillero",
        JSON.stringify({
          tipo_institucion: tipoInstitucion.trim(),
          institucion_procedencia: institucionProcedencia.trim(),
          semillero_nombre: semilleroNombre.trim(),
        })
      );
      fd.append("integrantes", JSON.stringify(integrantes));
      fd.append(
        "info_general",
        JSON.stringify({
          titulo_trabajo: tituloTrabajo.trim(),
          linea_investigacion: lineaInv || "",
          palabras_clave: palabrasClave.trim(),
          resumen: resumenInfo.trim(),
        })
      );
      fd.append(
        "contenido",
        JSON.stringify({
          planteamiento_problema: planteamiento.trim(),
          objetivo_general: objetivoGral.trim(),
          objetivos_especificos: objetivosEsp.trim(),
          metodologia: metodologia.trim(),
          resultados_esperados: resultados.trim(),
        })
      );
      if (comprobantePago) {
        fd.append("comprobante_pago", comprobantePago, comprobantePago.name);
      }
      if (docFinal) {
        fd.append("documento", docFinal, docFinal.name);
      }

      await enviarInscripcionExterna(conv.id, fd);
      setInscripcionEnviada(true);
      setPasosCompletados((p) => new Set([...p, 5]));
      onGuardado();
    } catch (e: any) {
      setGeneralError(e.message || "Error al enviar la inscripción.");
    } finally {
      setSaving(false);
    }
  };

  // ── Guardar Borrador Parcial ─────────────────────────────────────────────
  const guardarBorradorActual = async () => {
    setGuardandoBorrador(true);
    setGeneralError("");
    try {
      await guardarBorradorSemillero(conv.id, {
        usuario_id: usuarioId,
        paso_actual: paso,
        semillero: {
          tipo_institucion: tipoInstitucion.trim(),
          institucion_procedencia: institucionProcedencia.trim(),
          semillero_nombre: semilleroNombre.trim(),
        },
        integrantes,
        info_general: {
          titulo_trabajo: tituloTrabajo.trim(),
          linea_investigacion: lineaInv || "",
          palabras_clave: palabrasClave.trim(),
          resumen: resumenInfo.trim(),
        },
        contenido: {
          planteamiento_problema: planteamiento.trim(),
          objetivo_general: objetivoGral.trim(),
          objetivos_especificos: objetivosEsp.trim(),
          metodologia: metodologia.trim(),
          resultados_esperados: resultados.trim(),
        },
      });
      setBorradorGuardadoMensaje("✓ Borrador guardado exitosamente. Podrás continuar tu inscripción cuando desees.");
      setTimeout(() => setBorradorGuardadoMensaje(""), 4500);
      onGuardado();
    } catch (e: any) {
      setGeneralError(e.message || "Error al guardar el borrador.");
    } finally {
      setGuardandoBorrador(false);
    }
  };

  // ── Banner convocatoria ───────────────────────────────────────────────────
  const Banner = () => (
    <div className="p-3 rounded-xl bg-theme-primary/10 border border-[#C8E6D2] flex items-center gap-2 mb-4">
      <span className="text-xs font-mono font-bold text-theme-primary bg-theme-bg-card px-2 py-0.5 rounded border border-[#C8E6D2]">
        {codigoDisplay}
      </span>
      <span className="text-sm font-semibold text-theme-text-main truncate">{conv.titulo}</span>
      <span className="ml-auto text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium border border-blue-200 flex-shrink-0">
        Externa
      </span>
    </div>
  );

  // ── Botones de navegación ─────────────────────────────────────────────────
  const NavButtons = ({
    onBack,
    onNext,
    nextLabel = "Continuar →",
    nextDisabled = false,
  }: {
    onBack?: () => void;
    onNext: () => void;
    nextLabel?: string;
    nextDisabled?: boolean;
  }) => (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-theme-border mt-4">
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <Button variant="ghost" onClick={onClose} disabled={saving || guardandoBorrador}>
          Cancelar
        </Button>
        {onBack && (
          <Button variant="outline" onClick={onBack} disabled={saving || guardandoBorrador}>
            ← Volver
          </Button>
        )}
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
        <Button
          variant="outline"
          onClick={guardarBorradorActual}
          disabled={saving || guardandoBorrador}
          className="border-amber-300 text-amber-900 bg-amber-50/70 hover:bg-amber-100 transition-colors"
        >
          {guardandoBorrador ? "Guardando..." : "💾 Guardar borrador"}
        </Button>

        <Button variant="primary" onClick={onNext} disabled={saving || guardandoBorrador || nextDisabled}>
          {saving ? "Guardando y enviando..." : nextLabel}
        </Button>
      </div>
    </div>
  );

  // ── Error banner ──────────────────────────────────────────────────────────
  const ErrorBanner = () =>
    generalError ? (
      <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-sm font-medium flex items-center gap-2 mb-3">
        <span>⚠</span>
        <span>{generalError}</span>
      </div>
    ) : null;

  return (
    <Modal open={!!conv} onClose={saving ? () => {} : onClose} title="INSCRIPCIÓN — CONVOCATORIA EXTERNA" size="xl">
      <StepperHeader pasoActual={paso} pasosCompletados={pasosCompletados} onSelectPaso={setPaso} />
      <Banner />

      {/* ── Aviso de Pago de Inscripción para Convocatorias Externas ── */}
      <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-300 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 text-lg shadow-sm">
            💳
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
              Pago de inscripción
            </p>
            <p className="text-xs text-emerald-800">
              Para postulaciones a convocatorias externas, realiza tu pago en el portal de extensión institucional.
            </p>
          </div>
        </div>
        <a
          href="https://extension.unicatolicadelsur.edu.co/register"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shadow-sm transition-all hover:shadow hover:scale-[1.02] shrink-0"
        >
          <span>AQUÍ PUEDES PAGAR LA INSCRIPCIÓN</span>
          <span className="text-xs">↗</span>
        </a>
      </div>

      {/* ── Aviso de Borrador Recuperado o Guardado ── */}
      {borradorGuardadoMensaje && (
        <div className="p-3 rounded-xl bg-green-50 border border-green-300 text-green-800 text-xs font-medium flex items-center gap-2 mb-3 shadow-sm animate-fade-in">
          <span>💾</span>
          <span>{borradorGuardadoMensaje}</span>
        </div>
      )}

      {borradorRecuperado && !borradorGuardadoMensaje && (
        <div className="p-3 rounded-xl bg-purple-50 border border-purple-300 text-purple-900 text-xs font-medium flex items-center justify-between gap-2 mb-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-sm">📂</span>
            <span>
              <strong>Borrador recuperado:</strong> Se han cargado tus datos guardados previamente. Continúas en el <strong>Paso {paso}</strong>.
            </span>
          </div>
          <button
            type="button"
            onClick={() => setBorradorRecuperado(false)}
            className="text-purple-600 hover:text-purple-800 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      <ErrorBanner />

      {/* ── PASO 1: SEMILLERO ────────────────────────────────────────────── */}
      {paso === 1 && (
        <div className="space-y-4">
          <SectionTitle>Información del Semillero</SectionTitle>
          <Field label="Tipo de institución" required error={errores1.tipo_institucion}>
            <Select
              options={tiposInstitucion.map((t) => ({ value: t, label: t }))}
              placeholder="Seleccionar..."
              value={tipoInstitucion}
              hasError={!!errores1.tipo_institucion}
              onChange={(v) => {
                setTipoInstitucion(v);
                setErrores1((p) => {
                  const n = { ...p };
                  delete n.tipo_institucion;
                  return n;
                });
                setGeneralError("");
              }}
            />
          </Field>
          <Field label="Procedencia" hint="Establecido automáticamente para convocatorias externas">
            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-theme-border bg-theme-bg-main text-sm cursor-not-allowed select-none">
              <span className="text-theme-text-main font-medium">{PROCEDENCIA_FIJA}</span>
              <span className="ml-auto text-theme-text-muted">🔒</span>
            </div>
          </Field>
          <Field label="Institución de procedencia" required error={errores1.institucion_procedencia}>
            <Input
              placeholder="Ej: Universidad Nacional de Colombia"
              value={institucionProcedencia}
              hasError={!!errores1.institucion_procedencia}
              onChange={(v) => {
                setInstitucionProcedencia(v);
                setErrores1((p) => {
                  const n = { ...p };
                  delete n.institucion_procedencia;
                  return n;
                });
                setGeneralError("");
              }}
            />
          </Field>
          <Field label="Semillero" required error={errores1.semillero_nombre}>
            <Input
              placeholder="Ej: Semillero de Investigación en IA"
              value={semilleroNombre}
              hasError={!!errores1.semillero_nombre}
              onChange={(v) => {
                setSemilleroNombre(v);
                setErrores1((p) => {
                  const n = { ...p };
                  delete n.semillero_nombre;
                  return n;
                });
                setGeneralError("");
              }}
            />
          </Field>
          <NavButtons onNext={avanzarPaso1} nextLabel="Continuar →" />
        </div>
      )}

      {/* ── PASO 2: INTEGRANTES ──────────────────────────────────────────── */}
      {paso === 2 && (
        <div className="space-y-4">
          {/* Banner de descarga de plantilla de asentimiento para menores */}
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50/50 to-emerald-50/30 border border-[#C8E6D2] flex flex-col gap-3 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <span className="text-xl shrink-0 mt-0.5">📄</span>
                <div>
                  <strong className="text-theme-text-main font-bold block">
                    ¿Tienes estudiantes menores de edad en el semillero?
                  </strong>
                  <p className="text-theme-text-muted text-[11px] leading-relaxed">
                    Si marcas a un estudiante como <strong>menor de edad</strong>, deberás adjuntar su formato de Asentimiento y Consentimiento Informado firmado por su acudiente legal.
                  </p>
                  {infoPlantilla?.personalizada && (
                    <p className="text-[11px] text-emerald-700 font-semibold mt-0.5">
                      📌 Plantilla institucional configurada: {infoPlantilla.nombre}
                    </p>
                  )}
                </div>
              </div>
              <a
                href={`http://localhost:4200/api/convocatorias/plantilla-asentimiento?convocatoria_id=${conv?.id || ""}&print=1`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-theme-primary text-white font-bold text-xs hover:bg-[#17563A] transition-all shrink-0 shadow-sm active:scale-95"
                title="Descargar formato oficial"
              >
                <span>📥</span> Descargar plantilla
              </a>
            </div>

            {/* Zona Admin para subir / cambiar la plantilla oficial (SOLO ADMINISTRADORES) */}
            {(user?.roles?.some((r: string) => r.toLowerCase() === "administrador" || r.toLowerCase() === "super administrador") || (userActual as any)?.rol?.toLowerCase() === "administrador") && (
              <div className="pt-2 border-t border-emerald-200/70 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-theme-text-muted font-medium flex items-center gap-1">
                  ⚙️ <strong>Zona Admin:</strong> Carga o actualiza el archivo oficial de plantilla (.docx, .pdf, .doc) para esta convocatoria.
                </span>
                <div className="flex items-center gap-2">
                  <label className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-emerald-800 font-semibold text-[11px] cursor-pointer hover:bg-emerald-50 shadow-2xs transition-all">
                    <span>{subiendoPlantillaAdmin ? "⏳ Subiendo..." : "📤 Cargar archivo plantilla"}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.xlsx"
                      className="hidden"
                      disabled={subiendoPlantillaAdmin}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !conv?.id) return;
                        setSubiendoPlantillaAdmin(true);
                        setMensajePlantillaAdmin("");
                        try {
                          const res = await subirPlantillaAsentimiento(file, conv.id);
                          setInfoPlantilla({
                            personalizada: true,
                            nombre: res.plantilla_nombre,
                            ruta: res.plantilla_ruta,
                          });
                          setMensajePlantillaAdmin(`✅ Plantilla actualizada: ${res.plantilla_nombre}`);
                          setTimeout(() => setMensajePlantillaAdmin(""), 4000);
                        } catch (err: unknown) {
                          alert(err instanceof Error ? err.message : "Error al subir plantilla");
                        } finally {
                          setSubiendoPlantillaAdmin(false);
                          e.target.value = "";
                        }
                      }}
                    />
                  </label>
                  {mensajePlantillaAdmin && (
                    <span className="text-[11px] text-emerald-700 font-bold">{mensajePlantillaAdmin}</span>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <SectionTitle>Integrantes del Semillero ({integrantes.length})</SectionTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setMostrarFormIntegrante(true);
                setErroresIntg({});
              }}
            >
              + Agregar integrante
            </Button>
          </div>

          {integrantes.length === 0 && !mostrarFormIntegrante && (
            <div className="text-center py-8 text-theme-text-muted bg-theme-bg-main rounded-xl border border-dashed border-theme-border">
              <p className="text-sm">No hay integrantes agregados.</p>
              <p className="text-xs mt-1">Debes agregar al menos uno para continuar.</p>
            </div>
          )}

          <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
            {integrantes.map((intg) => (
              <FilaIntegrante
                key={intg.id}
                integrante={intg}
                onEliminar={eliminarIntegrante}
                onToggleMayorEdad={toggleMayorEdadIntegrante}
                onSubirAsentimiento={subirAsentimientoFila}
                eliminando={false}
              />
            ))}
          </div>

          {mostrarFormIntegrante && (
            <div className="p-4 rounded-xl border border-[#C8E6D2] bg-theme-primary/10 space-y-3.5">
              <div className="flex items-center justify-between border-b border-theme-border/60 pb-2">
                <p className="text-sm font-bold text-theme-text-main">Nuevo integrante del semillero</p>
                <button
                  type="button"
                  onClick={() => {
                    setMostrarFormIntegrante(false);
                    setErroresIntg({});
                  }}
                  className="text-xs text-theme-text-muted hover:text-theme-text-main"
                >
                  ✕ Cerrar
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Field label="Nombre completo" required error={erroresIntg.nombre_completo}>
                  <Input
                    placeholder="Nombre completo del integrante"
                    value={nuevoIntg.nombre_completo}
                    onChange={(v) => {
                      setNuevoIntg((p) => ({ ...p, nombre_completo: v }));
                      setErroresIntg((p) => {
                        const n = { ...p };
                        delete n.nombre_completo;
                        return n;
                      });
                    }}
                    hasError={!!erroresIntg.nombre_completo}
                  />
                </Field>
                <Field label="Tipo de documento" required error={erroresIntg.tipo_documento}>
                  <Select
                    options={(
                      catalogos?.tipos_documento || ["CC", "TI", "CE", "Pasaporte", "Otro"]
                    ).map((t) => ({ value: t, label: t }))}
                    placeholder="Tipo doc..."
                    value={nuevoIntg.tipo_documento}
                    onChange={(v) => {
                      setNuevoIntg((p) => ({ ...p, tipo_documento: v }));
                      setErroresIntg((p) => {
                        const n = { ...p };
                        delete n.tipo_documento;
                        return n;
                      });
                    }}
                    hasError={!!erroresIntg.tipo_documento}
                  />
                </Field>
                <Field label="Número de documento (solo números)" required error={erroresIntg.numero_documento}>
                  <Input
                    placeholder="Ej: 1085234567"
                    value={nuevoIntg.numero_documento}
                    onChange={(v) => {
                      const soloNumeros = v.replace(/\D/g, "");
                      setNuevoIntg((p) => ({ ...p, numero_documento: soloNumeros }));
                      setErroresIntg((p) => {
                        const n = { ...p };
                        delete n.numero_documento;
                        return n;
                      });
                    }}
                    hasError={!!erroresIntg.numero_documento}
                  />
                </Field>
                <Field label="Rol" required error={erroresIntg.rol}>
                  <Select
                    options={(
                      catalogos?.roles_integrante || [
                        "Director",
                        "Coinvestigador",
                        "Estudiante",
                        "Auxiliar de Investigación",
                        "Otro",
                      ]
                    ).map((r) => ({ value: r, label: r }))}
                    placeholder="Rol..."
                    value={nuevoIntg.rol}
                    onChange={(v) => {
                      setNuevoIntg((p) => ({ ...p, rol: v }));
                      setErroresIntg((p) => {
                        const n = { ...p };
                        delete n.rol;
                        return n;
                      });
                    }}
                    hasError={!!erroresIntg.rol}
                  />
                </Field>
                <Field label="Correo electrónico" required error={erroresIntg.email}>
                  <Input
                    placeholder="correo@ejemplo.com"
                    value={nuevoIntg.email}
                    onChange={(v) => {
                      setNuevoIntg((p) => ({ ...p, email: v }));
                      setErroresIntg((p) => {
                        const n = { ...p };
                        delete n.email;
                        return n;
                      });
                    }}
                    hasError={!!erroresIntg.email}
                  />
                </Field>
                <Field label="Teléfono (solo números)" error={erroresIntg.telefono}>
                  <Input
                    placeholder="Ej: 3123456789"
                    value={nuevoIntg.telefono}
                    onChange={(v) => {
                      const soloNumeros = v.replace(/\D/g, "");
                      setNuevoIntg((p) => ({ ...p, telefono: soloNumeros }));
                      setErroresIntg((p) => {
                        const n = { ...p };
                        delete n.telefono;
                        return n;
                      });
                    }}
                    hasError={!!erroresIntg.telefono}
                  />
                </Field>
              </div>

              {/* Control ¿Es mayor de edad? y Subida de Asentimiento */}
              <div className="p-3.5 rounded-xl bg-white border border-[#BBDDC7] space-y-2.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-theme-text-main flex items-center gap-1.5">
                      <span>👤</span> ¿Es mayor de edad?
                    </label>
                    <p className="text-[11px] text-theme-text-muted">
                      Indica si el integrante tiene 18 años o más.
                    </p>
                  </div>
                  <div className="inline-flex items-center rounded-full p-0.5 bg-gray-100 border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setNuevoIntg((p) => ({ ...p, es_mayor_edad: true }))}
                      className={`px-4 py-1 text-xs rounded-full font-bold transition-all ${
                        nuevoIntg.es_mayor_edad
                          ? "bg-emerald-500 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Sí (+18)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNuevoIntg((p) => ({ ...p, es_mayor_edad: false }))}
                      className={`px-4 py-1 text-xs rounded-full font-bold transition-all ${
                        !nuevoIntg.es_mayor_edad
                          ? "bg-rose-500 text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      No (-18)
                    </button>
                  </div>
                </div>

                {!nuevoIntg.es_mayor_edad && (
                  <div className="p-3 rounded-lg bg-rose-50/70 border border-rose-200 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-rose-800 flex items-center gap-1">
                        <span>⚠️</span> Asentimiento Informado requerido (Menor de edad)
                      </span>
                      <a
                        href={`http://localhost:4200/api/convocatorias/plantilla-asentimiento?convocatoria_id=${conv?.id || ""}&print=1`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[11px] text-theme-primary font-bold hover:underline inline-flex items-center gap-1 shrink-0"
                      >
                        <span>📥</span> Descargar plantilla &rarr;
                      </a>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="flex-1 flex items-center justify-between px-3 py-2 rounded-lg bg-white border border-rose-300 cursor-pointer hover:bg-rose-50/50 transition-colors">
                        <span className="text-xs text-theme-text-main truncate font-medium">
                          {nuevoIntg.asentimiento_nombre ? `📄 ${nuevoIntg.asentimiento_nombre}` : "Seleccionar archivo firmado (PDF, JPG, PNG)..."}
                        </span>
                        {subiendoAsentimiento && <span className="text-[10px] text-theme-primary font-bold">Subiendo...</span>}
                        <input
                          type="file"
                          accept=".pdf,image/jpeg,image/png,image/webp,image/jpg"
                          className="hidden"
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (f) {
                              try {
                                setSubiendoAsentimiento(true);
                                const res = await subirAsentimientoIntegrante(conv.id, f);
                                if (res.ok) {
                                  setNuevoIntg((p) => ({
                                    ...p,
                                    asentimiento_nombre: res.asentimiento_nombre,
                                    asentimiento_ruta: res.asentimiento_ruta,
                                    asentimiento_peso_bytes: res.asentimiento_peso_bytes,
                                  }));
                                }
                              } catch (err: any) {
                                setGeneralError(err.message || "Error al subir asentimiento.");
                              } finally {
                                setSubiendoAsentimiento(false);
                              }
                            }
                          }}
                        />
                      </label>
                      {nuevoIntg.asentimiento_nombre && (
                        <button
                          type="button"
                          onClick={() =>
                            setNuevoIntg((p) => ({
                              ...p,
                              asentimiento_nombre: undefined,
                              asentimiento_ruta: undefined,
                              asentimiento_peso_bytes: undefined,
                            }))
                          }
                          className="px-2 py-1.5 text-xs text-rose-600 hover:text-rose-800 bg-rose-100/60 rounded-lg"
                          title="Quitar archivo"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setMostrarFormIntegrante(false);
                    setErroresIntg({});
                  }}
                >
                  Cancelar
                </Button>
                <Button variant="primary" size="sm" onClick={agregarIntegrante}>
                  Agregar a la lista
                </Button>
              </div>
            </div>
          )}

          <NavButtons onBack={() => setPaso(1)} onNext={avanzarPaso2} nextLabel="Continuar →" />
        </div>
      )}

      {/* ── PASO 3: INFORMACIÓN GENERAL ─────────────────────────────────── */}
      {paso === 3 && (
        <div className="space-y-4">
          <SectionTitle>Información General del Trabajo</SectionTitle>
          <Field label="Título del trabajo" required error={errores3.titulo_trabajo}>
            <Input
              placeholder="Título del proyecto o trabajo de investigación"
              value={tituloTrabajo}
              onChange={(v) => {
                setTituloTrabajo(v);
                setErrores3((p) => {
                  const n = { ...p };
                  delete n.titulo_trabajo;
                  return n;
                });
                setGeneralError("");
              }}
              hasError={!!errores3.titulo_trabajo}
            />
          </Field>
          <Field label="Línea de investigación">
            <Select
              options={(catalogos?.lineas_investigacion || []).map((l) => ({ value: l.nombre, label: l.nombre }))}
              placeholder="Seleccionar línea (opcional)"
              value={lineaInv}
              onChange={(v) => setLineaInv(v)}
            />
          </Field>
          <Field
            label="Palabras clave"
            required
            error={errores3.palabras_clave}
            hint="Separa con comas. Ej: inteligencia artificial, machine learning"
          >
            <Input
              placeholder="Ej: inteligencia artificial, datos, redes neuronales"
              value={palabrasClave}
              onChange={(v) => {
                setPalabrasClave(v);
                setErrores3((p) => {
                  const n = { ...p };
                  delete n.palabras_clave;
                  return n;
                });
                setGeneralError("");
              }}
              hasError={!!errores3.palabras_clave}
            />
          </Field>
          <Field label="Resumen" required error={errores3.resumen} hint={`${resumenInfo.length}/500 caracteres`}>
            <Textarea
              placeholder="Resumen del trabajo de investigación (máx. 500 caracteres)"
              value={resumenInfo}
              rows={4}
              onChange={(v) => {
                setResumenInfo(v);
                setErrores3((p) => {
                  const n = { ...p };
                  delete n.resumen;
                  return n;
                });
                setGeneralError("");
              }}
              hasError={!!errores3.resumen}
            />
          </Field>
          <NavButtons onBack={() => setPaso(2)} onNext={avanzarPaso3} nextLabel="Continuar →" />
        </div>
      )}

      {/* ── PASO 4: CONTENIDO DEL TRABAJO ───────────────────────────────── */}
      {paso === 4 && (
        <div className="space-y-4">
          <SectionTitle>Contenido del Trabajo</SectionTitle>
          <Field label="Planteamiento del problema" required error={errores4.planteamiento_problema}>
            <Textarea
              placeholder="Describe el problema que aborda la investigación..."
              value={planteamiento}
              rows={3}
              onChange={(v) => {
                setPlanteamiento(v);
                setErrores4((p) => {
                  const n = { ...p };
                  delete n.planteamiento_problema;
                  return n;
                });
                setGeneralError("");
              }}
              hasError={!!errores4.planteamiento_problema}
            />
          </Field>
          <Field label="Objetivo general" required error={errores4.objetivo_general}>
            <Textarea
              placeholder="Objetivo principal del trabajo..."
              value={objetivoGral}
              rows={3}
              onChange={(v) => {
                setObjetivoGral(v);
                setErrores4((p) => {
                  const n = { ...p };
                  delete n.objetivo_general;
                  return n;
                });
                setGeneralError("");
              }}
              hasError={!!errores4.objetivo_general}
            />
          </Field>
          <Field label="Objetivos específicos" required error={errores4.objetivos_especificos}>
            <Textarea
              placeholder="Lista los objetivos específicos..."
              value={objetivosEsp}
              rows={3}
              onChange={(v) => {
                setObjetivosEsp(v);
                setErrores4((p) => {
                  const n = { ...p };
                  delete n.objetivos_especificos;
                  return n;
                });
                setGeneralError("");
              }}
              hasError={!!errores4.objetivos_especificos}
            />
          </Field>
          <Field label="Metodología" required error={errores4.metodologia}>
            <Textarea
              placeholder="Describe la metodología a utilizar..."
              value={metodologia}
              rows={3}
              onChange={(v) => {
                setMetodologia(v);
                setErrores4((p) => {
                  const n = { ...p };
                  delete n.metodologia;
                  return n;
                });
                setGeneralError("");
              }}
              hasError={!!errores4.metodologia}
            />
          </Field>
          <Field label="Resultados esperados" required error={errores4.resultados_esperados}>
            <Textarea
              placeholder="¿Qué resultados o productos esperas obtener?..."
              value={resultados}
              rows={3}
              onChange={(v) => {
                setResultados(v);
                setErrores4((p) => {
                  const n = { ...p };
                  delete n.resultados_esperados;
                  return n;
                });
                setGeneralError("");
              }}
              hasError={!!errores4.resultados_esperados}
            />
          </Field>
          <NavButtons onBack={() => setPaso(3)} onNext={avanzarPaso4} nextLabel="Continuar →" />
        </div>
      )}

      {/* ── PASO 5: ENVÍO FINAL ──────────────────────────────────────────── */}
      {paso === 5 && (
        <div className="space-y-4">
          {inscripcionEnviada ? (
            <div className="text-center py-8 space-y-4">
              <div className="text-5xl">🎉</div>
              <h3 className="text-xl font-bold text-theme-primary">¡Inscripción enviada exitosamente!</h3>
              <p className="text-sm text-theme-text-muted max-w-md mx-auto">
                Tu solicitud de inscripción a la convocatoria externa ha sido registrada con toda la información
                del semillero, integrantes y contenido.
              </p>
              <div className="pt-2">
                <Button variant="primary" onClick={onClose}>
                  Cerrar
                </Button>
              </div>
            </div>
          ) : (
            <>
              <SectionTitle>Envío Final — Resumen y Confirmación</SectionTitle>

              <div className="space-y-3 text-sm">
                {/* Paso 1 summary */}
                <div className="p-3.5 rounded-xl border border-theme-border bg-theme-bg-main">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-theme-primary">✓ Paso 1 — Semillero</p>
                    <button
                      type="button"
                      onClick={() => setPaso(1)}
                      className="text-xs text-theme-primary font-semibold hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-theme-text-muted">Tipo de institución:</span>
                      <strong className="text-theme-text-main">{tipoInstitucion || "—"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-text-muted">Procedencia:</span>
                      <strong className="text-theme-text-main">{PROCEDENCIA_FIJA}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-text-muted">Institución:</span>
                      <strong className="text-theme-text-main">{institucionProcedencia || "—"}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-theme-text-muted">Semillero:</span>
                      <strong className="text-theme-text-main">{semilleroNombre || "—"}</strong>
                    </div>
                  </div>
                </div>

                {/* Paso 2 summary */}
                <div className="p-3.5 rounded-xl border border-theme-border bg-theme-bg-main">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-theme-primary">
                      ✓ Paso 2 — Integrantes ({integrantes.length})
                    </p>
                    <button
                      type="button"
                      onClick={() => setPaso(2)}
                      className="text-xs text-theme-primary font-semibold hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    {integrantes.map((intg, idx) => (
                      <div key={intg.id || idx} className="flex justify-between py-0.5 border-b border-theme-border last:border-none">
                        <div>
                          <span className="font-semibold text-theme-text-main">{intg.nombre_completo}</span>
                          <span className="text-theme-text-muted ml-2">({intg.rol})</span>
                        </div>
                        <span className="text-theme-text-muted">{intg.email}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Paso 3 summary */}
                <div className="p-3.5 rounded-xl border border-theme-border bg-theme-bg-main">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-theme-primary">✓ Paso 3 — Información general</p>
                    <button
                      type="button"
                      onClick={() => setPaso(3)}
                      className="text-xs text-theme-primary font-semibold hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-theme-text-muted">Título: </span>
                      <strong className="text-theme-text-main">{tituloTrabajo}</strong>
                    </div>
                    {lineaInv && (
                      <div>
                        <span className="text-theme-text-muted">Línea: </span>
                        <span className="text-theme-text-main font-medium">{lineaInv}</span>
                      </div>
                    )}
                    <div>
                      <span className="text-theme-text-muted">Palabras clave: </span>
                      <span className="text-theme-text-main">{palabrasClave}</span>
                    </div>
                  </div>
                </div>

                {/* Paso 4 summary */}
                <div className="p-3.5 rounded-xl border border-theme-border bg-theme-bg-main">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-bold text-theme-primary">✓ Paso 4 — Contenido del trabajo</p>
                    <button
                      type="button"
                      onClick={() => setPaso(4)}
                      className="text-xs text-theme-primary font-semibold hover:underline"
                    >
                      Editar
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div>
                      <span className="text-theme-text-muted">Planteamiento: </span>
                      <span className="text-theme-text-main line-clamp-2">{planteamiento}</span>
                    </div>
                    <div>
                      <span className="text-theme-text-muted">Objetivo general: </span>
                      <span className="text-theme-text-main line-clamp-2">{objetivoGral}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Documentos Adjuntos: Comprobante de Pago y Propuesta */}
              <div className="space-y-3.5 pt-1">
                <SectionTitle>Documentación y Comprobantes</SectionTitle>

                {/* Comprobante de Pago */}
                <div className={`p-3.5 rounded-xl border transition-colors space-y-2.5 ${
                  !comprobantePago ? "border-amber-300 bg-amber-50/40" : "border-[#C8E6D2] bg-[#F7FAF8]"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-theme-text-main flex items-center gap-1.5">
                      <span>💳</span> Comprobante de Pago de Inscripción <span className="text-red-500">*</span>
                    </label>
                    {comprobantePago ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <span>✓</span> Adjuntado
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Obligatorio *
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-theme-text-muted">
                    Adjunta el recibo o comprobante de pago emitido por la plataforma institucional (PDF, JPG, PNG o WEBP, máx. 15MB).
                  </p>

                  <div className="flex items-center gap-2.5">
                    <label className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                      comprobantePago ? "border-emerald-300 bg-white hover:bg-emerald-50/50" : "border-amber-300 bg-white hover:bg-amber-50/50"
                    }`}>
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm">📎</span>
                        <span className={`text-xs font-medium truncate ${comprobantePago ? "text-emerald-900 font-semibold" : "text-theme-text-muted"}`}>
                          {comprobantePago ? comprobantePago.name : "Seleccionar archivo de comprobante..."}
                        </span>
                      </div>
                      {comprobantePago && (
                        <span className="text-[10px] text-theme-text-muted shrink-0 ml-2 font-medium">
                          ({(comprobantePago.size / 1024).toFixed(1)} KB)
                        </span>
                      )}
                      <input
                        type="file"
                        accept=".pdf,image/jpeg,image/png,image/webp,image/jpg"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setComprobantePago(f);
                            setGeneralError("");
                          }
                        }}
                      />
                    </label>
                    {comprobantePago && (
                      <button
                        type="button"
                        onClick={() => setComprobantePago(null)}
                        className="px-2.5 py-2 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
                        title="Quitar archivo"
                      >
                        ✕ Quitar
                      </button>
                    )}
                  </div>

                  <div className="text-[11px] text-[#4B5563] pt-0.5 flex items-center justify-between">
                    <span>¿Aún no has cancelado la inscripción?</span>
                    <a
                      href="https://extension.unicatolicadelsur.edu.co/register"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold text-theme-primary hover:underline inline-flex items-center gap-1"
                    >
                      <span>💳</span> Pagar aquí en línea &rarr;
                    </a>
                  </div>
                </div>

                {/* Documento adjunto obligatorio: Propuesta de investigación */}
                <div className={`p-3.5 rounded-xl border transition-colors space-y-2.5 ${
                  !docFinal ? "border-amber-300 bg-amber-50/40" : "border-[#C8E6D2] bg-[#F7FAF8]"
                }`}>
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-theme-text-main flex items-center gap-1.5">
                      <span>📄</span> Propuesta de Investigación o Aval <span className="text-red-500">*</span>
                    </label>
                    {docFinal ? (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                        <span>✓</span> Adjuntado
                      </span>
                    ) : (
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                        Obligatorio *
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-theme-text-muted">
                    Adjunta el documento en formato PDF con la propuesta de investigación detallada o carta de aval (máx. 25MB).
                  </p>

                  <div className="flex items-center gap-2.5">
                    <label className={`flex-1 flex items-center justify-between px-3 py-2 rounded-xl border cursor-pointer transition-colors ${
                      docFinal ? "border-emerald-300 bg-white hover:bg-emerald-50/50" : "border-amber-300 bg-white hover:bg-amber-50/50"
                    }`}>
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-sm">📄</span>
                        <span className={`text-xs font-medium truncate ${docFinal ? "text-emerald-900 font-semibold" : "text-theme-text-muted"}`}>
                          {docFinal ? docFinal.name : "Seleccionar archivo PDF..."}
                        </span>
                      </div>
                      {docFinal && (
                        <span className="text-[10px] text-theme-text-muted shrink-0 ml-2 font-medium">
                          ({(docFinal.size / 1024).toFixed(1)} KB)
                        </span>
                      )}
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) {
                            setDocFinal(f);
                            setGeneralError("");
                          }
                        }}
                      />
                    </label>
                    {docFinal && (
                      <button
                        type="button"
                        onClick={() => setDocFinal(null)}
                        className="px-2.5 py-2 text-xs font-semibold text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors"
                        title="Quitar archivo"
                      >
                        ✕ Quitar
                      </button>
                    )}
                  </div>
                </div>

                {/* Alerta si hay menores sin formato de asentimiento */}
                {integrantes.some((it) => it.es_mayor_edad === false && !it.asentimiento_ruta && !it.asentimiento_nombre) && (
                  <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-start gap-2">
                      <span className="text-base shrink-0">⚠️</span>
                      <div>
                        <p className="font-bold">Faltan formatos de asentimiento informado</p>
                        <p className="text-[11px] text-amber-800 mt-0.5">
                          Hay integrantes menores de edad que no tienen su formato cargado. Debes regresar al Paso 2 para adjuntarlo.
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaso(2)}
                      className="shrink-0 px-2.5 py-1 text-xs font-semibold bg-amber-200 hover:bg-amber-300 text-amber-900 rounded-lg transition-colors"
                    >
                      Ir al Paso 2 &rarr;
                    </button>
                  </div>
                )}
              </div>

              {/* ── Aviso y Autorización de Tratamiento de Datos Personales (Semillero Externo) ── */}
              <div className="p-4 rounded-xl border bg-[#F4F9F6] border-[#C8E6D2] space-y-2">
                <div className="flex items-start gap-2.5">
                  <span className="text-base text-theme-primary shrink-0 mt-0.5">🛡️</span>
                  <div className="space-y-1.5 text-xs">
                    <p className="font-bold text-theme-text-main">
                      Aviso de Privacidad y Tratamiento de Datos Personales
                    </p>
                    <p className="text-[#4B5563] leading-relaxed text-[11px]">
                      En cumplimiento de la Ley Estatutaria 1581 de 2012 y el régimen general de Protección de Datos Personales, los datos suministrados sobre la institución, integrantes del semillero y propuesta serán almacenados y tratados exclusivamente para la gestión, evaluación, seguimiento y contacto institucional en el marco de las convocatorias NOUS.
                    </p>
                    <label className="flex items-start gap-2 pt-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={autorizaDatos}
                        onChange={(e) => {
                          setAutorizaDatos(e.target.checked);
                          if (e.target.checked) setGeneralError("");
                        }}
                        className="mt-0.5 w-4 h-4 rounded text-theme-primary border-gray-300 focus:ring-theme-primary accent-theme-primary shrink-0"
                      />
                      <span className="text-xs font-semibold text-theme-text-main leading-tight">
                        Autorizo de manera previa, expresa e informada el tratamiento de los datos personales e institucionales suministrados. <span className="text-red-500">*</span>
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-theme-primary/10 border border-[#C8E6D2]">
                <p className="text-xs text-theme-primary font-medium">
                  Al presionar "Guardar y Enviar inscripción" se registrará formalmente toda la información ingresada.
                </p>
              </div>

              <NavButtons
                onBack={() => setPaso(4)}
                onNext={enviarFinal}
                nextLabel="🚀 Guardar y Enviar inscripción"
                nextDisabled={
                  saving ||
                  !autorizaDatos ||
                  !comprobantePago ||
                  !docFinal ||
                  integrantes.some((it) => it.es_mayor_edad === false && !it.asentimiento_ruta && !it.asentimiento_nombre)
                }
              />
            </>
          )}
        </div>
      )}
    </Modal>
  );
}


// ─── Modal Confirmar Eliminación Convocatoria ───────────────────────────────
function EliminarConvocatoriaModal({
  conv,
  onClose,
  onDeleted,
}: {
  conv: Convocatoria | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");

  if (!conv) return null;

  const codigo = conv.codigo_con || conv.codigo || `CON${conv.id}`;

  const handleEliminar = async () => {
    try {
      setEliminando(true);
      setError("");
      await eliminarConvocatoria(conv.id);
      onClose();
      onDeleted();
    } catch (e: any) {
      console.error("Error al eliminar convocatoria:", e);
      setError(e?.message || "No se pudo eliminar la convocatoria. Intente nuevamente.");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <Modal open={!!conv} onClose={onClose} title="Eliminar Convocatoria" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800">
          <span className="text-2xl">⚠️</span>
          <div className="text-sm">
            <p className="font-bold">¿Está seguro de que desea eliminar esta convocatoria?</p>
            <p className="text-xs text-red-700 mt-1">
              Esta acción no se puede deshacer. Se eliminará permanentemente la convocatoria y sus registros asociados.
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-theme-bg-main border border-theme-border rounded-xl text-xs space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-theme-primary bg-theme-primary/10 px-2 py-0.5 rounded border border-[#C8E6D2]">
              {codigo}
            </span>
            <span className="font-semibold text-theme-text-main text-sm truncate">{conv.titulo}</span>
          </div>
          {conv.descripcion && (
            <p className="text-theme-text-muted line-clamp-2">{conv.descripcion}</p>
          )}
          <div className="flex flex-wrap gap-3 text-theme-text-muted pt-1">
            <span>📅 Apertura: <strong>{conv.fecha_apertura ? new Date(conv.fecha_apertura).toLocaleDateString("es-CO") : "—"}</strong></span>
            <span>🔒 Cierre: <strong>{conv.fecha_cierre ? new Date(conv.fecha_cierre).toLocaleDateString("es-CO") : "—"}</strong></span>
            <span>🏷️ Estado: <strong className="capitalize">{conv.estado}</strong></span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-theme-border">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={eliminando}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleEliminar}
            disabled={eliminando}
          >
            {eliminando ? "Eliminando..." : "🗑️ Sí, eliminar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

// ─── Modal Confirmar Eliminación Convocatoria Externa ───────────────────────
function EliminarExternaModal({
  conv,
  onClose,
  onDeleted,
}: {
  conv: ConvocatoriaExterna | null;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState("");

  if (!conv) return null;

  const codigo = conv.codigo || conv.codigo_ext || `EXT${conv.id}`;

  const handleEliminar = async () => {
    try {
      setEliminando(true);
      setError("");
      await eliminarConvocatoriaExterna(conv.id);
      onClose();
      onDeleted();
    } catch (e: any) {
      console.error("Error al eliminar convocatoria externa:", e);
      setError(e?.message || "No se pudo eliminar la convocatoria externa.");
    } finally {
      setEliminando(false);
    }
  };

  return (
    <Modal open={!!conv} onClose={onClose} title="Eliminar Convocatoria Externa" size="md">
      <div className="space-y-4">
        <div className="flex items-start gap-3 p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-800">
          <span className="text-2xl">⚠️</span>
          <div className="text-sm">
            <p className="font-bold">¿Está seguro de que desea eliminar esta convocatoria externa?</p>
            <p className="text-xs text-red-700 mt-1">
              Esta acción no se puede deshacer. Se eliminará del banco de convocatorias externas.
            </p>
          </div>
        </div>

        <div className="p-3.5 bg-theme-bg-main border border-theme-border rounded-xl text-xs space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="font-mono font-bold text-theme-primary bg-theme-primary/10 px-2 py-0.5 rounded border border-[#C8E6D2]">
              {codigo}
            </span>
            <span className="font-semibold text-theme-text-main text-sm truncate">{conv.titulo}</span>
          </div>
          {conv.entidad_externa && (
            <p className="text-theme-text-muted">🏛️ Entidad: <strong className="text-theme-text-main">{conv.entidad_externa}</strong></p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-theme-border">
          <Button variant="ghost" size="sm" onClick={onClose} disabled={eliminando}>
            Cancelar
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleEliminar}
            disabled={eliminando}
          >
            {eliminando ? "Eliminando..." : "🗑️ Sí, eliminar"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

type Tab = "todas" | "internas" | "externas" | "conjunta" | "borrador" | "alertas";
export function Convocatorias({ user }: { user?: UsuarioMe | null }) {
  const [activeTab, setActiveTab] = useState<Tab>("todas");
  const [showWizard, setShowWizard] = useState(false);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Convocatoria | null>(null);
  const [editingConv, setEditingConv] = useState<Convocatoria | null>(null);
  const [deletingConv, setDeletingConv] = useState<Convocatoria | null>(null);
  const [inscribiendoConv, setInscribiendoConv] = useState<Convocatoria | null>(null);
  // Estado para flujo de inscripción en convocatorias externas (Paso 1: Semillero)
  const [semilleroExternoConv, setSemilleroExternoConv] = useState<Convocatoria | null>(null);
  const [misBorradores, setMisBorradores] = useState<any[]>([]);
  const [showPlantillaModal, setShowPlantillaModal] = useState(false);
  const [plantillaConvTarget, setPlantillaConvTarget] = useState<Convocatoria | null>(null);

  const [search, setSearch] = useState("");
  const [filterEstado, setFilterEstado] = useState("todos");

  const cargar = useCallback(() => {
    setLoading(true);
    const u = getUsuarioActual();
    Promise.all([
      getConvocatorias(),
      getMisBorradores(u?.id).catch(() => ({ borradores: [] })),
    ])
      .then(([convs, borrsData]) => {
        setConvocatorias(convs);
        setMisBorradores(borrsData?.borradores || []);
      })
      .catch((e) => console.error("Error cargando convocatorias:", e))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const isEstudiante = user?.roles?.some(r => r.toLowerCase().includes("estudiante"));
  const isExternoRestrictivo = user?.roles?.some(r => r.toLowerCase().includes("externo")) && !user?.roles?.some(r => ["administrador", "admin", "directivos", "director_investigacion", "coordinador_investigacion", "docente"].includes(r.toLowerCase()));
  const puedeCrearConvocatoria = !isExternoRestrictivo && !isEstudiante && (user?.permisos?.includes('convocatorias.crear') || user?.roles?.some(r => r.toLowerCase().includes('admin') || r.toLowerCase().includes('director') || r.toLowerCase().includes('coordinador')));

  const convocatoriasPermitidas = convocatorias.filter(c => {
    const isConvExterna = (c.tipo ?? "").toLowerCase() === "externa" || (c.tipo ?? "").toLowerCase() === "externas";
    return (!isEstudiante || (c.dirigida_a && c.dirigida_a.toLowerCase().includes("estudiante"))) &&
           (!isExternoRestrictivo || isConvExterna);
  });

  const filtradas = convocatoriasPermitidas.filter((c) => {
    const cod = (c.codigo_con || c.codigo || "").toLowerCase();
    const matchSearch =
      !search ||
      c.titulo.toLowerCase().includes(search.toLowerCase()) ||
      cod.includes(search.toLowerCase()) ||
      (c.tipo_investigacion ?? "").toLowerCase().includes(search.toLowerCase());
    
    const tieneBorrador = misBorradores.some((b) => b.convocatoria_id === c.id);
    const matchEstado =
      filterEstado === "todos" ||
      c.estado === filterEstado ||
      (filterEstado === "borrador" && (c.estado === "borrador" || tieneBorrador));

    let matchTipo = true;
    const tipoLower = (c.tipo ?? "").toLowerCase();
    const isConvExterna = tipoLower === "externa" || tipoLower === "externas";

    if (activeTab === "internas") {
      matchTipo = tipoLower === "interna" || tipoLower === "internas";
    } else if (activeTab === "externas") {
      matchTipo = isConvExterna;
    } else if (activeTab === "conjunta") {
      matchTipo = tipoLower === "conjunta" || tipoLower === "conjuntas";
    } else if (activeTab === "borrador") {
      matchTipo = c.estado === "borrador" || tieneBorrador;
    }

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
          (puedeCrearConvocatoria || user?.roles?.some(r => r.toLowerCase().includes('admin'))) && (
            <div className="flex items-center gap-2">
              {user?.roles?.some(r => r.toLowerCase().includes('admin')) && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setPlantillaConvTarget(null);
                    setShowPlantillaModal(true);
                  }}
                >
                  📄 Plantilla Asentimiento
                </Button>
              )}
              {puedeCrearConvocatoria && (
                <Button variant="primary" onClick={() => setShowWizard(true)}>
                  + Nueva Convocatoria
                </Button>
              )}
            </div>
          )
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Abiertas", value: convocatoriasPermitidas.filter(c => c.estado === "activa" || c.estado === "publicada").length, color: "var(--theme-primary)" },
          { label: "En evaluación", value: convocatoriasPermitidas.filter(c => c.estado === "evaluacion").length, color: "#D97706" },
          { label: "Cerradas", value: convocatoriasPermitidas.filter(c => c.estado === "cerrada").length, color: "#9CA3AF" },
          { label: "Total", value: convocatoriasPermitidas.length, color: "#2563EB" },
        ].map((s) => (
          <div key={s.label} className="bg-theme-bg-card border border-theme-border rounded-xl p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: s.color + "15", color: s.color }}>
              {s.value}
            </div>
            <p className="text-sm text-theme-text-muted font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-theme-bg-card border border-theme-border rounded-xl overflow-hidden">
        <div className="flex border-b border-theme-border overflow-x-auto">
          {([
            { id: "todas" as Tab, label: "Todas", icon: "📋" },
            { id: "internas" as Tab, label: "Internas", icon: "🏫" },
            { id: "externas" as Tab, label: "Externas", icon: "🌐" },
            { id: "conjunta" as Tab, label: "Conjunta", icon: "🤝" },
            { id: "borrador" as Tab, label: "Borradores", icon: "📝" },
            { id: "alertas" as Tab, label: "Alertas", icon: "🔔" },
          ]).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${activeTab === tab.id
                  ? "border-theme-primary text-theme-primary bg-theme-primary/10"
                  : "border-transparent text-theme-text-muted hover:text-theme-text-main hover:bg-theme-bg-main"
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
          {activeTab === "alertas" ? (
            <AlertasTab user={user} />
          ) : (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="flex-1 min-w-[200px] relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-theme-text-muted text-sm">🔍</span>
                  <input
                    type="text"
                    placeholder="Buscar convocatoria por nombre, tipo o código CON..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 text-sm border border-theme-border rounded-xl bg-theme-bg-main focus:outline-none focus:border-theme-primary transition-colors"
                  />
                </div>
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="text-xs text-red-500 hover:text-red-700 font-medium"
                  >
                    ✕ Limpiar búsqueda
                  </button>
                )}
              </div>

              {loading && (
                <div className="text-center py-12 text-theme-text-muted">Cargando convocatorias...</div>
              )}
              {!loading && filtradas.length === 0 && (
                <div className="text-center py-12 text-theme-text-muted bg-theme-bg-main rounded-xl border border-theme-border">
                  {convocatorias.length === 0
                    ? "No hay convocatorias registradas aún."
                    : "No hay convocatorias que coincidan con los filtros aplicados."}
                </div>
              )}
              {filtradas.map((c) => {
                const borrador = misBorradores.find((b) => b.convocatoria_id === c.id);
                return (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <span className="text-xs font-mono font-bold text-theme-primary bg-theme-primary/10 px-2.5 py-0.5 rounded-md border border-[#C8E6D2]">
                            {c.codigo_con || c.codigo || `CON${c.id}`}
                          </span>
                          <Badge variant={estadoBadge(c.estado)} />
                          {borrador && (
                            <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 font-semibold border border-purple-200 flex items-center gap-1">
                              <span>🟣</span> Borrador guardado
                            </span>
                          )}
                          {c.tipo && (
                            <span className="text-xs bg-theme-bg-main text-theme-text-muted px-2 py-0.5 rounded font-medium">
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
                        </div>
                        <h3 className="text-base font-bold text-theme-text-main mb-1">{c.titulo}</h3>
                        {c.descripcion && (
                          <p className="text-xs text-theme-text-muted mb-2 line-clamp-2 max-w-2xl">{c.descripcion}</p>
                        )}
                        <div className="flex flex-wrap gap-4 text-xs text-theme-text-muted">
                          <span>📅 Apertura: <strong className="text-theme-text-main">{formatDate(c.fecha_apertura)}</strong></span>
                          <span>🔒 Cierre: <strong className="text-theme-text-main">{formatDate(c.fecha_cierre)}</strong></span>
                          {c.creado_por_nombre && (
                            <span>👤 Creado por: <strong className="text-theme-text-main">{c.creado_por_nombre}</strong></span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2 flex-shrink-0">
                        <div className="flex gap-2 flex-wrap justify-end">
                          {(user?.permisos?.includes('convocatorias.editar') || user?.roles?.includes('administrador')) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingConv(c)}
                            >
                              ✏️ Editar
                            </Button>
                          )}
                          {(user?.permisos?.includes('convocatorias.eliminar') || user?.roles?.includes('administrador')) && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                              onClick={() => setDeletingConv(c)}
                            >
                              🗑️ Eliminar
                            </Button>
                          )}
                          <Button
                            variant={borrador ? "secondary" : "ghost"}
                            size="sm"
                            className={borrador ? "border-purple-300 bg-purple-50 text-purple-800 font-semibold hover:bg-purple-100" : ""}
                            onClick={() => {
                              if (c.tipo === "Externa") {
                                setSemilleroExternoConv(c);
                              } else {
                                setInscribiendoConv(c);
                              }
                            }}
                          >
                            {borrador ? "✏️ Continuar inscripción" : "📝 Inscribirse"}
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
                );
              })}
            </div>
          )}
        </div>
      </div>

      <WizardModal open={showWizard} onClose={() => setShowWizard(false)} onCreated={cargar} />
      <DetailModal
        conv={selected}
        user={user}
        onClose={() => setSelected(null)}
        onEliminar={(c) => setDeletingConv(c)}
        onInscribirse={(c) => {
          setSelected(null);
          if (c.tipo === "Externa") {
            setSemilleroExternoConv(c);
          } else {
            setInscribiendoConv(c);
          }
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
      <EliminarConvocatoriaModal
        conv={deletingConv}
        onClose={() => setDeletingConv(null)}
        onDeleted={cargar}
      />
      <SemilleroExternoModal
        conv={semilleroExternoConv}
        user={user}
        onClose={() => setSemilleroExternoConv(null)}
        onGuardado={cargar}
      />
      <GestionarPlantillaModal
        open={showPlantillaModal}
        onClose={() => setShowPlantillaModal(false)}
        convocatorias={convocatorias}
        convocatoriaSeleccionada={plantillaConvTarget}
      />
    </div>
  );
}