const express = require('express');
const router = express.Router();
const ctrl = require('./usuarios.controller');
const { verificarAutenticacion, verificarRol } = require('../auth/auth.middleware');

// Todas las rutas de usuarios requieren estar autenticado y ser administrador
router.use(verificarAutenticacion, verificarRol('administrador'));

// GET /api/usuarios
router.get('/', ctrl.getUsuarios);

// GET /api/usuarios/roles
router.get('/roles', ctrl.getRolesDisponibles);

// POST /api/usuarios/:id/roles
router.post('/:id/roles', ctrl.asignarRol);

// DELETE /api/usuarios/:id/roles/:role
router.delete('/:id/roles/:role', ctrl.removerRol);

module.exports = router;
