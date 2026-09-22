const pool = require("../../db/connection");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const PDFDocument = require("pdfkit");

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

  uploadAsentimientoMiddleware: uploadEnvio.single("asentimiento"),
  uploadPlantillaMiddleware: uploadEnvio.single("plantilla"),

  // ─── Subir Plantilla Oficial de Asentimiento (Administrador) ────────────────
  async subirPlantillaAsentimiento(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo de plantilla." });
      }

      const convocatoriaId = req.params.id || req.body.convocatoria_id;
      const rutaRelativa = `/uploads/inscripciones/${req.file.filename}`;

      if (convocatoriaId) {
        await pool.query(
          `UPDATE convocatorias 
           SET plantilla_asentimiento_nombre = ?, 
               plantilla_asentimiento_ruta = ?, 
               plantilla_asentimiento_mime = ?, 
               plantilla_asentimiento_peso_bytes = ? 
           WHERE id = ?`,
          [req.file.originalname, rutaRelativa, req.file.mimetype, req.file.size, convocatoriaId]
        );
      }

      // Guardar también en configuracion_plantillas como plantilla global
      await pool.query(
        `INSERT INTO configuracion_plantillas (clave, nombre_original, ruta_archivo, mime_type, peso_bytes)
         VALUES ('plantilla_asentimiento', ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE 
           nombre_original = VALUES(nombre_original),
           ruta_archivo = VALUES(ruta_archivo),
           mime_type = VALUES(mime_type),
           peso_bytes = VALUES(peso_bytes)`,
        [req.file.originalname, rutaRelativa, req.file.mimetype, req.file.size]
      );

      return res.json({
        ok: true,
        mensaje: "Plantilla oficial de asentimiento guardada exitosamente.",
        plantilla_nombre: req.file.originalname,
        plantilla_ruta: rutaRelativa,
        plantilla_mime: req.file.mimetype,
        plantilla_peso_bytes: req.file.size,
      });
    } catch (err) {
      console.error("Error al subir plantilla de asentimiento:", err);
      return res.status(500).json({ error: err.message || "Error al subir plantilla de asentimiento." });
    }
  },

  // ─── Restablecer Plantilla Oficial de Asentimiento al Formato Estándar ──────
  async eliminarPlantillaAsentimiento(req, res) {
    try {
      const convId = req.params.id || req.query.convocatoria_id || req.body.convocatoria_id;
      if (convId) {
        await pool.query(
          "UPDATE convocatorias SET plantilla_asentimiento_nombre = NULL, plantilla_asentimiento_ruta = NULL, plantilla_asentimiento_mime = NULL, plantilla_asentimiento_peso_bytes = NULL WHERE id = ?",
          [convId]
        );
      } else {
        await pool.query("DELETE FROM configuracion_plantillas WHERE clave = 'plantilla_asentimiento'");
      }
      return res.json({
        ok: true,
        mensaje: "Plantilla restablecida exitosamente al formato institucional estándar.",
      });
    } catch (err) {
      console.error("Error al restablecer plantilla de asentimiento:", err);
      return res.status(500).json({ error: err.message || "Error al restablecer plantilla de asentimiento." });
    }
  },

  // ─── Obtener Información de la Plantilla Actual ──────────────────────────────
  async obtenerInfoPlantilla(req, res) {
    try {
      const convId = req.params.id || req.query.convocatoria_id;
      if (convId) {
        const [rows] = await pool.query(
          "SELECT plantilla_asentimiento_nombre, plantilla_asentimiento_ruta, plantilla_asentimiento_peso_bytes FROM convocatorias WHERE id = ?",
          [convId]
        );
        if (rows.length > 0 && rows[0].plantilla_asentimiento_ruta) {
          return res.json({
            ok: true,
            personalizada: true,
            nombre: rows[0].plantilla_asentimiento_nombre,
            ruta: rows[0].plantilla_asentimiento_ruta,
            peso_bytes: rows[0].plantilla_asentimiento_peso_bytes,
          });
        }
      }

      // Revisar global
      const [gRows] = await pool.query(
        "SELECT nombre_original, ruta_archivo, peso_bytes, fecha_actualizacion FROM configuracion_plantillas WHERE clave = 'plantilla_asentimiento' LIMIT 1"
      );
      if (gRows.length > 0 && gRows[0].ruta_archivo) {
        return res.json({
          ok: true,
          personalizada: true,
          nombre: gRows[0].nombre_original,
          ruta: gRows[0].ruta_archivo,
          peso_bytes: gRows[0].peso_bytes,
          fecha: gRows[0].fecha_actualizacion,
        });
      }

      return res.json({
        ok: true,
        personalizada: false,
        nombre: "Formato Institucional Estándar (HTML / PDF)",
        ruta: "/api/convocatorias/plantilla-asentimiento?print=1",
      });
    } catch (err) {
      return res.status(500).json({ error: "Error al consultar información de plantilla." });
    }
  },

  // ─── Subir Asentimiento Informado (menores de edad) ────────────────────────
  async subirAsentimiento(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No se recibió ningún archivo de asentimiento." });
      }
      return res.json({
        ok: true,
        mensaje: "Asentimiento informado cargado exitosamente.",
        asentimiento_nombre: req.file.originalname,
        asentimiento_ruta: `/uploads/inscripciones/${req.file.filename}`,
        asentimiento_mime: req.file.mimetype,
        asentimiento_peso_bytes: req.file.size,
      });
    } catch (err) {
      console.error("Error al subir asentimiento:", err);
      return res.status(500).json({ error: err.message || "Error al subir archivo de asentimiento." });
    }
  },

  // ─── Descargar Plantilla Oficial de Asentimiento Informado ─────────────────
  async descargarPlantillaAsentimiento(req, res) {
    try {
      const convId = req.params.id || req.query.convocatoria_id;
      let archivoRuta = null;
      let archivoNombre = null;

      if (convId) {
        const [rows] = await pool.query(
          "SELECT plantilla_asentimiento_nombre, plantilla_asentimiento_ruta FROM convocatorias WHERE id = ?",
          [convId]
        );
        if (rows.length > 0 && rows[0].plantilla_asentimiento_ruta) {
          archivoRuta = rows[0].plantilla_asentimiento_ruta;
          archivoNombre = rows[0].plantilla_asentimiento_nombre;
        }
      }

      if (!archivoRuta) {
        const [gRows] = await pool.query(
          "SELECT nombre_original, ruta_archivo FROM configuracion_plantillas WHERE clave = 'plantilla_asentimiento' LIMIT 1"
        );
        if (gRows.length > 0 && gRows[0].ruta_archivo) {
          archivoRuta = gRows[0].ruta_archivo;
          archivoNombre = gRows[0].nombre_original;
        }
      }

      if (archivoRuta) {
        const absPath = path.join(__dirname, "../../../", archivoRuta.replace(/^\//, ""));
        if (fs.existsSync(absPath)) {
          return res.download(absPath, archivoNombre || "Plantilla_Asentimiento_Informado.pdf");
        }
      }

      // Generar PDF Institucional Oficial con PDFKit y descargar directamente
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        'attachment; filename="Formato_Asentimiento_Informado_NOUS.pdf"'
      );

      const doc = new PDFDocument({
        size: "LETTER",
        margins: { top: 40, bottom: 40, left: 45, right: 45 },
      });

      doc.pipe(res);

      const startX = doc.page.margins.left;
      const endX = doc.page.width - doc.page.margins.right;

      // Encabezado
      doc
        .fontSize(13)
        .font("Helvetica-Bold")
        .fillColor("#1B5E20")
        .text("FUNDACIÓN UNIVERSITARIA CATÓLICA DEL SUR — NOUS", { align: "center" })
        .moveDown(0.2);

      doc
        .fontSize(9)
        .font("Helvetica")
        .fillColor("#4B5563")
        .text("DIRECCIÓN DE INVESTIGACIONES Y EXTENSIÓN · SEMILLEROS DE INVESTIGACIÓN", { align: "center" })
        .moveDown(0.4);

      doc
        .fontSize(10)
        .font("Helvetica-Bold")
        .fillColor("#1B5E20")
        .text("FORMATO INSTITUCIONAL DE ASENTIMIENTO Y CONSENTIMIENTO INFORMADO (MENORES DE EDAD)", {
          align: "center",
        })
        .moveDown(0.5);

      // Línea divisoria verde
      doc
        .strokeColor("#1B5E20")
        .lineWidth(1.5)
        .moveTo(startX, doc.y)
        .lineTo(endX, doc.y)
        .stroke();
      doc.y += 10;

      const renderCampo = (label) => {
        const y = doc.y;
        doc.fontSize(9.5).font("Helvetica-Bold").fillColor("#374151").text(label, startX, y, { width: 210, continued: false });
        doc.strokeColor("#9CA3AF").lineWidth(0.8).moveTo(startX + 215, y + 10).lineTo(endX, y + 10).stroke();
        doc.y = y + 18;
      };

      const renderSeccion = (titulo) => {
        doc.y += 4;
        doc.fontSize(10).font("Helvetica-Bold").fillColor("#1B5E20").text(titulo, startX);
        const secY = doc.y + 2;
        doc.strokeColor("#E5E7EB").lineWidth(0.8).moveTo(startX, secY).lineTo(endX, secY).stroke();
        doc.y = secY + 6;
      };

      // Sección 1
      renderSeccion("1. DATOS DEL PARTICIPANTE MENOR DE EDAD");
      renderCampo("Nombre completo del estudiante:");
      renderCampo("Tipo y número de documento:");
      renderCampo("Institución educativa / Procedencia:");
      renderCampo("Nombre del Semillero:");

      // Sección 2
      renderSeccion("2. DATOS DEL PADRE, MADRE O TUTOR LEGAL");
      renderCampo("Nombre completo del tutor:");
      renderCampo("Cédula de ciudadanía:");
      renderCampo("Parentesco / Representación legal:");
      renderCampo("Teléfono de contacto:");
      renderCampo("Correo electrónico:");

      // Sección 3
      renderSeccion("3. DECLARACIÓN DE ASENTIMIENTO Y CONSENTIMIENTO INFORMADO");
      doc
        .fontSize(8.8)
        .font("Helvetica")
        .fillColor("#374151")
        .text(
          "Yo, en mi calidad de representante legal del menor de edad arriba identificado, manifiesto de manera voluntaria, libre e informada que he sido enterado(a) de los objetivos, alcance y actividades formativas de la convocatoria académica de investigación NOUS, y AUTORIZO su vinculación y participación activa como integrante del semillero de investigación.\n\nAsimismo, autorizo el tratamiento de sus datos personales e institucionales en estricto cumplimiento de la Ley 1581 de 2012 con fines exclusivamente académicos, de divulgación científica y seguimiento institucional.",
          startX,
          doc.y + 2,
          { width: endX - startX, align: "justify", lineGap: 2 }
        );
      doc.y += 20;

      // Firmas
      const sigY = doc.y + 10;
      const colWidth = (endX - startX - 40) / 2;

      // Firma Tutor
      doc.strokeColor("#374151").lineWidth(1).moveTo(startX, sigY).lineTo(startX + colWidth, sigY).stroke();
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#1F2937")
        .text("Firma del Padre / Madre / Tutor Legal", startX, sigY + 5, { width: colWidth, align: "center" });
      doc
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor("#4B5563")
        .text("C.C. Nº: __________________________", startX, sigY + 18, { width: colWidth, align: "center" });

      // Firma Estudiante
      const col2X = startX + colWidth + 40;
      doc.strokeColor("#374151").lineWidth(1).moveTo(col2X, sigY).lineTo(col2X + colWidth, sigY).stroke();
      doc
        .fontSize(9)
        .font("Helvetica-Bold")
        .fillColor("#1F2937")
        .text("Firma del Estudiante (Menor de edad)", col2X, sigY + 5, { width: colWidth, align: "center" });
      doc
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor("#4B5563")
        .text("Doc. Identidad Nº: __________________", col2X, sigY + 18, { width: colWidth, align: "center" });

      // Ciudad y fecha
      doc
        .fontSize(8.5)
        .font("Helvetica")
        .fillColor("#6B7280")
        .text(
          "Ciudad y Fecha: _________________________________, Pasto (Nariño), 2026.",
          startX,
          sigY + 45,
          { width: endX - startX, align: "center" }
        );

      doc.end();
    } catch (err) {
      return res.status(500).json({ error: "Error al generar plantilla de asentimiento." });
    }
  },

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
      if (!/^\d+$/.test(numeroDocumento))
        return res.status(400).json({ error: "El número de documento solo debe contener números.", campo: "numero_documento" });
      if (telefono && !/^\d+$/.test(telefono))
        return res.status(400).json({ error: "El teléfono solo debe contener números.", campo: "telefono" });
      if (!rol || !ROLES_INTEGRANTE.includes(rol))
        return res.status(400).json({ error: "El rol no es válido.", campo: "rol" });
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ error: "El correo electrónico no es válido.", campo: "email" });

      const esMayorEdad = req.body.es_mayor_edad !== false && req.body.es_mayor_edad !== "false";
      const asentimientoNombre = req.body.asentimiento_nombre || null;
      const asentimientoRuta = req.body.asentimiento_ruta || null;
      const asentimientoMime = req.body.asentimiento_mime || null;
      const asentimientoPesoBytes = req.body.asentimiento_peso_bytes || null;

      const [result] = await pool.query(
        `INSERT INTO inscripcion_semillero_integrantes
         (inscripcion_id, nombre_completo, tipo_documento, numero_documento, rol, email, telefono, es_mayor_edad, asentimiento_nombre, asentimiento_ruta, asentimiento_mime, asentimiento_peso_bytes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [inscripcion.id, nombreCompleto, tipoDocumento, numeroDocumento, rol, email, telefono, esMayorEdad, asentimientoNombre, asentimientoRuta, asentimientoMime, asentimientoPesoBytes]
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
      if (!/^\d+$/.test(numeroDocumento))
        return res.status(400).json({ error: "El número de documento solo debe contener números.", campo: "numero_documento" });
      if (telefono && !/^\d+$/.test(telefono))
        return res.status(400).json({ error: "El teléfono solo debe contener números.", campo: "telefono" });
      if (!rol || !ROLES_INTEGRANTE.includes(rol))
        return res.status(400).json({ error: "El rol no es válido.", campo: "rol" });
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return res.status(400).json({ error: "El correo electrónico no es válido.", campo: "email" });

      const esMayorEdad = req.body.es_mayor_edad !== false && req.body.es_mayor_edad !== "false";
      const asentimientoNombre = req.body.asentimiento_nombre || null;
      const asentimientoRuta = req.body.asentimiento_ruta || null;
      const asentimientoMime = req.body.asentimiento_mime || null;
      const asentimientoPesoBytes = req.body.asentimiento_peso_bytes || null;

      await pool.query(
        `UPDATE inscripcion_semillero_integrantes
         SET nombre_completo = ?, tipo_documento = ?, numero_documento = ?, rol = ?, email = ?, telefono = ?,
             es_mayor_edad = ?, asentimiento_nombre = ?, asentimiento_ruta = ?, asentimiento_mime = ?, asentimiento_peso_bytes = ?
         WHERE id = ? AND inscripcion_id = ?`,
        [nombreCompleto, tipoDocumento, numeroDocumento, rol, email, telefono, esMayorEdad, asentimientoNombre, asentimientoRuta, asentimientoMime, asentimientoPesoBytes, integId, inscripcion.id]
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

  // ─── GESTIÓN DE BORRADORES (Guardar y Continuar) ──────────────────────────

  // POST /:id/guardar-borrador — guarda el estado parcial del formulario (Paso 1..5)
  async guardarBorrador(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      const usuarioId = parseInt(req.body.usuario_id, 10);
      const pasoActual = parseInt(req.body.paso_actual, 10) || 1;

      if (!convId || !usuarioId) {
        return res.status(400).json({ error: "Parámetros incompletos (convocatoria o usuario)." });
      }

      // Parsear datos
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

      // Buscar si ya tiene un borrador en proceso
      const [draftRows] = await pool.query(
        "SELECT id FROM convocatoria_inscripciones WHERE convocatoria_id = ? AND usuario_id = ? AND estado = 'en_proceso' LIMIT 1",
        [convId, usuarioId]
      );

      let inscId;
      if (draftRows.length > 0) {
        inscId = draftRows[0].id;
        await pool.query(
          "UPDATE convocatoria_inscripciones SET fecha_inscripcion = NOW() WHERE id = ?",
          [inscId]
        );
      } else {
        const [insRes] = await pool.query(
          `INSERT INTO convocatoria_inscripciones
           (convocatoria_id, usuario_id, tipo_investigacion, resumen_proyecto, justificacion,
            documento_nombre_original, documento_ruta, documento_mime, documento_peso_bytes, estado, fecha_inscripcion)
           VALUES (?, ?, 'Investigación formativa (Semillero)', '', '', '', '', '', 0, 'en_proceso', NOW())`,
          [convId, usuarioId]
        );
        inscId = insRes.insertId;
      }

      // Guardar Semillero si viene información
      if (semilleroData) {
        const tipoInst = (semilleroData.tipo_institucion || "").trim();
        const instProc = (semilleroData.institucion_procedencia || "").trim();
        const semNombre = (semilleroData.semillero_nombre || "").trim();
        if (tipoInst || instProc || semNombre) {
          const [existSem] = await pool.query("SELECT id FROM inscripcion_semillero_externo WHERE inscripcion_id = ? LIMIT 1", [inscId]);
          if (existSem.length > 0) {
            await pool.query(
              `UPDATE inscripcion_semillero_externo SET tipo_institucion = ?, procedencia = 'Semillero externo', institucion_procedencia = ?, semillero_nombre = ? WHERE inscripcion_id = ?`,
              [tipoInst, instProc, semNombre, inscId]
            );
          } else {
            await pool.query(
              `INSERT INTO inscripcion_semillero_externo (inscripcion_id, tipo_institucion, procedencia, institucion_procedencia, semillero_nombre) VALUES (?, ?, 'Semillero externo', ?, ?)`,
              [inscId, tipoInst, instProc, semNombre]
            );
          }
        }
      }

      // Guardar Integrantes si vienen
      if (Array.isArray(integrantesData)) {
        await pool.query("DELETE FROM inscripcion_semillero_integrantes WHERE inscripcion_id = ?", [inscId]);
        for (const intg of integrantesData) {
          if (intg.nombre_completo || intg.numero_documento || intg.email) {
            await pool.query(
              `INSERT INTO inscripcion_semillero_integrantes
               (inscripcion_id, nombre_completo, tipo_documento, numero_documento, rol, email, telefono, es_mayor_edad, asentimiento_nombre, asentimiento_ruta, asentimiento_mime, asentimiento_peso_bytes)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                inscId,
                (intg.nombre_completo || "").trim(),
                (intg.tipo_documento || "CC").trim(),
                (intg.numero_documento || "").trim(),
                (intg.rol || "Estudiante").trim(),
                (intg.email || "").trim(),
                (intg.telefono || "").trim() || null,
                intg.es_mayor_edad !== false && intg.es_mayor_edad !== "false",
                intg.asentimiento_nombre || null,
                intg.asentimiento_ruta || null,
                intg.asentimiento_mime || null,
                intg.asentimiento_peso_bytes || null,
              ]
            );
          }
        }
      }

      // Guardar Info General si viene
      if (infoGeneralData) {
        const titTrabajo = (infoGeneralData.titulo_trabajo || "").trim();
        const linInvest = (infoGeneralData.linea_investigacion || "").trim() || null;
        const palClave = (infoGeneralData.palabras_clave || "").trim();
        const resumen = (infoGeneralData.resumen || "").trim();
        if (titTrabajo || linInvest || palClave || resumen) {
          const [existInfo] = await pool.query("SELECT id FROM inscripcion_semillero_info_general WHERE inscripcion_id = ? LIMIT 1", [inscId]);
          if (existInfo.length > 0) {
            await pool.query(
              `UPDATE inscripcion_semillero_info_general SET titulo_trabajo = ?, linea_investigacion = ?, palabras_clave = ?, resumen = ? WHERE inscripcion_id = ?`,
              [titTrabajo, linInvest, palClave, resumen, inscId]
            );
          } else {
            await pool.query(
              `INSERT INTO inscripcion_semillero_info_general (inscripcion_id, titulo_trabajo, linea_investigacion, palabras_clave, resumen) VALUES (?, ?, ?, ?, ?)`,
              [inscId, titTrabajo, linInvest, palClave, resumen]
            );
          }
        }
      }

      // Guardar Contenido si viene
      if (contenidoData) {
        const plantProb = (contenidoData.planteamiento_problema || "").trim();
        const objGral = (contenidoData.objetivo_general || "").trim();
        const objEsp = (contenidoData.objetivos_especificos || "").trim();
        const metodo = (contenidoData.metodologia || "").trim();
        const resEsp = (contenidoData.resultados_esperados || "").trim();
        if (plantProb || objGral || objEsp || metodo || resEsp) {
          const [existCont] = await pool.query("SELECT id FROM inscripcion_semillero_contenido WHERE inscripcion_id = ? LIMIT 1", [inscId]);
          if (existCont.length > 0) {
            await pool.query(
              `UPDATE inscripcion_semillero_contenido SET planteamiento_problema = ?, objetivo_general = ?, objetivos_especificos = ?, metodologia = ?, resultados_esperados = ? WHERE inscripcion_id = ?`,
              [plantProb, objGral, objEsp, metodo, resEsp, inscId]
            );
          } else {
            await pool.query(
              `INSERT INTO inscripcion_semillero_contenido (inscripcion_id, planteamiento_problema, objetivo_general, objetivos_especificos, metodologia, resultados_esperados) VALUES (?, ?, ?, ?, ?, ?)`,
              [inscId, plantProb, objGral, objEsp, metodo, resEsp]
            );
          }
        }
      }

      return res.json({
        ok: true,
        mensaje: "Borrador guardado exitosamente.",
        inscripcion_id: inscId,
        paso_actual: pasoActual,
      });
    } catch (err) {
      console.error("Error al guardar borrador:", err);
      return res.status(500).json({ error: "Error al guardar el borrador." });
    }
  },

  // GET /:id/mi-borrador?usuario_id=X — recupera el borrador en proceso
  async obtenerBorrador(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      const usuarioId = parseInt(req.query.usuario_id, 10);
      if (!convId || !usuarioId) return res.status(400).json({ error: "Parámetros incompletos." });

      const [draftRows] = await pool.query(
        "SELECT * FROM convocatoria_inscripciones WHERE convocatoria_id = ? AND usuario_id = ? AND estado = 'en_proceso' ORDER BY id DESC LIMIT 1",
        [convId, usuarioId]
      );

      if (draftRows.length === 0) {
        return res.json({ ok: true, tiene_borrador: false });
      }

      const inscripcion = draftRows[0];
      const datos = await cargarTodosPasos(inscripcion.id);

      // Calcular último paso alcanzado
      let ultimoPaso = 1;
      if (datos.semillero && datos.semillero.semillero_nombre) ultimoPaso = 2;
      if (datos.integrantes && datos.integrantes.length > 0) ultimoPaso = 3;
      if (datos.info_general && datos.info_general.titulo_trabajo) ultimoPaso = 4;
      if (datos.contenido && datos.contenido.planteamiento_problema) ultimoPaso = 5;

      return res.json({
        ok: true,
        tiene_borrador: true,
        inscripcion,
        ultimo_paso: ultimoPaso,
        ...datos,
      });
    } catch (err) {
      console.error("Error al obtener borrador:", err);
      return res.status(500).json({ error: "Error al consultar borrador." });
    }
  },

  // GET /mis-borradores?usuario_id=X — lista todas las convocatorias con borradores del usuario
  async listarBorradores(req, res) {
    try {
      const usuarioId = parseInt(req.query.usuario_id, 10) || req.user?.id;
      if (!usuarioId) return res.status(400).json({ error: "Usuario requerido." });

      const [rows] = await pool.query(
        `SELECT ci.id as inscripcion_id, ci.convocatoria_id, ci.fecha_inscripcion as fecha_borrador, ci.estado,
                c.titulo as convocatoria_titulo, c.codigo, c.tipo, c.estado as estado_convocatoria, c.fecha_cierre,
                ise.semillero_nombre, isig.titulo_trabajo
         FROM convocatoria_inscripciones ci
         JOIN convocatorias c ON c.id = ci.convocatoria_id
         LEFT JOIN inscripcion_semillero_externo ise ON ise.inscripcion_id = ci.id
         LEFT JOIN inscripcion_semillero_info_general isig ON isig.inscripcion_id = ci.id
         WHERE ci.usuario_id = ? AND ci.estado = 'en_proceso'
         ORDER BY ci.fecha_inscripcion DESC`,
        [usuarioId]
      );

      return res.json({ ok: true, borradores: rows });
    } catch (err) {
      console.error("Error al listar borradores:", err);
      return res.status(500).json({ error: "Error al listar borradores." });
    }
  },

  // ─── PASO 5: ENVÍO FINAL ──────────────────────────────────────────────────

  uploadEnvioMiddleware: uploadEnvio.fields([
    { name: "documento", maxCount: 1 },
    { name: "comprobante_pago", maxCount: 1 },
  ]),

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
    const archivoDoc = req.files?.documento?.[0] || (req.file?.fieldname === "documento" ? req.file : null);
    const archivoPago = req.files?.comprobante_pago?.[0] || (req.file?.fieldname === "comprobante_pago" ? req.file : null);
    const subidos = [archivoDoc, archivoPago].filter(Boolean);

    const limpiarArchivos = () => {
      subidos.forEach((f) => {
        if (f && f.path && fs.existsSync(f.path)) {
          try { fs.unlinkSync(f.path); } catch (_) {}
        }
      });
    };

    try {
      const convId = parseInt(req.params.id, 10);
      const usuarioId = parseInt(req.body.usuario_id, 10);
      if (!convId || !usuarioId) {
        limpiarArchivos();
        return res.status(400).json({ error: "Parámetros incompletos (convocatoria o usuario)." });
      }

      // Validar convocatoria
      const [convRows] = await pool.query(
        "SELECT id, tipo, estado FROM convocatorias WHERE id = ? LIMIT 1",
        [convId]
      );
      if (convRows.length === 0) {
        limpiarArchivos();
        return res.status(404).json({ error: "Convocatoria no encontrada." });
      }
      if (convRows[0].estado === "cerrada") {
        limpiarArchivos();
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
        limpiarArchivos();
        return res.status(400).json({ error: "Paso 1 (Semillero): Todos los campos son obligatorios." });
      }

      if (!Array.isArray(integrantesData) || integrantesData.length === 0) {
        limpiarArchivos();
        return res.status(400).json({ error: "Paso 2 (Integrantes): Debes agregar al menos un integrante." });
      }

      // Validar que todos los menores de edad tengan asentimiento informado adjunto
      for (const intg of integrantesData) {
        const esMayor = intg.es_mayor_edad !== false && intg.es_mayor_edad !== "false";
        if (!esMayor && !intg.asentimiento_ruta && !intg.asentimiento_nombre) {
          limpiarArchivos();
          return res.status(400).json({
            error: `El integrante menor de edad "${intg.nombre_completo || 'sin nombre'}" debe tener adjunto su formato de asentimiento informado.`,
            campo: "integrantes",
          });
        }
      }

      const titTrabajo = infoGeneralData?.titulo_trabajo || "";
      const linInvest = infoGeneralData?.linea_investigacion || null;
      const palClave = infoGeneralData?.palabras_clave || "";
      const resumenTexto = infoGeneralData?.resumen || "";

      if (!titTrabajo.trim() || !palClave.trim() || !resumenTexto.trim()) {
        limpiarArchivos();
        return res.status(400).json({ error: "Paso 3 (Información general): Todos los campos requeridos deben ser completados." });
      }

      const plantProb = contenidoData?.planteamiento_problema || "";
      const objGral = contenidoData?.objetivo_general || "";
      const objEsp = contenidoData?.objetivos_especificos || "";
      const metodo = contenidoData?.metodologia || "";
      const resEsp = contenidoData?.resultados_esperados || "";

      if (!plantProb.trim() || !objGral.trim() || !objEsp.trim() || !metodo.trim() || !resEsp.trim()) {
        limpiarArchivos();
        return res.status(400).json({ error: "Paso 4 (Contenido del trabajo): Todos los campos son obligatorios." });
      }

      // Validar Comprobante de pago obligatorio
      if (!archivoPago) {
        limpiarArchivos();
        return res.status(400).json({
          error: "El comprobante de pago de inscripción es obligatorio para convocatorias externas.",
          campo: "comprobante_pago",
        });
      }

      const permitidosPago = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/jpg"];
      if (!permitidosPago.includes(archivoPago.mimetype)) {
        limpiarArchivos();
        return res.status(400).json({
          error: "El comprobante de pago debe ser PDF o una imagen (JPG, PNG, WEBP).",
          campo: "comprobante_pago",
        });
      }
      const pagoInfo = {
        nombre: archivoPago.originalname,
        ruta: `/uploads/inscripciones/${archivoPago.filename}`,
        mime: archivoPago.mimetype,
        peso: archivoPago.size,
      };

      // Validar PDF de propuesta obligatorio
      if (!archivoDoc) {
        limpiarArchivos();
        return res.status(400).json({
          error: "Debes adjuntar el documento de la propuesta de investigación o aval en formato PDF.",
          campo: "documento",
        });
      }
      if (archivoDoc.mimetype !== "application/pdf") {
        limpiarArchivos();
        return res.status(400).json({ error: "La propuesta de investigación debe ser un archivo PDF.", campo: "documento" });
      }
      const docInfo = {
        nombre: archivoDoc.originalname,
        ruta: `/uploads/inscripciones/${archivoDoc.filename}`,
        mime: archivoDoc.mimetype,
        peso: archivoDoc.size,
      };

      // ── Validar límite de hasta 50 inscripciones por convocatoria
      const [conteoRows] = await pool.query(
        "SELECT COUNT(*) as total FROM convocatoria_inscripciones WHERE convocatoria_id = ? AND estado != 'en_proceso'",
        [convId]
      );
      if (conteoRows[0].total >= 50) {
        limpiarArchivos();
        return res.status(400).json({
          error: "Esta convocatoria ya ha alcanzado el límite máximo permitido de 50 inscripciones.",
        });
      }

      const archivoPrincipalInfo = docInfo || pagoInfo || { nombre: null, ruta: null, mime: null, peso: 0 };

      // ── 1. Reutilizar borrador existente si había uno en proceso, o insertar nueva inscripción
      const [draftRows] = await pool.query(
        "SELECT id FROM convocatoria_inscripciones WHERE convocatoria_id = ? AND usuario_id = ? AND estado = 'en_proceso' LIMIT 1",
        [convId, usuarioId]
      );

      let inscId;
      if (draftRows.length > 0) {
        inscId = draftRows[0].id;
        await pool.query(
          `UPDATE convocatoria_inscripciones
           SET estado = 'registrada', tipo_investigacion = ?, resumen_proyecto = ?, justificacion = ?,
               documento_nombre_original = ?, documento_ruta = ?, documento_mime = ?, documento_peso_bytes = ?, fecha_inscripcion = NOW()
           WHERE id = ?`,
          [
            tipoInv || "Investigación formativa (Semillero)",
            resumenTexto,
            `Inscripción semillero: ${semNombre} - ${instProc}`,
            archivoPrincipalInfo.nombre,
            archivoPrincipalInfo.ruta,
            archivoPrincipalInfo.mime,
            archivoPrincipalInfo.peso,
            inscId,
          ]
        );
      } else {
        const [insRes] = await pool.query(
          `INSERT INTO convocatoria_inscripciones
           (convocatoria_id, usuario_id, tipo_investigacion, resumen_proyecto, justificacion,
            documento_nombre_original, documento_ruta, documento_mime, documento_peso_bytes, estado, fecha_inscripcion)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'registrada', NOW())`,
          [
            convId,
            usuarioId,
            tipoInv || "Investigación formativa (Semillero)",
            resumenTexto,
            `Inscripción semillero: ${semNombre} - ${instProc}`,
            archivoPrincipalInfo.nombre,
            archivoPrincipalInfo.ruta,
            archivoPrincipalInfo.mime,
            archivoPrincipalInfo.peso,
          ]
        );
        inscId = insRes.insertId;
      }

      // ── 2. Guardar Paso 1: Semillero Externo
      await pool.query(
        `INSERT INTO inscripcion_semillero_externo
         (inscripcion_id, tipo_institucion, procedencia, institucion_procedencia, semillero_nombre)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE tipo_institucion = VALUES(tipo_institucion), institucion_procedencia = VALUES(institucion_procedencia), semillero_nombre = VALUES(semillero_nombre)`,
        [inscId, tipoInst.trim(), procFija, instProc.trim(), semNombre.trim()]
      );

      // ── 3. Guardar Paso 2: Integrantes
      await pool.query("DELETE FROM inscripcion_semillero_integrantes WHERE inscripcion_id = ?", [inscId]);
      for (const intg of integrantesData) {
        if (intg.nombre_completo && intg.tipo_documento && intg.numero_documento && intg.rol && intg.email) {
          await pool.query(
            `INSERT INTO inscripcion_semillero_integrantes
             (inscripcion_id, nombre_completo, tipo_documento, numero_documento, rol, email, telefono, es_mayor_edad, asentimiento_nombre, asentimiento_ruta, asentimiento_mime, asentimiento_peso_bytes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              inscId,
              intg.nombre_completo.trim(),
              intg.tipo_documento.trim(),
              intg.numero_documento.trim(),
              intg.rol.trim(),
              intg.email.trim(),
              (intg.telefono || "").trim() || null,
              intg.es_mayor_edad !== false && intg.es_mayor_edad !== "false",
              intg.asentimiento_nombre || null,
              intg.asentimiento_ruta || null,
              intg.asentimiento_mime || null,
              intg.asentimiento_peso_bytes || null,
            ]
          );
        }
      }

      // ── 4. Guardar Paso 3: Información General
      await pool.query(
        `INSERT INTO inscripcion_semillero_info_general
         (inscripcion_id, titulo_trabajo, linea_investigacion, palabras_clave, resumen)
         VALUES (?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE titulo_trabajo = VALUES(titulo_trabajo), linea_investigacion = VALUES(linea_investigacion), palabras_clave = VALUES(palabras_clave), resumen = VALUES(resumen)`,
        [inscId, titTrabajo.trim(), linInvest || null, palClave.trim(), resumenTexto.trim()]
      );

      // ── 5. Guardar Paso 4: Contenido
      await pool.query(
        `INSERT INTO inscripcion_semillero_contenido
         (inscripcion_id, planteamiento_problema, objetivo_general, objetivos_especificos, metodologia, resultados_esperados)
         VALUES (?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE planteamiento_problema = VALUES(planteamiento_problema), objetivo_general = VALUES(objetivo_general), objetivos_especificos = VALUES(objetivos_especificos), metodologia = VALUES(metodologia), resultados_esperados = VALUES(resultados_esperados)`,
        [inscId, plantProb.trim(), objGral.trim(), objEsp.trim(), metodo.trim(), resEsp.trim()]
      );

      // ── 6. Guardar documento de propuesta si existe
      if (docInfo) {
        try {
          await pool.query(
            `INSERT INTO convocatoria_inscripcion_documentos
              (inscripcion_id, requisito_nombre, documento_nombre_original, documento_ruta, documento_mime, documento_peso_bytes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [inscId, "Propuesta de investigación", docInfo.nombre, docInfo.ruta, docInfo.mime, docInfo.peso]
          );
        } catch (errDoc) {
          console.warn("Aviso al guardar propuesta de semillero:", errDoc.message);
        }

        try {
          await pool.query(
            `INSERT INTO documentos 
              (convocatoria_id, nombre, tipo, url, version, fecha_creacion, subido_por)
             VALUES (?, ?, ?, ?, 1, CURDATE(), ?)`,
            [convId, docInfo.nombre, docInfo.mime, docInfo.ruta, usuarioId]
          );
        } catch (docErr) {
          console.warn("Aviso al registrar en documentos institucional:", docErr.message);
        }
      }

      // ── 7. Guardar comprobante de pago si existe
      if (pagoInfo) {
        try {
          await pool.query(
            `INSERT INTO convocatoria_inscripcion_documentos
              (inscripcion_id, requisito_nombre, documento_nombre_original, documento_ruta, documento_mime, documento_peso_bytes)
             VALUES (?, ?, ?, ?, ?, ?)`,
            [inscId, "Comprobante de Pago", pagoInfo.nombre, pagoInfo.ruta, pagoInfo.mime, pagoInfo.peso]
          );
        } catch (errPago) {
          console.warn("Aviso al guardar comprobante de pago:", errPago.message);
        }

        try {
          await pool.query(
            `INSERT INTO documentos 
              (convocatoria_id, nombre, tipo, url, version, fecha_creacion, subido_por)
             VALUES (?, ?, ?, ?, 1, CURDATE(), ?)`,
            [convId, `Comprobante de Pago - ${pagoInfo.nombre}`, pagoInfo.mime, pagoInfo.ruta, usuarioId]
          );
        } catch (docErr) {
          console.warn("Aviso al registrar comprobante en documentos institucional:", docErr.message);
        }
      }

      const [updRows] = await pool.query("SELECT * FROM convocatoria_inscripciones WHERE id = ? LIMIT 1", [inscId]);
      return res.json({
        ok: true,
        mensaje: "¡Inscripción completada y enviada correctamente!",
        inscripcion: updRows[0],
      });
    } catch (err) {
      limpiarArchivos();
      console.error("Error al enviar inscripción:", err);
      return res.status(500).json({ error: "Error al registrar y enviar la inscripción." });
    }
  },
};

module.exports = pasosSemilleroController;
