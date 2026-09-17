const pool = require('../../db/connection');

// GET /api/usuarios — Retorna todos los usuarios con sus roles
exports.getUsuarios = async (req, res) => {
  try {
    const [usuarios] = await pool.query(`
      SELECT 
        u.id, 
        u.nombre_completo as nombre, 
        u.correo_institucional as email, 
        u.cedula,
        u.activo,
        u.fecha_creacion as fecha_registro
      FROM usuarios u
      ORDER BY u.nombre_completo ASC
    `);

    const [roles] = await pool.query(`
      SELECT ur.usuario_id, r.nombre as rol
      FROM usuario_rol ur
      JOIN roles r ON r.id = ur.rol_id
    `);

    // Mapear roles a los usuarios
    const usuariosConRoles = usuarios.map(u => {
      const userRoles = roles
        .filter(r => r.usuario_id === u.id)
        .map(r => r.rol);
      return {
        ...u,
        estado: u.activo ? 'active' : 'inactive',
        roles: userRoles,
      };
    });

    res.json(usuariosConRoles);
  } catch (err) {
    console.error('Error al obtener usuarios:', err);
    res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
  }
};

// GET /api/usuarios/roles-disponibles — Retorna los roles que existen
exports.getRolesDisponibles = async (req, res) => {
  try {
    const [roles] = await pool.query('SELECT id, nombre, descripcion FROM roles');
    res.json(roles);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener roles' });
  }
};

// POST /api/usuarios/:id/roles — Asigna un rol a un usuario
exports.asignarRol = async (req, res) => {
  const { id } = req.params;
  const { rol } = req.body; // El nombre del rol, ej: "administrador", "investigador"

  if (!rol) {
    return res.status(400).json({ error: 'El campo "rol" es requerido' });
  }

  try {
    // 1. Obtener ID del rol
    const [[rolData]] = await pool.query('SELECT id FROM roles WHERE nombre = ?', [rol]);
    if (!rolData) {
      return res.status(404).json({ error: `El rol '${rol}' no existe` });
    }

    // 2. Asignar rol
    await pool.query(
      'INSERT IGNORE INTO usuario_rol (usuario_id, rol_id) VALUES (?, ?)',
      [id, rolData.id]
    );

    res.json({ message: `Rol '${rol}' asignado correctamente al usuario ${id}` });
  } catch (err) {
    console.error('Error al asignar rol:', err);
    res.status(500).json({ error: 'Error al asignar el rol' });
  }
};

// DELETE /api/usuarios/:id/roles/:role — Quita un rol a un usuario
exports.removerRol = async (req, res) => {
  const { id, role } = req.params; // role es el nombre, ej: "investigador"

  try {
    const [[rolData]] = await pool.query('SELECT id FROM roles WHERE nombre = ?', [role]);
    if (!rolData) {
      return res.status(404).json({ error: `El rol '${role}' no existe` });
    }

    await pool.query(
      'DELETE FROM usuario_rol WHERE usuario_id = ? AND rol_id = ?',
      [id, rolData.id]
    );

    res.json({ message: `Rol '${role}' removido del usuario ${id}` });
  } catch (err) {
    console.error('Error al remover rol:', err);
    res.status(500).json({ error: 'Error al remover el rol' });
  }
};
