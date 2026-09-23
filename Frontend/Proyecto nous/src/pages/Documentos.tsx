import React, { useState, useEffect, useRef } from "react";
import { Badge, Button, Card, PageHeader, Modal, Field, Input } from "@/components/ui";
import { type UsuarioMe, documentosApi, type FormatoInstitucional, getToken } from "@/services/api";

const docTypeColors: Record<string, { bg: string; color: string; icon: string }> = {
  Investigación: { bg: "#EBF5EF", color: "var(--theme-primary)", icon: "📋" },
  "Investigación Formativa": { bg: "#EFF6FF", color: "#2563EB", icon: "📊" },
  Semilleros: { bg: "#FFF8E6", color: "#D4930B", icon: "🌱" },
  "Ético/Legal": { bg: "#ECFEFF", color: "#0891B2", icon: "⚖️" },
  Emprendimiento: { bg: "#F5F3FF", color: "#7C3AED", icon: "🚀" },
};

export function Documentos({ user }: { user?: UsuarioMe | null }) {
  const [activeFilter, setActiveFilter] = useState("Todos");
  const [documentos, setDocumentos] = useState<FormatoInstitucional[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ codigo: "", nombre: "", categoria: "Investigación", version: "" });
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categorias = ["Investigación", "Investigación Formativa", "Semilleros", "Ético/Legal", "Emprendimiento"];
  const filtros = ["Todos", ...categorias];

  const fetchDocumentos = async () => {
    try {
      setLoading(true);
      const data = await documentosApi.obtenerFormatos(activeFilter);
      setDocumentos(data);
    } catch (err) {
      console.error("Error al cargar documentos", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocumentos();
  }, [activeFilter]);

  const handleDescargar = async (doc: FormatoInstitucional) => {
    try {
      const token = getToken();
      const headers: Record<string, string> = {};
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const res = await fetch(documentosApi.getDescargarUrl(doc.id), { headers });
      if (!res.ok) throw new Error("Error al descargar archivo");
      
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${doc.codigo} - ${doc.nombre}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("No se pudo descargar el archivo.");
    }
  };

  const handleEliminar = async (id: number) => {
    if (!confirm("¿Está seguro de eliminar este formato? Esta acción no se puede deshacer.")) return;
    try {
      await documentosApi.eliminarFormato(id);
      fetchDocumentos();
    } catch (error: any) {
      alert(error.message || "Error al eliminar");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    if (!formData.codigo || !formData.nombre || !formData.categoria || !formData.version) {
      setErrorMsg("Todos los campos son obligatorios.");
      return;
    }
    if (!file) {
      setErrorMsg("Debes seleccionar un archivo PDF.");
      return;
    }

    setIsSubmitting(true);
    try {
      const data = new FormData();
      data.append("codigo", formData.codigo);
      data.append("nombre", formData.nombre);
      data.append("categoria", formData.categoria);
      data.append("version", formData.version);
      data.append("archivo", file);

      await documentosApi.subirFormato(data);
      setModalOpen(false);
      setFormData({ codigo: "", nombre: "", categoria: "Investigación", version: "" });
      setFile(null);
      fetchDocumentos();
    } catch (error: any) {
      setErrorMsg(error.message || "Error al subir documento");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAdmin = user?.roles?.includes("administrador");

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title="Gestión Documental"
        subtitle="Repositorio central de formatos institucionales de investigación"
        breadcrumb={["NOUS", "Documentos"]}
        actions={isAdmin && <Button variant="primary" onClick={() => setModalOpen(true)}>+ Subir Documento</Button>}
      />

      {/* Filters */}
      <Card>
        <div className="flex flex-wrap gap-2">
          {filtros.map((t) => (
            <button
              key={t}
              onClick={() => setActiveFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === t ? "bg-theme-primary text-white" : "bg-theme-bg-main text-theme-text-muted hover:bg-[#DDE4DF]"
              }`}
            >
              {t !== "Todos" && docTypeColors[t] ? docTypeColors[t].icon + " " : ""}{t}
            </button>
          ))}
        </div>
      </Card>

      {/* Doc list */}
      <Card padding={false}>
        {loading ? (
          <div className="p-8 text-center text-theme-text-muted">Cargando documentos...</div>
        ) : documentos.length === 0 ? (
          <div className="p-8 text-center text-theme-text-muted">No se encontraron documentos en esta categoría.</div>
        ) : (
          <div className="divide-y divide-[#F2F5F3]">
            {documentos.map((doc) => {
              const cfg = docTypeColors[doc.categoria] ?? { bg: "#F2F5F3", color: "#637068", icon: "📄" };
              return (
                <div key={doc.id} className="flex items-center gap-4 px-5 py-4 hover:bg-theme-bg-main group">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0" style={{ backgroundColor: cfg.bg }}>
                    {cfg.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-theme-text-main truncate">
                      {doc.codigo} - {doc.nombre}
                    </p>
                    <p className="text-xs text-theme-text-muted">
                      Versión: {doc.version} · Act: {new Date(doc.fecha_actualizacion).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full hidden sm:block" style={{ backgroundColor: cfg.bg, color: cfg.color }}>
                    {doc.categoria}
                  </span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm" onClick={() => handleDescargar(doc)}>Descargar</Button>
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => handleEliminar(doc.id)} className="text-red-600 border-red-200 hover:bg-red-50">Borrar</Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal Subir Documento */}
      {modalOpen && (
        <Modal open={true} title="Subir / Actualizar Formato" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMsg && <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md">{errorMsg}</div>}
            
            <Field label="Código del Formato (ej: F-GIV001)">
              <Input required value={formData.codigo} onChange={(v) => setFormData({ ...formData, codigo: v })} placeholder="Código único" />
            </Field>

            <Field label="Nombre del Formato">
              <Input required value={formData.nombre} onChange={(v) => setFormData({ ...formData, nombre: v })} placeholder="Ej: Anteproyecto de Investigación" />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Categoría">
                <select
                  required
                  className="w-full px-3 py-2 bg-theme-bg-main border border-theme-border rounded-md text-sm text-theme-text-main focus:outline-none focus:border-theme-primary"
                  value={formData.categoria}
                  onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                >
                  {categorias.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </Field>
              <Field label="Versión">
                <Input required value={formData.version} onChange={(v) => setFormData({ ...formData, version: v })} placeholder="Ej: 01" />
              </Field>
            </div>

            <Field label="Archivo PDF">
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,application/pdf"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-theme-text-muted file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-theme-primary file:text-white hover:file:bg-green-700"
              />
              <p className="text-xs text-theme-text-muted mt-1">Si el código ya existe, se actualizará el archivo existente.</p>
            </Field>

            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" type="button" onClick={() => setModalOpen(false)} disabled={isSubmitting}>Cancelar</Button>
              <Button variant="primary" type="submit" disabled={isSubmitting}>{isSubmitting ? "Subiendo..." : "Subir Formato"}</Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
