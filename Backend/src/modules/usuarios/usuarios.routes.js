const express = require('express');
const router = express.Router();
const ctrl = require('./usuarios.controller');
const { verificarAutenticacion, verificarPermiso } = require('../auth/auth.middleware');

// Todas las rutas de usuarios requieren estar autenticado
router.use(verificarAutenticacion);

router.get('/', verificarPermiso('usuarios.leer'), ctrl.getUsuarios);
router.post('/', verificarPermiso('usuarios.crear'), ctrl.crearUsuario);
router.delete('/:id', verificarPermiso('usuarios.eliminar'), ctrl.eliminarUsuario);
router.patch('/:id/estado', verificarPermiso('usuarios.editar'), ctrl.actualizarEstado);
router.get('/roles', verificarPermiso('usuarios.leer'), ctrl.getRolesDisponibles);
router.post('/:id/roles', verificarPermiso('usuarios.editar'), ctrl.asignarRol);
router.delete('/:id/roles/:role', verificarPermiso('usuarios.editar'), ctrl.removerRol);

module.exports = router;