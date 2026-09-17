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
  mfa_habilitado: boolean;
  activo: boolean;
  roles: string[];
}

export interface LoginLocalResponse {
  token?: string;
  mfaRequired?: boolean;
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

  /** Registra una cuenta nueva con correo institucional y contraseña */
  registro(data: {
    nombre_completo: string;
    correo: string;
    password: string;
    cedula?: string;
  }): Promise<LoginLocalResponse> {
    return apiFetch<LoginLocalResponse>('/auth/registro', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
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
  getKpis:               () => apiFetch<DashboardKpis>('/dashboard/kpis'),
  getEvolucionProyectos: () => apiFetch<EvolucionItem[]>('/dashboard/evolucion-proyectos'),
  getEjecucionFinanciera:() => apiFetch<EjecucionItem[]>('/dashboard/ejecucion-financiera'),
  getProductosTipo:      () => apiFetch<ProductoTipo[]>('/dashboard/productos-tipo'),
  getActividadReciente:  () => apiFetch<ActividadItem[]>('/dashboard/actividad-reciente'),
  getTopProyectos:       () => apiFetch<TopProyecto[]>('/dashboard/top-proyectos'),
  getConvocatoriasActivas:()=> apiFetch<ConvocatoriaResumen[]>('/dashboard/convocatorias-activas'),
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
  getAll:  (params?: { estado?: string; grupo?: string; q?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string> ?? {}).toString();
    return apiFetch<Proyecto[]>(`/proyectos${qs ? '?' + qs : ''}`);
  },
  getById: (id: number) => apiFetch<ProyectoDetalle>(`/proyectos/${id}`),
};

// ── Convocatorias ─────────────────────────────────────────────────────────────
export interface Convocatoria {
  id: number;
  nombre: string;
  tipo: string;
  estado: string;
  descripcion: string;
  apertura: string;
  cierre: string;
  presupuesto: string;
  inscritos: number;
  evaluadores: number;
}

export const convocatoriasApi = {
  getAll:  (params?: { estado?: string }) => {
    const qs = new URLSearchParams(params as Record<string, string> ?? {}).toString();
    return apiFetch<Convocatoria[]>(`/convocatorias${qs ? '?' + qs : ''}`);
  },
  getById: (id: number) => apiFetch<Convocatoria & { proyectos: any[] }>(`/convocatorias/${id}`),
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
  getAll:  () => apiFetch<Semillero[]>('/semilleros'),
  getById: (id: number) => apiFetch<SemilleroDetalle>(`/semilleros/${id}`),
};
