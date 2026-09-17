import React, { useState, useEffect } from "react";
import { Badge, Button, Card, PageHeader, SearchBar, Avatar, Tabs, Modal, Field, Input, Select } from "@/components/ui";
import {
  getUsuariosAdmin,
  getRolesAdmin,
  crearUsuarioAdmin,
  type UsuarioAdmin,
  type RolAdmin
} from "@/services/api";

const PARAMETROS = [
  { clave: "Institución", valor: "Fundación Universitaria Católica del Sur" },
  { clave: "NIT", valor: "900.000.000-1" },
  { clave: "Vicerrectoría", valor: "Vicerrectoría de Investigación e Innovación" },
  { clave: "Código institución MinCiencias", valor: "COL-0123456" },
  { clave: "Correo institucional VRI", valor: "investigacion@unicatolicadelsur.edu.co" },
  { clave: "Versión NOUS", valor: "v1.0.0 — 2026" },
];

const rolColors: Record<string, string> = {
  "Administrador": "#DC2626",
  "directivos": "#7C3AED",
  "director_investigación": "#1E6B3C",
  "coordinador_investigación": "#2563EB",
  "lider_investigacion": "#059669",
  "director_semilleros": "#D97706",
  "coordinador_semilleros": "#B45309",
  "lider_semilleros": "#10B981",
  "docente": "#4F46E5",
  "Estudiante": "#EC4899",
  "evaluador": "#6366F1",
  "financiero": "#0891B2",
  "compras": "#0D9488",
  "comite_etica": "#84CC16",
  "comité_investigación": "#3B82F6",
};

function NuevoUsuarioModal({
  open,
  onClose,
  roles,
  onSuccess
}: {
  open: boolean;
  onClose: () => void;
  roles: RolAdmin[];
  onSuccess: () => void;
}) {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [cedula, setCedula] = useState("");
  const [rolId, setRolId] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!nombre.trim() || !correo.trim()) return;
    setLoading(true);
    try {
      await crearUsuarioAdmin({
        nombre_completo: nombre.trim(),
        correo_institucional: correo.trim(),
        cedula: cedula.trim() || undefined,
        rol_id: rolId ? Number(rolId) : undefined,
      });
      setNombre("");
      setCorreo("");
      setCedula("");
      setRolId("");
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error al crear usuario:", err);
      alert("Error al crear usuario en la base de datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title="Crear Nuevo Usuario" size="md">
      <div className="space-y-4">
        <Field label="Nombre Completo" required>
          <Input placeholder="Ej: Dra. Elena Ramírez" value={nombre} onChange={setNombre} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Correo Institucional" required>
            <Input type="email" placeholder="usuario@unicatolicadelsur.edu.co" value={correo} onChange={setCorreo} />
          </Field>
          <Field label="Cédula / Documento">
            <Input placeholder="Número de cédula" value={cedula} onChange={setCedula} />
          </Field>
        </div>
        <Field label="Rol Institucional">
          <Select
            options={roles.map((r) => ({ value: String(r.id), label: `${r.nombre} (ID ${r.id})` }))}
            value={rolId}
            onChange={setRolId}
            placeholder="Seleccionar rol institucional"
          />
        </Field>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#DDE4DF]">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" disabled={loading} onClick={handleSubmit}>
            {loading ? "Creando..." : "Crear Usuario"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export function Administracion() {
  const [tab, setTab] = useState("usuarios");
  const [search, setSearch] = useState("");
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [roles, setRoles] = useState<RolAdmin[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  const cargarDatos = () => {
    setLoading(true);
    Promise.all([getUsuariosAdmin(), getRolesAdmin()])
      .then(([usersData, rolesData]) => {
        setUsuarios(usersData ?? []);
        setRoles(rolesData ?? []);
      })
      .catch((err) => console.error("Error al cargar administración:", err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const filteredUsers = usuarios.filter((u) =>
    (u.nombre_completo ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.correo_institucional ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (u.rol ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title="Administración del Sistema"
        subtitle="Gestión de usuarios, roles institucionales y configuración de plataforma"
        breadcrumb={["NOUS", "Administración"]}
        actions={
          tab === "usuarios" ? (
            <Button variant="primary" onClick={() => setShowModal(true)}>+ Nuevo Usuario</Button>
          ) : undefined
        }
      />

      <Tabs
        tabs={[
          { id: "usuarios", label: "Usuarios del Sistema" },
          { id: "roles", label: "Roles y Permisos" },
          { id: "parametros", label: "Parámetros Institucionales" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "usuarios" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Usuarios", value: usuarios.length, color: "#1E6B3C" },
              { label: "Usuarios Activos", value: usuarios.filter((u) => u.activo === 1).length, color: "#1E6B3C" },
              { label: "Roles Oficiales", value: roles.length, color: "#7C3AED" },
              { label: "Usuarios Inactivos", value: usuarios.filter((u) => u.activo === 0).length, color: "#9CA3AF" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-[#DDE4DF] rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg font-bold" style={{ backgroundColor: s.color + "15", color: s.color }}>
                  {s.value}
                </div>
                <p className="text-sm text-[#637068] font-medium">{s.label}</p>
              </div>
            ))}
          </div>

          <Card>
            <SearchBar placeholder="Buscar usuario por nombre, email o rol..." value={search} onChange={setSearch} />
          </Card>

          <Card padding={false}>
            {filteredUsers.length === 0 ? (
              <div className="p-8 text-center text-sm text-[#637068]">
                No se encontraron usuarios en la base de datos.
              </div>
            ) : (
              <div className="divide-y divide-[#F2F5F3]">
                {filteredUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFFFE] group">
                    <Avatar name={u.nombre_completo} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[#1A2B22]">{u.nombre_completo}</p>
                      <p className="text-xs text-[#637068]">{u.correo_institucional}</p>
                    </div>
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full hidden sm:block"
                      style={{
                        backgroundColor: (rolColors[u.rol] ?? "#9CA3AF") + "15",
                        color: rolColors[u.rol] ?? "#9CA3AF",
                      }}
                    >
                      {u.rol}
                    </span>
                    <span className="text-xs text-[#637068] hidden md:block">CC: {u.cedula}</span>
                    <Badge variant={u.activo === 1 ? "active" : "closed"} />
                    <span className="text-xs text-[#9BAD9F] hidden lg:block">
                      {u.fecha_creacion ? new Date(u.fecha_creacion).toLocaleDateString("es-CO") : "—"}
                    </span>
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
            {roles.map((rol) => (
              <Card key={rol.id} className="hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: (rolColors[rol.nombre] ?? "#9CA3AF") + "15" }}
                  >
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: rolColors[rol.nombre] ?? "#9CA3AF" }} />
                  </div>
                  <span className="text-xs text-[#9BAD9F] font-mono">ID {rol.id}</span>
                </div>
                <h3 className="text-sm font-bold text-[#1A2B22] mb-1">{rol.nombre}</h3>
                <p className="text-xs text-[#637068] mb-3 leading-relaxed">{rol.descripcion}</p>
                <div className="flex items-center justify-between pt-3 border-t border-[#F2F5F3]">
                  <span className="text-xs font-semibold text-[#1E6B3C] bg-[#EBF5EF] px-2.5 py-1 rounded-full">
                    {rol.usuarios_count} usuario{rol.usuarios_count === 1 ? "" : "s"} asignado{rol.usuarios_count === 1 ? "" : "s"}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {tab === "parametros" && (
        <Card>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm font-semibold text-[#1A2B22]">Parámetros Institucionales</p>
            <Button variant="primary" size="sm">Configurado</Button>
          </div>
          <div className="divide-y divide-[#F2F5F3]">
            {PARAMETROS.map((p) => (
              <div key={p.clave} className="flex justify-between items-center py-3">
                <span className="text-sm text-[#637068]">{p.clave}</span>
                <span className="text-sm font-semibold text-[#1A2B22]">{p.valor}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      <NuevoUsuarioModal
        open={showModal}
        onClose={() => setShowModal(false)}
        roles={roles}
        onSuccess={cargarDatos}
      />
    </div>
  );
}
