const pool = require("../../db/connection");
const { obtenerSiglaTipoInvestigacion } = require("./convocatorias.constants");

/**
 * Servicio de Convocatorias (Internas y Externas)
 * Implementa RF-CON-01 a RF-CON-05
 */
const convocatoriasService = {
  // ─── Generación de Códigos de Convocatorias Externas ───────────────────────

  /**
   * Generar código atómico para convocatoria externa: TIPO + E + AÑO + NNN
   * Consecutivo independiente por tipo de investigación y año, reiniciado anualmente.
   */
  async generarCodigoConvocatoriaExterna(tipoInvestigacion, anioConvocatoria) {
    const sigla = tipoInvestigacion ? (obtenerSiglaTipoInvestigacion(tipoInvestigacion) || "EXT") : "EXT";
    const anio = parseInt(anioConvocatoria, 10) || new Date().getFullYear();

    // Incremento atómico en MySQL
    await pool.query(
      `INSERT INTO consecutivos_convocatorias (tipo_codigo, anio, ultimo_consecutivo)
       VALUES (?, ?, 1)
       ON DUPLICATE KEY UPDATE ultimo_consecutivo = LAST_INSERT_ID(ultimo_consecutivo + 1)`,
      [sigla, anio]
    );

    const [rows] = await pool.query("SELECT LAST_INSERT_ID() as siguiente");
    const siguiente = rows[0]?.siguiente || 1;
    const consecutivoStr = String(siguiente).padStart(3, "0");

    return `${sigla}E${anio}${consecutivoStr}`;
  },

  // ─── RF-CON-02: Consulta y Listado ─────────────────────────────────────────

  /**
   * Listar todas las convocatorias con filtros dinámicos
   */
  async listar({ estado, tipo, q }) {
    let sql = `
      SELECT c.id, c.codigo, c.tipo_investigacion,
             COALESCE(c.codigo, CONCAT('CON', c.id)) as codigo_con,
             c.titulo, c.tipo, c.descripcion, c.dirigida_a,
             c.fecha_apertura, c.fecha_cierre, c.estado, c.aprobada_comite, c.fecha_aprobacion,
             c.observaciones_comite, c.requisitos, c.plantilla_base_url,
             u.nombre_completo as creado_por_nombre,
             DATEDIFF(c.fecha_cierre, CURDATE()) as dias_restantes
      FROM convocatorias c
      LEFT JOIN usuarios u ON u.id = c.creado_por
      WHERE 1=1
    `;
    const params = [];

    if (estado) {
      sql += " AND c.estado = ?";
      params.push(estado);
    }
    if (tipo) {
      sql += " AND c.tipo = ?";
      params.push(tipo);
    }
    if (q) {
      sql += " AND (c.titulo LIKE ? OR c.requisitos LIKE ? OR c.descripcion LIKE ? OR c.codigo LIKE ?)";
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += " ORDER BY c.fecha_apertura DESC, c.id DESC";

    const [rows] = await pool.query(sql, params);
    return rows;
  },

  /**
   * RF-CON-02: Convocatorias vigentes (publicadas y con fecha dentro del rango actual)
   */
  async listarVigentes() {
    const sql = `
      SELECT c.id, c.codigo, c.tipo_investigacion,
             COALESCE(c.codigo, CONCAT('CON', c.id)) as codigo_con,
             c.titulo, c.tipo, c.descripcion, c.dirigida_a,
             c.fecha_apertura, c.fecha_cierre, c.estado, c.aprobada_comite, c.requisitos,
             u.nombre_completo as creado_por_nombre,
             DATEDIFF(c.fecha_cierre, CURDATE()) as dias_restantes
      FROM convocatorias c
      LEFT JOIN usuarios u ON u.id = c.creado_por
      WHERE (c.estado = 'publicada' OR c.estado = 'activa')
        AND (c.fecha_cierre IS NULL OR c.fecha_cierre >= CURDATE())
        AND (c.fecha_apertura IS NULL OR c.fecha_apertura <= CURDATE())
      ORDER BY c.fecha_cierre ASC
    `;
    const [rows] = await pool.query(sql);
    return rows;
  },

  /**
   * Obtener detalle completo de una convocatoria por ID
   */
  async obtenerPorId(id) {
    const sql = `
      SELECT c.*, COALESCE(c.codigo, CONCAT('CON', c.id)) as codigo_con,
             u.nombre_completo as creado_por_nombre,
             DATEDIFF(c.fecha_cierre, CURDATE()) as dias_restantes
      FROM convocatorias c
      LEFT JOIN usuarios u ON u.id = c.creado_por
      WHERE c.id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows.length > 0 ? rows[0] : null;
  },

  // ─── RF-CON-01: Registro y Publicación ─────────────────────────────────────

  /**
   * Registrar nueva convocatoria (por defecto en borrador o el estado provisto)
   */
  async crear({ titulo, tipo, tipo_investigacion, dirigida_a, descripcion, fecha_apertura, fecha_cierre, rubro_disponible, requisitos, plantilla_base_url, creado_por, estado }) {
    const estadoFinal = estado || "borrador";
    let codigo = null;
    const tipoInvLimpio = tipo_investigacion ? tipo_investigacion.trim() : null;

    if (tipo === "Externa") {
      const anio = fecha_apertura ? new Date(fecha_apertura).getFullYear() : new Date().getFullYear();
      codigo = await this.generarCodigoConvocatoriaExterna(tipoInvLimpio, anio);
    }

    const sql = `
      INSERT INTO convocatorias (
        codigo, tipo_investigacion, titulo, tipo, dirigida_a, descripcion, fecha_apertura, fecha_cierre, rubro_disponible,
        estado, requisitos, plantilla_base_url, creado_por, aprobada_comite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `;
    const [result] = await pool.query(sql, [
      codigo,
      tipoInvLimpio,
      titulo,
      tipo || null,
      dirigida_a || null,
      descripcion || null,
      fecha_apertura || null,
      fecha_cierre || null,
      rubro_disponible || 0,
      estadoFinal,
      requisitos || null,
      plantilla_base_url || null,
      creado_por || null,
    ]);

    return this.obtenerPorId(result.insertId);
  },

  /**
   * Actualizar convocatoria existente
   * Nota: El código asignado es inmutable y no se modifica.
   */
  async actualizar(id, data) {
    const fields = [];
    const params = [];

    const allowed = [
      "titulo", "tipo", "tipo_investigacion", "dirigida_a", "descripcion", "fecha_apertura", "fecha_cierre",
      "estado", "requisitos", "plantilla_base_url"
    ];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return this.obtenerPorId(id);

    params.push(id);
    await pool.query(`UPDATE convocatorias SET ${fields.join(", ")} WHERE id = ?`, params);
    return this.obtenerPorId(id);
  },

  /**
   * RF-CON-01: Publicar convocatoria
   */
  async publicar(id) {
    const convocatoria = await this.obtenerPorId(id);
    if (!convocatoria) return null;

    await pool.query(
      "UPDATE convocatorias SET estado = 'publicada' WHERE id = ?",
      [id]
    );
    return this.obtenerPorId(id);
  },

  /**
   * Eliminar convocatoria (solo si está en borrador u objetada)
   */
  async eliminar(id) {
    const convocatoria = await this.obtenerPorId(id);
    if (!convocatoria) return { notFound: true };

    const [res] = await pool.query("DELETE FROM convocatorias WHERE id = ?", [id]);
    return { ok: res.affectedRows > 0 };
  },

  // ─── RF-CON-03: Alertas de Fechas ─────────────────────────────────────────

  /**
   * Obtener alertas de convocatorias próximas a vencer, por abrir y vencidas
   */
  async obtenerAlertas() {
    // 1. Convocatorias activas que cierran en 7 días o menos
    const [proximasACerrar] = await pool.query(`
      SELECT id, titulo, tipo, fecha_apertura, fecha_cierre,
             rubro_disponible, estado,
             DATEDIFF(fecha_cierre, CURDATE()) as dias_restantes
      FROM convocatorias
      WHERE (estado = 'publicada' OR estado = 'activa')
        AND fecha_cierre >= CURDATE()
        AND DATEDIFF(fecha_cierre, CURDATE()) <= 7
      ORDER BY dias_restantes ASC
    `);

    // 2. Convocatorias programadas para abrir próximamente (fecha_apertura futura)
    const [proximasAAbrir] = await pool.query(`
      SELECT id, titulo, tipo, fecha_apertura, fecha_cierre, estado,
             DATEDIFF(fecha_apertura, CURDATE()) as dias_para_apertura
      FROM convocatorias
      WHERE fecha_apertura > CURDATE()
      ORDER BY fecha_apertura ASC
    `);

    // 3. Convocatorias que ya pasaron su fecha de cierre pero siguen marcadas activas/publicadas
    const [vencidasSinCerrar] = await pool.query(`
      SELECT id, titulo, fecha_cierre, estado,
             ABS(DATEDIFF(CURDATE(), fecha_cierre)) as dias_vencida
      FROM convocatorias
      WHERE (estado = 'publicada' OR estado = 'activa')
        AND fecha_cierre < CURDATE()
      ORDER BY fecha_cierre DESC
    `);

    return {
      resumen: {
        proximas_a_cerrar_total: proximasACerrar.length,
        criticas_3_dias: proximasACerrar.filter(c => c.dias_restantes <= 3).length,
        proximas_a_abrir_total: proximasAAbrir.length,
        vencidas_pendientes_cierre: vencidasSinCerrar.length,
      },
      proximas_a_cerrar: proximasACerrar.map(c => ({
        ...c,
        nivel_alerta: c.dias_restantes <= 3 ? "critica" : "advertencia",
        mensaje: c.dias_restantes === 0
          ? "Cierra hoy"
          : c.dias_restantes === 1
          ? "Cierra mañana"
          : `Quedan ${c.dias_restantes} días para el cierre`,
      })),
      proximas_a_abrir: proximasAAbrir,
      vencidas_pendientes_cierre: vencidasSinCerrar,
    };
  },

  // ─── RF-CON-04: Banco de Convocatorias Externas ───────────────────────────

  /**
   * Listar repositorio de convocatorias externas
   */
  async listarExternas({ q }) {
    let sql = `
      SELECT id, codigo, tipo_investigacion, COALESCE(codigo, CONCAT('EXT', id)) as codigo_ext,
             titulo, entidad_externa, fecha_apertura, fecha_cierre, descripcion,
             DATEDIFF(fecha_cierre, CURDATE()) as dias_restantes,
             CASE
               WHEN fecha_cierre IS NULL THEN 'indefinida'
               WHEN fecha_cierre < CURDATE() THEN 'cerrada'
               ELSE 'vigente'
             END as estado_vigencia
      FROM convocatoria_externa
      WHERE 1=1
    `;
    const params = [];

    if (q) {
      sql += " AND (titulo LIKE ? OR entidad_externa LIKE ? OR descripcion LIKE ? OR codigo LIKE ?)";
      params.push(`%${q}%`, `%${q}%`, `%${q}%`, `%${q}%`);
    }

    sql += " ORDER BY fecha_cierre DESC, id DESC";
    const [rows] = await pool.query(sql, params);
    return rows;
  },

  async obtenerExternaPorId(id) {
    const [rows] = await pool.query(
      "SELECT * FROM convocatoria_externa WHERE id = ?",
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  async crearExterna({ titulo, entidad_externa, tipo_investigacion, fecha_apertura, fecha_cierre, descripcion }) {
    const tipoInvLimpio = tipo_investigacion ? tipo_investigacion.trim() : null;
    const anio = fecha_apertura ? new Date(fecha_apertura).getFullYear() : new Date().getFullYear();
    const codigo = await this.generarCodigoConvocatoriaExterna(tipoInvLimpio, anio);

    const sql = `
      INSERT INTO convocatoria_externa (codigo, tipo_investigacion, titulo, entidad_externa, fecha_apertura, fecha_cierre, descripcion)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    const [result] = await pool.query(sql, [
      codigo,
      tipoInvLimpio,
      titulo,
      entidad_externa || null,
      fecha_apertura || null,
      fecha_cierre || null,
      descripcion || null,
    ]);
    return this.obtenerExternaPorId(result.insertId);
  },

  async actualizarExterna(id, data) {
    const fields = [];
    const params = [];
    const allowed = ["titulo", "entidad_externa", "tipo_investigacion", "fecha_apertura", "fecha_cierre", "descripcion"];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        fields.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (fields.length === 0) return this.obtenerExternaPorId(id);

    params.push(id);
    await pool.query(`UPDATE convocatoria_externa SET ${fields.join(", ")} WHERE id = ?`, params);
    return this.obtenerExternaPorId(id);
  },

  async eliminarExterna(id) {
    const [res] = await pool.query("DELETE FROM convocatoria_externa WHERE id = ?", [id]);
    return { ok: res.affectedRows > 0 };
  },

  // ─── RF-CON-05: Comité de Asignación y Objeción ───────────────────────────

  /**
   * Aprobar convocatoria por parte del comité
   */
  async aprobarComite(id, { fecha_aprobacion } = {}) {
    const fecha = fecha_aprobacion || new Date().toISOString().slice(0, 10);
    const sql = `
      UPDATE convocatorias
      SET aprobada_comite = 1,
          fecha_aprobacion = ?,
          estado = CASE WHEN estado IN ('borrador', 'objetada') THEN 'publicada' ELSE estado END,
          observaciones_comite = NULL
      WHERE id = ?
    `;
    await pool.query(sql, [fecha, id]);
    return this.obtenerPorId(id);
  },

  /**
   * Objetar convocatoria con observaciones
   */
  async objetarComite(id, { observaciones }) {
    const sql = `
      UPDATE convocatorias
      SET aprobada_comite = 0,
          estado = 'objetada',
          observaciones_comite = ?
      WHERE id = ?
    `;
    await pool.query(sql, [observaciones || "Objeción sin observaciones detalladas", id]);
    return this.obtenerPorId(id);
  },

  // ─── Inscripciones a Convocatorias ──────────────────────────────────────────

  /**
   * Verificar si el usuario ya está inscrito en la convocatoria
   */
  async verificarInscripcionExistente(convocatoria_id, usuario_id) {
    const [rows] = await pool.query(
      `SELECT id, convocatoria_id, usuario_id, tipo_investigacion, fecha_inscripcion, estado 
       FROM convocatoria_inscripciones 
       WHERE convocatoria_id = ? AND usuario_id = ?`,
      [convocatoria_id, usuario_id]
    );
    if (rows.length === 0) return null;

    try {
      const [docs] = await pool.query(
        `SELECT * FROM convocatoria_inscripcion_documentos WHERE inscripcion_id = ? ORDER BY id ASC`,
        [rows[0].id]
      );
      rows[0].documentos_adjuntos = docs;
    } catch (e) {
      rows[0].documentos_adjuntos = [];
    }

    return rows[0];
  },

  /**
   * Registrar una nueva inscripción y respaldar los documentos
   */
  async registrarInscripcion({
    convocatoria_id,
    usuario_id,
    tipo_investigacion,
    resumen_proyecto,
    justificacion,
    documento_nombre_original,
    documento_ruta,
    documento_mime,
    documento_peso_bytes,
    documentos_adjuntos = [],
  }) {
    // 1. Insertar en convocatoria_inscripciones
    const sqlInscripcion = `
      INSERT INTO convocatoria_inscripciones 
        (convocatoria_id, usuario_id, tipo_investigacion, resumen_proyecto, justificacion, 
         documento_nombre_original, documento_ruta, documento_mime, documento_peso_bytes, estado)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'registrada')
    `;
    const [resInscripcion] = await pool.query(sqlInscripcion, [
      convocatoria_id,
      usuario_id,
      tipo_investigacion || null,
      resumen_proyecto,
      justificacion,
      documento_nombre_original,
      documento_ruta,
      documento_mime,
      documento_peso_bytes,
    ]);

    const inscripcionId = resInscripcion.insertId;

    // 2. Insertar cada documento en convocatoria_inscripcion_documentos y tabla institucional documentos
    const docsAInsertar =
      documentos_adjuntos.length > 0
        ? documentos_adjuntos
        : [
            {
              requisito_nombre: "Propuesta de investigación",
              documento_nombre_original,
              documento_ruta,
              documento_mime,
              documento_peso_bytes,
            },
          ];

    for (const doc of docsAInsertar) {
      try {
        await pool.query(
          `INSERT INTO convocatoria_inscripcion_documentos
            (inscripcion_id, requisito_nombre, documento_nombre_original, documento_ruta, documento_mime, documento_peso_bytes)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            inscripcionId,
            doc.requisito_nombre,
            doc.documento_nombre_original,
            doc.documento_ruta,
            doc.documento_mime,
            doc.documento_peso_bytes,
          ]
        );
      } catch (err) {
        console.warn("Aviso al guardar documento individual de inscripción:", err.message);
      }

      try {
        await pool.query(
          `INSERT INTO documentos 
            (convocatoria_id, nombre, tipo, url, version, fecha_creacion, subido_por)
           VALUES (?, ?, ?, ?, 1, CURDATE(), ?)`,
          [
            convocatoria_id,
            doc.documento_nombre_original,
            doc.documento_mime,
            doc.documento_ruta,
            usuario_id,
          ]
        );
      } catch (docErr) {
        console.warn("Aviso al registrar en documentos institucional:", docErr.message);
      }
    }

    // 3. Retornar la inscripción recién creada con datos enriquecidos y documentos adjuntos
    const [rows] = await pool.query(
      `SELECT ci.*, u.nombre_completo as usuario_nombre, u.correo_institucional as usuario_correo,
              c.titulo as convocatoria_titulo
       FROM convocatoria_inscripciones ci
       JOIN usuarios u ON u.id = ci.usuario_id
       JOIN convocatorias c ON c.id = ci.convocatoria_id
       WHERE ci.id = ?`,
      [inscripcionId]
    );

    try {
      const [docsGuardados] = await pool.query(
        `SELECT * FROM convocatoria_inscripcion_documentos WHERE inscripcion_id = ? ORDER BY id ASC`,
        [inscripcionId]
      );
      rows[0].documentos_adjuntos = docsGuardados;
    } catch (e) {
      rows[0].documentos_adjuntos = docsAInsertar;
    }

    return rows[0];
  },

  /**
   * Listar todas las inscripciones registradas para una convocatoria con sus documentos
   */
  async listarInscripciones(convocatoria_id) {
    const [rows] = await pool.query(
      `SELECT ci.*, u.nombre_completo as usuario_nombre, u.correo_institucional as usuario_correo
       FROM convocatoria_inscripciones ci
       JOIN usuarios u ON u.id = ci.usuario_id
       WHERE ci.convocatoria_id = ?
       ORDER BY ci.fecha_inscripcion DESC`,
      [convocatoria_id]
    );

    if (rows.length > 0) {
      try {
        const ids = rows.map((r) => r.id);
        const [docs] = await pool.query(
          `SELECT * FROM convocatoria_inscripcion_documentos WHERE inscripcion_id IN (?) ORDER BY id ASC`,
          [ids]
        );
        const docsMap = {};
        for (const doc of docs) {
          if (!docsMap[doc.inscripcion_id]) docsMap[doc.inscripcion_id] = [];
          docsMap[doc.inscripcion_id].push(doc);
        }
        for (const row of rows) {
          row.documentos_adjuntos = docsMap[row.id] || [];
        }
      } catch (e) {
        console.warn("Aviso al cargar documentos de inscripciones:", e.message);
        for (const row of rows) {
          row.documentos_adjuntos = [];
        }
      }
    }

    return rows;
  },
};

module.exports = convocatoriasService;
