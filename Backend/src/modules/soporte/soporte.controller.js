const pool = require('../../db/connection');
const { enviarCorreo } = require('../../shared/mailer');

exports.crearReporte = async (req, res) => {
  try {
    const { categoria, asunto, descripcion } = req.body;
    const validCategorias = ['error_tecnico', 'duda_uso', 'solicitud_acceso', 'otro'];
    
    if (!validCategorias.includes(categoria)) {
      return res.status(400).json({ error: 'Categoría no válida' });
    }
    if (!asunto || !descripcion) {
      return res.status(400).json({ error: 'Asunto y descripción son requeridos' });
    }

    const [result] = await pool.query(
      `INSERT INTO reportes_soporte (usuario_id, categoria, asunto, descripcion, estado)
       VALUES (?, ?, ?, ?, 'pendiente')`,
      [req.usuario.id, categoria, asunto, descripcion]
    );

    try {
      const [[user]] = await pool.query('SELECT nombre_completo, correo_institucional FROM usuarios WHERE id = ?', [req.usuario.id]);
      
      const cuerpo = `
        <h3>Nuevo Reporte de Soporte (#${result.insertId})</h3>
        <p><strong>Usuario:</strong> ${user.nombre_completo} (${user.correo_institucional})</p>
        <p><strong>Categoría:</strong> ${categoria}</p>
        <p><strong>Asunto:</strong> ${asunto}</p>
        <p><strong>Descripción:</strong></p>
        <p>${descripcion}</p>
      `;

      enviarCorreo({
        destinatarios: ['practicante.inv1@unicatolicadelsur.edu.co'],
        asunto: `[Soporte NOUS] ${asunto}`,
        cuerpo,
        tipo: 'alerta_soporte'
      }).catch(err => console.error('Error enviando correo de soporte:', err));
    } catch (mailErr) {
      console.error('Error preparando correo de soporte:', mailErr);
    }

    res.status(201).json({ ok: true, id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getMisReportes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT * FROM reportes_soporte 
       WHERE usuario_id = ? 
       ORDER BY fecha_creacion DESC`,
      [req.usuario.id]
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getAllReportes = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT rs.*, u.nombre_completo as usuario_nombre, u.correo_institucional as usuario_correo
       FROM reportes_soporte rs
       JOIN usuarios u ON rs.usuario_id = u.id
       WHERE rs.estado != 'resuelto'
       ORDER BY rs.fecha_creacion DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateEstado = async (req, res) => {
  try {
    const { estado } = req.body;
    const { id } = req.params;
    const validEstados = ['pendiente', 'en_revision', 'resuelto'];
    
    if (!validEstados.includes(estado)) {
      return res.status(400).json({ error: 'Estado no válido' });
    }

    await pool.query(
      `UPDATE reportes_soporte SET estado = ? WHERE id = ?`,
      [estado, id]
    );

    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
