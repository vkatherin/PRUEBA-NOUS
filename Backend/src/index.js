require('dotenv').config(); // ← PRIMERO, antes de todo
const express = require('express');
const cors = require('cors');
const passport = require('passport');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const pool = require('./db/connection');

// Routers
const authRoutes = require('./modules/auth/auth.routes');
const dashboardRoutes = require('./modules/dashboard/dashboard.routes');
const proyectosRoutes = require('./modules/proyectos/proyectos.routes');
const convocatoriasRoutes = require('./modules/convocatorias/convocatorias.routes');
const semillerosRoutes = require('./modules/semilleros/semilleros.routes');
const evaluacionRoutes = require('./modules/evaluacion/evaluacion.routes');
const usuariosRoutes = require('./modules/usuarios/usuarios.routes');
const preferenciasRoutes = require('./modules/preferencias/preferencias.routes');
const documentosRoutes = require('./modules/documentos/documentos.routes');
const soporteRoutes = require('./modules/soporte/soporte.routes');

const path = require('path');
const app = express();

// ── Passport — Google OAuth 2.0 (RF-AU-01) ──────────────────────────────────
try {
  if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.startsWith('TU_')) {
    console.warn('⚠️  Google OAuth no configurado. Añade GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en .env');
  } else {
    passport.use(
      new GoogleStrategy(
        {
          clientID: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          callbackURL: process.env.GOOGLE_CALLBACK_URL,
        },
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

// Middlewares
const allowedOrigins = [
  'http://localhost:8443',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  'https://prueba-nous-1.onrender.com',
].filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json());
app.use(passport.initialize());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/proyectos', proyectosRoutes);
app.use('/api/convocatorias', convocatoriasRoutes);
app.use('/api/semilleros', semillerosRoutes);
app.use('/api/evaluaciones', evaluacionRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/preferencias', preferenciasRoutes);
app.use('/api/documentos', documentosRoutes);
app.use('/api/soporte', soporteRoutes);

// Ruta raíz para identificar el servicio cuando se abre directamente en el navegador.
app.get('/', (req, res) => {
  res.json({
    servicio: 'NOUS Backend',
    estado: 'activo',
    api: '/api/health',
  });
});

// Endpoint de salud
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM roles');
    res.json({ status: 'ok', roles_en_bd: rows[0].total });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ── Tareas programadas (Jobs) y Migraciones automáticas ────────────────────────
require('./jobs/notificarVencimientos');
require('./jobs/resumenSemanal');
const autoMigrate = require('./db/auto_migrate');

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log(`🚀 Servidor NOUS corriendo en puerto ${PORT}`);
  if ((process.env.DB_CLIENT || 'mysql').toLowerCase() === 'mysql' && process.env.AUTO_MIGRATE !== 'false') {
    await autoMigrate();
  } else {
    console.log('ℹ️  Migraciones automáticas omitidas para PostgreSQL/Supabase.');
  }
});