require('dotenv').config({ path: '../../../.env' });
const pool = require('../connection');

async function run() {
  try {
    const [cols] = await pool.query(`
      SELECT COUNT(*) as count 
      FROM information_schema.columns 
      WHERE table_schema = DATABASE() 
        AND table_name = 'proyectos' 
        AND column_name = 'inscripcion_id'
    `);

    if (cols[0].count === 0) {
      console.log('Agregando columna inscripcion_id a la tabla proyectos...');
      await pool.query(`
        ALTER TABLE proyectos
          ADD COLUMN inscripcion_id INT NULL AFTER convocatoria_id,
          ADD CONSTRAINT fk_proyecto_inscripcion
            FOREIGN KEY (inscripcion_id) REFERENCES convocatoria_inscripciones(id);
      `);
      console.log('Migración completada con éxito.');
    } else {
      console.log('La columna inscripcion_id ya existe en la tabla proyectos. Omitiendo.');
    }
  } catch (error) {
    console.error('Error al ejecutar la migración 06:', error);
  } finally {
    process.exit(0);
  }
}

run();
