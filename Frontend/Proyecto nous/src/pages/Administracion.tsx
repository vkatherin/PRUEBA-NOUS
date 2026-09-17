import React, { useState } from "react";
import { Badge, Button, Card, PageHeader, SearchBar, Avatar, Tabs, Modal, Field, Input, Select } from "@/components/ui";

const USUARIOS = [
  { nombre: "Administrador NOUS", email: "admin@cusur.edu.co", rol: "Super Administrador", facultad: "VRI", estado: "active" as const, ultimo: "Hoy, 09:15 am" },
  { nombre: "Carlos Mejía Hernández", email: "cmejia@cusur.edu.co", rol: "Investigador", facultad: "Ingeniería", estado: "active" as const, ultimo: "Ayer, 4:22 pm" },
  { nombre: "María Torres Duarte", email: "mtorres@cusur.edu.co", rol: "Investigador", facultad: "Ciencias Sociales", estado: "active" as const, ultimo: "Hace 2 días" },
  { nombre: "Jorge Peña Alarcón", email: "jpena@cusur.edu.co", rol: "Investigador", facultad: "Ciencias Económicas", estado: "active" as const, ultimo: "Hace 3 días" },
  { nombre: "Laura Ríos Castillo", email: "lrios@cusur.edu.co", rol: "Evaluador", facultad: "Externa", estado: "active" as const, ultimo: "Hace 1 semana" },
  { nombre: "Roberto Díaz Morales", email: "rdiaz@cusur.edu.co", rol: "Coordinador VRI", facultad: "VRI", estado: "active" as const, ultimo: "Hace 2 días" },
  { nombre: "Claudia Herrera Soto", email: "cherrera@cusur.edu.co", rol: "Investigador", facultad: "Ciencias de la Salud", estado: "active" as const, ultimo: "Hace 5 días" },
  { nombre: "Sebastián Ortiz H.", email: "sortiz@cusur.edu.co", rol: "Estudiante-Investigador", facultad: "Ingeniería", estado: "active" as const, ultimo: "Hace 1 día" },
  { nombre: "Pedro Serna Quintero", email: "pserna@cusur.edu.co", rol: "Investigador", facultad: "Educación", estado: "inactive" as const, ultimo: "Hace 1 mes" },
  { nombre: "Felipe Arango Mesa", email: "farango@cusur.edu.co", rol: "Investigador", facultad: "Derecho", estado: "inactive" as const, ultimo: "Hace 3 semanas" },
];

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
  "Investigador": "#1E6B3C",
  "Evaluador": "#2563EB",
  "Estudiante-Investigador": "#D97706",
  "Consulta": "#9CA3AF",
};

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
        <div className="flex items-center gap-3 p-3 rounded-xl bg-[#EBF5EF]">
          <input type="checkbox" defaultChecked className="accent-[#1E6B3C] w-4 h-4" />
          <span className="text-xs text-[#637068]">
            Enviar credenciales de acceso al correo institucional
          </span>
        </div>
        <div className="flex justify-end gap-3 pt-3 border-t border-[#DDE4DF]">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button variant="primary" onClick={onClose}>Crear Usuario</Button>
        </div>
      </div>
    </Modal>
  );
}

export function Administracion() {
  const [tab, setTab] = useState("usuarios");
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);

  const filteredUsers = USUARIOS.filter((u) =>
    u.nombre.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.rol.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-5">
      <PageHeader
        title="Administración del Sistema"
        subtitle="Gestión de usuarios, roles, parámetros institucionales y configuración"
        breadcrumb={["NOUS", "Administración"]}
        actions={
          tab === "usuarios" ? (
            <Button variant="primary" onClick={() => setShowModal(true)}>+ Nuevo Usuario</Button>
          ) : undefined
        }
      />

      <Tabs
        tabs={[
          { id: "usuarios", label: "Usuarios" },
          { id: "roles", label: "Roles y Permisos" },
          { id: "parametros", label: "Parámetros Institucionales" },
          { id: "facultades", label: "Facultades y Programas" },
        ]}
        active={tab}
        onChange={setTab}
      />

      {tab === "usuarios" && (
        <div className="space-y-4">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Total Usuarios", value: USUARIOS.length, color: "#1E6B3C" },
              { label: "Activos", value: USUARIOS.filter((u) => u.estado === "active").length, color: "#1E6B3C" },
              { label: "Investigadores", value: USUARIOS.filter((u) => u.rol === "Investigador").length, color: "#7C3AED" },
              { label: "Inactivos", value: USUARIOS.filter((u) => u.estado === "inactive").length, color: "#9CA3AF" },
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
            <div className="divide-y divide-[#F2F5F3]">
              {filteredUsers.map((u, i) => (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-[#FAFFFE] group">
                  <Avatar name={u.nombre} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1A2B22]">{u.nombre}</p>
                    <p className="text-xs text-[#637068]">{u.email}</p>
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
                  <span className="text-xs text-[#637068] hidden md:block">{u.facultad}</span>
                  <Badge variant={u.estado} />
                  <span className="text-xs text-[#9BAD9F] hidden lg:block">{u.ultimo}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="outline" size="sm">Editar</Button>
                    <Button variant="ghost" size="sm">
                      {u.estado === "active" ? "Suspender" : "Activar"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
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
                  <span className="text-xs text-[#9BAD9F]">{rol.permisos} permisos</span>
                </div>
                <h3 className="text-sm font-bold text-[#1A2B22] mb-1">{rol.nombre}</h3>
                <p className="text-xs text-[#637068] mb-3">{rol.desc}</p>
                <div className="flex items-center justify-between pt-3 border-t border-[#F2F5F3]">
                  <span className="text-xs text-[#637068]">{rol.usuarios} usuarios</span>
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
            <p className="text-sm font-semibold text-[#1A2B22]">Parámetros Institucionales</p>
            <Button variant="primary" size="sm">Guardar Cambios</Button>
          </div>
          <div className="space-y-4">
            {PARAMETROS.map((p) => (
              <div key={p.clave} className="flex items-center gap-4 py-3 border-b border-[#F2F5F3]">
                <span className="text-xs font-semibold text-[#637068] w-52 flex-shrink-0">{p.clave}</span>
                <input
                  defaultValue={p.valor}
                  className="flex-1 px-3 py-2 text-sm border border-[#DDE4DF] rounded-lg bg-white text-[#1A2B22] focus:outline-none focus:border-[#1E6B3C]"
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
                  <div className="w-10 h-10 rounded-xl bg-[#EBF5EF] flex items-center justify-center text-xl flex-shrink-0">🏛️</div>
                  <Button variant="ghost" size="sm">Editar</Button>
                </div>
                <h3 className="text-sm font-bold text-[#1A2B22] mb-2">{f.nombre}</h3>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {f.programas.map((p)=>(
                    <span key={p} className="text-xs bg-[#EBF5EF] text-[#1E6B3C] px-2 py-0.5 rounded-full font-medium">{p}</span>
                  ))}
                </div>
                <div className="flex items-center gap-4 pt-3 border-t border-[#F2F5F3] text-xs text-[#637068]">
                  <span>👥 {f.docentes} docentes</span>
                  <span>🔬 {f.grupos} grupos</span>
                  <span>📌 {f.lineas} líneas</span>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <NuevoUsuarioModal open={showModal} onClose={() => setShowModal(false)} />
    </div>
  );
}
