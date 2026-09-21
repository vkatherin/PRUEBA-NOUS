require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedTestData() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    console.log('--- Iniciando inserción de datos de prueba ---');

    // 1. Obtener al menos una convocatoria activa
    const [convocatorias] = await pool.query('SELECT id, titulo FROM convocatorias WHERE estado = "abierta" OR estado = "borrador" OR estado = "publicada" LIMIT 1');
    if (convocatorias.length === 0) {
      console.log('No hay convocatorias. Creando una de prueba...');
      const [convResult] = await pool.query(`
        INSERT INTO convocatorias (titulo, codigo, descripcion, fecha_inicio, fecha_fin, estado, requisitos, tipo_convocatoria, dirigida_a, modalidad)
        VALUES ('Convocatoria de Prueba 2025', 'CONV-TEST', 'Prueba', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'abierta', '[]', 'investigacion', '["docente","estudiante"]', 'virtual')
      `);
      convocatorias.push({ id: convResult.insertId, titulo: 'Convocatoria de Prueba 2025' });
    }
    const convId = convocatorias[0].id;

    // 2. Obtener un evaluador
    let [evaluadores] = await pool.query(`
      SELECT u.id, u.nombre_completo 
      FROM usuarios u 
      JOIN usuario_rol ur ON ur.usuario_id = u.id 
      JOIN roles r ON r.id = ur.rol_id 
      WHERE r.nombre = 'evaluador' AND u.activo = 1 LIMIT 1
    `);
    
    if (evaluadores.length === 0) {
      console.log('No hay evaluadores, asignando rol a un usuario existente...');
      const [usuarios] = await pool.query('SELECT id FROM usuarios LIMIT 1');
      const [rolEval] = await pool.query('SELECT id FROM roles WHERE nombre = "evaluador"');
      
      if (usuarios.length > 0 && rolEval.length > 0) {
        await pool.query('INSERT IGNORE INTO usuario_rol (usuario_id, rol_id) VALUES (?, ?)', [usuarios[0].id, rolEval[0].id]);
        
        evaluadores = await pool.query(`
          SELECT u.id, u.nombre_completo 
          FROM usuarios u 
          JOIN usuario_rol ur ON ur.usuario_id = u.id 
          JOIN roles r ON r.id = ur.rol_id 
          WHERE r.nombre = 'evaluador' AND u.activo = 1 LIMIT 1
        `).then(res => res[0]);
      } else {
         console.log("No hay usuarios en la base de datos.");
         process.exit(1);
      }
    }
    const evalId = evaluadores[0].id;

    // 3. Crear 5 proyectos de prueba
    console.log('Creando proyectos de prueba...');
    const proyectosIds = [];
    for (let i = 1; i <= 5; i++) {
      const [pryRes] = await pool.query(`
        INSERT INTO proyectos (titulo, codigo_unico, convocatoria_id, investigador_principal_id, estado, fecha_inicio)
        VALUES (?, ?, ?, ?, 'en_evaluacion', CURDATE())
      `, [`Proyecto de Prueba ${i}`, `PRY-TEST-${i}`, convId, evalId]); // Usamos el evalId como IP solo para llenado de prueba
      proyectosIds.push(pryRes.insertId);
    }

    // 4. Asignar 2 proyectos en estado "pendiente" a este evaluador
    console.log('Asignando evaluaciones pendientes...');
    await pool.query(`
      INSERT INTO evaluaciones (proyecto_id, evaluador_id, tipo, fecha_asignacion, fecha_limite, estado)
      VALUES (?, ?, 'protocolo_60pts', CURDATE(), DATE_ADD(CURDATE(), INTERVAL 5 DAY), 'pendiente')
    `, [proyectosIds[0], evalId]);
    
    await pool.query(`
      INSERT INTO evaluaciones (proyecto_id, evaluador_id, tipo, fecha_asignacion, fecha_limite, estado)
      VALUES (?, ?, 'sustentacion_40pts', CURDATE(), DATE_ADD(CURDATE(), INTERVAL -2 DAY), 'pendiente')
    `, [proyectosIds[1], evalId]); // Vencida para probar

    // 5. Asignar 1 proyecto "completada" con puntaje
    console.log('Asignando evaluación completada...');
    const [evaRes] = await pool.query(`
      INSERT INTO evaluaciones (proyecto_id, evaluador_id, tipo, fecha_asignacion, fecha_limite, estado, puntaje_total, observaciones)
      VALUES (?, ?, 'protocolo_60pts', DATE_ADD(CURDATE(), INTERVAL -10 DAY), CURDATE(), 'completada', 85, 'Buen proyecto.')
    `, [proyectosIds[2], evalId]);

    // Insertar criterios de la evaluación completada
    const defaultCriterios = [
      { criterio: "Pertinencia y problema de investigación", puntaje_maximo: 25, puntaje_obtenido: 20 },
      { criterio: "Calidad metodológica", puntaje_maximo: 25, puntaje_obtenido: 25 },
      { criterio: "Impacto y resultados esperados", puntaje_maximo: 20, puntaje_obtenido: 15 },
      { criterio: "Viabilidad técnica y financiera", puntaje_maximo: 20, puntaje_obtenido: 18 },
      { criterio: "Experiencia del equipo investigador", puntaje_maximo: 10, puntaje_obtenido: 7 },
    ];
    for (const crit of defaultCriterios) {
      await pool.query(`
        INSERT INTO evaluacion_criterios (evaluacion_id, criterio, puntaje_maximo, puntaje_obtenido)
        VALUES (?, ?, ?, ?)
      `, [evaRes.insertId, crit.criterio, crit.puntaje_maximo, crit.puntaje_obtenido]);
    }

    // Proyectos 3 y 4 quedan "sin evaluador" para que salgan en el modal de Asignar.

    console.log('✅ Datos de prueba insertados correctamente!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error al insertar datos:', err);
    process.exit(1);
  }
}

seedTestData();
