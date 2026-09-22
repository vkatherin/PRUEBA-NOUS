import React, { useState, useEffect } from "react";
import { Badge, Button, Card, PageHeader, SearchBar, Avatar, Tabs, Modal, Field, Input, Select } from "@/components/ui";
import { usuariosApi, soporteApi, type UsuarioRol, type RolDisponible, type ReporteSoporte } from "@/services/api";

const ROLES = [
  { nombre: "Super Administrador", usuarios: 1, permisos: 45, desc: "Acceso total al sistema" },
  { nombre: "Coordinador VRI", usuarios: 2, permisos: 38, desc: "Gestión de módulos institucionales" },
  { nombre: "Investigador", usuarios: 52, permisos: 22, desc: "Gestión de proyectos y productos propios" },
  { nombre: "Evaluador", usuarios: 12, permisos: 8, desc: "Evaluación de convocatorias asignadas" },
  { nombre: "Estudiante-Investigador", usuarios: 35, permisos: 12, desc: "Seguimiento de semillero y trayectoria" },
  { nombre: "Consulta", usuarios: 26, permisos: 5, desc: "Solo lectura de información pública" },
];

const PARAMETROS = [
  { clave: "Institución", valor: "Fundación Universitaria Católica del Sur" },
  { clave: "NIT", valor: "900.000.000-1" },
  { clave: "Vicerrectoría", valor: "Vicerrectoría de Investigación e Innovación" },
  { clave: "Código institución MinCiencias", valor: "COL-0123456" },
  { clave: "Correo institucional VRI", valor: "investigacion@cusur.edu.co" },
  { clave: "Versión NOUS", valor: "v1.0.0 — Agosto 2025" },
];

const rolColors: Record<string, string> = {
  "Super Administrador": "#DC2626",
  "Coordinador VRI": "#7C3AED",
  "Investigador": "var(--theme-primary)",
  "Evaluador": "#2563EB",
  "Estudiante-Investigador": "#D97706",
  "Consulta": "#9CA3AF",
};

function EliminarUsuarioModal({
  usuario,
  onClose,
  onConfirm,
}: {
  usuario: UsuarioRol | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!usuario) return null;
  return (
    <Modal open={!!usuario} onClose={onClose} title="Eliminar Usuario" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: "#FEE2E2" }}>⚠️</div>
          <div>
            <p className="text-sm font-semibold text-red-700">Esta accion es permanente</p>
            <p className="text-xs text-red-600 mt-0.5">El usuario y todos sus datos seran eliminados del sistema.</p>
          </div>
        </div>
        <div className="p-4 rounded-xl" style={{ backgroundColor: "#F2F5F3", border: "1px solid #DDE4DF" }}>
          <p className="text-xs text-theme-text-muted mb-1">Usuario a eliminar:</p>
          <p className="text-sm font-bold text-theme-text-main">{usuario.nombre}</p>
          <p className="text-xs text-theme-text-muted">{usuario.email}</p>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-theme-border">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#DC2626" }}
          >
            Eliminar definitivamente
          </button>
        </div>
      </div>
    </Modal>
  );
}

function RemoverRolModal({
  roleInfo,
  onClose,
  onConfirm,
}: {
  roleInfo: { userId: number, roleName: string } | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  if (!roleInfo) return null;
  return (
    <Modal open={!!roleInfo} onClose={onClose} title="Quitar Rol" size="md">
      <div className="space-y-4">
        <div className="flex items-center gap-4 p-4 rounded-xl" style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}>
          <div className="w-10 h-10 rounded-full flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: "#FEE2E2" }}>⚠️</div>
          <div>
            <p className="text-sm font-semibold text-red-700">Confirmar acción</p>
            <p className="text-xs text-red-600 mt-0.5">¿Estás seguro de quitar el rol <strong>{roleInfo.roleName}</strong> a este usuario?</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 pt-2 border-t border-theme-border">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
            style={{ backgroundColor: "#DC2626" }}
          >
            Quitar rol
          </button>
        </div>
      </div>
    </Modal>
  );
}

function NuevoUsuarioModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal open={open} onClose={onClose} title="Crear Nuevo Usuario" size="md">
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="Nombre" required>
            <Input placeholder="Nombres" />
          </Field>
          <Field label="Apellidos" required>
            <Input placeholder="Apellidos" />
          </Field>
        </div>
        <Field label="Correo Institucional" required>
          <Input type="email" placeholder="usuario@cusur.edu.co" />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Rol" required>
            <Select
              options={ROLES.map((r) => ({ value: r.nombre, label: r.nombre }))}
              placeholder="Seleccionar rol"
            />
          </Field>
          <Field label="Facultad / Dependencia">
            <Select
              options={[
                { value: "vri", label: "VRI" },
                { value: "ing", label: "Ingeniería" },
                { value: "econ", label: "Ciencias Económicas" },
                { value: "agro", label: "Agropecuarias" },
                { value: "educ", label: "Educación" },
                { value: "derecho", label: "Derecho" },
                { value: "salud", label: "Salud" },
                { value: "externa", label: "Externa" },
              ]}
              placeholder="Seleccionar"
            />
          </Field>
        </div>
        <div className="flex items-center gap-3 p-3 rounded-xl bg-theme-primary/10">
          <input type="checkbox" defaultChecked className="accent-[var(--theme-primary)] w-4 h-4" />
          <span className="text-xs text-theme-text-muted">
            Enviar credenciales de acceso al correo institucional
          </span>
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-theme-border">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onClose}>Crear Usuario</Button>
        </div>
      </div>
    </Modal>
  );
}

export function Administracion() {
  const [tab, setTab] = useState("usuarios");
  const [subTabUsuarios, setSubTabUsuarios] = useState("con-rol");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<UsuarioRol | null>(null);
  const [rolToRemove, setRolToRemove] = useState<{ userId: number, roleName: string } | null>(null);

  const [usuarios, setUsuarios] = useState<UsuarioRol[]>([]);
  const [rolesDisponibles, setRolesDisponibles] = useState<RolDisponible[]>([]);
  const [reportesSoporte, setReportesSoporte] = useState<ReporteSoporte[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [usersData, rolesData, reportesData] = await Promise.all([
          usuariosApi.getAll(),
          usuariosApi.getRoles(),
          soporteApi.listarTodos().catch(() => []) // Fallback in case of error
        ]);
        setUsuarios(usersData);
        setRolesDisponibles(rolesData);
        setReportesSoporte(reportesData);
      } catch (error) {
        console.error("Error fetching admin data:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleAssignRole = async (userId: number, roleName: string) => {
    try {
      await usuariosApi.asignarRol(userId, roleName);
      const updated = await usuariosApi.getAll();
      setUsuarios(updated);
    } catch (err) {
      console.error(err);
      alert("Error asignando rol");
    }
  };

  const handleRemoveRole = async () => {
    if (!rolToRemove) return;
    try {
      await usuariosApi.removerRol(rolToRemove.userId, rolToRemove.roleName);
      const updated = await usuariosApi.getAll();
      setUsuarios(updated);
      setRolToRemove(null);
    } catch (err) {
      console.error(err);
      alert("Error removiendo rol");
    }
  };

  const handleDeleteUser = async () => {
    if (!usuarioAEliminar) return;
    try {
      await usuariosApi.deleteUsuario(usuarioAEliminar.id);
      setUsuarios(prev => prev.filter(u => u.id !== usuarioAEliminar.id));
      setUsuarioAEliminar(null);
    } catch (err: any) {
      alert(err.message || "Error al eliminar usuario");
    }
  };

  const filteredUsers = usuarios.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.roles.join(", ").toLowerCase().includes(search.toLowerCase())
  );

  const usuariosConRol = filteredUsers.filter(u => u.roles.length > 0);
  const usuariosSinRol = filteredUsers.filter(u => u.roles.length === 0);

  const displayedUsers = subTabUsuarios === "con-rol" ? usuariosConRol : usuariosSinRol;

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title="Asignación de Roles"
        subtitle="Gestión de usuarios y asignación de roles en el sistema"
        breadcrumb={["NOUS", "Asignación de Roles"]}
        actions={
          tab === "usuarios" ? (
            <div className="flex gap-2">
              <Button variant="primary" onClick={() => setShowModal(true)}>+ Nuevo Usuario</Button>
            </div>
          ) : undefined
        }
      />

      <Tabs
        tabs={[
          { id: "usuarios", label: "Usuarios" },
          { id: "roles", label: "Roles y Permisos" },
          { id: "parametros", label: "Parámetros Institucionales" },
          { id: "facultades", label: "Facultades y Programas" },
          { id: "soporte", label: "Soporte" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "usuarios" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Usuarios", value: usuarios.length, color: "var(--theme-primary)" },
              { label: "Con Rol", value: usuarios.filter(u => u.roles.length > 0).length, color: "var(--theme-primary)" },
              { label: "Sin Rol", value: usuarios.filter(u => u.roles.length === 0).length, color: "#D97706" },
              { label: "Inactivos", value: usuarios.filter(u => u.estado === "inactive").length, color: "#9CA3AF" },
            ].map((s) => (
              <div key={s.label} className="bg-theme-bg-card border border-theme-border rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ backgroundColor: s.color + "15", color: s.color }}>
                  {s.value}
                </div>
                <p className="text-sm text-theme-text-muted font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          <Card>
            <SearchBar placeholder="Buscar usuario por nombre, email o rol..." value={search} onChange={setSearch} />
          </Card>

          <Tabs
            tabs={[
              { id: "con-rol", label: `Usuarios con Rol (${usuarios.filter(u => u.roles.length > 0).length})` },
              { id: "sin-rol", label: `Usuarios sin Rol (${usuarios.filter(u => u.roles.length === 0).length})` },
            ]}
            active={subTabUsuarios}
            onChange={setSubTabUsuarios}
          />

          <Card padding={false}>
            {loading ? (
              <div className="p-8 text-center text-theme-text-muted">Cargando usuarios...</div>
            ) : displayedUsers.length === 0 ? (
              <div className="p-8 text-center text-theme-text-muted">No se encontraron usuarios.</div>
            ) : (
              <div className="divide-y divide-[#F2F5F3]">
                {displayedUsers.map((u, i) => (
                  <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-theme-bg-main group">
                    <Avatar name={u.nombre} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-theme-text-main">{u.nombre}</p>
                      <p className="text-xs text-theme-text-muted">{u.email}</p>
                    </div>
                    <div className="flex gap-1 flex-wrap w-48">
                      {u.roles.length > 0 ? u.roles.map(r => (
                        <span
                          key={r}
                          className="text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap"
                          style={{ backgroundColor: (rolColors[r] ?? "#9CA3AF") + "15", color: rolColors[r] ?? "#9CA3AF" }}
                          title="Click para remover rol"
                          onClick={() => setRolToRemove({ userId: u.id, roleName: r })}
                        >
                          {r} ✕
                        </span>
                      )) : (
                        <span className="text-xs text-gray-400 italic">Sin rol</span>
                      )}
                    </div>
                    <Badge variant={u.estado as any} />
                    <span className="text-xs text-theme-text-muted hidden lg:block">{new Date(u.fecha_registro).toLocaleDateString()}</span>
                    
                    <div className="flex gap-2">
                      <select 
                        className="text-xs border border-gray-200 rounded px-2 py-1 outline-none"
                        onChange={(e) => {
                          if(e.target.value) {
                            handleAssignRole(u.id, e.target.value);
                            e.target.value = "";
                          }
                        }}
                        defaultValue=""
                      >
                        <option value="" disabled>+ Asignar Rol</option>
                        {rolesDisponibles
                          .filter(r => !u.roles.includes(r.nombre))
                          .map(r => (
                            <option key={r.id} value={r.nombre}>{r.nombre}</option>
                          ))
                        }
                      </select>
                      <button
                        onClick={() => setUsuarioAEliminar(u)}
                        className="p-1.5 rounded-lg transition-colors"
                        title="Eliminar usuario"
                        style={{ color: "#DC2626", backgroundColor: "#FEE2E2" }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#FECACA")}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = "#FEE2E2")}
                      >
                        <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                          <path d="M10 11v6M14 11v6" />
                          <path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {tab === "roles" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {ROLES.map((rol) => (
              <Card key={rol.nombre} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: (rolColors[rol.nombre] ?? "#9CA3AF") + "15" }}
                  >
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: rolColors[rol.nombre] ?? "#9CA3AF" }} />
                  </div>
                  <span className="text-xs text-theme-text-muted">{rol.permisos} permisos</span>
                </div>
                <h3 className="text-sm font-bold text-theme-text-main mb-1">{rol.nombre}</h3>
                <p className="text-xs text-theme-text-muted mb-3">{rol.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-theme-border">
                  <span className="text-xs text-theme-text-muted">{rol.usuarios} usuarios</span>
                  <Button variant="outline" size="sm">Configurar</Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "parametros" && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-theme-text-main">Parámetros Institucionales</p>
            <Button variant="primary" size="sm">Guardar Cambios</Button>
          </div>
          <div className="space-y-4">
            {PARAMETROS.map((p) => (
              <div key={p.clave} className="flex items-center gap-4 py-3 border-b border-theme-border">
                <span className="text-xs font-semibold text-theme-text-muted w-52 flex-shrink-0">{p.clave}</span>
                <input
                  defaultValue={p.valor}
                  className="flex-1 px-3 py-2 text-sm border border-theme-border rounded-lg bg-theme-bg-card text-theme-text-main focus:outline-none focus:border-theme-primary"
                />
              </div>
            ))}
          </div>
        </Card>
      )}

      {tab === "facultades" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="primary" size="sm">+ Crear Facultad</Button>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[
              { nombre:"Ingeniería", programas:["Ing. Civil","Ing. de Sistemas","Ing. Ambiental"], grupos:2, lineas:4, docentes:28 },
              { nombre:"Ciencias Económicas y Administrativas", programas:["Administración de Empresas","Contaduría Pública","Economía"], grupos:2, lineas:3, docentes:22 },
              { nombre:"Ciencias Agropecuarias", programas:["Medicina Veterinaria","Agronomía","Zootecnia"], grupos:1, lineas:3, docentes:18 },
              { nombre:"Educación", programas:["Lic. Matemáticas","Lic. Lengua Castellana","Lic. Biología"], grupos:1, lineas:2, docentes:16 },
              { nombre:"Ciencias Jurídicas y Políticas", programas:["Derecho"], grupos:1, lineas:2, docentes:14 },
              { nombre:"Ciencias de la Salud", programas:["Enfermería","Bacteriología"], grupos:1, lineas:2, docentes:12 },
            ].map((f)=>(
              <Card key={f.nombre} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-theme-primary/10 flex items-center justify-center text-xl flex-shrink-0">🏛️</div>
                  <Button variant="ghost" size="sm">Editar</Button>
                </div>
                <h3 className="text-sm font-bold text-theme-text-main mb-2">{f.nombre}</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {f.programas.map((p)=>(
                    <span key={p} className="text-xs bg-theme-primary/10 text-theme-primary px-2 py-0.5 rounded-full font-medium">{p}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-theme-border text-xs text-theme-text-muted">
                  <span>👥 {f.docentes} docentes</span>
                  <span>🔬 {f.grupos} grupos</span>
                  <span>📌 {f.lineas} líneas</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "soporte" && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-theme-text-main">Reportes de Soporte</p>
          </div>
          {loading ? (
            <div className="p-8 text-center text-theme-text-muted">Cargando...</div>
          ) : reportesSoporte.length === 0 ? (
            <div className="p-8 text-center text-theme-text-muted">No hay reportes.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-theme-border text-xs text-theme-text-muted">
                    <th className="pb-3 font-semibold">Usuario</th>
                    <th className="pb-3 font-semibold">Categoría</th>
                    <th className="pb-3 font-semibold">Asunto</th>
                    <th className="pb-3 font-semibold">Fecha</th>
                    <th className="pb-3 font-semibold">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-theme-border">
                  {reportesSoporte.map(r => (
                    <tr key={r.id} className="text-sm text-theme-text-main hover:bg-theme-bg-main">
                      <td className="py-3 pr-4">
                        <div className="font-semibold">{r.usuario_nombre}</div>
                        <div className="text-xs text-theme-text-muted">{r.usuario_correo}</div>
                      </td>
                      <td className="py-3 pr-4 uppercase text-xs tracking-wider text-theme-text-muted">{r.categoria.replace('_', ' ')}</td>
                      <td className="py-3 pr-4 font-medium">{r.asunto}</td>
                      <td className="py-3 pr-4 text-xs text-theme-text-muted">{new Date(r.fecha_creacion).toLocaleDateString()}</td>
                      <td className="py-3 pr-4">
                        <select
                          className="text-xs border border-theme-border rounded px-2 py-1 outline-none focus:border-theme-primary bg-theme-bg-card"
                          value={r.estado}
                          onChange={async (e) => {
                            try {
                              await soporteApi.actualizarEstado(r.id, e.target.value);
                              const updated = await soporteApi.listarTodos();
                              setReportesSoporte(updated);
                            } catch(err) {
                              alert("Error actualizando estado");
                            }
                          }}
                        >
                          <option value="pendiente">Pendiente</option>
                          <option value="en_revision">En Revisión</option>
                          <option value="resuelto">Resuelto</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      <NuevoUsuarioModal open={showModal} onClose={() => setShowModal(false)} />
      <EliminarUsuarioModal
        usuario={usuarioAEliminar}
        onClose={() => setUsuarioAEliminar(null)}
        onConfirm={handleDeleteUser}
      />
      <RemoverRolModal
        roleInfo={rolToRemove}
        onClose={() => setRolToRemove(null)}
        onConfirm={handleRemoveRole}
      />
    </div>
  );
}
