const express = require("express");
const router = express.Router();
const convocatoriasController = require("./convocatorias.controller");

// ─── RF-CON-03: Alertas de Fechas (Debe ir antes de /:id) ───────────────────
router.get("/alertas", convocatoriasController.obtenerAlertas);

// ─── RF-CON-02: Convocatorias Vigentes (Debe ir antes de /:id) ──────────────
router.get("/vigentes", convocatoriasController.listarVigentes);

// ─── RF-CON-04: Banco de Convocatorias Externas ─────────────────────────────
router.get("/externas", convocatoriasController.listarExternas);
router.post("/externas", convocatoriasController.crearExterna);
router.get("/externas/:id", convocatoriasController.obtenerExternaPorId);
router.put("/externas/:id", convocatoriasController.actualizarExterna);
router.delete("/externas/:id", convocatoriasController.eliminarExterna);

// ─── RF-CON-01 y RF-CON-02: Convocatorias Internas ──────────────────────────
router.get("/", convocatoriasController.listar);
router.post("/", convocatoriasController.crear);
router.get("/:id", convocatoriasController.obtenerPorId);
router.put("/:id", convocatoriasController.actualizar);
router.patch("/:id/publicar", convocatoriasController.publicar);
router.delete("/:id", convocatoriasController.eliminar);

// ─── RF-CON-05: Comité de Asignación y Objeción ─────────────────────────────
router.patch("/:id/comite/aprobar", convocatoriasController.aprobarComite);
router.patch("/:id/comite/objetar", convocatoriasController.objetarComite);

// ─── Inscripciones a Convocatorias ──────────────────────────────────────────
router.post(
  "/:id/inscribirse",
  convocatoriasController.uploadDocumentoMiddleware,
  convocatoriasController.inscribirse
);
router.get("/:id/mi-inscripcion", convocatoriasController.verificarInscripcion);
router.get("/:id/inscripciones", convocatoriasController.listarInscripciones);

module.exports = router;
