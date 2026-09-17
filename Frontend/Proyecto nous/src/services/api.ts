const BASE = "/api";

async function fetchJSON<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Error del servidor");
  return data as T;
}

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  roles: string[];
}

export async function login(correo: string, password: string): Promise<{ ok: boolean; usuario: Usuario }> {
  return fetchJSON("/auth/login", {
    method: "POST",
    body: JSON.stringify({ correo, password }),
  });
}

export interface DashboardStats {
  proyectos: number;
  convocatorias: number;
  semilleros: number;
  investigadores: number;
  evaluaciones: number;
  convocatoriasActivas: number;
  proyectosPorEstado: { estado: string; total: number }[];
  convocatoriasRecientes?: { id: number; nombre: string; estado: string; cierre: string }[];
  topProyectos?: { id: number; nombre: string; estado: string; lider: string; facultad: string; grupo: string }[];
  recentActivity?: { project: string; user: string; action: string; time: string }[];
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return fetchJSON("/dashboard/stats");
}

export interface Proyecto {
  id: number;
  titulo: string;
  codigo_unico?: string;
  tipo_proyecto: string;
  estado: string;
  fecha_inicio: string;
  duracion_meses?: number;
  valor_total?: number;
  investigador_principal?: string;
  investigador_principal_id?: number;
  convocatoria?: string;
  convocatoria_id?: number;
  linea_investigacion?: string;
  facultad?: string;
  descripcion?: string;
  objetivos?: string;
  metodologia?: string;
  avance?: number;
  fecha_creacion?: string;
}

export async function getProyectos(params?: { estado?: string; tipo?: string; q?: string }): Promise<Proyecto[]> {
  const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
  return fetchJSON(`/proyectos${query}`);
}

export async function crearProyecto(data: Partial<Proyecto>): Promise<{ ok: boolean; proyecto: Proyecto }> {
  return fetchJSON("/proyectos", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Tipos de Investigación Centralizados ─────────────────────────────────────
export const TIPOS_INVESTIGACION = [
  { label: "Investigación de creación", codigo: "IC" },
  { label: "Investigación formal", codigo: "IPD" },
  { label: "Investigación formativa", codigo: "IF" },
  { label: "Emprendimiento", codigo: "UE" },
  { label: "Semilleros", codigo: "SEM" },
] as const;

export const MAPA_TIPO_INVESTIGACION: Record<string, string> = {
  "Investigación de creación": "IC",
  "Investigación formal": "IPD",
  "Investigación formativa": "IF",
  "Emprendimiento": "UE",
  "Semilleros": "SEM",
};

export interface Convocatoria {
  id: number;
  codigo?: string;
  codigo_con?: string;
  tipo_investigacion?: string;
  titulo: string;
  tipo: string;
  dirigida_a?: string;
  descripcion?: string;
  fecha_apertura: string;
  fecha_cierre: string;
  fecha_resultados?: string;
  rubro_disponible?: number;
  estado: string;
  aprobada_comite: number;
  creado_por_nombre: string;
  dias_restantes?: number;
  requisitos?: string;
  observaciones_comite?: string;
}

export interface ConvocatoriaExterna {
  id: number;
  codigo?: string;
  codigo_ext?: string;
  tipo_investigacion?: string;
  titulo: string;
  entidad_externa: string;
  fecha_apertura: string;
  fecha_cierre: string;
  descripcion: string;
  dias_restantes?: number;
  estado_vigencia?: "vigente" | "cerrada" | "indefinida";
}

export interface AlertasConvocatorias {
  resumen: {
    proximas_a_cerrar_total: number;
    criticas_3_dias: number;
    proximas_a_abrir_total: number;
    vencidas_pendientes_cierre: number;
  };
  proximas_a_cerrar: Array<Convocatoria & { nivel_alerta: string; mensaje: string }>;
  proximas_a_abrir: Convocatoria[];
  vencidas_pendientes_cierre: Convocatoria[];
}

export async function getConvocatorias(params?: { estado?: string; tipo?: string; q?: string }): Promise<Convocatoria[]> {
  const query = params ? "?" + new URLSearchParams(params as any).toString() : "";
  return fetchJSON(`/convocatorias${query}`);
}

export async function getConvocatoriasVigentes(): Promise<Convocatoria[]> {
  return fetchJSON("/convocatorias/vigentes");
}

export async function getConvocatoriasAlertas(): Promise<AlertasConvocatorias> {
  return fetchJSON("/convocatorias/alertas");
}

export async function crearConvocatoria(data: Partial<Convocatoria>): Promise<{ ok: boolean; convocatoria: Convocatoria }> {
  return fetchJSON("/convocatorias", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function actualizarConvocatoria(id: number, data: Partial<Convocatoria>): Promise<{ ok: boolean; convocatoria: Convocatoria }> {
  return fetchJSON(`/convocatorias/${id}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function publicarConvocatoria(id: number): Promise<{ ok: boolean; convocatoria: Convocatoria }> {
  return fetchJSON(`/convocatorias/${id}/publicar`, { method: "PATCH" });
}

export async function getConvocatoriasExternas(q?: string): Promise<ConvocatoriaExterna[]> {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return fetchJSON(`/convocatorias/externas${query}`);
}

export async function crearConvocatoriaExterna(data: Partial<ConvocatoriaExterna>): Promise<{ ok: boolean; convocatoria: ConvocatoriaExterna }> {
  return fetchJSON("/convocatorias/externas", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function aprobarConvocatoriaComite(id: number): Promise<{ ok: boolean; convocatoria: Convocatoria }> {
  return fetchJSON(`/convocatorias/${id}/comite/aprobar`, { method: "PATCH" });
}

export async function objetarConvocatoriaComite(id: number, observaciones: string): Promise<{ ok: boolean; convocatoria: Convocatoria }> {
  return fetchJSON(`/convocatorias/${id}/comite/objetar`, {
    method: "PATCH",
    body: JSON.stringify({ observaciones }),
  });
}

export interface Semillero {
  id: number;
  nombre: string;
  codigo: string;
  vobo_programa: number;
  vobo_vicerrectoria: number;
  fecha_creacion: string;
  lider_estudiante_nombre: string;
  horas_asignadas: number;
  lider_profesor: string;
  programa: string;
  integrantes?: number;
  tema_interes?: string;
}

export async function getSemilleros(): Promise<Semillero[]> {
  return fetchJSON("/semilleros");
}

export async function crearSemillero(data: { nombre: string; programa_id?: number; tema_interes?: string; mision?: string; vision?: string }): Promise<{ ok: boolean; semillero: Semillero }> {
  return fetchJSON("/semilleros", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface CriterioEvaluacion {
  id: number;
  evaluacion_id: number;
  criterio: string;
  puntaje_maximo: number | string;
  puntaje_obtenido: number | string;
}

export interface Evaluacion {
  id: number;
  proyecto_id: number;
  evaluador_id: number;
  tipo: string;
  fecha_asignacion: string;
  fecha_limite: string;
  estado: string;
  puntaje_total: number | string;
  observaciones?: string;
  proyecto: string;
  convocatoria: string;
  evaluador_nombre: string;
  criterios?: CriterioEvaluacion[];
}

export async function getEvaluaciones(): Promise<Evaluacion[]> {
  return fetchJSON("/evaluaciones");
}

export async function getEvaluacion(id: number): Promise<Evaluacion> {
  return fetchJSON(`/evaluaciones/${id}`);
}

export async function calificarEvaluacion(id: number, data: { puntaje_total: number; observaciones: string; criterios: { id?: number; criterio?: string; puntaje_obtenido: number }[] }): Promise<{ ok: boolean }> {
  return fetchJSON(`/evaluaciones/${id}/calificar`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export interface UsuarioAdmin {
  id: number;
  nombre_completo: string;
  correo_institucional: string;
  cedula: string;
  activo: number;
  fecha_creacion: string;
  rol: string;
  rol_ids?: string;
}

export interface RolAdmin {
  id: number;
  nombre: string;
  descripcion: string;
  usuarios_count: number;
  permisos_count: number;
}

export async function getUsuariosAdmin(): Promise<UsuarioAdmin[]> {
  return fetchJSON("/usuarios");
}

export async function getRolesAdmin(): Promise<RolAdmin[]> {
  return fetchJSON("/roles");
}

export async function crearUsuarioAdmin(data: { nombre_completo: string; correo_institucional: string; cedula?: string; rol_id?: number }): Promise<{ ok: boolean; usuario: UsuarioAdmin }> {
  return fetchJSON("/usuarios", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Inscripciones a Convocatorias ──────────────────────────────────────────

export interface InscripcionDocumento {
  id: number;
  inscripcion_id: number;
  requisito_nombre: string;
  documento_nombre_original: string;
  documento_ruta: string;
  documento_mime: string;
  documento_peso_bytes: number;
  fecha_creacion: string;
}

export interface Inscripcion {
  id: number;
  convocatoria_id: number;
  usuario_id: number;
  tipo_investigacion?: string;
  resumen_proyecto: string;
  justificacion: string;
  documento_nombre_original: string;
  documento_ruta: string;
  documento_mime: string;
  documento_peso_bytes: number;
  fecha_inscripcion: string;
  estado: string;
  usuario_nombre?: string;
  usuario_correo?: string;
  convocatoria_titulo?: string;
  documentos_adjuntos?: InscripcionDocumento[];
}

export function getUsuarioActual(): Usuario | null {
  try {
    const raw = sessionStorage.getItem("nous_user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function inscribirseConvocatoria(
  convocatoriaId: number,
  formData: FormData
): Promise<{ ok: boolean; mensaje: string; inscripcion: Inscripcion }> {
  const res = await fetch(`${BASE}/convocatorias/${convocatoriaId}/inscribirse`, {
    method: "POST",
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Error al procesar la inscripción");
    (err as any).campo = data.campo;
    (err as any).status = res.status;
    throw err;
  }
  return data;
}

export async function consultarMiInscripcion(
  convocatoriaId: number,
  usuarioId: number
): Promise<{ inscrito: boolean; inscripcion: Inscripcion | null }> {
  return fetchJSON(`/convocatorias/${convocatoriaId}/mi-inscripcion?usuario_id=${usuarioId}`);
}

export async function getInscripcionesConvocatoria(
  convocatoriaId: number
): Promise<Inscripcion[]> {
  return fetchJSON(`/convocatorias/${convocatoriaId}/inscripciones`);
}

