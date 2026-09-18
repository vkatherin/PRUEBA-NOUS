const express = require("express");
const router = express.Router();
const ctrl = require("./proyectos.controller");

const { verificarAutenticacion, verificarPermiso } = require('../auth/auth.middleware');

router.use(verificarAutenticacion);

// Lista + filtros
router.get("/", verificarPermiso('proyectos.leer'), ctrl.listar);

// Rutas específicas ANTES de /:id
router.get("/:id/equipo", verificarPermiso('proyectos.leer'), ctrl.equipo);
router.get("/:id/avance", verificarPermiso('proyectos.leer'), ctrl.avance);

// CRUD por id
router.get("/:id",          verificarPermiso('proyectos.leer'), ctrl.detalle);
router.post("/",            verificarPermiso('proyectos.crear'), ctrl.crear);
router.put("/:id",          verificarPermiso('proyectos.editar'), ctrl.actualizar);
router.patch("/:id/estado", verificarPermiso('proyectos.editar'), ctrl.cambiarEstado);
router.delete("/:id",       verificarPermiso('proyectos.eliminar'), ctrl.eliminar);

module.exports = router;
