const express = require("express");
const router = express.Router();
const convocatoriasController = require("./convocatorias.controller");
const semilleroExternoController = require("./semillero-externo.controller");
const pasosSemilleroController = require("./pasos-semillero.controller");

const { verificarAutenticacion, verificarPermiso } = require('../auth/auth.middleware');

// ─── Plantilla Oficial de Asentimiento (Descarga Pública y Consulta) ────────
router.get("/plantilla-asentimiento", pasosSemilleroController.descargarPlantillaAsentimiento);
router.get("/plantilla-asentimiento/info", pasosSemilleroController.obtenerInfoPlantilla);
router.get("/:id/plantilla-asentimiento/info", pasosSemilleroController.obtenerInfoPlantilla);

router.use(verificarAutenticacion);

// ─── RF-CON-03: Alertas de Fechas (Debe ir antes de /:id) ───────────────────
router.get("/alertas", verificarPermiso('convocatorias.leer'), convocatoriasController.obtenerAlertas);

// ─── RF-CON-02: Convocatorias Vigentes (Debe ir antes de /:id) ──────────────
router.get("/vigentes", verificarPermiso('convocatorias.leer'), convocatoriasController.listarVigentes);

// ─── RF-CON-04: Banco de Convocatorias Externas ─────────────────────────────
router.get("/externas", verificarPermiso('convocatorias.leer'), convocatoriasController.listarExternas);
router.post("/externas", verificarPermiso('convocatorias.crear'), convocatoriasController.crearExterna);
router.get("/externas/:id", verificarPermiso('convocatorias.leer'), convocatoriasController.obtenerExternaPorId);
router.put("/externas/:id", verificarPermiso('convocatorias.editar'), convocatoriasController.actualizarExterna);
router.delete("/externas/:id", verificarPermiso('convocatorias.eliminar'), convocatoriasController.eliminarExterna);

// ─── Borradores de Inscripción (Debe ir antes de /:id) ──────────────────────
router.get("/mis-borradores", verificarPermiso('convocatorias.leer'), pasosSemilleroController.listarBorradores);

// ─── RF-CON-01 y RF-CON-02: Convocatorias Internas ──────────────────────────
router.get("/", verificarPermiso('convocatorias.leer'), convocatoriasController.listar);
router.post("/", verificarPermiso('convocatorias.crear'), convocatoriasController.crear);
router.get("/:id", verificarPermiso('convocatorias.leer'), convocatoriasController.obtenerPorId);
router.put("/:id", verificarPermiso('convocatorias.editar'), convocatoriasController.actualizar);
router.patch("/:id/publicar", verificarPermiso('convocatorias.publicar'), convocatoriasController.publicar);
router.delete("/:id", verificarPermiso('convocatorias.eliminar'), convocatoriasController.eliminar);

// ─── RF-CON-05: Comité de Asignación y Objeción ─────────────────────────────
router.patch("/:id/comite/aprobar", verificarPermiso('convocatorias.consolidar'), convocatoriasController.aprobarComite);
router.patch("/:id/comite/objetar", verificarPermiso('convocatorias.consolidar'), convocatoriasController.objetarComite);

// ─── Inscripción Externa: Catálogos ─────────────────────────────────────────
router.get("/:id/semillero-catalogos", verificarPermiso('convocatorias.leer'), pasosSemilleroController.getCatalogos);

// ─── Inscripción Externa: Paso 1 — Semillero ────────────────────────────────
router.get("/:id/semillero-externo", verificarPermiso('convocatorias.leer'), semilleroExternoController.obtener);
router.post("/:id/semillero-externo", verificarPermiso('convocatorias.leer'), semilleroExternoController.guardar);

// ─── Plantilla Oficial de Asentimiento (Carga Administrativa) ───────────────
router.post(
  "/plantilla-asentimiento",
  verificarPermiso('convocatorias.editar'),
  pasosSemilleroController.uploadPlantillaMiddleware,
  pasosSemilleroController.subirPlantillaAsentimiento
);
router.post(
  "/:id/plantilla-asentimiento",
  verificarPermiso('convocatorias.editar'),
  pasosSemilleroController.uploadPlantillaMiddleware,
  pasosSemilleroController.subirPlantillaAsentimiento
);

// ─── Inscripción Externa: Paso 2 — Integrantes y Asentimiento ──────────────
router.post(
  "/:id/semillero-asentimiento",
  verificarPermiso('convocatorias.leer'),
  pasosSemilleroController.uploadAsentimientoMiddleware,
  pasosSemilleroController.subirAsentimiento
);
router.get("/:id/semillero-integrantes", verificarPermiso('convocatorias.leer'), pasosSemilleroController.getIntegrantes);
router.post("/:id/semillero-integrantes", verificarPermiso('convocatorias.leer'), pasosSemilleroController.addIntegrante);
router.put("/:id/semillero-integrantes/:integId", verificarPermiso('convocatorias.leer'), pasosSemilleroController.updateIntegrante);
router.delete("/:id/semillero-integrantes/:integId", verificarPermiso('convocatorias.leer'), pasosSemilleroController.deleteIntegrante);

// ─── Inscripción Externa: Paso 3 — Información general ──────────────────────
router.get("/:id/semillero-info-general", verificarPermiso('convocatorias.leer'), pasosSemilleroController.getInfoGeneral);
router.post("/:id/semillero-info-general", verificarPermiso('convocatorias.leer'), pasosSemilleroController.saveInfoGeneral);

// ─── Inscripción Externa: Paso 4 — Contenido del trabajo ────────────────────
router.get("/:id/semillero-contenido", verificarPermiso('convocatorias.leer'), pasosSemilleroController.getContenido);
router.post("/:id/semillero-contenido", verificarPermiso('convocatorias.leer'), pasosSemilleroController.saveContenido);

// ─── Inscripción Externa: Paso 5 — Envío final ──────────────────────────────
router.get("/:id/semillero-resumen", verificarPermiso('convocatorias.leer'), pasosSemilleroController.getResumen);
router.post(
  "/:id/semillero-enviar",
  verificarPermiso('convocatorias.leer'),
  pasosSemilleroController.uploadEnvioMiddleware,
  pasosSemilleroController.enviarFinal
);

// ─── Inscripción Externa: Borradores por Convocatoria ───────────────────────
router.get("/:id/mi-borrador", verificarPermiso('convocatorias.leer'), pasosSemilleroController.obtenerBorrador);
router.post("/:id/guardar-borrador", verificarPermiso('convocatorias.leer'), pasosSemilleroController.guardarBorrador);

// ─── Inscripciones Generales (internas) ─────────────────────────────────────
router.post(
  "/:id/inscribirse",
  verificarPermiso('convocatorias.leer'), // anyone who can read convocatorias can try to inscribe (ownership checked later/implicitly by token)
  convocatoriasController.uploadDocumentoMiddleware,
  convocatoriasController.inscribirse
);
router.get("/:id/mi-inscripcion", verificarPermiso('convocatorias.leer'), convocatoriasController.verificarInscripcion);
router.get("/:id/inscripciones", verificarPermiso('convocatorias.leer'), convocatoriasController.listarInscripciones);

module.exports = router;
