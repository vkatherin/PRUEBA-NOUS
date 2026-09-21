const express  = require('express');
const passport = require('passport');
const router   = express.Router();
const ctrl     = require('./auth.controller');
const { verificarAutenticacion } = require('./auth.middleware');

// Guard: evitar crash cuando Google OAuth no está configurado
const googleGuard = (req, res, next) => {
  const id = process.env.GOOGLE_CLIENT_ID;
  if (!id || id.startsWith('TU_')) {
    return res.status(503).json({
      error: 'Google OAuth no está configurado. Añade GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el .env del backend.'
    });
  }
  next();
};

// ── RF-AU-01 — Google OAuth 2.0 ───────────────────────────────────────────────

// Inicia el flujo OAuth — redirige a Google
router.get('/google',
  googleGuard,
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    prompt: 'select_account',
  })
);

// Callback de Google — Passport verifica el código y llama a googleCallback
router.get('/google/callback',
  googleGuard,
  passport.authenticate('google', {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?error=auth_google`,
  }),
  ctrl.googleCallback
);

// ── Sesión ─────────────────────────────────────────────────────────────────────

// GET /api/auth/me — datos del usuario autenticado
router.get('/me', verificarAutenticacion, ctrl.getMe);

// POST /api/auth/login — login local (email + contraseña)
router.post('/login', ctrl.loginLocal);

// POST /api/auth/logout
router.post('/logout', verificarAutenticacion, ctrl.logout);

// ── RF-AU-02 — MFA ────────────────────────────────────────────────────────────

// POST /api/auth/mfa/setup — genera TOTP secret y QR
router.post('/mfa/setup', verificarAutenticacion, ctrl.setupMfa);

// POST /api/auth/mfa/verify — verifica código TOTP y activa MFA
router.post('/mfa/verify', verificarAutenticacion, ctrl.verifyMfa);

// ── RF-AU-04 — Recuperación de contraseña ─────────────────────────────────────

// POST /api/auth/recuperar-password — solicita reset (genera token)
router.post('/recuperar-password', ctrl.solicitarReset);

// POST /api/auth/reset-password — aplica el nuevo password con el token
router.post('/reset-password', ctrl.resetPassword);

// POST /api/auth/cambiar-password — el usuario autenticado cambia su contraseña
router.post('/cambiar-password', verificarAutenticacion, ctrl.cambiarPassword);

// POST /api/auth/seleccionar-rol — el usuario elige su rol tras Google OAuth
router.post('/seleccionar-rol', verificarAutenticacion, ctrl.seleccionarRol);

// POST /api/auth/aceptar-datos — registra la aceptación de la Política de Datos (Ley 1581 de 2012)
router.post('/aceptar-datos', verificarAutenticacion, ctrl.aceptarDatos);

// ── RF-AU-03 — Registro local ─────────────────────────────────────────────────

// POST /api/auth/registro — crea una nueva cuenta con correo institucional
router.post('/registro', ctrl.registro);

module.exports = router;
