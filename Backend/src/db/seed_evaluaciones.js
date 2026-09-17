require('dotenv').config();
const pool = require('./connection');

async function seedEvaluaciones() {
  try {
    const [count] = await pool.query('SELECT count(*) as c FROM evaluaciones');
    if (count[0].c === 0) {
      const [res1] = await pool.query(`
        INSERT INTO evaluaciones
          (proyecto_id, evaluador_id, tipo, fecha_asignacion, fecha_limite, estado, puntaje_total, observaciones)
        VALUES
          (1, 1, 'Técnica', '2026-09-10', '2026-09-25', 'en_progreso', 0, 'Revisión preliminar de arquitectura'),
          (2, 1, 'Comité', '2026-09-12', '2026-09-30', 'pendiente', 0, 'Revisión de viabilidad e impacto')
      `);

      // Criterios para evaluación 1
      await pool.query(`
        INSERT INTO evaluacion_criterios
          (evaluacion_id, criterio, puntaje_maximo, puntaje_obtenido)
        VALUES
          (1, 'Pertinencia y problema de investigación', 25, 20),
          (1, 'Calidad metodológica', 25, 22),
          (1, 'Impacto y resultados esperados', 20, 16),
          (1, 'Viabilidad técnica y financiera', 20, 18),
          (1, 'Experiencia del equipo investigador', 10, 9)
      `);

      // Criterios para evaluación 2
      await pool.query(`
        INSERT INTO evaluacion_criterios
          (evaluacion_id, criterio, puntaje_maximo, puntaje_obtenido)
        VALUES
          (2, 'Pertinencia y problema de investigación', 25, 0),
          (2, 'Calidad metodológica', 25, 0),
          (2, 'Impacto y resultados esperados', 20, 0),
          (2, 'Viabilidad técnica y financiera', 20, 0),
          (2, 'Experiencia del equipo investigador', 10, 0)
      `);

      console.log('Evaluaciones y criterios seed insertados con éxito');
    } else {
      console.log('Evaluaciones ya tiene datos.');
    }
  } catch (err) {
    console.error('Error al semillar evaluaciones:', err);
  } finally {
    process.exit();
  }
}

seedEvaluaciones();
