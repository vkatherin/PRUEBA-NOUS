const express = require('express');
const router = express.Router();
const ctrl = require('./usuarios.controller');
const { verificarAutenticacion, verificarRol } = require('../auth/auth.middleware');

// Todas las rutas de usuarios requieren estar autenticado y ser administrador
router.use(verificarAutenticacion, verificarRol('administrador'));

router.get('/', ctrl.getUsuarios);
router.post('/', ctrl.crearUsuario);
router.patch('/:id/estado', ctrl.actualizarEstado);
router.get('/roles', ctrl.getRolesDisponibles);
router.post('/:id/roles', ctrl.asignarRol);
router.delete('/:id/roles/:role', ctrl.removerRol);

module.exports = router;