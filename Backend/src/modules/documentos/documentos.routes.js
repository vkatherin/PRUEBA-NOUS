const express = require("express");
const router = express.Router();
const documentosController = require("./documentos.controller");
const { verificarAutenticacion, verificarRol } = require("../auth/auth.middleware");

// Todos los autenticados pueden listar y descargar
router.get("/formatos", verificarAutenticacion, documentosController.obtenerFormatos);
router.get("/formatos/:id/descargar", verificarAutenticacion, documentosController.descargarFormato);

// Solo administrador puede subir y borrar
router.post("/formatos", verificarAutenticacion, verificarRol("administrador"), documentosController.subirFormato);
router.delete("/formatos/:id", verificarAutenticacion, verificarRol("administrador"), documentosController.eliminarFormato);

module.exports = router;
