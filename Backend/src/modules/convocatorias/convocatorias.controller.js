const pool = require('../../db/connection');

// GET /api/convocatorias
exports.getConvocatorias = async (req, res) => {
  try {
    const { estado } = req.query;

    let sql = `
      SELECT
        c.id,
        c.titulo              AS nombre,
        c.tipo,
        c.estado,
        c.requisitos          AS descripcion,
        DATE_FORMAT(c.fecha_apertura, '%d %b %Y') AS apertura,
        DATE_FORMAT(c.fecha_cierre,   '%d %b %Y') AS cierre,
        CONCAT('$', FORMAT(c.rubro_disponible / 1000000, 0), 'M') AS presupuesto,
        (SELECT COUNT(*) FROM proyectos p WHERE p.convocatoria_id = c.id)          AS inscritos,
        (SELECT COUNT(DISTINCT ce.evaluado_por) FROM comite_evaluacion ce JOIN proyectos p ON p.id = ce.proyecto_id WHERE p.convocatoria_id = c.id) AS evaluadores
      FROM convocatorias c
      WHERE 1=1
    `;

    const params = [];
    if (estado) {
      sql += ' AND c.estado = ?';
      params.push(estado);
    }

    sql += ' ORDER BY c.fecha_cierre DESC';

    const [rows] = await pool.query(sql, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/convocatorias/:id
exports.getConvocatoriaById = async (req, res) => {
  try {
    const { id } = req.params;

    const [[conv]] = await pool.query(`
      SELECT
        c.id,
        c.titulo    AS nombre,
        c.tipo,
        c.estado,
        c.requisitos AS descripcion,
        DATE_FORMAT(c.fecha_apertura,  '%d %b %Y') AS apertura,
        DATE_FORMAT(c.fecha_cierre,    '%d %b %Y') AS cierre,
        CONCAT('$', FORMAT(c.rubro_disponible / 1000000, 0), 'M') AS presupuesto,
        c.aprobada_comite,
        DATE_FORMAT(c.fecha_aprobacion,'%d %b %Y') AS fecha_aprobacion
      FROM convocatorias c
      WHERE c.id = ?
    `, [id]);

    if (!conv) return res.status(404).json({ error: 'Convocatoria no encontrada' });

    const [proyectos] = await pool.query(`
      SELECT
        p.codigo_unico AS codigo,
        p.titulo,
        u.nombre_completo AS investigador,
        p.estado
      FROM proyectos p
      JOIN usuarios u ON u.id = p.investigador_principal_id
      WHERE p.convocatoria_id = ?
    `, [id]);

    res.json({ ...conv, proyectos });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
