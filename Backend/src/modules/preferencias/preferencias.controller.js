const pool = require('../../db/connection');

exports.getPreferencias = async (req, res) => {
  try {
    const [[preferencias]] = await pool.query(
      `SELECT * FROM preferencias_notificacion WHERE usuario_id = ?`,
      [req.usuario.id]
    );

    if (preferencias) {
      return res.json(preferencias);
    }

    // Si no existe, crear con defaults y retornar
    const defaults = {
      usuario_id: req.usuario.id,
      notif_convocatoria_nueva: true,
      notif_convocatoria_por_vencer: true,
      notif_evaluacion_asignada: true,
      notif_cambio_estado: true,
      notif_resumen_semanal: false,
      idioma: 'es'
    };

    await pool.query(
      `INSERT INTO preferencias_notificacion (
        usuario_id, notif_convocatoria_nueva, notif_convocatoria_por_vencer,
        notif_evaluacion_asignada, notif_cambio_estado, notif_resumen_semanal, idioma
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        defaults.usuario_id, defaults.notif_convocatoria_nueva, defaults.notif_convocatoria_por_vencer,
        defaults.notif_evaluacion_asignada, defaults.notif_cambio_estado, defaults.notif_resumen_semanal,
        defaults.idioma
      ]
    );

    res.json(defaults);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updatePreferencias = async (req, res) => {
  try {
    const fields = ['notif_convocatoria_nueva', 'notif_convocatoria_por_vencer', 'notif_evaluacion_asignada', 'notif_cambio_estado', 'notif_resumen_semanal', 'idioma'];
    let sets = [];
    let values = [];

    for (const field of fields) {
      if (req.body[field] !== undefined) {
        sets.push(`${field} = ?`);
        values.push(req.body[field]);
      }
    }

    if (sets.length === 0) {
      return res.status(400).json({ error: 'Ningún campo válido proporcionado' });
    }

    values.push(req.usuario.id);

    // Asegurar que exista primero
    const [[exists]] = await pool.query(`SELECT 1 FROM preferencias_notificacion WHERE usuario_id = ?`, [req.usuario.id]);
    if (!exists) {
      await pool.query(
        `INSERT INTO preferencias_notificacion (usuario_id) VALUES (?)`,
        [req.usuario.id]
      );
    }

    await pool.query(
      `UPDATE preferencias_notificacion SET ${sets.join(', ')} WHERE usuario_id = ?`,
      values
    );

    res.json({ mensaje: 'Preferencias actualizadas' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
