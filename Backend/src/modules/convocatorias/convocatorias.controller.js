const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const multer = require("multer");
const pool = require("../../db/connection");
const convocatoriasService = require("./convocatorias.service");

// Configuración de almacenamiento seguro para archivos de inscripción
const uploadDir = path.join(__dirname, "../../../uploads/inscripciones");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const convId = req.params.id || "0";
    const userId = req.body.usuario_id || "0";
    const timestamp = Date.now();
    const random = crypto.randomBytes(6).toString("hex");
    cb(null, `inscripcion_CON${convId}_user${userId}_${timestamp}_${random}.pdf`);
  },
});

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ext !== ".pdf" || file.mimetype !== "application/pdf") {
    return cb(new Error("Solo se permiten archivos PDF."));
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 15 * 1024 * 1024, // Máximo 15MB
  },
});

function verificarMagicBytesPDF(filePath) {
  try {
    const stat = fs.statSync(filePath);
    // Un PDF real debe tener al menos 1 KB de contenido
    if (stat.size < 1024) return false;

    const fd = fs.openSync(filePath, "r");
    const buffer = Buffer.alloc(5);
    fs.readSync(fd, buffer, 0, 5, 0);
    fs.closeSync(fd);
    return buffer.toString("utf-8") === "%PDF-";
  } catch {
    return false;
  }
}

const uploadDocumentoMiddleware = (req, res, next) => {
  upload.any()(req, res, (err) => {
    if (err) {
      if (err.message && err.message.includes("Solo se permiten")) {
        return res.status(400).json({ error: "Solo se permiten archivos PDF.", campo: "documentos" });
      }
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({ error: "Uno o más archivos exceden el tamaño máximo permitido (15MB).", campo: "documentos" });
      }
      return res.status(400).json({ error: "Error al procesar los documentos adjuntos.", campo: "documentos" });
    }
    // Asegurar req.file para compatibilidad
    if (req.files && req.files.length > 0) {
      req.file = req.files.find((f) => f.fieldname === "documento") || req.files[0];
    }
    next();
  });
};

const convocatoriasController = {
  // ─── RF-CON-02: Consultas ─────────────────────────────────────────────────

  async listar(req, res) {
    try {
      const { estado, tipo, q } = req.query;
      const convocatorias = await convocatoriasService.listar({ estado, tipo, q });
      res.json(convocatorias);
    } catch (err) {
      console.error("Error al listar convocatorias:", err);
      res.status(500).json({ error: "Error al consultar convocatorias" });
    }
  },

  async listarVigentes(req, res) {
    try {
      const vigentes = await convocatoriasService.listarVigentes();
      res.json(vigentes);
    } catch (err) {
      console.error("Error al listar convocatorias vigentes:", err);
      res.status(500).json({ error: "Error al consultar convocatorias vigentes" });
    }
  },

  async obtenerPorId(req, res) {
    try {
      const convocatoria = await convocatoriasService.obtenerPorId(req.params.id);
      if (!convocatoria) {
        return res.status(404).json({ error: "Convocatoria no encontrada" });
      }
      res.json(convocatoria);
    } catch (err) {
      console.error("Error al obtener convocatoria:", err);
      res.status(500).json({ error: "Error al consultar la convocatoria" });
    }
  },

  // ─── RF-CON-01: Registro y Publicación ─────────────────────────────────────

  async crear(req, res) {
    try {
      const {
        titulo,
        tipo,
        tipo_investigacion,
        dirigida_a,
        descripcion,
        fecha_apertura,
        fecha_cierre,
        requisitos,
        plantilla_base_url,
        creado_por,
        estado,
      } = req.body;

      // 1. Validar título (no vacío tras trim)
      if (!titulo || !titulo.trim()) {
        return res.status(400).json({ error: "El nombre de la convocatoria es obligatorio", campo: "titulo" });
      }

      // 2. Validar tipo
      if (!tipo || !tipo.trim()) {
        return res.status(400).json({ error: "El tipo de convocatoria es obligatorio", campo: "tipo" });
      }

      // Validación obligatoria para convocatorias externas
      if (tipo.trim() === "Externa") {
        if (!tipo_investigacion || !tipo_investigacion.trim()) {
          return res.status(400).json({
            error: "Selecciona el tipo de investigación para generar el código de la convocatoria.",
            campo: "tipo_investigacion",
          });
        }
      }

      // 3. Validar dirigida_a (únicamente Docente, Estudiante, Administrativo)
      const DIRIGIDA_PERMITIDOS = ["Docente", "Estudiante", "Administrativo"];
      if (!dirigida_a || !DIRIGIDA_PERMITIDOS.includes(dirigida_a.trim())) {
        return res.status(400).json({
          error: "Selecciona una opción válida para 'Dirigida a' (Docente, Estudiante, Administrativo)",
          campo: "dirigida_a",
        });
      }

      // 4. Validar descripción (no vacía tras trim)
      if (!descripcion || !descripcion.trim()) {
        return res.status(400).json({ error: "La descripción de la convocatoria es obligatoria", campo: "descripcion" });
      }

      // 5. Validar fechas de apertura y cierre
      if (!fecha_apertura) {
        return res.status(400).json({ error: "Selecciona una fecha de apertura", campo: "fecha_apertura" });
      }
      if (!fecha_cierre) {
        return res.status(400).json({ error: "Selecciona una fecha de cierre", campo: "fecha_cierre" });
      }

      const fApertura = new Date(fecha_apertura);
      const fCierre = new Date(fecha_cierre);
      if (isNaN(fApertura.getTime())) {
        return res.status(400).json({ error: "La fecha de apertura no tiene un formato válido", campo: "fecha_apertura" });
      }
      if (isNaN(fCierre.getTime())) {
        return res.status(400).json({ error: "La fecha de cierre no tiene un formato válido", campo: "fecha_cierre" });
      }
      if (fCierre < fApertura) {
        return res.status(400).json({
          error: "La fecha de cierre no puede ser anterior a la fecha de apertura.",
          campo: "fecha_cierre",
        });
      }

      // 6. Validar requisitos
      if (!requisitos || (typeof requisitos === "string" && !requisitos.trim())) {
        return res.status(400).json({ error: "Debes incluir al menos un requisito para la convocatoria", campo: "requisitos" });
      }

      const nueva = await convocatoriasService.crear({
        titulo: titulo.trim(),
        tipo: tipo.trim(),
        tipo_investigacion: tipo_investigacion ? tipo_investigacion.trim() : null,
        dirigida_a: dirigida_a.trim(),
        descripcion: descripcion.trim(),
        fecha_apertura,
        fecha_cierre,
        rubro_disponible: 0,
        requisitos: typeof requisitos === "string" ? requisitos.trim() : (Array.isArray(requisitos) ? requisitos.join("|") : null),
        plantilla_base_url,
        creado_por,
        estado,
      });

      res.status(201).json({
        ok: true,
        mensaje: "Convocatoria registrada exitosamente",
        convocatoria: nueva,
      });
    } catch (err) {
      console.error("Error al registrar convocatoria:", err);
      res.status(500).json({ error: "Error al registrar la convocatoria" });
    }
  },

  async actualizar(req, res) {
    try {
      const data = { ...req.body };

      if (data.titulo !== undefined) {
        if (!data.titulo || !data.titulo.trim()) {
          return res.status(400).json({ error: "El nombre de la convocatoria no puede estar vacío", campo: "titulo" });
        }
        data.titulo = data.titulo.trim();
      }

      if (data.tipo !== undefined) {
        if (!data.tipo || !data.tipo.trim()) {
          return res.status(400).json({ error: "El tipo de convocatoria no puede estar vacío", campo: "tipo" });
        }
        data.tipo = data.tipo.trim();
      }

      if (data.dirigida_a !== undefined) {
        const DIRIGIDA_PERMITIDOS = ["Docente", "Estudiante", "Administrativo"];
        if (!data.dirigida_a || !DIRIGIDA_PERMITIDOS.includes(data.dirigida_a.trim())) {
          return res.status(400).json({
            error: "Selecciona una opción válida para 'Dirigida a' (Docente, Estudiante, Administrativo)",
            campo: "dirigida_a",
          });
        }
        data.dirigida_a = data.dirigida_a.trim();
      }

      if (data.descripcion !== undefined) {
        if (!data.descripcion || !data.descripcion.trim()) {
          return res.status(400).json({ error: "La descripción no puede estar vacía", campo: "descripcion" });
        }
        data.descripcion = data.descripcion.trim();
      }

      // Validar coherencia de fechas si ambas o una de ellas se actualiza
      if (data.fecha_apertura && data.fecha_cierre) {
        const fApertura = new Date(data.fecha_apertura);
        const fCierre = new Date(data.fecha_cierre);
        if (fCierre < fApertura) {
          return res.status(400).json({
            error: "La fecha de cierre no puede ser anterior a la fecha de apertura.",
            campo: "fecha_cierre",
          });
        }
      }

      if (data.requisitos !== undefined && Array.isArray(data.requisitos)) {
        data.requisitos = data.requisitos.join("|");
      }

      // Eliminar cualquier campo de presupuesto recibido
      delete data.rubro_disponible;

      const actualizada = await convocatoriasService.actualizar(req.params.id, data);
      if (!actualizada) {
        return res.status(404).json({ error: "Convocatoria no encontrada" });
      }
      res.json({
        ok: true,
        mensaje: "Convocatoria actualizada correctamente",
        convocatoria: actualizada,
      });
    } catch (err) {
      console.error("Error al actualizar convocatoria:", err);
      res.status(500).json({ error: "Error al actualizar la convocatoria" });
    }
  },

  async publicar(req, res) {
    try {
      const publicada = await convocatoriasService.publicar(req.params.id);
      if (!publicada) {
        return res.status(404).json({ error: "Convocatoria no encontrada" });
      }
      res.json({
        ok: true,
        mensaje: "Convocatoria publicada con éxito",
        convocatoria: publicada,
      });
    } catch (err) {
      console.error("Error al publicar convocatoria:", err);
      res.status(500).json({ error: "Error al publicar la convocatoria" });
    }
  },

  async eliminar(req, res) {
    try {
      const resultado = await convocatoriasService.eliminar(req.params.id);
      if (resultado.notFound) {
        return res.status(404).json({ error: "Convocatoria no encontrada" });
      }
      res.json({ ok: true, mensaje: "Convocatoria eliminada correctamente" });
    } catch (err) {
      console.error("Error al eliminar convocatoria:", err);
      res.status(500).json({ error: "Error al eliminar la convocatoria" });
    }
  },

  // ─── RF-CON-03: Alertas de Fechas ─────────────────────────────────────────

  async obtenerAlertas(req, res) {
    try {
      const alertas = await convocatoriasService.obtenerAlertas();
      res.json(alertas);
    } catch (err) {
      console.error("Error al obtener alertas de convocatorias:", err);
      res.status(500).json({ error: "Error al consultar alertas" });
    }
  },

  // ─── RF-CON-04: Banco de Convocatorias Externas ───────────────────────────

  async listarExternas(req, res) {
    try {
      const { q } = req.query;
      const externas = await convocatoriasService.listarExternas({ q });
      res.json(externas);
    } catch (err) {
      console.error("Error al listar convocatorias externas:", err);
      res.status(500).json({ error: "Error al consultar convocatorias externas" });
    }
  },

  async obtenerExternaPorId(req, res) {
    try {
      const externa = await convocatoriasService.obtenerExternaPorId(req.params.id);
      if (!externa) {
        return res.status(404).json({ error: "Convocatoria externa no encontrada" });
      }
      res.json(externa);
    } catch (err) {
      console.error("Error al obtener convocatoria externa:", err);
      res.status(500).json({ error: "Error al consultar la convocatoria externa" });
    }
  },

  async crearExterna(req, res) {
    try {
      const { titulo, entidad_externa, tipo_investigacion, fecha_apertura, fecha_cierre, descripcion } = req.body;
      if (!titulo || !titulo.trim()) {
        return res.status(400).json({ error: "El título de la convocatoria externa es obligatorio", campo: "titulo" });
      }

      if (!tipo_investigacion || !tipo_investigacion.trim()) {
        return res.status(400).json({
          error: "Selecciona el tipo de investigación para generar el código de la convocatoria.",
          campo: "tipo_investigacion",
        });
      }

      const nueva = await convocatoriasService.crearExterna({
        titulo: titulo.trim(),
        entidad_externa: entidad_externa ? entidad_externa.trim() : null,
        tipo_investigacion: tipo_investigacion.trim(),
        fecha_apertura,
        fecha_cierre,
        descripcion,
      });

      res.status(201).json({
        ok: true,
        mensaje: "Convocatoria externa registrada en el banco",
        convocatoria: nueva,
      });
    } catch (err) {
      console.error("Error al registrar convocatoria externa:", err);
      res.status(500).json({ error: err.message || "Error al registrar convocatoria externa" });
    }
  },

  async actualizarExterna(req, res) {
    try {
      const actualizada = await convocatoriasService.actualizarExterna(req.params.id, req.body);
      if (!actualizada) {
        return res.status(404).json({ error: "Convocatoria externa no encontrada" });
      }
      res.json({
        ok: true,
        mensaje: "Convocatoria externa actualizada correctamente",
        convocatoria: actualizada,
      });
    } catch (err) {
      console.error("Error al actualizar convocatoria externa:", err);
      res.status(500).json({ error: "Error al actualizar convocatoria externa" });
    }
  },

  async eliminarExterna(req, res) {
    try {
      const resultado = await convocatoriasService.eliminarExterna(req.params.id);
      if (!resultado.ok) {
        return res.status(404).json({ error: "Convocatoria externa no encontrada" });
      }
      res.json({ ok: true, mensaje: "Convocatoria externa eliminada correctamente" });
    } catch (err) {
      console.error("Error al eliminar convocatoria externa:", err);
      res.status(500).json({ error: "Error al eliminar convocatoria externa" });
    }
  },

  // ─── RF-CON-05: Comité de Asignación y Objeción ───────────────────────────

  async aprobarComite(req, res) {
    try {
      const { fecha_aprobacion } = req.body || {};
      const aprobada = await convocatoriasService.aprobarComite(req.params.id, { fecha_aprobacion });
      if (!aprobada) {
        return res.status(404).json({ error: "Convocatoria no encontrada" });
      }
      res.json({
        ok: true,
        mensaje: "Convocatoria aprobada por el comité",
        convocatoria: aprobada,
      });
    } catch (err) {
      console.error("Error al aprobar convocatoria por comité:", err);
      res.status(500).json({ error: "Error al procesar la aprobación del comité" });
    }
  },

  async objetarComite(req, res) {
    try {
      const { observaciones } = req.body || {};
      if (!observaciones || !observaciones.trim()) {
        return res.status(400).json({ error: "Se deben incluir las observaciones de la objeción" });
      }

      const objetada = await convocatoriasService.objetarComite(req.params.id, {
        observaciones: observaciones.trim(),
      });

      if (!objetada) {
        return res.status(404).json({ error: "Convocatoria no encontrada" });
      }

      res.json({
        ok: true,
        mensaje: "Convocatoria objetada por el comité",
        convocatoria: objetada,
      });
    } catch (err) {
      console.error("Error al objetar convocatoria por comité:", err);
      res.status(500).json({ error: "Error al procesar la objeción del comité" });
    }
  },

  // Middleware de carga de archivo
  uploadDocumentoMiddleware,

  // ─── Inscripción a Convocatoria ───────────────────────────────────────────

  async inscribirse(req, res) {
    const files = req.files && req.files.length > 0 ? req.files : (req.file ? [req.file] : []);
    const limpiarArchivosSubidos = () => {
      for (const f of files) {
        if (f && f.path && fs.existsSync(f.path)) {
          try {
            fs.unlinkSync(f.path);
          } catch (e) {
            console.error("Error al eliminar archivo temporal:", e.message);
          }
        }
      }
    };

    try {
      const convId = parseInt(req.params.id, 10);
      if (!convId || isNaN(convId)) {
        limpiarArchivosSubidos();
        return res.status(400).json({ error: "ID de convocatoria inválido." });
      }

      // 1. Validar convocatoria
      const conv = await convocatoriasService.obtenerPorId(convId);
      if (!conv) {
        limpiarArchivosSubidos();
        return res.status(404).json({ error: "Convocatoria no encontrada." });
      }

      if (conv.estado === "cerrada") {
        limpiarArchivosSubidos();
        return res.status(400).json({ error: "La convocatoria se encuentra cerrada." });
      }

      // 2. Validar usuario
      const usuarioId = parseInt(req.body.usuario_id, 10);
      if (!usuarioId || isNaN(usuarioId)) {
        limpiarArchivosSubidos();
        return res.status(400).json({ error: "El usuario que realiza la inscripción es obligatorio." });
      }

      const [userRows] = await pool.query("SELECT id, activo FROM usuarios WHERE id = ?", [usuarioId]);
      if (userRows.length === 0 || !userRows[0].activo) {
        limpiarArchivosSubidos();
        return res.status(403).json({ error: "Usuario inactivo o no autorizado." });
      }

      // 3. Validar límite de hasta 50 inscripciones por convocatoria
      const [conteoRows] = await pool.query(
        "SELECT COUNT(*) as total FROM convocatoria_inscripciones WHERE convocatoria_id = ?",
        [convId]
      );
      if (conteoRows[0].total >= 50) {
        limpiarArchivosSubidos();
        return res.status(400).json({
          error: "Esta convocatoria ya ha alcanzado el límite máximo permitido de 50 inscripciones.",
        });
      }

      // 4. Validar documento(s)
      if (!files || files.length === 0) {
        return res.status(400).json({
          error: "Debes adjuntar los archivos PDF requeridos.",
          campo: "documentos",
        });
      }

      for (const f of files) {
        const esPdfMime = f.mimetype === "application/pdf";
        const esMagicPdf = verificarMagicBytesPDF(f.path);
        if (!esPdfMime || !esMagicPdf) {
          limpiarArchivosSubidos();
          return res.status(400).json({
            error: `El archivo ${f.originalname} no es un documento PDF válido.`,
            campo: "documentos",
          });
        }
      }

      // 5. Validar Tipo de investigación
      const tipoInvestigacion = (req.body.tipo_investigacion || "").trim();
      if (!tipoInvestigacion) {
        limpiarArchivosSubidos();
        return res.status(400).json({
          error: "Selecciona el tipo de investigación.",
          campo: "tipo_investigacion",
        });
      }

      // 6. Validar Resumen del proyecto
      const resumen = (req.body.resumen || req.body.resumen_proyecto || "").trim();
      if (!resumen) {
        limpiarArchivosSubidos();
        return res.status(400).json({
          error: "El resumen del proyecto es obligatorio.",
          campo: "resumen",
        });
      }
      if (resumen.length > 500) {
        limpiarArchivosSubidos();
        return res.status(400).json({
          error: "El máximo permitido es de 500 caracteres.",
          campo: "resumen",
        });
      }

      // 7. Validar Justificación
      const justificacion = (req.body.justificacion || "").trim();
      if (!justificacion) {
        limpiarArchivosSubidos();
        return res.status(400).json({
          error: "La justificación es obligatoria.",
          campo: "justificacion",
        });
      }
      if (justificacion.length > 500) {
        limpiarArchivosSubidos();
        return res.status(400).json({
          error: "El máximo permitido es de 500 caracteres.",
          campo: "justificacion",
        });
      }

      // Parsear metadata de requisitos si fue enviada
      let requisitosInfo = [];
      try {
        if (req.body.requisitos_info) {
          requisitosInfo = JSON.parse(req.body.requisitos_info);
        }
      } catch (e) {
        console.warn("No se pudo parsear requisitos_info:", e.message);
      }

      // Procesar lista de documentos adjuntos
      const documentosProcesados = files.map((f, idx) => {
        const rutaRelativa = `/uploads/inscripciones/${f.filename}`;
        const matchInfo = requisitosInfo.find(
          (ri) => ri.filename === f.originalname || ri.fieldname === f.fieldname
        ) || requisitosInfo[idx];
        const reqNombre = matchInfo?.requisito || f.originalname.replace(/\.pdf$/i, "");
        return {
          requisito_nombre: reqNombre,
          documento_nombre_original: f.originalname,
          documento_ruta: rutaRelativa,
          documento_mime: f.mimetype,
          documento_peso_bytes: f.size,
        };
      });

      const archivoPrincipal = files.find((f) => f.fieldname === "documento") || files[0];
      const rutaRelativaPrincipal = `/uploads/inscripciones/${archivoPrincipal.filename}`;

      // 8. Registrar inscripción
      const nuevaInscripcion = await convocatoriasService.registrarInscripcion({
        convocatoria_id: convId,
        usuario_id: usuarioId,
        tipo_investigacion: tipoInvestigacion,
        resumen_proyecto: resumen,
        justificacion: justificacion,
        documento_nombre_original: archivoPrincipal.originalname,
        documento_ruta: rutaRelativaPrincipal,
        documento_mime: archivoPrincipal.mimetype,
        documento_peso_bytes: archivoPrincipal.size,
        documentos_adjuntos: documentosProcesados,
      });

      return res.status(201).json({
        ok: true,
        mensaje: "Inscripción realizada correctamente.",
        inscripcion: nuevaInscripcion,
      });
    } catch (err) {
      limpiarArchivosSubidos();
      console.error("Error al registrar inscripción:", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          error: "Ya tienes una inscripción registrada para esta convocatoria.",
        });
      }
      return res.status(500).json({ error: "Error al registrar la inscripción." });
    }
  },

  async verificarInscripcion(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      const usuarioId = parseInt(req.query.usuario_id, 10);
      if (!convId || !usuarioId) {
        return res.status(400).json({ error: "Parámetros incompletos." });
      }
      const inscripcion = await convocatoriasService.verificarInscripcionExistente(convId, usuarioId);
      return res.json({
        inscrito: !!inscripcion,
        inscripcion: inscripcion || null,
      });
    } catch (err) {
      console.error("Error al verificar inscripción:", err);
      return res.status(500).json({ error: "Error al verificar la inscripción." });
    }
  },

  async listarInscripciones(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      if (!convId) {
        return res.status(400).json({ error: "ID inválido." });
      }
      const inscripciones = await convocatoriasService.listarInscripciones(convId);
      return res.json(inscripciones);
    } catch (err) {
      console.error("Error al listar inscripciones:", err);
      return res.status(500).json({ error: "Error al listar las inscripciones." });
    }
  },
};

module.exports = convocatoriasController;
