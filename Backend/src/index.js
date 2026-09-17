require('dotenv').config(); // ← PRIMERO, antes de todo
const express = require('express');
const cors = require('cors');
const pool = require('./db/connection');

<<<<<<< HEAD
// Routes
const authRoutes         = require('./modules/auth/auth.routes');
const dashboardRoutes    = require('./modules/dashboard/dashboard.routes');
const proyectosRoutes    = require('./modules/proyectos/proyectos.routes');
const convocatoriasRoutes= require('./modules/convocatorias/convocatorias.routes');
const semillerosRoutes   = require('./modules/semilleros/semilleros.routes');
const usuariosRoutes     = require('./modules/usuarios/usuarios.routes');
=======
// Routers
const authRouter = require('./modules/auth/auth.routes');
const dashboardRouter = require('./modules/dashboard/dashboard.routes');
const proyectosRouter = require('./modules/proyectos/proyectos.routes');
const convocatoriasRouter = require('./modules/convocatorias/convocatorias.routes');
const semillerosRouter = require('./modules/semilleros/semilleros.routes');
const evaluacionRouter = require('./modules/evaluacion/evaluacion.routes');
const usuariosRouter = require('./modules/usuarios/usuarios.routes');
>>>>>>> main

const path = require('path');
const app = express();

// Middlewares
app.use(cors({ origin: ['http://localhost:8443', 'http://localhost:3000'] }));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

<<<<<<< HEAD
// ── Rutas ─────────────────────────────────────────────────────────────────────
app.use('/api/auth',         authRoutes);
app.use('/api/dashboard',    dashboardRoutes);
app.use('/api/proyectos',    proyectosRoutes);
app.use('/api/convocatorias',convocatoriasRoutes);
app.use('/api/semilleros',   semillerosRoutes);
app.use('/api/usuarios',     usuariosRoutes);
=======
// Rutas
app.use('/api/auth', authRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/proyectos', proyectosRouter);
app.use('/api/convocatorias', convocatoriasRouter);
app.use('/api/semilleros', semillerosRouter);
app.use('/api/evaluaciones', evaluacionRouter);
app.use('/api', usuariosRouter);
>>>>>>> main

// Endpoint de salud: confirma que la conexión real funciona
app.get('/api/health', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS total FROM roles');
    res.json({ status: 'ok', roles_en_bd: rows[0].total });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀 Servidor NOUS corriendo en puerto ${PORT}`));