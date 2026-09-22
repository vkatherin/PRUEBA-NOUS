const express = require('express');
const router = express.Router();
const ctrl = require('./soporte.controller');
const { verificarAutenticacion, verificarRol } = require('../auth/auth.middleware');

router.post('/', verificarAutenticacion, ctrl.crearReporte);
router.get('/mis-reportes', verificarAutenticacion, ctrl.getMisReportes);
router.get('/', verificarAutenticacion, verificarRol('administrador'), ctrl.getAllReportes);
router.patch('/:id/estado', verificarAutenticacion, verificarRol('administrador'), ctrl.updateEstado);

module.exports = router;
