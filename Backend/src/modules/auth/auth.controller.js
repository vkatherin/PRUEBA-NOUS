const pool = require('../../db/connection');
const jwt  = require('jsonwebtoken');

// ── Helpers internos ──────────────────────────────────────────────────────────

/**
 * Inserta un registro en log_auditoria (RF-AU-05).
 */
async function registrarAuditoria(usuario_id, accion, entidad_afectada = null, entidad_id = null) {
  try {
    await pool.query(
      `INSERT INTO log_auditoria (usuario_id, accion, entidad_afectada, entidad_id)
       VALUES (?, ?, ?, ?)`,
      [usuario_id, accion, entidad_afectada, entidad_id]
    );
  } catch (err) {
    // La auditoría no debe bloquear el flujo principal
    console.error('⚠️  Error al registrar auditoría:', err.message);
  }
}

/**
 * Genera un JWT firmado con los datos esenciales del usuario.
 */
function generarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, correo: usuario.correo_institucional },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
}

// ── RF-AU-01 — Google OAuth callback ─────────────────────────────────────────

/**
 * Llamado por Passport luego del callback de Google.
 * Crea o actualiza el usuario en la BD y devuelve un JWT.
 * Redirige al frontend con el token como query param.
 */
exports.googleCallback = async (req, res) => {
  try {
    const perfil = req.user; // objeto inyectado por passport-google-oauth20

    // Verificar dominio institucional
    const dominio = process.env.DOMINIO_INSTITUCIONAL || 'unicatolicadelsur.edu.co';
    if (!perfil.correo.endsWith(`@${dominio}`)) {
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=dominio_invalido`
      );
    }

    const [[existente]] = await pool.query(
      `SELECT id, nombre_completo, correo_institucional, mfa_habilitado, activo
       FROM usuarios WHERE correo_institucional = ?`,
      [perfil.correo]
    );

    let usuarioId;

    if (existente) {
      // Usuario existente — actualizar nombre si cambió
      await pool.query(
        `UPDATE usuarios SET nombre_completo = ? WHERE id = ?`,
        [perfil.nombre, existente.id]
      );
      usuarioId = existente.id;

      if (!existente.activo) {
        return res.redirect(
          `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=usuario_inactivo`
        );
      }
    } else {
      // Usuario nuevo — crear registro
      const [result] = await pool.query(
        `INSERT INTO usuarios (nombre_completo, correo_institucional, activo)
         VALUES (?, ?, TRUE)`,
        [perfil.nombre, perfil.correo]
      );
      usuarioId = result.insertId;
    }

    await registrarAuditoria(usuarioId, 'login_google', 'usuarios', usuarioId);

    // Verificar si el usuario tiene MFA habilitado
    const [[usuario]] = await pool.query(
      `SELECT id, correo_institucional, mfa_habilitado FROM usuarios WHERE id = ?`,
      [usuarioId]
    );

    if (usuario.mfa_habilitado) {
      // Emitir token temporal (corto) para la fase de verificación MFA
      const tempToken = jwt.sign(
        { id: usuarioId, correo: usuario.correo_institucional, mfaPendiente: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.redirect(
        `${process.env.FRONTEND_URL || 'http://localhost:5173'}?mfaRequired=true&tempToken=${tempToken}`
      );
    }

    const token = generarToken(usuario);
    return res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${token}`
    );
  } catch (err) {
    console.error('❌ Error en googleCallback:', err.message);
    res.redirect(
      `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=server_error`
    );
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────

/**
 * Retorna los datos del usuario autenticado (req.usuario inyectado por middleware).
 */
exports.getMe = async (req, res) => {
  try {
    const [[usuario]] = await pool.query(
      `SELECT u.id, u.nombre_completo, u.correo_institucional, u.mfa_habilitado, u.activo,
              JSON_ARRAYAGG(r.nombre) AS roles
       FROM usuarios u
       LEFT JOIN usuario_rol ur ON ur.usuario_id = u.id
       LEFT JOIN roles r        ON r.id = ur.rol_id
       WHERE u.id = ?
       GROUP BY u.id`,
      [req.usuario.id]
    );

    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    // JSON_ARRAYAGG puede retornar [null] si no hay roles
    const roles = Array.isArray(usuario.roles)
      ? usuario.roles.filter(Boolean)
      : [];

    res.json({ ...usuario, roles });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/auth/login — Login local (RF-AU-04 respaldo) ───────────────────

/**
 * Autentica con email + contraseña. Backup para cuando no se usa OAuth.
 */
exports.loginLocal = async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { correo, password } = req.body;

  if (!correo || !password) {
    return res.status(400).json({ error: 'Correo y contraseña son requeridos' });
  }

  try {
    const [[usuario]] = await pool.query(
      `SELECT id, nombre_completo, correo_institucional, password_hash, mfa_habilitado, activo
       FROM usuarios WHERE correo_institucional = ?`,
      [correo]
    );

    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    if (!usuario.activo) {
      return res.status(403).json({ error: 'Usuario inactivo. Contacta al administrador.' });
    }

    if (!usuario.password_hash) {
      return res.status(401).json({
        error: 'Este usuario solo puede iniciar sesión con Google Workspace'
      });
    }

    const valida = await bcrypt.compare(password, usuario.password_hash);
    if (!valida) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    await registrarAuditoria(usuario.id, 'login_local', 'usuarios', usuario.id);

    if (usuario.mfa_habilitado) {
      // Token temporal — requiere verificación MFA
      const tempToken = jwt.sign(
        { id: usuario.id, correo: usuario.correo_institucional, mfaPendiente: true },
        process.env.JWT_SECRET,
        { expiresIn: '5m' }
      );
      return res.json({ mfaRequired: true, tempToken });
    }

    const token = generarToken(usuario);
    return res.json({
      token,
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre_completo,
        correo: usuario.correo_institucional,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/auth/logout ─────────────────────────────────────────────────────

/**
 * El JWT es stateless; el cliente lo elimina. Aquí solo se registra auditoría.
 */
exports.logout = async (req, res) => {
  try {
    await registrarAuditoria(req.usuario.id, 'logout', 'usuarios', req.usuario.id);
    res.json({ mensaje: 'Sesión cerrada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/auth/mfa/setup (RF-AU-02) ──────────────────────────────────────

/**
 * Genera un TOTP secret para el usuario y retorna la URL del QR.
 */
exports.setupMfa = async (req, res) => {
  const speakeasy = require('speakeasy');
  const QRCode    = require('qrcode');

  try {
    const secret = speakeasy.generateSecret({
      name: `NOUS (${req.usuario.correo})`,
      issuer: 'NOUS - Católica del Sur',
      length: 32,
    });

    // Guardar / actualizar secret (aún no verificado)
    await pool.query(
      `INSERT INTO usuario_mfa (usuario_id, secret, verified)
       VALUES (?, ?, FALSE)
       ON DUPLICATE KEY UPDATE secret = VALUES(secret), verified = FALSE`,
      [req.usuario.id, secret.base32]
    );

    const qrDataUrl = await QRCode.toDataURL(secret.otpauth_url);

    res.json({
      qrCode: qrDataUrl,
      secret: secret.base32, // para ingreso manual
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/auth/mfa/verify (RF-AU-02) ─────────────────────────────────────

/**
 * Verifica el token TOTP. Si es correcto activa MFA y emite el JWT final.
 */
exports.verifyMfa = async (req, res) => {
  const speakeasy = require('speakeasy');
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token MFA requerido' });
  }

  try {
    const usuarioId = req.usuario.id;

    const [[mfaRow]] = await pool.query(
      `SELECT secret FROM usuario_mfa WHERE usuario_id = ?`,
      [usuarioId]
    );

    if (!mfaRow) {
      return res.status(400).json({ error: 'MFA no configurado. Llama primero a /mfa/setup' });
    }

    const valido = speakeasy.totp.verify({
      secret: mfaRow.secret,
      encoding: 'base32',
      token,
      window: 1, // ±30 s de tolerancia
    });

    if (!valido) {
      return res.status(401).json({ error: 'Código MFA inválido o expirado' });
    }

    // Marcar secret como verificado y activar MFA en el perfil
    await pool.query(
      `UPDATE usuario_mfa SET verified = TRUE WHERE usuario_id = ?`,
      [usuarioId]
    );
    await pool.query(
      `UPDATE usuarios SET mfa_habilitado = TRUE WHERE id = ?`,
      [usuarioId]
    );

    await registrarAuditoria(usuarioId, 'mfa_activado', 'usuarios', usuarioId);

    // Si venía de un token temporal (mfaPendiente), emitir JWT completo
    const [[usuario]] = await pool.query(
      `SELECT id, correo_institucional FROM usuarios WHERE id = ?`,
      [usuarioId]
    );

    const jwtFinal = generarToken(usuario);
    res.json({ token: jwtFinal, mensaje: 'MFA verificado correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/auth/recuperar-password (RF-AU-04) ─────────────────────────────

/**
 * Genera un token de reset y lo imprime en consola (TODO: enviar por email).
 */
exports.solicitarReset = async (req, res) => {
  const crypto = require('crypto');
  const { correo } = req.body;

  if (!correo) {
    return res.status(400).json({ error: 'Correo requerido' });
  }

  try {
    const [[usuario]] = await pool.query(
      `SELECT id, nombre_completo FROM usuarios WHERE correo_institucional = ? AND activo = TRUE`,
      [correo]
    );

    // Por seguridad, responder siempre igual aunque el correo no exista
    if (!usuario) {
      return res.json({ mensaje: 'Si el correo existe, recibirás instrucciones de recuperación.' });
    }

    // Invalidar tokens previos
    await pool.query(
      `UPDATE password_reset_tokens SET usado = TRUE WHERE usuario_id = ? AND usado = FALSE`,
      [usuario.id]
    );

    // Generar token único
    const tokenPlano = crypto.randomBytes(32).toString('hex');
    const tokenHash  = crypto.createHash('sha256').update(tokenPlano).digest('hex');
    const expiresAt  = new Date(Date.now() + 30 * 60 * 1000); // 30 minutos

    await pool.query(
      `INSERT INTO password_reset_tokens (usuario_id, token_hash, expires_at)
       VALUES (?, ?, ?)`,
      [usuario.id, tokenHash, expiresAt]
    );

    await registrarAuditoria(usuario.id, 'solicitud_reset_password', 'usuarios', usuario.id);

    // TODO: conectar nodemailer para enviar el link por email
    console.log('\n🔑 [RESET PASSWORD TOKEN]');
    console.log(`   Usuario: ${usuario.nombre_completo} (${correo})`);
    console.log(`   Token:   ${tokenPlano}`);
    console.log(`   Link:    ${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${tokenPlano}`);
    console.log(`   Expira:  ${expiresAt.toISOString()}\n`);

    res.json({ mensaje: 'Si el correo existe, recibirás instrucciones de recuperación.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ── POST /api/auth/reset-password (RF-AU-04) ─────────────────────────────────

/**
 * Valida el token de reset y actualiza la contraseña.
 */
exports.resetPassword = async (req, res) => {
  const crypto = require('crypto');
  const bcrypt = require('bcryptjs');
  const { token, nuevaPassword } = req.body;

  if (!token || !nuevaPassword) {
    return res.status(400).json({ error: 'Token y nueva contraseña son requeridos' });
  }

  if (nuevaPassword.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  try {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const [[resetRow]] = await pool.query(
      `SELECT prt.id, prt.usuario_id, prt.expires_at, prt.usado
       FROM password_reset_tokens prt
       WHERE prt.token_hash = ?`,
      [tokenHash]
    );

    if (!resetRow) {
      return res.status(400).json({ error: 'Token inválido' });
    }

    if (resetRow.usado) {
      return res.status(400).json({ error: 'El token ya fue utilizado' });
    }

    if (new Date(resetRow.expires_at) < new Date()) {
      return res.status(400).json({ error: 'El token ha expirado' });
    }

    const passwordHash = await bcrypt.hash(nuevaPassword, 12);

    await pool.query(
      `UPDATE usuarios SET password_hash = ? WHERE id = ?`,
      [passwordHash, resetRow.usuario_id]
    );

    await pool.query(
      `UPDATE password_reset_tokens SET usado = TRUE WHERE id = ?`,
      [resetRow.id]
    );

    await registrarAuditoria(resetRow.usuario_id, 'reset_password', 'usuarios', resetRow.usuario_id);

    res.json({ mensaje: 'Contraseña actualizada correctamente' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ── POST /api/auth/registro (RF-AU-03) ───────────────────────────────────────

/**
 * Registra un nuevo usuario con correo institucional y contraseña.
 * Solo se permiten correos del dominio institucional configurado.
 */
exports.registro = async (req, res) => {
  const bcrypt = require('bcryptjs');
  const { nombre_completo, correo, password, cedula } = req.body;

  if (!nombre_completo || !correo || !password) {
    return res.status(400).json({ error: 'Nombre, correo y contraseña son requeridos' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
  }

  // Verificar dominio institucional
  const dominio = process.env.DOMINIO_INSTITUCIONAL || 'unicatolicadelsur.edu.co';
  if (!correo.endsWith(`@${dominio}`)) {
    return res.status(400).json({
      error: `Solo se permiten correos institucionales del dominio @${dominio}`
    });
  }

  try {
    // Verificar si el correo ya existe
    const [[existente]] = await pool.query(
      `SELECT id FROM usuarios WHERE correo_institucional = ?`,
      [correo]
    );

    if (existente) {
      return res.status(409).json({ error: 'Ya existe una cuenta con ese correo institucional' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const [result] = await pool.query(
      `INSERT INTO usuarios (nombre_completo, correo_institucional, cedula, password_hash, activo)
       VALUES (?, ?, ?, ?, TRUE)`,
      [nombre_completo.trim(), correo.trim().toLowerCase(), cedula || null, passwordHash]
    );

    await registrarAuditoria(result.insertId, 'registro_local', 'usuarios', result.insertId);

    // Emitir JWT para iniciar sesión automáticamente tras el registro
    const token = jwt.sign(
      { id: result.insertId, correo: correo.trim().toLowerCase() },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      token,
      usuario: {
        id: result.insertId,
        nombre: nombre_completo.trim(),
        correo: correo.trim().toLowerCase(),
      },
      mensaje: 'Cuenta creada exitosamente'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
