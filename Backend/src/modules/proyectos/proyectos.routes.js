const express = require("express");
const router = express.Router();
const ctrl = require("./proyectos.controller");

// Lista + filtros
router.get("/", ctrl.listar);

// Rutas específicas ANTES de /:id
router.get("/:id/equipo",  ctrl.equipo);
router.get("/:id/avance",  ctrl.avance);

// CRUD por id
router.get("/:id",          ctrl.detalle);
router.post("/",            ctrl.crear);
router.put("/:id",          ctrl.actualizar);
router.patch("/:id/estado", ctrl.cambiarEstado);
router.delete("/:id",       ctrl.eliminar);

module.exports = router;
