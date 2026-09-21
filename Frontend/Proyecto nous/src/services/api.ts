// Central API service — all fetch calls go through here
const BASE = '/api';

// ── Token storage helpers ────────────────────────────────────────────────────
export const TOKEN_KEY = 'nous_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

// ── Core fetch wrapper — injects JWT automatically ───────────────────────────
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${endpoint}`, { ...options, headers });

  if (res.status === 401) {
    if (endpoint.startsWith('/auth/login') || endpoint.startsWith('/auth/registro') || endpoint.startsWith('/auth/mfa')) {
      const err = await res.json().catch(() => ({ error: 'Credenciales inválidas' }));
      throw new Error(err.error || 'Credenciales inválidas');
    }
    // Token expirado o inválido — limpiar y recargar
    clearToken();
    window.dispatchEvent(new Event('nous:session-expired'));
    throw new Error('Sesión expirada');
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || `HTTP ${res.status}`);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────
export interface UsuarioMe {
  id: number;
  nombre_completo: string;
  correo_institucional: string;
  nombre?: string;
  correo?: string;
  cedula?: string;
  fecha_aceptacion_datos?: string;
  mfa_habilitado: boolean;
  activo: boolean;
  tiene_password?: boolean;
  roles: string[];
  permisos: string[];
}

export interface LoginLocalResponse {
  token?: string;
  mfaRequired?: boolean;
  datosPendientes?: boolean;
  elegirRol?: boolean;
  esDocente?: boolean;
  tempToken?: string;
  usuario?: { id: number; nombre: string; correo: string };
}

export interface MfaSetupResponse {
  qrCode: string; // data URL del QR
  secret: string; // para ingreso manual
}

export const authApi = {
  /** Redirige al backend para iniciar el flujo OAuth con Google Workspace */
  loginWithGoogle(): void {
    window.location.href = 'http://localhost:4200/api/auth/google';
  },

  /** Login local con email y contraseña */
  loginLocal(correo: string, password: string): Promise<LoginLocalResponse> {
    return apiFetch<LoginLocalResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ correo, password }),
    });
  },

  /** Datos del usuario autenticado actual */
  getMe(): Promise<UsuarioMe> {
    return apiFetch<UsuarioMe>('/auth/me');
  },

  /** Cierra la sesión (registra auditoría en servidor) */
  logout(): Promise<{ mensaje: string }> {
    return apiFetch<{ mensaje: string }>('/auth/logout', { method: 'POST' });
  },

  /** Obtiene el QR para configurar MFA */
  setupMfa(): Promise<MfaSetupResponse> {
    return apiFetch<MfaSetupResponse>('/auth/mfa/setup', { method: 'POST' });
  },

  /** Verifica el código TOTP y activa MFA */
  verifyMfa(token: string): Promise<{ token: string; mensaje: string }> {
    return apiFetch<{ token: string; mensaje: string }>('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  /** Desactiva MFA */
  disableMfa(token: string): Promise<{ mensaje: string }> {
    return apiFetch<{ mensaje: string }>('/auth/mfa/disable', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  /** Solicita el flujo de recuperación de contraseña */
  solicitarReset(correo: string): Promise<{ mensaje: string }> {
    return apiFetch<{ mensaje: string }>('/auth/recuperar-password', {
      method: 'POST',
      body: JSON.stringify({ correo }),
    });
  },

  /** Aplica el nuevo password usando el token de reset */
  resetPassword(token: string, nuevaPassword: string): Promise<{ mensaje: string }> {
    return apiFetch<{ mensaje: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ token, nuevaPassword }),
    });
  },

  /** Cambiar contraseña con sesión iniciada */
  cambiarPassword(passwordActual: string, passwordNueva: string): Promise<{ mensaje: string }> {
    return apiFetch<{ mensaje: string }>('/auth/cambiar-password', {
      method: 'POST',
      body: JSON.stringify({ passwordActual, passwordNueva }),
    });
  },

  /** Registra una cuenta nueva con correo institucional y contraseña */
  registro(data: {
    nombre_completo: string;
    correo: string;
    password: string;
    cedula?: string;
    aceptaDatos: boolean;
  }): Promise<LoginLocalResponse> {
    return apiFetch<LoginLocalResponse>('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  /** Selecciona el rol tras el login con Google (para usuarios sin rol previo) */
  seleccionarRol(rol: string, tempToken: string): Promise<{ token: string; mensaje: string }> {
    return apiFetch<{ token: string; mensaje: string }>('/auth/seleccionar-rol', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tempToken}` },
      body: JSON.stringify({ rol }),
    });
  },

  /**
   * Registra la aceptación explícita de la Política de Tratamiento de Datos
   * Personales (Ley 1581 de 2012). Usa el tempToken temporal como credencial.
   * Retorna el siguiente paso del flujo (mfa / elegir_rol / token final).
   */
  aceptarDatos(tempToken: string): Promise<LoginLocalResponse> {
    return apiFetch<LoginLocalResponse>('/auth/aceptar-datos', {
      method: 'POST',
      headers: { Authorization: `Bearer ${tempToken}` },
    });
  },
};

// ── Preferencias ─────────────────────────────────────────────────────────────
export interface PreferenciasNotificacion {
  notif_convocatoria_nueva: boolean;
  notif_convocatoria_por_vencer: boolean;
  notif_evaluacion_asignada: boolean;
  notif_cambio_estado: boolean;
  notif_resumen_semanal: boolean;
  idioma: string;
}

export const preferenciasApi = {
  getPreferencias(): Promise<PreferenciasNotificacion> {
    return apiFetch<PreferenciasNotificacion>('/preferencias');
  },
  updatePreferencias(data: Partial<PreferenciasNotificacion>): Promise<{ mensaje: string }> {
    return apiFetch<{ mensaje: string }>('/preferencias', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }
};

// ── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardKpis {
  proyectosActivos: number;
  proyectosTotal: number;
  convocatoriasAbiertas: number;
  postulacionesTotales: number;
  productos: number;
  articulos: number;
  ponencias: number;
  presupuestoAprobado: number;
  presupuestoEjecutado: number;
  ejecucionPct: number;
  investigadoresActivos?: number;
}

export interface EvolucionItem {
  mes: string;
  activos: number;
  cerrados: number;
  nuevos: number;
}

export interface EjecucionItem {
  mes: string;
  aprobado: number;
  ejecutado: number;
  presupuesto?: number;
}

export interface ProductoTipo {
  name: string;
  value: number;
}

export interface ActividadItem {
  user: string;
  accion: string;
  description: string;
  time: string;
}

export interface TopProyecto {
  id: number;
  nombre: string;
  lider: string;
  grupo: string;
  estado: string;
  avance: number;
}

export interface ConvocatoriaResumen {
  id: number;
  nombre: string;
  estado: string;
  cierre: string;
  inscritos: number;
}

export const dashboardApi = {
  getKpis: () => apiFetch<DashboardKpis>('/dashboard/kpis'),
  getEvolucionProyectos: () => apiFetch<EvolucionItem[]>('/dashboard/evolucion-proyectos'),
  getEjecucionFinanciera: () => apiFetch<EjecucionItem[]>('/dashboard/ejecucion-financiera'),
  getProductosTipo: () => apiFetch<ProductoTipo[]>('/dashboard/productos-tipo'),
  getActividadReciente: () => apiFetch<ActividadItem[]>('/dashboard/actividad-reciente'),
  getTopProyectos: () => apiFetch<TopProyecto[]>('/dashboard/top-proyectos'),
  getConvocatoriasActivas: () => apiFetch<ConvocatoriaResumen[]>('/dashboard/convocatorias-activas'),
};

// ── Proyectos ────────────────────────────────────────────────────────────────
export interface Proyecto {
  id: number;
  id_display: string;
  nombre: string;
  tipo: string;
  estado: string;
  inicio: string;
  fin: string;
  presupuesto: string;
  lider: string;
  grupo: string;
  facultad: string;
  avance: number;
}

export interface ProyectoDetalle extends Proyecto {
  lugar_ejecucion: string;
  duracion_meses: number;
  resumen?: string;
  objetivos?: string;
  metodologia_resumen?: string;
  equipo: { nombre: string; rol: string; dedicacion: string; vinculacion: string }[];
  cronograma: { nombre: string; responsable: string; inicio: string; fin: string; avance: number; estado: string }[];
  productos: { tipo: string; titulo: string; estado: string; fecha: string }[];
  rubros: { rubro: string; aprobado: number; ejecutado: number; saldo: number }[];
  riesgos: { descripcion: string; probabilidad: string; impacto: string; mitigacion: string }[];
}

export const proyectosApi = {
  getAll: (params?: { estado?: string; grupo?: string; q?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string> ?? {}).toString();
    return apiFetch<Proyecto[]>(`/proyectos${qs ? '?' + qs : ''}`);
  },
  getById: (id: number) => apiFetch<ProyectoDetalle>(`/proyectos/${id}`),
};

// ── Semilleros ────────────────────────────────────────────────────────────────
export interface Semillero {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string;
  lider: string;
  grupo: string;
  estado: string;
  integrantes: number;
  proyectos: number;
}

export interface SemilleroDetalle extends Semillero {
  vision?: string;
  mision?: string;
  estado_arte?: string;
  lider_estudiante?: string;
  cvlac_url?: string;
  ingreso: string;
  integrantes_lista: { nombre: string; programa: string; ingreso: string }[];
  proyectos_lista: { codigo: string; titulo: string; estado: string }[];
}

export const semillerosApi = {
  getAll: () => apiFetch<Semillero[]>('/semilleros'),
  getById: (id: number) => apiFetch<SemilleroDetalle>(`/semilleros/${id}`),
};

// ── Usuarios y Roles ──────────────────────────────────────────────────────────
export interface UsuarioRol {
  id: number;
  nombre: string;
  email: string;
  cedula: string;
  estado: string;
  fecha_registro: string;
  roles: string[];
}

export interface RolDisponible {
  id: number;
  nombre: string;
  descripcion: string;
}

export const usuariosApi = {
  getAll: () => apiFetch<UsuarioRol[]>('/usuarios'),
  getRoles: () => apiFetch<RolDisponible[]>('/usuarios/roles'),
  asignarRol: (id: number, rol: string) => apiFetch<{ message: string }>(`/usuarios/${id}/roles`, {
    method: 'POST',
    body: JSON.stringify({ rol }),
  }),
  removerRol: (id: number, rol: string) => apiFetch<{ message: string }>(`/usuarios/${id}/roles/${rol}`, {
    method: 'DELETE',
  }),
  deleteUsuario: (id: number) => apiFetch<{ ok: boolean; mensaje: string }>(`/usuarios/${id}`, {
    method: 'DELETE',
  }),
};

// ─── Tipos de Investigación ─────────────────────────────────────────────────
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
  const query = params ? "?" + new URLSearchParams(params as Record<string, string>).toString() : "";
  return apiFetch(`/convocatorias${query}`);
}

export async function getConvocatoriasAlertas(): Promise<AlertasConvocatorias> {
  return apiFetch("/convocatorias/alertas");
}

export async function crearConvocatoria(data: Partial<Convocatoria>): Promise<{ ok: boolean; convocatoria: Convocatoria }> {
  return apiFetch("/convocatorias", { method: "POST", body: JSON.stringify(data) });
}

export async function actualizarConvocatoria(id: number, data: Partial<Convocatoria>): Promise<{ ok: boolean; convocatoria: Convocatoria }> {
  return apiFetch(`/convocatorias/${id}`, { method: "PUT", body: JSON.stringify(data) });
}

export async function publicarConvocatoria(id: number): Promise<{ ok: boolean; convocatoria: Convocatoria }> {
  return apiFetch(`/convocatorias/${id}/publicar`, { method: "PATCH" });
}

export async function eliminarConvocatoria(id: number): Promise<{ ok: boolean; mensaje: string }> {
  return apiFetch(`/convocatorias/${id}`, { method: "DELETE" });
}

export async function getConvocatoriasExternas(q?: string): Promise<ConvocatoriaExterna[]> {
  const query = q ? `?q=${encodeURIComponent(q)}` : "";
  return apiFetch(`/convocatorias/externas${query}`);
}

export async function crearConvocatoriaExterna(data: Partial<ConvocatoriaExterna>): Promise<{ ok: boolean; convocatoria: ConvocatoriaExterna }> {
  return apiFetch("/convocatorias/externas", { method: "POST", body: JSON.stringify(data) });
}

export async function eliminarConvocatoriaExterna(id: number): Promise<{ ok: boolean; mensaje: string }> {
  return apiFetch(`/convocatorias/externas/${id}`, { method: "DELETE" });
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

export async function inscribirseConvocatoria(
  convocatoriaId: number,
  formData: FormData
): Promise<{ ok: boolean; mensaje: string; inscripcion: Inscripcion }> {
  const res = await fetch(`/api/convocatorias/${convocatoriaId}/inscribirse`, {
    method: "POST",
    headers: { Authorization: `Bearer ${getToken()}` },
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

export async function getInscripcionesConvocatoria(convocatoriaId: number): Promise<Inscripcion[]> {
  return apiFetch(`/convocatorias/${convocatoriaId}/inscripciones`);
}



// ─── Semillero Externo ────────────────────────────────────────────────────────

export interface SemilleroExterno {
  id: number;
  inscripcion_id: number;
  tipo_institucion: string;
  procedencia: string;
  institucion_procedencia: string;
  semillero_nombre: string;
  fecha_creacion: string;
}

export interface SemilleroExternoData {
  tipos_institucion: string[];
  procedencia_fija: string;
  inscripcion: Inscripcion | null;
  semillero: SemilleroExterno | null;
}

export function getUsuarioActual(): { id: number; nombre: string; email: string; rol: string } | null {
  const token = getToken();
  if (!token) return { id: 1, nombre: "Usuario", email: "", rol: "Docente" };
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      id: payload.id || 1,
      nombre: payload.nombre_completo || payload.nombre || "Usuario",
      email: payload.correo_institucional || payload.email || "",
      rol: (payload.roles && payload.roles[0]) || payload.rol || "Docente",
    };
  } catch (_) {
    return { id: 1, nombre: "Usuario", email: "", rol: "Docente" };
  }
}

export async function getSemilleroExterno(
  convocatoriaId: number,
  usuarioId?: number
): Promise<SemilleroExternoData> {
  const query = usuarioId ? `?usuario_id=${usuarioId}` : "";
  return apiFetch(`/convocatorias/${convocatoriaId}/semillero-externo${query}`);
}

export async function guardarSemilleroExterno(
  convocatoriaId: number,
  data: {
    usuario_id: number;
    tipo_institucion: string;
    institucion_procedencia: string;
    semillero_nombre: string;
  }
): Promise<{ ok: boolean; mensaje: string; inscripcion: Inscripcion; semillero: SemilleroExterno }> {
  return apiFetch(`/convocatorias/${convocatoriaId}/semillero-externo`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Catálogos ────────────────────────────────────────────────────────────────
export interface CatalogosSemillero {
  tipos_documento: string[];
  roles_integrante: string[];
  lineas_investigacion: { id: number; nombre: string }[];
}

export async function getCatalogosSemillero(convocatoriaId: number): Promise<CatalogosSemillero> {
  return apiFetch(`/convocatorias/${convocatoriaId}/semillero-catalogos`);
}

// ─── Paso 2: Integrantes ──────────────────────────────────────────────────────
export interface IntegranteSemillero {
  id: number;
  inscripcion_id: number;
  nombre_completo: string;
  tipo_documento: string;
  numero_documento: string;
  rol: string;
  email: string;
  telefono?: string;
  fecha_creacion: string;
}

export async function getIntegrantesSemillero(
  convocatoriaId: number, usuarioId: number
): Promise<{ ok: boolean; integrantes: IntegranteSemillero[] }> {
  return apiFetch(`/convocatorias/${convocatoriaId}/semillero-integrantes?usuario_id=${usuarioId}`);
}

export async function addIntegranteSemillero(
  convocatoriaId: number,
  data: { usuario_id: number; nombre_completo: string; tipo_documento: string; numero_documento: string; rol: string; email: string; telefono?: string }
): Promise<{ ok: boolean; mensaje: string; integrante: IntegranteSemillero }> {
  return apiFetch(`/convocatorias/${convocatoriaId}/semillero-integrantes`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateIntegranteSemillero(
  convocatoriaId: number, integranteId: number,
  data: { usuario_id: number; nombre_completo: string; tipo_documento: string; numero_documento: string; rol: string; email: string; telefono?: string }
): Promise<{ ok: boolean; mensaje: string; integrante: IntegranteSemillero }> {
  return apiFetch(`/convocatorias/${convocatoriaId}/semillero-integrantes/${integranteId}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export async function deleteIntegranteSemillero(
  convocatoriaId: number, integranteId: number, usuarioId: number
): Promise<{ ok: boolean; mensaje: string }> {
  return apiFetch(`/convocatorias/${convocatoriaId}/semillero-integrantes/${integranteId}?usuario_id=${usuarioId}`, {
    method: "DELETE",
  });
}

// ─── Paso 3: Información general ─────────────────────────────────────────────
export interface InfoGeneralSemillero {
  id: number;
  inscripcion_id: number;
  titulo_trabajo: string;
  linea_investigacion?: string;
  palabras_clave: string;
  resumen: string;
  fecha_creacion: string;
}

export async function getInfoGeneralSemillero(
  convocatoriaId: number, usuarioId: number
): Promise<{ ok: boolean; info_general: InfoGeneralSemillero | null }> {
  return apiFetch(`/convocatorias/${convocatoriaId}/semillero-info-general?usuario_id=${usuarioId}`);
}

export async function saveInfoGeneralSemillero(
  convocatoriaId: number,
  data: { usuario_id: number; titulo_trabajo: string; linea_investigacion?: string; palabras_clave: string; resumen: string }
): Promise<{ ok: boolean; mensaje: string; info_general: InfoGeneralSemillero }> {
  return apiFetch(`/convocatorias/${convocatoriaId}/semillero-info-general`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Paso 4: Contenido del trabajo ────────────────────────────────────────────
export interface ContenidoSemillero {
  id: number;
  inscripcion_id: number;
  planteamiento_problema: string;
  objetivo_general: string;
  objetivos_especificos: string;
  metodologia: string;
  resultados_esperados: string;
  fecha_creacion: string;
}

export async function getContenidoSemillero(
  convocatoriaId: number, usuarioId: number
): Promise<{ ok: boolean; contenido: ContenidoSemillero | null }> {
  return apiFetch(`/convocatorias/${convocatoriaId}/semillero-contenido?usuario_id=${usuarioId}`);
}

export async function saveContenidoSemillero(
  convocatoriaId: number,
  data: { usuario_id: number; planteamiento_problema: string; objetivo_general: string; objetivos_especificos: string; metodologia: string; resultados_esperados: string }
): Promise<{ ok: boolean; mensaje: string; contenido: ContenidoSemillero }> {
  return apiFetch(`/convocatorias/${convocatoriaId}/semillero-contenido`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Paso 5: Resumen y envío final ────────────────────────────────────────────
export interface ResumenInscripcionExterna {
  ok: boolean;
  inscripcion: Inscripcion;
  semillero: SemilleroExterno | null;
  integrantes: IntegranteSemillero[];
  info_general: InfoGeneralSemillero | null;
  contenido: ContenidoSemillero | null;
}

export async function getResumenSemillero(
  convocatoriaId: number, usuarioId: number
): Promise<ResumenInscripcionExterna> {
  return apiFetch(`/convocatorias/${convocatoriaId}/semillero-resumen?usuario_id=${usuarioId}`);
}

export async function enviarInscripcionExterna(
  convocatoriaId: number,
  formData: FormData
): Promise<{ ok: boolean; mensaje: string; inscripcion: Inscripcion }> {
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}/convocatorias/${convocatoriaId}/semillero-enviar`, {
    method: "POST",
    headers,
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) {
    const err = new Error(data.error || "Error al enviar la inscripción");
    (err as any).faltantes = data.faltantes;
    throw err;
  }
  return data;
}

export async function guardarBorradorSemillero(
  convocatoriaId: number,
  data: any
): Promise<{ ok: boolean; mensaje: string; inscripcion_id: number; paso_actual: number }> {
  return apiFetch(`/convocatorias/${convocatoriaId}/guardar-borrador`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function getBorradorSemillero(
  convocatoriaId: number,
  usuarioId: number
): Promise<{
  ok: boolean;
  tiene_borrador: boolean;
  inscripcion?: Inscripcion;
  ultimo_paso?: number;
  semillero?: any;
  integrantes?: any[];
  info_general?: any;
  contenido?: any;
}> {
  return apiFetch(`/convocatorias/${convocatoriaId}/mi-borrador?usuario_id=${usuarioId}`);
}

export async function getMisBorradores(
  usuarioId?: number
): Promise<{ ok: boolean; borradores: any[] }> {
  const query = usuarioId ? `?usuario_id=${usuarioId}` : "";
  return apiFetch(`/convocatorias/mis-borradores${query}`);
}

// ─── Documentos Institucionales ───────────────────────────────────────────────
export interface FormatoInstitucional {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  version: string;
  archivo_nombre_original: string;
  archivo_ruta: string;
  fecha_actualizacion: string;
  subido_por: number | null;
}

export const documentosApi = {
  obtenerFormatos: (categoria?: string): Promise<FormatoInstitucional[]> => {
    const query = categoria && categoria !== "Todos" ? `?categoria=${encodeURIComponent(categoria)}` : "";
    return apiFetch(`/documentos/formatos${query}`);
  },

  subirFormato: async (formData: FormData): Promise<{ mensaje: string }> => {
    const token = getToken();
    const headers: Record<string, string> = {};
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE}/documentos/formatos`, {
      method: "POST",
      headers,
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error al subir formato");
    return data;
  },

  eliminarFormato: (id: number): Promise<{ mensaje: string }> => {
    return apiFetch(`/documentos/formatos/${id}`, { method: "DELETE" });
  },

  getDescargarUrl: (id: number): string => {
    return `${BASE}/documentos/formatos/${id}/descargar`;
  }
};

// ── Evaluaciones ─────────────────────────────────────────────────────────────
export interface Evaluacion {
  id: number; proyecto_id: number; evaluador_id: number; tipo: string;
  fecha_asignacion: string; fecha_limite: string; estado: string;
  puntaje_total: number; observaciones: string;
  proyecto: string; convocatoria: string; evaluador_nombre: string;
}
export interface EvaluacionDetalle extends Evaluacion {
  criterios: { id: number; criterio: string; puntaje_maximo: number; puntaje_obtenido: number }[];
}
export interface EvaluadorDisponible { id: number; nombre_completo: string; correo_institucional: string; }
export interface ProyectoSinEvaluador { id: number; titulo: string; codigo_unico: string; estado: string; }

export const evaluacionesApi = {
  getAll: () => apiFetch<Evaluacion[]>('/evaluaciones'),
  getById: (id: number) => apiFetch<EvaluacionDetalle>(`/evaluaciones/${id}`),
  calificar: (id: number, data: { puntaje_total: number; observaciones: string; criterios: { id?: number; criterio?: string; puntaje_maximo?: number; puntaje_obtenido: number }[] }) =>
    apiFetch(`/evaluaciones/${id}/calificar`, { method: 'POST', body: JSON.stringify(data) }),
  getEvaluadoresDisponibles: () => apiFetch<EvaluadorDisponible[]>('/evaluaciones/data/evaluadores'),
  getProyectosSinEvaluador: () => apiFetch<ProyectoSinEvaluador[]>('/evaluaciones/data/proyectos-sin-evaluador'),
  asignar: (data: { proyecto_id: number; evaluador_id: number; tipo: string; fecha_limite?: string }) =>
    apiFetch('/evaluaciones', { method: 'POST', body: JSON.stringify(data) }),
};
