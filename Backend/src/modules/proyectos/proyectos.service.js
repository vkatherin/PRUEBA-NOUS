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
      p.id, p.titulo, p.codigo_unico, p.tipo_proyecto, p.estado,
      p.fecha_inicio, p.duracion_meses, p.valor_total,
      p.fecha_creacion,
      u.nombre_completo  AS investigador_principal,
      u.id               AS investigador_principal_id,
      c.titulo           AS convocatoria,
      c.id               AS convocatoria_id,
      l.nombre           AS linea_investigacion,
      prog.nombre        AS programa,
      prog.facultad      AS facultad
    FROM proyectos p
    LEFT JOIN usuarios              u    ON u.id = p.investigador_principal_id
    LEFT JOIN convocatorias         c    ON c.id = p.convocatoria_id
    LEFT JOIN lineas_investigacion  l    ON l.id = p.linea_investigacion_id
    LEFT JOIN programas_academicos  prog ON prog.id = p.programa_id
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
      u.nombre_completo      AS investigador_principal,
      u.correo_institucional AS investigador_correo,
      c.titulo               AS convocatoria,
      l.nombre               AS linea_investigacion,
      prog.nombre            AS programa,
      prog.facultad          AS facultad,
      d.resumen_ejecutivo,
      d.objetivo_general,
      d.objetivos_especificos
    FROM proyectos p
    LEFT JOIN usuarios              u    ON u.id = p.investigador_principal_id
    LEFT JOIN convocatorias         c    ON c.id = p.convocatoria_id
    LEFT JOIN lineas_investigacion  l    ON l.id = p.linea_investigacion_id
    LEFT JOIN programas_academicos  prog ON prog.id = p.programa_id
    LEFT JOIN proyecto_descripcion  d    ON d.proyecto_id = p.id
    WHERE p.id = ?
  `, [id]);

  return proyecto || null;
}

// ─── Crear proyecto ───────────────────────────────────────────────────────────
async function crearProyecto(data) {
  const {
    titulo, codigo_unico, tipo_proyecto = "Investigación",
    fecha_inicio, duracion_meses, valor_total,
    investigador_principal_id, convocatoria_id,
    linea_investigacion_id, programa_id, lugar_ejecucion,
    descripcion, objetivos
  } = data;

  const [result] = await pool.query(`
    INSERT INTO proyectos
      (titulo, codigo_unico, tipo_proyecto, estado, fecha_inicio,
       duracion_meses, valor_total, investigador_principal_id,
       convocatoria_id, linea_investigacion_id, programa_id,
       lugar_ejecucion, fecha_creacion)
    VALUES (?, ?, ?, 'propuesta', ?, ?, ?, ?, ?, ?, ?, ?, NOW())
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
  ]);

  const insertId = result.insertId;

  if (descripcion || objetivos) {
    await pool.query(`
      INSERT INTO proyecto_descripcion
        (proyecto_id, resumen_ejecutivo, objetivo_general)
      VALUES (?, ?, ?)
    `, [insertId, descripcion || null, objetivos || null]);
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

  if (data.descripcion !== undefined || data.objetivos !== undefined) {
    const [[descExists]] = await pool.query("SELECT proyecto_id FROM proyecto_descripcion WHERE proyecto_id = ?", [id]);
    if (descExists) {
      await pool.query(`
        UPDATE proyecto_descripcion
        SET resumen_ejecutivo = COALESCE(?, resumen_ejecutivo),
            objetivo_general  = COALESCE(?, objetivo_general)
        WHERE proyecto_id = ?
      `, [data.descripcion || null, data.objetivos || null, id]);
    } else {
      await pool.query(`
        INSERT INTO proyecto_descripcion (proyecto_id, resumen_ejecutivo, objetivo_general)
        VALUES (?, ?, ?)
      `, [id, data.descripcion || null, data.objetivos || null]);
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

module.exports = {
  listarProyectos,
  obtenerProyecto,
  crearProyecto,
  actualizarProyecto,
  cambiarEstado,
  eliminarProyecto,
  obtenerEquipo,
  obtenerAvance,
};
