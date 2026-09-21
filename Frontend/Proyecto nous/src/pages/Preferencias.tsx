import React, { useState, useEffect } from "react";
import { PageHeader, Card, SectionTitle, Button } from "@/components/ui";
import { preferenciasApi, type PreferenciasNotificacion } from "@/services/api";
import { useTranslation } from "react-i18next";

export function Preferencias({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const { t, i18n } = useTranslation();
  const [pref, setPref] = useState<PreferenciasNotificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [exito, setExito] = useState(false);

  useEffect(() => {
    cargarPreferencias();
  }, []);

  const cargarPreferencias = async () => {
    try {
      const data = await preferenciasApi.getPreferencias();
      setPref(data);
      if (data.idioma && i18n.language !== data.idioma) {
        i18n.changeLanguage(data.idioma);
      }
    } catch (err: any) {
      setError(err.message || "Error al cargar preferencias");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (campo: keyof PreferenciasNotificacion) => {
    if (!pref) return;
    setPref({ ...pref, [campo]: !pref[campo] });
  };

  const handleIdioma = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!pref) return;
    setPref({ ...pref, idioma: e.target.value });
  };

  const guardar = async () => {
    if (!pref) return;
    setSaving(true);
    setError("");
    setExito(false);
    try {
      await preferenciasApi.updatePreferencias(pref);
      setExito(true);
      if (i18n.language !== pref.idioma) {
        i18n.changeLanguage(pref.idioma);
      }
      setTimeout(() => {
        setExito(false);
        if (onNavigate) onNavigate("dashboard");
      }, 800);
    } catch (err: any) {
      setError(err.message || "Error al guardar preferencias");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-6 text-theme-text-muted">Cargando preferencias...</div>;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <PageHeader title={t("preferencias", "Preferencias")} />

      {error && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{error}</div>}
      {exito && <div className="p-3 bg-green-50 text-green-700 text-sm rounded-md">Preferencias guardadas exitosamente.</div>}

      <Card>
        <SectionTitle>Notificaciones por Correo Electrónico</SectionTitle>
        <p className="text-sm text-theme-text-muted mb-4 mt-1">
          Configura qué tipo de correos deseas recibir en tu cuenta institucional.
        </p>

        <div className="space-y-4">
          <ToggleItem 
            label="Cuando se publique una convocatoria nueva" 
            checked={pref?.notif_convocatoria_nueva ?? true} 
            onChange={() => handleToggle("notif_convocatoria_nueva")} 
          />
          <ToggleItem 
            label="Cuando una convocatoria a la que estoy inscrito esté por vencer" 
            checked={pref?.notif_convocatoria_por_vencer ?? true} 
            onChange={() => handleToggle("notif_convocatoria_por_vencer")} 
          />
          <ToggleItem 
            label="Cuando me asignen una evaluación" 
            checked={pref?.notif_evaluacion_asignada ?? true} 
            onChange={() => handleToggle("notif_evaluacion_asignada")} 
          />
          <ToggleItem 
            label="Cuando cambie el estado de mi proyecto o convocatoria" 
            checked={pref?.notif_cambio_estado ?? true} 
            onChange={() => handleToggle("notif_cambio_estado")} 
          />
          <ToggleItem 
            label="Resumen semanal por correo" 
            checked={pref?.notif_resumen_semanal ?? false} 
            onChange={() => handleToggle("notif_resumen_semanal")} 
          />
        </div>
      </Card>

      <Card>
        <SectionTitle>Idioma</SectionTitle>
        <p className="text-sm text-theme-text-muted mb-4 mt-1">
          Selecciona el idioma de la plataforma (las traducciones se implementarán gradualmente).
        </p>
        <div className="max-w-xs">
          <select 
            className="w-full px-3 py-2 bg-theme-bg-main border border-theme-border rounded-md text-theme-text-main focus:outline-none focus:ring-2 focus:ring-theme-primary/50"
            value={pref?.idioma || 'es'}
            onChange={handleIdioma}
          >
            <option value="es">Español</option>
            <option value="en">English</option>
          </select>
        </div>
      </Card>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="outline" onClick={cargarPreferencias}>Descartar cambios</Button>
        <Button variant="primary" onClick={guardar} disabled={saving}>{saving ? "Guardando..." : "Guardar preferencias"}</Button>
      </div>
    </div>
  );
}

function ToggleItem({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label className="flex items-center justify-between p-3 border border-theme-border rounded-lg hover:bg-theme-bg-main cursor-pointer transition-colors">
      <span className="text-sm text-theme-text-main">{label}</span>
      <div className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-theme-primary' : 'bg-gray-300 dark:bg-gray-600'}`}>
        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
      </div>
      {/* Input hidden to make it accessible */}
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
    </label>
  );
}
