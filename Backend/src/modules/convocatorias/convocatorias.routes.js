const express = require("express");
const router = express.Router();
const convocatoriasController = require("./convocatorias.controller");
const semilleroExternoController = require("./semillero-externo.controller");
const pasosSemilleroController = require("./pasos-semillero.controller");

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

// ─── Inscripción Externa: Catálogos ─────────────────────────────────────────
router.get("/:id/semillero-catalogos", pasosSemilleroController.getCatalogos);

// ─── Inscripción Externa: Paso 1 — Semillero ────────────────────────────────
router.get("/:id/semillero-externo", semilleroExternoController.obtener);
router.post("/:id/semillero-externo", semilleroExternoController.guardar);

// ─── Inscripción Externa: Paso 2 — Integrantes ──────────────────────────────
router.get("/:id/semillero-integrantes", pasosSemilleroController.getIntegrantes);
router.post("/:id/semillero-integrantes", pasosSemilleroController.addIntegrante);
router.put("/:id/semillero-integrantes/:integId", pasosSemilleroController.updateIntegrante);
router.delete("/:id/semillero-integrantes/:integId", pasosSemilleroController.deleteIntegrante);

// ─── Inscripción Externa: Paso 3 — Información general ──────────────────────
router.get("/:id/semillero-info-general", pasosSemilleroController.getInfoGeneral);
router.post("/:id/semillero-info-general", pasosSemilleroController.saveInfoGeneral);

// ─── Inscripción Externa: Paso 4 — Contenido del trabajo ────────────────────
router.get("/:id/semillero-contenido", pasosSemilleroController.getContenido);
router.post("/:id/semillero-contenido", pasosSemilleroController.saveContenido);

// ─── Inscripción Externa: Paso 5 — Envío final ──────────────────────────────
router.get("/:id/semillero-resumen", pasosSemilleroController.getResumen);
router.post(
  "/:id/semillero-enviar",
  pasosSemilleroController.uploadEnvioMiddleware,
  pasosSemilleroController.enviarFinal
);

// ─── Inscripciones Generales (internas) ─────────────────────────────────────
router.post(
  "/:id/inscribirse",
  convocatoriasController.uploadDocumentoMiddleware,
  convocatoriasController.inscribirse
);
router.get("/:id/mi-inscripcion", convocatoriasController.verificarInscripcion);
router.get("/:id/inscripciones", convocatoriasController.listarInscripciones);

module.exports = router;
