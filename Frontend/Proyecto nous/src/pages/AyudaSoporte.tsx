import React, { useState, useEffect } from "react";
import { PageHeader, Card, Button, Input, Field, Select, Textarea, Badge } from "@/components/ui";
import { soporteApi, type ReporteSoporte } from "@/services/api";

const PREGUNTAS_FRECUENTES = [
  {
    pregunta: "¿Olvidé mi contraseña, qué hago?",
    respuesta: 'Usa "¿Olvidaste tu contraseña?" en la pantalla de login.'
  },
  {
    pregunta: "¿Cómo activo la autenticación multifactor (MFA)?",
    respuesta: 'Ve a Mi Perfil → Seguridad → Activar MFA.'
  },
  {
    pregunta: "No veo un módulo que debería ver",
    respuesta: 'Contacta al administrador, probablemente tu rol no tiene ese permiso asignado.'
  },
  {
    pregunta: "¿Cómo me inscribo a una convocatoria?",
    respuesta: 'Ve a Convocatorias, abre la convocatoria de tu interés y usa el botón "Inscribirse".'
  },
  {
    pregunta: "¿Dónde encuentro los formatos institucionales?",
    respuesta: 'En el menú "Gestión Documental".'
  }
];

export function AyudaSoporte() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  
  // Formulario de reporte
  const [categoria, setCategoria] = useState("");
  const [asunto, setAsunto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [loading, setLoading] = useState(false);
  const [reportes, setReportes] = useState<ReporteSoporte[]>([]);

  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    try {
      const data = await soporteApi.misReportes();
      setReportes(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnviarReporte = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!categoria || !asunto || !descripcion) return;
    setLoading(true);
    try {
      await soporteApi.crear({ categoria, asunto, descripcion });
      alert("Reporte enviado con éxito");
      setCategoria("");
      setAsunto("");
      setDescripcion("");
      cargarReportes();
    } catch (err: any) {
      alert(err.message || "Error al enviar el reporte");
    } finally {
      setLoading(false);
    }
  };

  const getEstadoColor = (estado: string) => {
    switch(estado) {
      case 'pendiente': return 'warning';
      case 'en_revision': return 'info';
      case 'resuelto': return 'success';
      default: return 'gray';
    }
  };

  return (
    <div className="p-6 max-w-[1200px] mx-auto space-y-5">
      <PageHeader
        title="Ayuda y Soporte"
        subtitle="Encuentra respuestas rápidas o contacta al equipo de soporte"
        breadcrumb={["NOUS", "Ayuda y Soporte"]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Columna Izquierda: FAQ y Contacto */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-bold text-theme-text-main mb-4">Preguntas Frecuentes</h2>
            <div className="divide-y divide-[#F2F5F3]">
              {PREGUNTAS_FRECUENTES.map((faq, i) => (
                <div key={i} className="py-3">
                  <button
                    className="w-full flex items-center justify-between text-left focus:outline-none group"
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  >
                    <span className="text-sm font-semibold text-theme-text-main group-hover:text-theme-primary transition-colors">
                      {faq.pregunta}
                    </span>
                    <svg
                      className={`w-4 h-4 text-theme-text-muted transition-transform ${openFaq === i ? "rotate-180" : ""}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {openFaq === i && (
                    <p className="mt-2 text-sm text-theme-text-muted leading-relaxed">
                      {faq.respuesta}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-theme-primary/10 flex items-center justify-center text-2xl flex-shrink-0">
                📩
              </div>
              <div>
                <h2 className="text-base font-bold text-theme-text-main">Contacto Directo</h2>
                <p className="text-sm text-theme-text-muted mt-1 leading-relaxed">
                  Durante la fase de práctica/piloto, puedes contactarnos directamente al correo:
                  <br />
                  <a href="mailto:practicante.inv1@unicatolicadelsur.edu.co" className="font-semibold text-theme-primary hover:underline">
                    practicante.inv1@unicatolicadelsur.edu.co
                  </a>
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Columna Derecha: Reportar Problema */}
        <div className="space-y-6">
          <Card>
            <h2 className="text-base font-bold text-theme-text-main mb-4">Reportar un problema</h2>
            <form onSubmit={handleEnviarReporte} className="space-y-4">
              <Field label="Categoría" required>
                <Select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  options={[
                    { value: '', label: 'Selecciona una categoría' },
                    { value: 'error_tecnico', label: 'Error técnico' },
                    { value: 'duda_uso', label: 'Duda de uso' },
                    { value: 'solicitud_acceso', label: 'Solicitud de acceso' },
                    { value: 'otro', label: 'Otro' },
                  ]}
                  placeholder="Selecciona una categoría"
                />
              </Field>
              <Field label="Asunto" required>
                <Input
                  value={asunto}
                  onChange={(e) => setAsunto(e.target.value)}
                  placeholder="Breve descripción del problema"
                />
              </Field>
              <Field label="Descripción detallada" required>
                <Textarea
                  value={descripcion}
                  onChange={(e) => setDescripcion(e.target.value)}
                  placeholder="Explica qué ocurrió, pasos para reproducirlo, etc."
                  rows={4}
                />
              </Field>
              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" disabled={loading || !categoria || !asunto || !descripcion}>
                  {loading ? "Enviando..." : "Enviar Reporte"}
                </Button>
              </div>
            </form>
          </Card>

          {reportes.length > 0 && (
            <Card>
              <h2 className="text-base font-bold text-theme-text-main mb-4">Mis reportes anteriores</h2>
              <div className="space-y-3">
                {reportes.map(r => (
                  <div key={r.id} className="p-4 rounded-xl border border-theme-border bg-theme-bg-main">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-gray-100 text-gray-700 uppercase tracking-wider">
                        {r.categoria.replace('_', ' ')}
                      </span>
                      <Badge variant={getEstadoColor(r.estado) as any}>
                        {r.estado.replace('_', ' ')}
                      </Badge>
                    </div>
                    <p className="text-sm font-bold text-theme-text-main">{r.asunto}</p>
                    <p className="text-xs text-theme-text-muted mt-1">{new Date(r.fecha_creacion).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
