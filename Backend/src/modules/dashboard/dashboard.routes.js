const express = require('express');
const router = express.Router();
const ctrl = require('./dashboard.controller');

const { verificarAutenticacion, verificarPermiso } = require('../auth/auth.middleware');

router.use(verificarAutenticacion, verificarPermiso('dashboard.leer'));

router.get('/kpis',                ctrl.getKpis);
router.get('/evolucion-proyectos', ctrl.getEvolucionProyectos);
router.get('/ejecucion-financiera',ctrl.getEjecucionFinanciera);
router.get('/productos-tipo',      ctrl.getProductosTipo);
router.get('/actividad-reciente',  ctrl.getActividadReciente);
router.get('/top-proyectos',       ctrl.getTopProyectos);
router.get('/convocatorias-activas',ctrl.getConvocatoriasActivas);

module.exports = router;
