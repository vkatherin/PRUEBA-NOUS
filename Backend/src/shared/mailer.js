const pool = require('../db/connection');
const nodemailer = require('nodemailer');

async function enviarCorreo({ destinatarios, asunto, cuerpo, tipo }) {
  if (!destinatarios || destinatarios.length === 0) return { enviados: 0 };

  const configurado = process.env.SMTP_HOST && process.env.SMTP_USER && !process.env.SMTP_HOST.startsWith('TU_');
  
  if (!configurado) {
    // Modo simulado
    for (const d of destinatarios) {
      await pool.query(
        `INSERT INTO notificaciones_simuladas (destinatario, asunto, cuerpo, tipo, fecha_creacion)
         VALUES (?, ?, ?, ?, NOW())`,
        [d, asunto, cuerpo, tipo]
      );
    }
    console.log(`📧 [SIMULADO] ${tipo} → ${destinatarios.length} destinatario(s): "${asunto}"`);
    return { simulado: true, enviados: destinatarios.length };
  }

  // Modo real
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT === '465',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"NOUS Sistema de Gestión" <${process.env.SMTP_USER}>`,
      to: destinatarios.join(', '),
      subject: asunto,
      html: cuerpo,
    });

    console.log(`📧 [REAL] ${tipo} → ${destinatarios.length} destinatario(s): "${asunto}" (${info.messageId})`);
    return { simulado: false, enviados: destinatarios.length, messageId: info.messageId };
  } catch (error) {
    console.error(`❌ [ERROR MAILER] Error enviando correo (${tipo}):`, error);
    throw error;
  }
}

module.exports = { enviarCorreo };
