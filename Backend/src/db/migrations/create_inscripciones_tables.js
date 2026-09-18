'use strict';
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../connection');

async function main() {
  console.log('\n🌱  Creando tablas de inscripciones y semillero externo...\n');

  const uploadDir = path.resolve(__dirname, '../../../uploads/inscripciones');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
    console.log('✅ Carpeta creada:', uploadDir);
  }

  const queries = [
    `CREATE TABLE IF NOT EXISTS convocatoria_inscripciones (
      id INT AUTO_INCREMENT PRIMARY KEY,
      convocatoria_id INT NOT NULL,
      usuario_id INT NOT NULL,
      tipo_investigacion VARCHAR(100) NULL,
      resumen_proyecto TEXT NULL,
      justificacion TEXT NULL,
      documento_nombre_original VARCHAR(255) NULL,
      documento_ruta VARCHAR(255) NULL,
      documento_mime VARCHAR(100) NULL,
      documento_peso_bytes BIGINT NULL,
      estado ENUM('en_proceso', 'registrada', 'aprobada', 'rechazada', 'en_evaluacion') NOT NULL DEFAULT 'registrada',
      fecha_inscripcion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (convocatoria_id) REFERENCES convocatorias(id) ON DELETE CASCADE,
      FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
      INDEX (convocatoria_id),
      INDEX (usuario_id)
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS convocatoria_inscripcion_documentos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      inscripcion_id INT NOT NULL,
      requisito_nombre VARCHAR(255) NOT NULL,
      documento_nombre_original VARCHAR(255) NOT NULL,
      documento_ruta VARCHAR(255) NOT NULL,
      documento_mime VARCHAR(100) NULL,
      documento_peso_bytes BIGINT NULL,
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inscripcion_id) REFERENCES convocatoria_inscripciones(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS inscripcion_semillero_externo (
      id INT AUTO_INCREMENT PRIMARY KEY,
      inscripcion_id INT NOT NULL UNIQUE,
      tipo_institucion VARCHAR(100) NOT NULL,
      procedencia VARCHAR(100) NOT NULL DEFAULT 'Semillero externo',
      institucion_procedencia VARCHAR(200) NOT NULL,
      semillero_nombre VARCHAR(200) NOT NULL,
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inscripcion_id) REFERENCES convocatoria_inscripciones(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS inscripcion_semillero_integrantes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      inscripcion_id INT NOT NULL,
      nombre_completo VARCHAR(200) NOT NULL,
      tipo_documento VARCHAR(30) NOT NULL,
      numero_documento VARCHAR(30) NOT NULL,
      rol VARCHAR(80) NOT NULL,
      email VARCHAR(150) NOT NULL,
      telefono VARCHAR(30) NULL,
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inscripcion_id) REFERENCES convocatoria_inscripciones(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS inscripcion_semillero_info_general (
      id INT AUTO_INCREMENT PRIMARY KEY,
      inscripcion_id INT NOT NULL UNIQUE,
      titulo_trabajo VARCHAR(300) NOT NULL,
      linea_investigacion VARCHAR(150) NULL,
      palabras_clave VARCHAR(300) NOT NULL,
      resumen TEXT NOT NULL,
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inscripcion_id) REFERENCES convocatoria_inscripciones(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`,

    `CREATE TABLE IF NOT EXISTS inscripcion_semillero_contenido (
      id INT AUTO_INCREMENT PRIMARY KEY,
      inscripcion_id INT NOT NULL UNIQUE,
      planteamiento_problema TEXT NOT NULL,
      objetivo_general TEXT NOT NULL,
      objetivos_especificos TEXT NOT NULL,
      metodologia TEXT NOT NULL,
      resultados_esperados TEXT NOT NULL,
      fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (inscripcion_id) REFERENCES convocatoria_inscripciones(id) ON DELETE CASCADE
    ) ENGINE=InnoDB;`
  ];

  for (const q of queries) {
    await pool.query(q);
  }

  console.log('✅ Todas las tablas de inscripciones creadas exitosamente.\n');
  process.exit(0);
}

main().catch(err => {
  console.error('❌ Error creando tablas:', err);
  process.exit(1);
});
