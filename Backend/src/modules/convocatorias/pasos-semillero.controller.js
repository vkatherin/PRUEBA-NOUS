const pool = require("../../db/connection");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ─── Catálogos ────────────────────────────────────────────────────────────────
const TIPOS_DOCUMENTO = ["CC", "TI", "CE", "Pasaporte", "NIT", "Otro"];
const ROLES_INTEGRANTE = ["Director", "Codirector", "Coinvestigador", "Estudiante", "Auxiliar de Investigación", "Otro"];

// ─── Multer para envío final ──────────────────────────────────────────────────
const storageEnvio = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, "../../../uploads/inscripciones");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `insc_${Date.now()}${ext}`);
  },
});
const uploadEnvio = multer({ storage: storageEnvio, limits: { fileSize: 15 * 1024 * 1024 } });

// ─── Helper: obtener inscripción existente ────────────────────────────────────
async function getInscripcion(convId, usuarioId) {
  const [rows] = await pool.query(
    "SELECT * FROM convocatoria_inscripciones WHERE convocatoria_id = ? AND usuario_id = ? LIMIT 1",
    [convId, usuarioId]
  );
  return rows.length > 0 ? rows[0] : null;
}

// ─── Helper: cargar todos los datos del formulario ───────────────────────────
async function cargarTodosPasos(inscripcionId) {
  const [[semRows], [intRows], [infoRows], [contRows]] = await Promise.all([
    pool.query("SELECT * FROM inscripcion_semillero_externo WHERE inscripcion_id = ? LIMIT 1", [inscripcionId]),
    pool.query("SELECT * FROM inscripcion_semillero_integrantes WHERE inscripcion_id = ? ORDER BY id", [inscripcionId]),
    pool.query("SELECT * FROM inscripcion_semillero_info_general WHERE inscripcion_id = ? LIMIT 1", [inscripcionId]),
    pool.query("SELECT * FROM inscripcion_semillero_contenido WHERE inscripcion_id = ? LIMIT 1", [inscripcionId]),
  ]);
  return {
    semillero: semRows.length > 0 ? semRows[0] : null,
    integrantes: intRows,
    info_general: infoRows.length > 0 ? infoRows[0] : null,
    contenido: contRows.length > 0 ? contRows[0] : null,
  };
}

const pasosSemilleroController = {

  // ─── CATÁLOGOS (helper para el frontend) ──────────────────────────────────
  async getCatalogos(req, res) {
    try {
      const [lineas] = await pool.query("SELECT id, nombre FROM lineas_investigacion ORDER BY nombre");
      return res.json({
        ok: true,
        tipos_documento: TIPOS_DOCUMENTO,
        roles_integrante: ROLES_INTEGRANTE,
        lineas_investigacion: lineas,
      });
    } catch (err) {
      console.error("Error al obtener catálogos:", err);
      return res.status(500).json({ error: "Error al obtener catálogos." });
    }
  },

  // ─── PASO 2: INTEGRANTES ──────────────────────────────────────────────────

  // GET /:id/semillero-integrantes?usuario_id=X
  async getIntegrantes(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      const usuarioId = parseInt(req.query.usuario_id, 10);
      if (!convId || !usuarioId) return res.status(400).json({ error: "Parámetros incompletos." });

      const inscripcion = await getInscripcion(convId, usuarioId);
      if (!inscripcion) return res.json({ ok: true, integrantes: [] });

      const [integrantes] = await pool.query(
        "SELECT * FROM inscripcion_semillero_integrantes WHERE inscripcion_id = ? ORDER BY id",
        [inscripcion.id]
      );
      return res.json({ ok: true, inscripcion_id: inscripcion.id, integrantes });
    } catch (err) {
      console.error("Error al obtener integrantes:", err);
      return res.status(500).json({ error: "Error al obtener los integrantes." });
    }
  },

  // POST /:id/semillero-integrantes  (agrega un integrante)
  async addIntegrante(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      const usuarioId = parseInt(req.body.usuario_id, 10);
      if (!convId || !usuarioId) return res.status(400).json({ error: "Parámetros incompletos." });

      const inscripcion = await getInscripcion(convId, usuarioId);
      if (!inscripcion) return res.status(404).json({ error: "No existe inscripción para esta convocatoria." });

      const nombreCompleto = (req.body.nombre_completo || "").trim();
      const tipoDocumento = (req.body.tipo_documento || "").trim();
      const numeroDocumento = (req.body.numero_documento || "").trim();
      const rol = (req.body.rol || "").trim();
      const email = (req.body.email || "").trim();
      const telefono = (req.body.telefono || "").trim() || null;

      if (!nombreCompleto) return res.status(400).json({ error: "El nombre completo es obligatorio.", campo: "nombre_completo" });
      if (!tipoDocumento || !TIPOS_DOCUMENTO.includes(tipoDocumento))
        return res.status(400).json({ error: "El tipo de documento no es válido.", campo: "tipo_documento" });
      if (!numeroDocumento) return res.status(400).json({ error: "El número de documento es obligatorio.", campo: "numero_documento" });
      if (!rol || !ROLES_INTEGRANTE.includes(rol))
        return res.status(400).json({ error: "El rol no es válido.", campo: "rol" });
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ error: "El correo electrónico no es válido.", campo: "email" });

      const [result] = await pool.query(
        `INSERT INTO inscripcion_semillero_integrantes
         (inscripcion_id, nombre_completo, tipo_documento, numero_documento, rol, email, telefono)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [inscripcion.id, nombreCompleto, tipoDocumento, numeroDocumento, rol, email, telefono]
      );

      const [rows] = await pool.query("SELECT * FROM inscripcion_semillero_integrantes WHERE id = ?", [result.insertId]);
      return res.status(201).json({ ok: true, mensaje: "Integrante agregado.", integrante: rows[0] });
    } catch (err) {
      console.error("Error al agregar integrante:", err);
      return res.status(500).json({ error: "Error al agregar el integrante." });
    }
  },

  // PUT /:id/semillero-integrantes/:integId
  async updateIntegrante(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      const integId = parseInt(req.params.integId, 10);
      const usuarioId = parseInt(req.body.usuario_id, 10);

      const inscripcion = await getInscripcion(convId, usuarioId);
      if (!inscripcion) return res.status(404).json({ error: "Inscripción no encontrada." });

      const [check] = await pool.query(
        "SELECT id FROM inscripcion_semillero_integrantes WHERE id = ? AND inscripcion_id = ?",
        [integId, inscripcion.id]
      );
      if (check.length === 0) return res.status(404).json({ error: "Integrante no encontrado." });

      const nombreCompleto = (req.body.nombre_completo || "").trim();
      const tipoDocumento = (req.body.tipo_documento || "").trim();
      const numeroDocumento = (req.body.numero_documento || "").trim();
      const rol = (req.body.rol || "").trim();
      const email = (req.body.email || "").trim();
      const telefono = (req.body.telefono || "").trim() || null;

      if (!nombreCompleto) return res.status(400).json({ error: "El nombre completo es obligatorio.", campo: "nombre_completo" });
      if (!tipoDocumento || !TIPOS_DOCUMENTO.includes(tipoDocumento))
        return res.status(400).json({ error: "El tipo de documento no es válido.", campo: "tipo_documento" });
      if (!numeroDocumento) return res.status(400).json({ error: "El número de documento es obligatorio.", campo: "numero_documento" });
      if (!rol || !ROLES_INTEGRANTE.includes(rol))
        return res.status(400).json({ error: "El rol no es válido.", campo: "rol" });
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ error: "El correo electrónico no es válido.", campo: "email" });

      await pool.query(
        `UPDATE inscripcion_semillero_integrantes
         SET nombre_completo=?, tipo_documento=?, numero_documento=?, rol=?, email=?, telefono=?
         WHERE id = ?`,
        [nombreCompleto, tipoDocumento, numeroDocumento, rol, email, telefono, integId]
      );

      const [rows] = await pool.query("SELECT * FROM inscripcion_semillero_integrantes WHERE id = ?", [integId]);
      return res.json({ ok: true, mensaje: "Integrante actualizado.", integrante: rows[0] });
    } catch (err) {
      console.error("Error al actualizar integrante:", err);
      return res.status(500).json({ error: "Error al actualizar el integrante." });
    }
  },

  // DELETE /:id/semillero-integrantes/:integId
  async deleteIntegrante(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      const integId = parseInt(req.params.integId, 10);
      const usuarioId = parseInt(req.query.usuario_id, 10);

      const inscripcion = await getInscripcion(convId, usuarioId);
      if (!inscripcion) return res.status(404).json({ error: "Inscripción no encontrada." });

      await pool.query(
        "DELETE FROM inscripcion_semillero_integrantes WHERE id = ? AND inscripcion_id = ?",
        [integId, inscripcion.id]
      );
      return res.json({ ok: true, mensaje: "Integrante eliminado." });
    } catch (err) {
      console.error("Error al eliminar integrante:", err);
      return res.status(500).json({ error: "Error al eliminar el integrante." });
    }
  },

  // ─── PASO 3: INFORMACIÓN GENERAL ─────────────────────────────────────────

  async getInfoGeneral(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      const usuarioId = parseInt(req.query.usuario_id, 10);
      if (!convId || !usuarioId) return res.status(400).json({ error: "Parámetros incompletos." });

      const inscripcion = await getInscripcion(convId, usuarioId);
      if (!inscripcion) return res.json({ ok: true, info_general: null });

      const [rows] = await pool.query(
        "SELECT * FROM inscripcion_semillero_info_general WHERE inscripcion_id = ? LIMIT 1",
        [inscripcion.id]
      );
      return res.json({ ok: true, info_general: rows.length > 0 ? rows[0] : null });
    } catch (err) {
      console.error("Error al obtener info general:", err);
      return res.status(500).json({ error: "Error al obtener la información general." });
    }
  },

  async saveInfoGeneral(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      const usuarioId = parseInt(req.body.usuario_id, 10);
      if (!convId || !usuarioId) return res.status(400).json({ error: "Parámetros incompletos." });

      const inscripcion = await getInscripcion(convId, usuarioId);
      if (!inscripcion) return res.status(404).json({ error: "No existe inscripción para esta convocatoria." });

      const tituloTrabajo = (req.body.titulo_trabajo || "").trim();
      const lineaInvestigacion = (req.body.linea_investigacion || "").trim() || null;
      const palabrasClave = (req.body.palabras_clave || "").trim();
      const resumen = (req.body.resumen || "").trim();

      if (!tituloTrabajo) return res.status(400).json({ error: "El título del trabajo es obligatorio.", campo: "titulo_trabajo" });
      if (!palabrasClave) return res.status(400).json({ error: "Las palabras clave son obligatorias.", campo: "palabras_clave" });
      if (!resumen) return res.status(400).json({ error: "El resumen es obligatorio.", campo: "resumen" });
      if (resumen.length > 500) return res.status(400).json({ error: "El resumen no puede superar 500 caracteres.", campo: "resumen" });

      const [existRows] = await pool.query(
        "SELECT id FROM inscripcion_semillero_info_general WHERE inscripcion_id = ? LIMIT 1",
        [inscripcion.id]
      );

      if (existRows.length > 0) {
        await pool.query(
          `UPDATE inscripcion_semillero_info_general
           SET titulo_trabajo=?, linea_investigacion=?, palabras_clave=?, resumen=?
           WHERE inscripcion_id=?`,
          [tituloTrabajo, lineaInvestigacion, palabrasClave, resumen, inscripcion.id]
        );
      } else {
        await pool.query(
          `INSERT INTO inscripcion_semillero_info_general
           (inscripcion_id, titulo_trabajo, linea_investigacion, palabras_clave, resumen)
           VALUES (?, ?, ?, ?, ?)`,
          [inscripcion.id, tituloTrabajo, lineaInvestigacion, palabrasClave, resumen]
        );
      }

      const [rows] = await pool.query(
        "SELECT * FROM inscripcion_semillero_info_general WHERE inscripcion_id = ? LIMIT 1",
        [inscripcion.id]
      );
      return res.json({ ok: true, mensaje: "Información general guardada.", info_general: rows[0] });
    } catch (err) {
      console.error("Error al guardar info general:", err);
      return res.status(500).json({ error: "Error al guardar la información general." });
    }
  },

  // ─── PASO 4: CONTENIDO DEL TRABAJO ───────────────────────────────────────

  async getContenido(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      const usuarioId = parseInt(req.query.usuario_id, 10);
      if (!convId || !usuarioId) return res.status(400).json({ error: "Parámetros incompletos." });

      const inscripcion = await getInscripcion(convId, usuarioId);
      if (!inscripcion) return res.json({ ok: true, contenido: null });

      const [rows] = await pool.query(
        "SELECT * FROM inscripcion_semillero_contenido WHERE inscripcion_id = ? LIMIT 1",
        [inscripcion.id]
      );
      return res.json({ ok: true, contenido: rows.length > 0 ? rows[0] : null });
    } catch (err) {
      console.error("Error al obtener contenido:", err);
      return res.status(500).json({ error: "Error al obtener el contenido del trabajo." });
    }
  },

  async saveContenido(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      const usuarioId = parseInt(req.body.usuario_id, 10);
      if (!convId || !usuarioId) return res.status(400).json({ error: "Parámetros incompletos." });

      const inscripcion = await getInscripcion(convId, usuarioId);
      if (!inscripcion) return res.status(404).json({ error: "No existe inscripción para esta convocatoria." });

      const planteamiento = (req.body.planteamiento_problema || "").trim();
      const objetivoGeneral = (req.body.objetivo_general || "").trim();
      const objetivosEspecificos = (req.body.objetivos_especificos || "").trim();
      const metodologia = (req.body.metodologia || "").trim();
      const resultados = (req.body.resultados_esperados || "").trim();

      if (!planteamiento) return res.status(400).json({ error: "El planteamiento del problema es obligatorio.", campo: "planteamiento_problema" });
      if (!objetivoGeneral) return res.status(400).json({ error: "El objetivo general es obligatorio.", campo: "objetivo_general" });
      if (!objetivosEspecificos) return res.status(400).json({ error: "Los objetivos específicos son obligatorios.", campo: "objetivos_especificos" });
      if (!metodologia) return res.status(400).json({ error: "La metodología es obligatoria.", campo: "metodologia" });
      if (!resultados) return res.status(400).json({ error: "Los resultados esperados son obligatorios.", campo: "resultados_esperados" });

      const [existRows] = await pool.query(
        "SELECT id FROM inscripcion_semillero_contenido WHERE inscripcion_id = ? LIMIT 1",
        [inscripcion.id]
      );

      if (existRows.length > 0) {
        await pool.query(
          `UPDATE inscripcion_semillero_contenido
           SET planteamiento_problema=?, objetivo_general=?, objetivos_especificos=?, metodologia=?, resultados_esperados=?
           WHERE inscripcion_id=?`,
          [planteamiento, objetivoGeneral, objetivosEspecificos, metodologia, resultados, inscripcion.id]
        );
      } else {
        await pool.query(
          `INSERT INTO inscripcion_semillero_contenido
           (inscripcion_id, planteamiento_problema, objetivo_general, objetivos_especificos, metodologia, resultados_esperados)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [inscripcion.id, planteamiento, objetivoGeneral, objetivosEspecificos, metodologia, resultados]
        );
      }

      const [rows] = await pool.query(
        "SELECT * FROM inscripcion_semillero_contenido WHERE inscripcion_id = ? LIMIT 1",
        [inscripcion.id]
      );
      return res.json({ ok: true, mensaje: "Contenido del trabajo guardado.", contenido: rows[0] });
    } catch (err) {
      console.error("Error al guardar contenido:", err);
      return res.status(500).json({ error: "Error al guardar el contenido del trabajo." });
    }
  },

  // ─── PASO 5: ENVÍO FINAL ──────────────────────────────────────────────────

  uploadEnvioMiddleware: uploadEnvio.single("documento"),

  // GET /:id/semillero-resumen?usuario_id=X — obtiene TODOS los pasos para revisión
  async getResumen(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      const usuarioId = parseInt(req.query.usuario_id, 10);
      if (!convId || !usuarioId) return res.status(400).json({ error: "Parámetros incompletos." });

      const inscripcion = await getInscripcion(convId, usuarioId);
      if (!inscripcion) return res.status(404).json({ error: "No existe inscripción para esta convocatoria." });

      const datos = await cargarTodosPasos(inscripcion.id);
      return res.json({
        ok: true,
        inscripcion,
        ...datos,
      });
    } catch (err) {
      console.error("Error al obtener resumen:", err);
      return res.status(500).json({ error: "Error al obtener el resumen." });
    }
  },

  // POST /:id/semillero-enviar — guarda todos los datos y realiza el envío final
  async enviarFinal(req, res) {
    const archivo = req.file;
    try {
      const convId = parseInt(req.params.id, 10);
      const usuarioId = parseInt(req.body.usuario_id, 10);
      if (!convId || !usuarioId) {
        if (archivo && fs.existsSync(archivo.path)) fs.unlinkSync(archivo.path);
        return res.status(400).json({ error: "Parámetros incompletos (convocatoria o usuario)." });
      }

      // Validar convocatoria
      const [convRows] = await pool.query(
        "SELECT id, tipo, estado FROM convocatorias WHERE id = ? LIMIT 1",
        [convId]
      );
      if (convRows.length === 0) {
        if (archivo && fs.existsSync(archivo.path)) fs.unlinkSync(archivo.path);
        return res.status(404).json({ error: "Convocatoria no encontrada." });
      }
      if (convRows[0].estado === "cerrada") {
        if (archivo && fs.existsSync(archivo.path)) fs.unlinkSync(archivo.path);
        return res.status(400).json({ error: "La convocatoria se encuentra cerrada." });
      }

      // Parsear datos de los pasos si vienen en el body
      let semilleroData = req.body.semillero;
      if (typeof semilleroData === "string") {
        try { semilleroData = JSON.parse(semilleroData); } catch (_) {}
      }
      let integrantesData = req.body.integrantes;
      if (typeof integrantesData === "string") {
        try { integrantesData = JSON.parse(integrantesData); } catch (_) {}
      }
      let infoGeneralData = req.body.info_general;
      if (typeof infoGeneralData === "string") {
        try { infoGeneralData = JSON.parse(infoGeneralData); } catch (_) {}
      }
      let contenidoData = req.body.contenido;
      if (typeof contenidoData === "string") {
        try { contenidoData = JSON.parse(contenidoData); } catch (_) {}
      }

      // Validar datos recibidos
      const semNombre = semilleroData?.semillero_nombre || req.body.semillero_nombre || "";
      const tipoInst = semilleroData?.tipo_institucion || req.body.tipo_institucion || "";
      const tipoInv = (req.body.tipo_investigacion || semilleroData?.tipo_investigacion || "").trim();
      const instProc = semilleroData?.institucion_procedencia || req.body.institucion_procedencia || "";
      const procFija = "Semillero externo";

      if (!tipoInst.trim() || !instProc.trim() || !semNombre.trim()) {
        if (archivo && fs.existsSync(archivo.path)) fs.unlinkSync(archivo.path);
        return res.status(400).json({ error: "Paso 1 (Semillero): Todos los campos son obligatorios." });
      }

      if (!Array.isArray(integrantesData) || integrantesData.length === 0) {
        if (archivo && fs.existsSync(archivo.path)) fs.unlinkSync(archivo.path);
        return res.status(400).json({ error: "Paso 2 (Integrantes): Debes agregar al menos un integrante." });
      }

      const titTrabajo = infoGeneralData?.titulo_trabajo || "";
      const linInvest = infoGeneralData?.linea_investigacion || null;
      const palClave = infoGeneralData?.palabras_clave || "";
      const resumenTexto = infoGeneralData?.resumen || "";

      if (!titTrabajo.trim() || !palClave.trim() || !resumenTexto.trim()) {
        if (archivo && fs.existsSync(archivo.path)) fs.unlinkSync(archivo.path);
        return res.status(400).json({ error: "Paso 3 (Información general): Todos los campos requeridos deben ser completados." });
      }

      const plantProb = contenidoData?.planteamiento_problema || "";
      const objGral = contenidoData?.objetivo_general || "";
      const objEsp = contenidoData?.objetivos_especificos || "";
      const metodo = contenidoData?.metodologia || "";
      const resEsp = contenidoData?.resultados_esperados || "";

      if (!plantProb.trim() || !objGral.trim() || !objEsp.trim() || !metodo.trim() || !resEsp.trim()) {
        if (archivo && fs.existsSync(archivo.path)) fs.unlinkSync(archivo.path);
        return res.status(400).json({ error: "Paso 4 (Contenido del trabajo): Todos los campos son obligatorios." });
      }

      // Validar PDF si se adjuntó
      let docInfo = { nombre: "", ruta: "", mime: "", peso: 0 };
      if (archivo) {
        if (archivo.mimetype !== "application/pdf") {
          fs.unlinkSync(archivo.path);
          return res.status(400).json({ error: "El documento adjunto debe ser un archivo PDF.", campo: "documento" });
        }
        docInfo = {
          nombre: archivo.originalname,
          ruta: `/uploads/inscripciones/${archivo.filename}`,
          mime: archivo.mimetype,
          peso: archivo.size,
        };
      }

      // ── 1. Crear o actualizar inscripción en convocatoria_inscripciones
      let inscripcion = await getInscripcion(convId, usuarioId);
      if (inscripcion) {
        if (archivo) {
          await pool.query(
            `UPDATE convocatoria_inscripciones
             SET estado='registrada', tipo_investigacion=COALESCE(NULLIF(?, ''), tipo_investigacion), documento_nombre_original=?, documento_ruta=?, documento_mime=?, documento_peso_bytes=?, fecha_inscripcion=NOW()
             WHERE id=?`,
            [tipoInv, docInfo.nombre, docInfo.ruta, docInfo.mime, docInfo.peso, inscripcion.id]
          );
        } else {
          await pool.query(
            "UPDATE convocatoria_inscripciones SET estado='registrada', tipo_investigacion=COALESCE(NULLIF(?, ''), tipo_investigacion), fecha_inscripcion=NOW() WHERE id=?",
            [tipoInv, inscripcion.id]
          );
        }
      } else {
        const [insRes] = await pool.query(
          `INSERT INTO convocatoria_inscripciones
           (convocatoria_id, usuario_id, tipo_investigacion, resumen_proyecto, justificacion,
            documento_nombre_original, documento_ruta, documento_mime, documento_peso_bytes, estado, fecha_inscripcion)
           VALUES (?, ?, ?, '', '', ?, ?, ?, ?, 'registrada', NOW())`,
          [convId, usuarioId, tipoInv, docInfo.nombre, docInfo.ruta, docInfo.mime, docInfo.peso]
        );
        const [newInsc] = await pool.query("SELECT * FROM convocatoria_inscripciones WHERE id=?", [insRes.insertId]);
        inscripcion = newInsc[0];
      }

      const inscId = inscripcion.id;

      // ── 2. Guardar Paso 1: Semillero Externo
      const [semExist] = await pool.query("SELECT id FROM inscripcion_semillero_externo WHERE inscripcion_id=? LIMIT 1", [inscId]);
      if (semExist.length > 0) {
        await pool.query(
          `UPDATE inscripcion_semillero_externo
           SET tipo_institucion=?, procedencia=?, institucion_procedencia=?, semillero_nombre=?
           WHERE inscripcion_id=?`,
          [tipoInst.trim(), procFija, instProc.trim(), semNombre.trim(), inscId]
        );
      } else {
        await pool.query(
          `INSERT INTO inscripcion_semillero_externo
           (inscripcion_id, tipo_institucion, procedencia, institucion_procedencia, semillero_nombre)
           VALUES (?, ?, ?, ?, ?)`,
          [inscId, tipoInst.trim(), procFija, instProc.trim(), semNombre.trim()]
        );
      }

      // ── 3. Guardar Paso 2: Integrantes
      await pool.query("DELETE FROM inscripcion_semillero_integrantes WHERE inscripcion_id=?", [inscId]);
      for (const intg of integrantesData) {
        if (intg.nombre_completo && intg.tipo_documento && intg.numero_documento && intg.rol && intg.email) {
          await pool.query(
            `INSERT INTO inscripcion_semillero_integrantes
             (inscripcion_id, nombre_completo, tipo_documento, numero_documento, rol, email, telefono)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              inscId,
              intg.nombre_completo.trim(),
              intg.tipo_documento.trim(),
              intg.numero_documento.trim(),
              intg.rol.trim(),
              intg.email.trim(),
              (intg.telefono || "").trim() || null,
            ]
          );
        }
      }

      // ── 4. Guardar Paso 3: Información General
      const [infoExist] = await pool.query("SELECT id FROM inscripcion_semillero_info_general WHERE inscripcion_id=? LIMIT 1", [inscId]);
      if (infoExist.length > 0) {
        await pool.query(
          `UPDATE inscripcion_semillero_info_general
           SET titulo_trabajo=?, linea_investigacion=?, palabras_clave=?, resumen=?
           WHERE inscripcion_id=?`,
          [titTrabajo.trim(), linInvest || null, palClave.trim(), resumenTexto.trim(), inscId]
        );
      } else {
        await pool.query(
          `INSERT INTO inscripcion_semillero_info_general
           (inscripcion_id, titulo_trabajo, linea_investigacion, palabras_clave, resumen)
           VALUES (?, ?, ?, ?, ?)`,
          [inscId, titTrabajo.trim(), linInvest || null, palClave.trim(), resumenTexto.trim()]
        );
      }

      // ── 5. Guardar Paso 4: Contenido
      const [contExist] = await pool.query("SELECT id FROM inscripcion_semillero_contenido WHERE inscripcion_id=? LIMIT 1", [inscId]);
      if (contExist.length > 0) {
        await pool.query(
          `UPDATE inscripcion_semillero_contenido
           SET planteamiento_problema=?, objetivo_general=?, objetivos_especificos=?, metodologia=?, resultados_esperados=?
           WHERE inscripcion_id=?`,
          [plantProb.trim(), objGral.trim(), objEsp.trim(), metodo.trim(), resEsp.trim(), inscId]
        );
      } else {
        await pool.query(
          `INSERT INTO inscripcion_semillero_contenido
           (inscripcion_id, planteamiento_problema, objetivo_general, objetivos_especificos, metodologia, resultados_esperados)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [inscId, plantProb.trim(), objGral.trim(), objEsp.trim(), metodo.trim(), resEsp.trim()]
        );
      }

      const [updRows] = await pool.query("SELECT * FROM convocatoria_inscripciones WHERE id = ? LIMIT 1", [inscId]);
      return res.json({
        ok: true,
        mensaje: "¡Inscripción completada y enviada correctamente!",
        inscripcion: updRows[0],
      });
    } catch (err) {
      if (archivo && fs.existsSync(archivo.path)) fs.unlinkSync(archivo.path);
      console.error("Error al enviar inscripción:", err);
      return res.status(500).json({ error: "Error al registrar y enviar la inscripción." });
    }
  },
};

module.exports = pasosSemilleroController;
