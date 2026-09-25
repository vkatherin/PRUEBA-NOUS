const cron = require('node-cron');
const pool = require('../db/connection');
const { enviarCorreo } = require('../shared/mailer');
const isPostgres = (process.env.DB_CLIENT || 'mysql').toLowerCase() === 'postgres';

// Ejecutar todos los días a las 8:00 AM
cron.schedule('0 8 * * *', async () => {
  try {
    console.log('⏰ Ejecutando job: Notificar vencimientos de convocatorias...');
    
    const [convocatorias] = await pool.query(`
      SELECT id, titulo, fecha_cierre 
      FROM convocatorias 
      WHERE estado IN ('publicada', 'activa') 
        AND ${isPostgres ? '(fecha_cierre - CURRENT_DATE) IN (0, 1, 3)' : 'DATEDIFF(fecha_cierre, CURDATE()) IN (0, 1, 3)'}
    `);

    for (const conv of convocatorias) {
      // Usuarios inscritos con notif_convocatoria_por_vencer = true
      const [users] = await pool.query(`
        SELECT DISTINCT u.correo_institucional, u.nombre_completo 
        FROM convocatoria_inscripciones ci
        JOIN usuarios u ON u.id = ci.usuario_id
        JOIN preferencias_notificacion p ON p.usuario_id = u.id
        WHERE ci.convocatoria_id = ? 
          AND u.activo = 1 
          AND p.notif_convocatoria_por_vencer = 1
      `, [conv.id]);

      if (users.length > 0) {
        await enviarCorreo({
          destinatarios: users.map(u => u.correo_institucional),
          asunto: `Recordatorio: Cierre de convocatoria ${conv.titulo}`,
          cuerpo: `<p>Hola,</p><p>Te recordamos que la convocatoria <strong>${conv.titulo}</strong> a la que te inscribiste, está próxima a vencer (Fecha de cierre: ${conv.fecha_cierre}).</p>`,
          tipo: 'VENCIMIENTO_CONVOCATORIA'
        });
      }
    }
  } catch (error) {
    console.error('❌ Error en job notificarVencimientos:', error);
  }
});
