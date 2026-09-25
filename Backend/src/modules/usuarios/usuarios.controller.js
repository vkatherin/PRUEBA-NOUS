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

// GET /api/usuarios/roles — Retorna los roles que existen
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
  const { rol } = req.body;

  if (!rol) {
    return res.status(400).json({ error: 'El campo "rol" es requerido' });
  }

  try {
    const [[rolData]] = await pool.query('SELECT id FROM roles WHERE nombre = ?', [rol]);
    if (!rolData) {
      return res.status(404).json({ error: `El rol '${rol}' no existe` });
    }

    await pool.query(
      'INSERT INTO usuario_rol (usuario_id, rol_id) VALUES (?, ?) ON CONFLICT (usuario_id, rol_id) DO NOTHING',
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
  const { id, role } = req.params;

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

// POST /api/usuarios — Crea un usuario nuevo
exports.crearUsuario = async (req, res) => {
  const { nombre_completo, correo_institucional, cedula, rol_id } = req.body;
  if (!nombre_completo || !correo_institucional) {
    return res.status(400).json({ error: 'Nombre y correo institucional son obligatorios' });
  }
  try {
    const genCedula = cedula || Date.now().toString().slice(-8);
    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre_completo, correo_institucional, cedula, mfa_habilitado, activo, fecha_creacion)
      VALUES (?, ?, ?, 0, 1, NOW())
      RETURNING id`,
      [nombre_completo, correo_institucional, genCedula]
    );
    const newId = result.insertId;
    if (rol_id) {
      await pool.query('INSERT INTO usuario_rol (usuario_id, rol_id) VALUES (?, ?)', [newId, rol_id]);
    }
    res.status(201).json({ ok: true, id: newId });
  } catch (err) {
    console.error('Error al crear usuario:', err);
    res.status(500).json({ error: 'Error al crear usuario: ' + err.message });
  }
};

// PATCH /api/usuarios/:id/estado — Activa/desactiva un usuario
exports.actualizarEstado = async (req, res) => {
  try {
    const { activo } = req.body;
    await pool.query('UPDATE usuarios SET activo = ? WHERE id = ?', [activo ? 1 : 0, req.params.id]);
    res.json({ ok: true, id: req.params.id, activo });
  } catch (err) {
    res.status(500).json({ error: 'Error al actualizar estado de usuario' });
  }
};

// DELETE /api/usuarios/:id — Elimina un usuario permanentemente
exports.eliminarUsuario = async (req, res) => {
  const { id } = req.params;
  const conn = await pool.getConnection();
  try {
    // No permitir que el administrador se elimine a sí mismo
    if (parseInt(id) === req.usuario.id) {
      conn.release();
      return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    }

    // Verificar que el usuario existe
    const [[existe]] = await conn.query('SELECT id, nombre_completo FROM usuarios WHERE id = ?', [id]);
    if (!existe) {
      conn.release();
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await conn.beginTransaction();

    // Desactivar verificación de FK temporalmente para eliminar todas las referencias
    // Eliminar tablas con FK directa a usuario_id (las más comunes)
    await conn.query('DELETE FROM usuario_rol WHERE usuario_id = ?', [id]);
    await conn.query('DELETE FROM log_auditoria WHERE usuario_id = ?', [id]);
    await conn.query('DELETE FROM usuario_mfa WHERE usuario_id = ?', [id]).catch(() => {});
    await conn.query('DELETE FROM password_reset_tokens WHERE usuario_id = ?', [id]).catch(() => {});

    // Eliminar el usuario
    await conn.query('DELETE FROM usuarios WHERE id = ?', [id]);

    await conn.commit();
    conn.release();

    res.json({ ok: true, mensaje: `Usuario "${existe.nombre_completo}" eliminado correctamente` });
  } catch (err) {
    await conn.rollback().catch(() => {});
    conn.release();
    console.error('Error al eliminar usuario:', err);
    res.status(500).json({ error: 'Error al eliminar el usuario: ' + err.message });
  }
};