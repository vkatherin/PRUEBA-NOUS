const jwt  = require('jsonwebtoken');
const pool = require('../../db/connection');

// ── RF-AU-03 — Verificar autenticación (valida JWT) ───────────────────────────

/**
 * Middleware que verifica el JWT del header Authorization.
 * Inyecta `req.usuario` con { id, correo } si el token es válido.
 *
 * Uso: router.get('/ruta-protegida', verificarAutenticacion, ctrl.handler)
 */
exports.verificarAutenticacion = (req, res, next) => {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  const token = authHeader.slice(7); // quitar "Bearer "

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);

    // Bloquear tokens temporales de MFA pendiente en rutas que no sean /mfa/verify
    if (payload.mfaPendiente) {
      const ruta = req.path;
      if (!ruta.endsWith('/mfa/verify')) {
        return res.status(403).json({
          error: 'Verificación MFA pendiente',
          mfaRequired: true,
        });
      }
    }

    // Bloquear tokens temporales de elección de rol en rutas que no sean /seleccionar-rol
    if (payload.elegirRol) {
      const ruta = req.path;
      if (!ruta.endsWith('/seleccionar-rol')) {
        return res.status(403).json({
          error: 'Selección de rol pendiente',
          elegirRolRequired: true,
        });
      }
    }

    req.usuario = { id: payload.id, correo: payload.correo };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesión expirada. Inicia sesión de nuevo.' });
    }
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// ── RF-AU-03 — Verificar rol ───────────────────────────────────────────────────

/**
 * Fábrica de middleware que verifica que el usuario tenga AL MENOS UNO de los roles indicados.
 *
 * Uso: router.delete('/ruta', verificarAutenticacion, verificarRol('administrador', 'directivos'), ctrl.handler)
 *
 * @param  {...string} roles - Nombres de rol permitidos
 */
exports.verificarRol = (...roles) => async (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  try {
    const [filas] = await pool.query(
      `SELECT r.nombre
       FROM usuario_rol ur
       JOIN roles r ON r.id = ur.rol_id
       WHERE ur.usuario_id = ?`,
      [req.usuario.id]
    );

    const rolesUsuario = filas.map(f => f.nombre);
    const tieneRol = roles.some(r => rolesUsuario.includes(r));

    if (!tieneRol) {
      return res.status(403).json({
        error: 'No tienes los permisos necesarios para esta acción',
        rolesRequeridos: roles,
      });
    }

    // Añadir roles al objeto de usuario para uso posterior
    req.usuario.roles = rolesUsuario;
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── RF-AU-03 — Verificar permiso ──────────────────────────────────────────────

/**
 * Fábrica de middleware que verifica que el usuario tenga el permiso indicado
 * a través de sus roles.
 *
 * Uso: router.post('/ruta', verificarAutenticacion, verificarPermiso('crear_proyecto'), ctrl.handler)
 *
 * @param  {string} permiso - Nombre del permiso requerido
 */
exports.verificarPermiso = (permiso) => async (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  try {
    const [filas] = await pool.query(
      `SELECT p.nombre
       FROM usuario_rol ur
       JOIN rol_permiso rp ON rp.rol_id = ur.rol_id
       JOIN permisos    p  ON p.id = rp.permiso_id
       WHERE ur.usuario_id = ? AND p.nombre = ?`,
      [req.usuario.id, permiso]
    );

    if (filas.length === 0) {
      return res.status(403).json({
        error: 'No tienes el permiso requerido para esta acción',
        permisoRequerido: permiso,
      });
    }

    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── Nivel 3 — Verificar propietario de registro (Row-Level Access) ──────────

/**
 * Middleware que verifica si el usuario autenticado es el "dueño" del registro que intenta acceder por ID.
 * Si el usuario tiene un rol que le permite ver/modificar todo (ej. administrador, directivos, etc.
 * según el módulo), se le permite el paso usando el arreglo 'rolesExentos'.
 *
 * @param {string} tabla - Nombre de la tabla en BD.
 * @param {string} campoPropietario - Nombre de la columna que almacena el ID del dueño.
 * @param {Array<string>} rolesExentos - Roles que no necesitan ser dueños para acceder.
 */
exports.verificarPropietario = (tabla, campoPropietario, rolesExentos = ['administrador', 'directivos']) => async (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({ error: 'Autenticación requerida' });
  }

  // Si tiene algún rol exento, pasa derecho
  if (req.usuario.roles && req.usuario.roles.some(r => rolesExentos.includes(r))) {
    return next();
  }

  const idRegistro = req.params.id;
  if (!idRegistro) {
    // Si la ruta no requiere ID (ej. listado genérico), pasamos. El listado se filtrará en el controlador.
    return next();
  }

  try {
    const [[registro]] = await pool.query(
      `SELECT ?? FROM ?? WHERE id = ?`,
      [campoPropietario, tabla, idRegistro]
    );

    if (!registro) {
      return res.status(404).json({ error: 'Registro no encontrado' });
    }

    if (registro[campoPropietario] !== req.usuario.id) {
      return res.status(403).json({ error: 'No tienes permiso para ver/modificar este registro (acceso denegado por propietario)' });
    }

    next();
  } catch (err) {
    console.error('Error en verificarPropietario:', err);
    res.status(500).json({ error: 'Error interno al verificar permisos de registro' });
  }
};
