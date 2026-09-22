const pool = require("../../db/connection");

// ─── Lista de proyectos con filtros ──────────────────────────────────────────
async function listarProyectos({ estado, tipo, q, convocatoria_id, usuario } = {}) {
  let where = ["1=1"];
  const params = [];

  if (usuario) {
    const roles = usuario.roles || [];
    const veTodos = ['administrador', 'directivos', 'director_investigacion'].some(r => roles.includes(r));
    if (!veTodos) {
      if (roles.includes('lider_investigacion') || roles.includes('docente')) {
        where.push("(p.investigador_principal_id = ? OR p.id IN (SELECT proyecto_id FROM proyecto_equipo WHERE usuario_id = ?))");
        params.push(usuario.id, usuario.id);
      } else {
        where.push("1=0"); // Falla de seguridad o rol inesperado sin acceso global ni local
      }
    }
  }

  if (estado) { where.push("p.estado = ?"); params.push(estado); }
  if (tipo)   { where.push("p.tipo_proyecto = ?"); params.push(tipo); }
  if (q)      { where.push("(p.titulo LIKE ? OR p.codigo_unico LIKE ?)"); params.push(`%${q}%`, `%${q}%`); }
  if (convocatoria_id) { where.push("p.convocatoria_id = ?"); params.push(convocatoria_id); }

  const [rows] = await pool.query(`
    SELECT
      p.id,
      p.codigo_unico       AS id_display,
      p.titulo             AS nombre,
      p.tipo_proyecto       AS tipo,
      p.estado,
      p.fecha_inicio        AS inicio,
      DATE_ADD(p.fecha_inicio, INTERVAL p.duracion_meses MONTH) AS fin,
      CONCAT('$', FORMAT(p.valor_total / 1000000, 2), 'M') AS presupuesto,
      u.nombre_completo      AS lider,
      u.id                   AS investigador_principal_id,
      COALESCE(g.nombre, 'Sin grupo asignado') AS grupo,
      prog.facultad,
      0 AS avance
    FROM proyectos p
    LEFT JOIN usuarios              u    ON u.id = p.investigador_principal_id
    LEFT JOIN convocatorias         c    ON c.id = p.convocatoria_id
    LEFT JOIN lineas_investigacion  l    ON l.id = p.linea_investigacion_id
    LEFT JOIN programas_academicos  prog ON prog.id = p.programa_id
    LEFT JOIN proyecto_grupo        pg   ON pg.proyecto_id = p.id
    LEFT JOIN grupos_investigacion  g    ON g.id = pg.grupo_id
    WHERE ${where.join(" AND ")}
    ORDER BY p.fecha_creacion DESC
  `, params);

  return rows;
}

// ─── Detalle de un proyecto ───────────────────────────────────────────────────
async function obtenerProyecto(id) {
  const [[proyecto]] = await pool.query(`
    SELECT
      p.*,
      p.codigo_unico         AS id_display,
      p.titulo               AS nombre,
      p.tipo_proyecto        AS tipo,
      p.fecha_inicio         AS inicio,
      DATE_ADD(p.fecha_inicio, INTERVAL p.duracion_meses MONTH) AS fin,
      CONCAT('$', FORMAT(p.valor_total / 1000000, 2), 'M') AS presupuesto,
      u.nombre_completo      AS lider,
      u.nombre_completo      AS investigador_principal,
      u.correo_institucional AS investigador_correo,
      COALESCE(g.nombre, 'Sin grupo asignado') AS grupo,
      c.titulo               AS convocatoria,
      l.nombre               AS linea_investigacion,
      prog.nombre            AS programa,
      prog.facultad          AS facultad,
      0                      AS avance,
      d.*
    FROM proyectos p
    LEFT JOIN usuarios              u    ON u.id = p.investigador_principal_id
    LEFT JOIN convocatorias         c    ON c.id = p.convocatoria_id
    LEFT JOIN lineas_investigacion  l    ON l.id = p.linea_investigacion_id
    LEFT JOIN programas_academicos  prog ON prog.id = p.programa_id
    LEFT JOIN proyecto_grupo        pg   ON pg.proyecto_id = p.id
    LEFT JOIN grupos_investigacion  g    ON g.id = pg.grupo_id
    LEFT JOIN proyecto_descripcion  d    ON d.proyecto_id = p.id
    WHERE p.id = ?
  `, [id]);

  if (!proyecto) return null;

  // Arrays adicionales
  proyecto.equipo = [];
  proyecto.cronograma = [];
  proyecto.productos = [];
  proyecto.rubros = []; // TODO: Falta tabla específica de presupuesto_proyecto en la BD
  proyecto.riesgos = [];

  try {
    const [equipoRows] = await pool.query(`
      SELECT
        u.nombre_completo AS nombre,
        pe.rol_en_proyecto AS rol,
        '100%' AS dedicacion,
        pe.entidad AS vinculacion
      FROM proyecto_equipo pe
      JOIN usuarios u ON u.id = pe.usuario_id
      WHERE pe.proyecto_id = ?
    `, [id]);
    proyecto.equipo = equipoRows;
  } catch (err) { console.warn("Error cargando equipo para proyecto", id, err.message); }

  try {
    const [cronoRows] = await pool.query(`
      SELECT
        pc.actividad AS nombre,
        u.nombre_completo AS responsable,
        pc.fecha_inicio AS inicio,
        pc.fecha_fin AS fin,
        0 AS avance,
        'Planeado' AS estado
      FROM proyecto_cronograma pc
      LEFT JOIN usuarios u ON u.id = pc.responsable_id
      WHERE pc.proyecto_id = ?
      ORDER BY pc.fecha_inicio
    `, [id]);
    proyecto.cronograma = cronoRows;
  } catch (err) { console.warn("Error cargando cronograma para proyecto", id, err.message); }

  try {
    const [prodRows] = await pool.query(`
      SELECT
        'Producto' AS tipo,
        descripcion AS titulo,
        estado,
        fecha_entrega AS fecha
      FROM proyecto_productos
      WHERE proyecto_id = ?
    `, [id]);
    proyecto.productos = prodRows;
  } catch (err) { console.warn("Error cargando productos para proyecto", id, err.message); }

  try {
    const [riesgosRows] = await pool.query(`
      SELECT
        nombre_riesgo AS descripcion,
        'Media' AS probabilidad,
        'Medio' AS impacto,
        manejo_previsto AS mitigacion
      FROM proyecto_riesgos
      WHERE proyecto_id = ?
    `, [id]);
    proyecto.riesgos = riesgosRows;
  } catch (err) { console.warn("Error cargando riesgos para proyecto", id, err.message); }

  try {
    const [[met]] = await pool.query(
      "SELECT * FROM proyecto_metodologia WHERE proyecto_id = ?", [id]
    );
    proyecto.metodologia = met || null;
  } catch (err) { console.warn("Error cargando metodología para proyecto", id, err.message); proyecto.metodologia = null; }

  return proyecto;
}

// ─── Crear proyecto ───────────────────────────────────────────────────────────
async function crearProyecto(data) {
  let datosHeredados = {};
  if (data.inscripcion_id) {
    const [[inscripcion]] = await pool.query(`
      SELECT usuario_id, convocatoria_id, tipo_investigacion,
             resumen_proyecto, justificacion
      FROM convocatoria_inscripciones WHERE id = ?
    `, [data.inscripcion_id]);

    if (inscripcion) {
      datosHeredados = {
        investigador_principal_id: data.investigador_principal_id || inscripcion.usuario_id,
        convocatoria_id: data.convocatoria_id || inscripcion.convocatoria_id,
        descripcion: data.descripcion || inscripcion.resumen_proyecto,
      };
    }
  }

  const finalData = { ...datosHeredados, ...data };

  const {
    titulo, codigo_unico, tipo_proyecto = "Investigación",
    fecha_inicio, duracion_meses, valor_total,
    investigador_principal_id, convocatoria_id,
    linea_investigacion_id, programa_id, lugar_ejecucion,
    descripcion, objetivos, inscripcion_id
  } = finalData;

  const [result] = await pool.query(`
    INSERT INTO proyectos
      (titulo, codigo_unico, tipo_proyecto, estado, fecha_inicio,
       duracion_meses, valor_total, investigador_principal_id,
       convocatoria_id, linea_investigacion_id, programa_id,
       lugar_ejecucion, fecha_creacion, inscripcion_id)
    VALUES (?, ?, ?, 'propuesta', ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
  `, [
    titulo,
    codigo_unico || `PRY-${Date.now().toString().slice(-6)}`,
    tipo_proyecto,
    fecha_inicio || null,
    duracion_meses || 12,
    valor_total || 0,
    investigador_principal_id || null,
    convocatoria_id || null,
    linea_investigacion_id || null,
    programa_id || null,
    lugar_ejecucion || null,
    inscripcion_id || null,
  ]);

  const insertId = result.insertId;

  const CAMPOS_DESCRIPCION = [
    'palabras_clave', 'resumen_ejecutivo', 'justificacion', 'pertinencia',
    'contexto', 'estado_arte', 'planteamiento_problema',
    'pregunta_investigacion', 'marco_teorico', 'objetivo_general',
    'objetivos_especificos', 'consideraciones_eticas_bioeticas',
    'conocimiento_generado', 'aporte_social', 'bibliografia'
  ];

  const hayCamposDesc = CAMPOS_DESCRIPCION.some(k => finalData[k] !== undefined) || descripcion || objetivos;
  if (hayCamposDesc) {
    const insCols = ['proyecto_id'];
    const insVals = [insertId];
    const qMarks = ['?'];
    
    // Map backwards compatibility for 'descripcion' -> 'resumen_ejecutivo' and 'objetivos' -> 'objetivo_general'
    if (descripcion && finalData.resumen_ejecutivo === undefined) finalData.resumen_ejecutivo = descripcion;
    if (objetivos && finalData.objetivo_general === undefined) finalData.objetivo_general = objetivos;

    for (const k of CAMPOS_DESCRIPCION) {
      if (finalData[k] !== undefined) {
        insCols.push(k);
        insVals.push(finalData[k]);
        qMarks.push('?');
      }
    }
    
    await pool.query(`
      INSERT INTO proyecto_descripcion (${insCols.join(", ")})
      VALUES (${qMarks.join(", ")})
    `, insVals);
  }

  if (inscripcion_id) {
    const [docs] = await pool.query(
      `SELECT documento_nombre_original, documento_ruta, documento_mime
       FROM convocatoria_inscripcion_documentos WHERE inscripcion_id = ?`,
      [inscripcion_id]
    );
    for (const doc of docs) {
      await pool.query(`
        INSERT INTO documentos (proyecto_id, nombre, tipo, url, subido_por, fecha_creacion)
        VALUES (?, ?, ?, ?, ?, NOW())
      `, [insertId, doc.documento_nombre_original, doc.documento_mime, doc.documento_ruta, finalData.investigador_principal_id || null]);
    }
  }

  return obtenerProyecto(insertId);
}

// ─── Actualizar proyecto ──────────────────────────────────────────────────────
async function actualizarProyecto(id, data) {
  const campos = [];
  const params = [];

  const permitidos = [
    "titulo", "tipo_proyecto", "fecha_inicio", "duracion_meses",
    "valor_total", "linea_investigacion_id", "programa_id",
    "lugar_ejecucion", "investigador_principal_id", "convocatoria_id"
  ];

  for (const key of permitidos) {
    if (data[key] !== undefined) {
      campos.push(`${key} = ?`);
      params.push(data[key]);
    }
  }

  if (campos.length > 0) {
    params.push(id);
    await pool.query(`UPDATE proyectos SET ${campos.join(", ")} WHERE id = ?`, params);
  }

  const CAMPOS_DESCRIPCION = [
    'palabras_clave', 'resumen_ejecutivo', 'justificacion', 'pertinencia',
    'contexto', 'estado_arte', 'planteamiento_problema',
    'pregunta_investigacion', 'marco_teorico', 'objetivo_general',
    'objetivos_especificos', 'consideraciones_eticas_bioeticas',
    'conocimiento_generado', 'aporte_social', 'bibliografia'
  ];

  const hayCamposDesc = CAMPOS_DESCRIPCION.some(k => data[k] !== undefined);
  if (hayCamposDesc) {
    const [[descExists]] = await pool.query("SELECT proyecto_id FROM proyecto_descripcion WHERE proyecto_id = ?", [id]);
    
    if (descExists) {
      const setClauses = [];
      const setParams = [];
      for (const k of CAMPOS_DESCRIPCION) {
        if (data[k] !== undefined) {
          setClauses.push(`${k} = COALESCE(?, ${k})`);
          setParams.push(data[k]);
        }
      }
      setParams.push(id);
      
      await pool.query(`
        UPDATE proyecto_descripcion
        SET ${setClauses.join(", ")}
        WHERE proyecto_id = ?
      `, setParams);
    } else {
      const insCols = ['proyecto_id'];
      const insVals = [id];
      const qMarks = ['?'];
      for (const k of CAMPOS_DESCRIPCION) {
        if (data[k] !== undefined) {
          insCols.push(k);
          insVals.push(data[k]);
          qMarks.push('?');
        }
      }
      await pool.query(`
        INSERT INTO proyecto_descripcion (${insCols.join(", ")})
        VALUES (${qMarks.join(", ")})
      `, insVals);
    }
  }

  return obtenerProyecto(id);
}

// ─── Cambiar estado ───────────────────────────────────────────────────────────
async function cambiarEstado(id, estado) {
  const validos = ["propuesta", "en_evaluacion", "aprobado", "en_ejecucion", "finalizado", "rechazado", "cancelado", "activo", "borrador"];
  if (!validos.includes(estado)) throw new Error("Estado inválido: " + estado);

  await pool.query("UPDATE proyectos SET estado = ? WHERE id = ?", [estado, id]);
  const updated = await obtenerProyecto(id);
  
  try {
    if (updated && updated.investigador_principal_id) {
      const { enviarCorreo } = require('../../shared/mailer');
      const [[ownerInfo]] = await pool.query(
        `SELECT u.correo_institucional FROM usuarios u
         JOIN preferencias_notificacion p ON p.usuario_id = u.id
         WHERE u.id = ? AND u.activo = 1 AND p.notif_cambio_estado = 1`,
        [updated.investigador_principal_id]
      );
      if (ownerInfo) {
        await enviarCorreo({
          destinatarios: [ownerInfo.correo_institucional],
          asunto: 'Cambio de estado en tu proyecto: ' + updated.titulo,
          cuerpo: `<p>Tu proyecto <strong>${updated.titulo}</strong> ha cambiado de estado a: ${estado}.</p>`,
          tipo: 'CAMBIO_ESTADO_PROYECTO'
        });
      }
    }
  } catch(e) { console.error('Error notificando cambio de estado proyecto:', e); }

  return updated;
}

// ─── Eliminar proyecto ────────────────────────────────────────────────────────
async function eliminarProyecto(id) {
  const proyecto = await obtenerProyecto(id);
  if (!proyecto) throw new Error("Proyecto no encontrado");
  await pool.query("DELETE FROM proyecto_descripcion WHERE proyecto_id = ?", [id]);
  await pool.query("DELETE FROM proyecto_equipo WHERE proyecto_id = ?", [id]);
  await pool.query("DELETE FROM proyecto_cronograma WHERE proyecto_id = ?", [id]);
  await pool.query("DELETE FROM proyectos WHERE id = ?", [id]);
  return { eliminado: true, id };
}

// ─── Equipo del proyecto ──────────────────────────────────────────────────────
async function obtenerEquipo(id) {
  const [rows] = await pool.query(`
    SELECT
      pe.id, pe.rol_en_proyecto AS rol, pe.entidad,
      u.id AS usuario_id, u.nombre_completo, u.correo_institucional AS email
    FROM proyecto_equipo pe
    JOIN usuarios u ON u.id = pe.usuario_id
    WHERE pe.proyecto_id = ?
    ORDER BY pe.id
  `, [id]);
  return rows;
}

// ─── Actividades / avance ─────────────────────────────────────────────────────
async function obtenerAvance(id) {
  const [actividades] = await pool.query(`
    SELECT
      pc.id, pc.actividad AS nombre, pc.fecha_inicio, pc.fecha_fin,
      pc.indicador_resultado,
      u.nombre_completo AS responsable
    FROM proyecto_cronograma pc
    LEFT JOIN usuarios u ON u.id = pc.responsable_id
    WHERE pc.proyecto_id = ?
    ORDER BY pc.fecha_inicio
  `, [id]);

  return { actividades, avance_general: 0 };
}

// ─── Inscripciones Disponibles (Lectura) ───────────────────────────────────────
async function listarInscripcionesDisponibles() {
  const [rows] = await pool.query(`
    SELECT
      ci.id, ci.convocatoria_id, ci.usuario_id, ci.tipo_investigacion,
      ci.resumen_proyecto, ci.justificacion, ci.fecha_inscripcion,
      u.nombre_completo AS investigador_nombre,
      c.titulo AS convocatoria_titulo
    FROM convocatoria_inscripciones ci
    JOIN usuarios u ON u.id = ci.usuario_id
    JOIN convocatorias c ON c.id = ci.convocatoria_id
    LEFT JOIN proyectos p ON p.inscripcion_id = ci.id
    WHERE p.id IS NULL
    ORDER BY ci.fecha_inscripcion DESC
  `);
  return rows;
}

// ─── Actualizar metodología ───────────────────────────────────────────────────
async function actualizarMetodologia(proyectoId, data) {
  const { tipo_estudio, variables, etapas, fuentes_instrumentos } = data;
  const [[existe]] = await pool.query(
    "SELECT proyecto_id FROM proyecto_metodologia WHERE proyecto_id = ?",
    [proyectoId]
  );
  if (existe) {
    await pool.query(`
      UPDATE proyecto_metodologia
      SET tipo_estudio = COALESCE(?, tipo_estudio),
          variables = COALESCE(?, variables),
          etapas = COALESCE(?, etapas),
          fuentes_instrumentos = COALESCE(?, fuentes_instrumentos)
      WHERE proyecto_id = ?
    `, [tipo_estudio, variables, etapas, fuentes_instrumentos, proyectoId]);
  } else {
    await pool.query(`
      INSERT INTO proyecto_metodologia
        (proyecto_id, tipo_estudio, variables, etapas, fuentes_instrumentos)
      VALUES (?, ?, ?, ?, ?)
    `, [proyectoId, tipo_estudio || null, variables || null, etapas || null, fuentes_instrumentos || null]);
  }
  const [[metodologia]] = await pool.query(
    "SELECT * FROM proyecto_metodologia WHERE proyecto_id = ?",
    [proyectoId]
  );
  return metodologia;
}

module.exports = {
  listarProyectos,
  obtenerProyecto,
  crearProyecto,
  actualizarProyecto,
  cambiarEstado,
  eliminarProyecto,
  obtenerEquipo,
  obtenerAvance,
  listarInscripcionesDisponibles,
  actualizarMetodologia,
};
