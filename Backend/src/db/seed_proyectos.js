require('dotenv').config();
const pool = require('./connection');

async function seed() {
  try {
    const [p] = await pool.query('SELECT count(*) as c FROM programas_academicos');
    if (p[0].c === 0) {
      await pool.query(
        "INSERT INTO programas_academicos (id, nombre, facultad) VALUES " +
        "(1, 'Ingeniería de Sistemas', 'Facultad de Ingeniería'), " +
        "(2, 'Administración de Empresas', 'Facultad de Ciencias Económicas'), " +
        "(3, 'Psicología', 'Facultad de Ciencias Sociales y Humanas')"
      );
      console.log('Programas seed inserted');
    }

    const [l] = await pool.query('SELECT count(*) as c FROM lineas_investigacion');
    if (l[0].c === 0) {
      await pool.query(
        "INSERT INTO lineas_investigacion (id, nombre) VALUES " +
        "(1, 'Inteligencia Artificial y Ciencia de Datos'), " +
        "(2, 'Desarrollo Social y Comunitario'), " +
        "(3, 'Sostenibilidad y Emprendimiento')"
      );
      console.log('Lineas seed inserted');
    }

    const [pry] = await pool.query('SELECT count(*) as c FROM proyectos');
    if (pry[0].c === 0) {
      const [res1] = await pool.query(
        "INSERT INTO proyectos (" +
        "  titulo, codigo_unico, tipo_proyecto, convocatoria_id, " +
        "  linea_investigacion_id, programa_id, fecha_inicio, " +
        "  duracion_meses, lugar_ejecucion, valor_total, estado, " +
        "  investigador_principal_id, fecha_creacion " +
        ") VALUES (" +
        "  'Plataforma Inteligente de Monitoreo Comunitario', 'PRY-2026-001', 'Investigación', 1, " +
        "  1, 1, '2026-10-01', 12, 'Cali, Valle del Cauca', 45000000.00, 'activo', 1, NOW()" +
        ")"
      );

      await pool.query(
        "INSERT INTO proyecto_descripcion (proyecto_id, resumen_ejecutivo, objetivo_general) VALUES (?, ?, ?)",
        [res1.insertId, 'Desarrollo de un sistema de alerta temprana basado en IA para la vigilancia comunitaria.', 'Diseñar e implementar una arquitectura de IoT e IA para análisis de datos comunitarios.']
      );

      await pool.query(
        "INSERT INTO proyecto_equipo (proyecto_id, usuario_id, rol_en_proyecto, entidad) VALUES (?, 1, 'Investigador Principal', 'UniCatólica')",
        [res1.insertId]
      );

      await pool.query(
        "INSERT INTO proyecto_cronograma (proyecto_id, actividad, fecha_inicio, fecha_fin, indicador_resultado, responsable_id) VALUES " +
        "(?, 'Fase 1: Levantamiento de requisitos y arquitectura inicial', '2026-10-01', '2026-11-30', 'Documento de especificación', 1), " +
        "(?, 'Fase 2: Prototipado y pruebas de campo', '2026-12-01', '2027-03-31', 'Prototipo funcional desplegado', 1)",
        [res1.insertId, res1.insertId]
      );

      const [res2] = await pool.query(
        "INSERT INTO proyectos (" +
        "  titulo, codigo_unico, tipo_proyecto, convocatoria_id, " +
        "  linea_investigacion_id, programa_id, fecha_inicio, " +
        "  duracion_meses, lugar_ejecucion, valor_total, estado, " +
        "  investigador_principal_id, fecha_creacion " +
        ") VALUES (" +
        "  'Optimización de Cadena de Suministro para Microempresas', 'PRY-2026-002', 'Innovación', 1, " +
        "  3, 2, '2026-11-15', 8, 'Yumbo y Cali', 28000000.00, 'en_evaluacion', 2, NOW()" +
        ")"
      );

      await pool.query(
        "INSERT INTO proyecto_descripcion (proyecto_id, resumen_ejecutivo, objetivo_general) VALUES (?, ?, ?)",
        [res2.insertId, 'Modelo logístico colaborativo para pequeños comercios mediante plataformas web.', 'Modelar y validar una red de distribución compartida para microempresarios.']
      );

      console.log('Proyectos seed inserted successfully!');
    }
  } catch (e) {
    console.error('Seed error:', e);
  } finally {
    process.exit();
  }
}

seed();
