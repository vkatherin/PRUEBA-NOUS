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
