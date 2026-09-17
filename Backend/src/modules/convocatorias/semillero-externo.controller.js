const pool = require("../../db/connection");

// Tipos de institución estándar (sin tabla en BD, se centraliza aquí)
const TIPOS_INSTITUCION = [
  "Universidad",
  "Instituto Tecnológico",
  "Politécnico",
  "Fundación",
  "Centro de Investigación",
  "Empresa",
  "Otro",
];

const PROCEDENCIA_FIJA = "Semillero externo";

const semilleroExternoController = {
  // ─── GET /api/convocatorias/:id/semillero-externo?usuario_id=X ──────────────
  // Devuelve tipos de institución y, si ya existe, el registro guardado del semillero externo
  async obtener(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      const usuarioId = parseInt(req.query.usuario_id, 10);

      if (!convId || isNaN(convId)) {
        return res.status(400).json({ error: "ID de convocatoria inválido." });
      }

      let semillero = null;
      let inscripcion = null;

      if (usuarioId && !isNaN(usuarioId)) {
        // Buscar inscripción existente
        const [inscRows] = await pool.query(
          "SELECT * FROM convocatoria_inscripciones WHERE convocatoria_id = ? AND usuario_id = ? LIMIT 1",
          [convId, usuarioId]
        );

        if (inscRows.length > 0) {
          inscripcion = inscRows[0];
          // Buscar datos de semillero externo asociados
          const [semRows] = await pool.query(
            "SELECT * FROM inscripcion_semillero_externo WHERE inscripcion_id = ? LIMIT 1",
            [inscripcion.id]
          );
          if (semRows.length > 0) {
            semillero = semRows[0];
          }
        }
      }

      return res.json({
        ok: true,
        tipos_institucion: TIPOS_INSTITUCION,
        procedencia_fija: PROCEDENCIA_FIJA,
        inscripcion: inscripcion || null,
        semillero: semillero || null,
      });
    } catch (err) {
      console.error("Error al obtener datos semillero externo:", err);
      return res.status(500).json({ error: "Error al consultar datos del semillero externo." });
    }
  },

  // ─── POST /api/convocatorias/:id/semillero-externo ──────────────────────────
  // Guarda (o actualiza) la información de semillero externo para la inscripción
  async guardar(req, res) {
    try {
      const convId = parseInt(req.params.id, 10);
      if (!convId || isNaN(convId)) {
        return res.status(400).json({ error: "ID de convocatoria inválido." });
      }

      // ── 1. Validar convocatoria ───────────────────────────────────────────
      const [convRows] = await pool.query(
        "SELECT id, tipo, estado FROM convocatorias WHERE id = ? LIMIT 1",
        [convId]
      );
      if (convRows.length === 0) {
        return res.status(404).json({ error: "Convocatoria no encontrada." });
      }
      const conv = convRows[0];

      if (conv.tipo !== "Externa") {
        return res.status(400).json({
          error: "Este endpoint solo aplica para convocatorias externas.",
          campo: "convocatoria",
        });
      }

      if (conv.estado === "cerrada") {
        return res.status(400).json({ error: "La convocatoria se encuentra cerrada." });
      }

      // ── 2. Validar usuario ───────────────────────────────────────────────
      const usuarioId = parseInt(req.body.usuario_id, 10);
      if (!usuarioId || isNaN(usuarioId)) {
        return res.status(400).json({ error: "El usuario es obligatorio.", campo: "usuario_id" });
      }

      const [userRows] = await pool.query(
        "SELECT id, activo FROM usuarios WHERE id = ? LIMIT 1",
        [usuarioId]
      );
      if (userRows.length === 0 || !userRows[0].activo) {
        return res.status(403).json({ error: "Usuario inactivo o no autorizado." });
      }

      // ── 3. Validar campos del semillero ─────────────────────────────────
      const tipoInstitucion = (req.body.tipo_institucion || "").trim();
      const procedencia = PROCEDENCIA_FIJA; // siempre fijo
      const institucionProcedencia = (req.body.institucion_procedencia || "").trim();
      const semilleroNombre = (req.body.semillero_nombre || "").trim();

      if (!tipoInstitucion) {
        return res.status(400).json({
          error: "El tipo de institución es obligatorio.",
          campo: "tipo_institucion",
        });
      }

      if (!TIPOS_INSTITUCION.includes(tipoInstitucion)) {
        return res.status(400).json({
          error: `El tipo de institución '${tipoInstitucion}' no es válido.`,
          campo: "tipo_institucion",
        });
      }

      if (!institucionProcedencia) {
        return res.status(400).json({
          error: "La institución de procedencia es obligatoria.",
          campo: "institucion_procedencia",
        });
      }

      if (!semilleroNombre) {
        return res.status(400).json({
          error: "El nombre del semillero es obligatorio.",
          campo: "semillero_nombre",
        });
      }

      // ── 4. Crear o reutilizar inscripción ────────────────────────────────
      let inscripcion = null;
      const [inscRows] = await pool.query(
        "SELECT * FROM convocatoria_inscripciones WHERE convocatoria_id = ? AND usuario_id = ? LIMIT 1",
        [convId, usuarioId]
      );

      if (inscRows.length > 0) {
        // Ya existe inscripción → reutilizar
        inscripcion = inscRows[0];
      } else {
        // Verificar límite de 50 inscripciones
        const [conteoRows] = await pool.query(
          "SELECT COUNT(*) as total FROM convocatoria_inscripciones WHERE convocatoria_id = ?",
          [convId]
        );
        if (conteoRows[0].total >= 50) {
          return res.status(400).json({
            error: "Esta convocatoria ya ha alcanzado el límite máximo permitido de 50 inscripciones.",
          });
        }

        // Crear inscripción base para convocatoria externa (sin documentos en este paso)
        const [result] = await pool.query(
          `INSERT INTO convocatoria_inscripciones
           (convocatoria_id, usuario_id, tipo_investigacion, resumen_proyecto, justificacion,
            documento_nombre_original, documento_ruta, documento_mime, documento_peso_bytes, estado)
           VALUES (?, ?, '', '', '', '', '', '', 0, 'en_proceso')`,
          [convId, usuarioId]
        );

        const [newRows] = await pool.query(
          "SELECT * FROM convocatoria_inscripciones WHERE id = ? LIMIT 1",
          [result.insertId]
        );
        inscripcion = newRows[0];
      }

      // ── 5. Crear o actualizar datos de semillero externo ─────────────────
      const [semRows] = await pool.query(
        "SELECT * FROM inscripcion_semillero_externo WHERE inscripcion_id = ? LIMIT 1",
        [inscripcion.id]
      );

      let semillero;
      if (semRows.length > 0) {
        // Actualizar registro existente
        await pool.query(
          `UPDATE inscripcion_semillero_externo
           SET tipo_institucion = ?, procedencia = ?, institucion_procedencia = ?, semillero_nombre = ?
           WHERE inscripcion_id = ?`,
          [tipoInstitucion, procedencia, institucionProcedencia, semilleroNombre, inscripcion.id]
        );
        const [updRows] = await pool.query(
          "SELECT * FROM inscripcion_semillero_externo WHERE inscripcion_id = ? LIMIT 1",
          [inscripcion.id]
        );
        semillero = updRows[0];
      } else {
        // Insertar nuevo
        await pool.query(
          `INSERT INTO inscripcion_semillero_externo
           (inscripcion_id, tipo_institucion, procedencia, institucion_procedencia, semillero_nombre)
           VALUES (?, ?, ?, ?, ?)`,
          [inscripcion.id, tipoInstitucion, procedencia, institucionProcedencia, semilleroNombre]
        );
        const [insRows] = await pool.query(
          "SELECT * FROM inscripcion_semillero_externo WHERE inscripcion_id = ? LIMIT 1",
          [inscripcion.id]
        );
        semillero = insRows[0];
      }

      return res.status(201).json({
        ok: true,
        mensaje: "Información del semillero guardada correctamente.",
        inscripcion,
        semillero,
      });
    } catch (err) {
      console.error("Error al guardar semillero externo:", err);
      if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
          error: "Ya tienes una inscripción registrada para esta convocatoria.",
        });
      }
      return res.status(500).json({ error: "Error al guardar la información del semillero." });
    }
  },
};

module.exports = semilleroExternoController;
