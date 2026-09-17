require('dotenv').config();
const pool = require('./connection');

async function seedSemilleros() {
  try {
    const [count] = await pool.query('SELECT count(*) as c FROM semilleros');
    if (count[0].c === 0) {
      const [res1] = await pool.query(`
        INSERT INTO semilleros
          (nombre, codigo, programa_id, lider_profesor_id, lider_estudiante_nombre,
           tema_interes, mision, vision, vobo_programa, vobo_vicerrectoria, fecha_creacion)
        VALUES
          ('HIDROSUR', 'SEM-001', 1, 1, 'Sebastián Ortiz Herrera',
           'Gestión de recursos hídricos, cambio climático y modelación ambiental',
           'Fomentar la investigación formativa en el manejo sostenible de cuencas',
           'Ser referente regional en investigación ambiental y gestión hídrica',
           1, 1, NOW()),
          ('ECOFIN', 'SEM-002', 2, 2, 'Laura Cristina Gómez',
           'Economía social, finanzas inclusivas y desarrollo territorial',
           'Impulsar el estudio y diseño de modelos financieros para microempresas',
           'Consolidar propuestas de impacto socioeconómico para el sector rural',
           1, 1, NOW()),
          ('AGROBIO', 'SEM-003', 1, 1, 'Andrés Felipe Morales',
           'Biotecnología aplicada al agro y sostenibilidad de cultivos',
           'Desarrollar soluciones biotecnológicas para pequeños productores',
           'Generar patentes y productos de innovación agropecuaria',
           1, 1, NOW())
      `);

      console.log('Semilleros seed insertados con éxito');

      // Semillar integrantes para HIDROSUR (id 1)
      await pool.query(`
        INSERT INTO semillero_integrantes
          (semillero_id, usuario_id, documento_identidad, horas_semanales, semestre, fecha_ingreso, estado)
        VALUES
          (1, 1, '1002345678', 8, 8, '2025-02-01', 'activo'),
          (1, 2, '1009876543', 6, 6, '2025-03-01', 'activo')
      `);
      console.log('Integrantes seed insertados');
    } else {
      console.log('Semilleros ya tiene datos.');
    }
  } catch (err) {
    console.error('Error al semillar semilleros:', err);
  } finally {
    process.exit();
  }
}

seedSemilleros();
