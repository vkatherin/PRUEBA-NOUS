const express = require("express");
const router = express.Router();
const ctrl = require("./proyectos.controller");

const { verificarAutenticacion, verificarPermiso, verificarPropietario } = require('../auth/auth.middleware');

router.use(verificarAutenticacion);

const propProyecto = verificarPropietario('proyectos', 'investigador_principal_id', [
  'administrador', 'directivos', 'director_investigacion', 'coordinador_investigacion'
]);

// Lista + filtros
router.get("/", verificarPermiso('proyectos.leer'), ctrl.listar);

// Rutas específicas ANTES de /:id
router.get("/:id/equipo", verificarPermiso('proyectos.leer'), propProyecto, ctrl.equipo);
router.get("/:id/avance", verificarPermiso('proyectos.leer'), propProyecto, ctrl.avance);

// CRUD por id
router.get("/:id",          verificarPermiso('proyectos.leer'), propProyecto, ctrl.detalle);
router.post("/",            verificarPermiso('proyectos.crear'), ctrl.crear);
router.put("/:id",          verificarPermiso('proyectos.editar'), propProyecto, ctrl.actualizar);
router.patch("/:id/estado", verificarPermiso('proyectos.editar'), propProyecto, ctrl.cambiarEstado);
router.delete("/:id",       verificarPermiso('proyectos.eliminar'), propProyecto, ctrl.eliminar);

module.exports = router;
