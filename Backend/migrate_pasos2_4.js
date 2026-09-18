const mysql = require('mysql2/promise');

async function main() {
  const pool = await mysql.createPool({
    host: 'localhost', port: 3306, database: 'nous_db',
    user: 'root', password: '123456'
  });

  const tablas = [
    // Paso 2: Integrantes (múltiples por inscripción)
    `CREATE TABLE IF NOT EXISTS inscripcion_semillero_integrantes (
      id                INT AUTO_INCREMENT PRIMARY KEY,
      inscripcion_id    INT NOT NULL,
      nombre_completo   VARCHAR(200) NOT NULL,
      tipo_documento    VARCHAR(30) NOT NULL,
      numero_documento  VARCHAR(30) NOT NULL,
      rol               VARCHAR(80) NOT NULL,
      email             VARCHAR(150) NOT NULL,
      telefono          VARCHAR(30) NULL,
      fecha_creacion    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_isi_inscripcion
        FOREIGN KEY (inscripcion_id)
        REFERENCES convocatoria_inscripciones(id)
        ON DELETE CASCADE
    )`,

    // Paso 3: Información general (uno por inscripción)
    `CREATE TABLE IF NOT EXISTS inscripcion_semillero_info_general (
      id                  INT AUTO_INCREMENT PRIMARY KEY,
      inscripcion_id      INT NOT NULL UNIQUE,
      titulo_trabajo      VARCHAR(300) NOT NULL,
      linea_investigacion VARCHAR(150) NULL,
      palabras_clave      VARCHAR(300) NOT NULL,
      resumen             TEXT NOT NULL,
      fecha_creacion      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_isig_inscripcion
        FOREIGN KEY (inscripcion_id)
        REFERENCES convocatoria_inscripciones(id)
        ON DELETE CASCADE
    )`,

    // Paso 4: Contenido del trabajo (uno por inscripción)
    `CREATE TABLE IF NOT EXISTS inscripcion_semillero_contenido (
      id                      INT AUTO_INCREMENT PRIMARY KEY,
      inscripcion_id          INT NOT NULL UNIQUE,
      planteamiento_problema  TEXT NOT NULL,
      objetivo_general        TEXT NOT NULL,
      objetivos_especificos   TEXT NOT NULL,
      metodologia             TEXT NOT NULL,
      resultados_esperados    TEXT NOT NULL,
      fecha_creacion          DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_isc_inscripcion
        FOREIGN KEY (inscripcion_id)
        REFERENCES convocatoria_inscripciones(id)
        ON DELETE CASCADE
    )`
  ];

  for (const sql of tablas) {
    const match = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/);
    const nombre = match ? match[1] : '?';
    await pool.query(sql);
    console.log('✅ Tabla creada:', nombre);
    const [cols] = await pool.query('DESCRIBE ' + nombre);
    cols.forEach(c => console.log('  ', c.Field, '|', c.Type));
    console.log('');
  }

  await pool.end();
  console.log('Migración completada.');
}

main().catch(e => { console.error('ERROR:', e.message); process.exit(1); });
