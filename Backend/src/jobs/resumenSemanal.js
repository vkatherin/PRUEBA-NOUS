const cron = require('node-cron');
const pool = require('../db/connection');
const { enviarCorreo } = require('../shared/mailer');
const isPostgres = (process.env.DB_CLIENT || 'mysql').toLowerCase() === 'postgres';

// Ejecutar los lunes a las 7:00 AM
cron.schedule('0 7 * * 1', async () => {
  try {
    console.log('⏰ Ejecutando job: Resumen semanal...');
    
    const [users] = await pool.query(`
      SELECT u.id, u.correo_institucional, u.nombre_completo 
      FROM usuarios u
      JOIN preferencias_notificacion p ON p.usuario_id = u.id
      WHERE u.activo = 1 AND p.notif_resumen_semanal = 1
    `);

    if (users.length === 0) return;

    // Obtener métricas generales
    const [[{ abiertas }]] = await pool.query(`SELECT COUNT(*) as abiertas FROM convocatorias WHERE estado IN ('publicada', 'activa') AND fecha_cierre >= ${isPostgres ? 'CURRENT_DATE' : 'CURDATE()'}`);

    for (const u of users) {
      const [[{ proyectos }]] = await pool.query(`SELECT COUNT(*) as proyectos FROM proyectos WHERE investigador_principal_id = ? AND estado IN ('activo', 'en_ejecucion')`, [u.id]);
      const [[{ evaluaciones }]] = await pool.query(`SELECT COUNT(*) as evaluaciones FROM evaluaciones WHERE evaluador_id = ? AND estado = 'pendiente'`, [u.id]);

      await enviarCorreo({
        destinatarios: [u.correo_institucional],
        asunto: 'Resumen Semanal NOUS',
        cuerpo: `
          <h3>Hola ${u.nombre_completo},</h3>
          <p>Este es tu resumen semanal:</p>
          <ul>
            <li><strong>Convocatorias activas en plataforma:</strong> ${abiertas}</li>
            <li><strong>Tus proyectos activos:</strong> ${proyectos}</li>
            <li><strong>Evaluaciones pendientes:</strong> ${evaluaciones}</li>
          </ul>
        `,
        tipo: 'RESUMEN_SEMANAL'
      });
    }
  } catch (error) {
    console.error('❌ Error en job resumenSemanal:', error);
  }
});
