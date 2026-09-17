const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const express  = require('express');
const cors     = require('cors');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');

// DB connection
const pool = require('./db/connection');

// Routes
const authRoutes         = require('./modules/auth/auth.routes');
const dashboardRoutes    = require('./modules/dashboard/dashboard.routes');
const proyectosRoutes    = require('./modules/proyectos/proyectos.routes');
const convocatoriasRoutes= require('./modules/convocatorias/convocatorias.routes');
const semillerosRoutes   = require('./modules/semilleros/semilleros.routes');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Passport — Google OAuth 2.0 (RF-AU-01) ───────────────────────────────────
// Guard: si las credenciales no están configuradas aún, registrar advertencia
// pero no bloquear el arranque del servidor (otros módulos siguen funcionando).
try {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.startsWith('TU_')) {
    console.warn('⚠️  Google OAuth no configurado. Añade GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env');
  } else {
    passport.use(
      new GoogleStrategy(
        {
          clientID:     process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL:  process.env.GOOGLE_CALLBACK_URL,
        },
        // verify callback: normaliza el perfil de Google al formato interno
        (_accessToken, _refreshToken, profile, done) => {
          const correo = profile.emails?.[0]?.value || '';
          const nombre = profile.displayName || correo;
          done(null, { correo, nombre, googleId: profile.id });
        }
      )
    );
  }
} catch (err) {
  console.error('❌ Error configurando Passport Google Strategy:', err.message);
}

// ── Middlewares ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize()); // passport stateless (sin sesiones de Express)

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/proyectos',    proyectosRoutes);
app.use('/api/convocatorias',convocatoriasRoutes);
app.use('/api/semilleros',   semillerosRoutes);

// Ruta de prueba básica
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'conectada', timestamp: new Date().toISOString() });
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'desconectada', error: err.message });
  }
});

// ── Servidor ──────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Servidor backend corriendo en http://localhost:${PORT}`);
  console.log(`   🔐 Auth:          http://localhost:${PORT}/api/auth/google`);
  console.log(`   📊 Dashboard:     http://localhost:${PORT}/api/dashboard/kpis`);
  console.log(`   📁 Proyectos:     http://localhost:${PORT}/api/proyectos`);
  console.log(`   📢 Convocatorias: http://localhost:${PORT}/api/convocatorias`);
  console.log(`   🌱 Semilleros:    http://localhost:${PORT}/api/semilleros`);
});
