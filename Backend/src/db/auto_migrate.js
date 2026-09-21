'use strict';
const fs = require('fs');
const path = require('path');
const pool = require('./connection');

/**
 * Ejecuta migraciones automáticas al iniciar el servidor para garantizar
 * que todas las tablas, columnas, roles y permisos existan sin requerir
 * pasos manuales entre los miembros del equipo.
 */
async function autoMigrate() {
  try {
    // 1. Asegurar directorio de uploads
    const uploadDirs = [
      path.resolve(__dirname, '../../uploads'),
      path.resolve(__dirname, '../../uploads/inscripciones'),
      path.resolve(__dirname, '../../uploads/formatos'),
    ];
    for (const dir of uploadDirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    }

    // 2. Tablas base de inscripciones y semilleros
    await pool.query(`
      CREATE TABLE IF NOT EXISTS convocatorias (
        id INT AUTO_INCREMENT PRIMARY KEY,
        codigo VARCHAR(50) NULL,
        titulo VARCHAR(255) NOT NULL,
        descripcion TEXT NULL,
        tipo VARCHAR(50) NOT NULL DEFAULT 'docente',
        estado ENUM('borrador', 'publicada', 'cerrada', 'evaluacion') NOT NULL DEFAULT 'borrador',
        fecha_inicio DATE NULL,
        fecha_fin DATE NULL,
        creado_por INT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS convocatoria_inscripciones (
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
        INDEX (convocatoria_id),
        INDEX (usuario_id)
      ) ENGINE=InnoDB;
    `);

    // Modificar ENUM si existía sin 'en_proceso'
    try {
      await pool.query(`
        ALTER TABLE convocatoria_inscripciones 
        MODIFY COLUMN estado ENUM('en_proceso', 'registrada', 'aprobada', 'rechazada', 'en_evaluacion') NOT NULL DEFAULT 'registrada';
      `);
    } catch (_) {}

    await pool.query(`
      CREATE TABLE IF NOT EXISTS convocatoria_inscripcion_documentos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inscripcion_id INT NOT NULL,
        requisito_nombre VARCHAR(255) NOT NULL,
        documento_nombre_original VARCHAR(255) NOT NULL,
        documento_ruta VARCHAR(255) NOT NULL,
        documento_mime VARCHAR(100) NULL,
        documento_peso_bytes BIGINT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX (inscripcion_id)
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS inscripcion_semillero_externo (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inscripcion_id INT NOT NULL UNIQUE,
        tipo_institucion VARCHAR(100) NOT NULL,
        procedencia VARCHAR(100) NOT NULL DEFAULT 'Semillero externo',
        institucion_procedencia VARCHAR(200) NOT NULL,
        semillero_nombre VARCHAR(200) NOT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX (inscripcion_id)
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS inscripcion_semillero_integrantes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inscripcion_id INT NOT NULL,
        nombre_completo VARCHAR(200) NOT NULL,
        tipo_documento VARCHAR(30) NOT NULL,
        numero_documento VARCHAR(30) NOT NULL,
        rol VARCHAR(80) NOT NULL,
        email VARCHAR(150) NOT NULL,
        telefono VARCHAR(30) NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX (inscripcion_id)
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS inscripcion_semillero_info_general (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inscripcion_id INT NOT NULL UNIQUE,
        titulo_trabajo VARCHAR(300) NOT NULL,
        linea_investigacion VARCHAR(150) NULL,
        palabras_clave VARCHAR(300) NOT NULL,
        resumen TEXT NOT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX (inscripcion_id)
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS inscripcion_semillero_contenido (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inscripcion_id INT NOT NULL UNIQUE,
        planteamiento_problema TEXT NOT NULL,
        objetivo_general TEXT NOT NULL,
        objetivos_especificos TEXT NOT NULL,
        metodologia TEXT NOT NULL,
        resultados_esperados TEXT NOT NULL,
        fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        INDEX (inscripcion_id)
      ) ENGINE=InnoDB;
    `);

    // 3. Garantizar columnas de tratamiento de datos en usuarios
    const columnasUsuarios = [
      "ADD COLUMN IF NOT EXISTS acepto_tratamiento_datos BOOLEAN NOT NULL DEFAULT FALSE",
      "ADD COLUMN IF NOT EXISTS fecha_aceptacion_datos DATETIME NULL",
      "ADD COLUMN IF NOT EXISTS version_politica_aceptada VARCHAR(20) NULL",
      "ADD COLUMN IF NOT EXISTS cedula VARCHAR(30) NULL"
    ];
    for (const colQuery of columnasUsuarios) {
      try {
        await pool.query(`ALTER TABLE usuarios ${colQuery}`);
      } catch (_) {}
    }

    // 4. Garantizar rol 'externo' y permisos en la base de datos
    await pool.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(50) NOT NULL UNIQUE,
        descripcion TEXT NULL
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS permisos (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS rol_permiso (
        rol_id INT NOT NULL,
        permiso_id INT NOT NULL,
        PRIMARY KEY (rol_id, permiso_id)
      ) ENGINE=InnoDB;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS usuario_rol (
        usuario_id INT NOT NULL,
        rol_id INT NOT NULL,
        PRIMARY KEY (usuario_id, rol_id)
      ) ENGINE=InnoDB;
    `);

    // Insertar rol externo
    await pool.query(`
      INSERT INTO roles (nombre, descripcion)
      VALUES ('externo', 'Investigador o participante externo en convocatorias')
      ON DUPLICATE KEY UPDATE descripcion = VALUES(descripcion);
    `);

    // Obtener id del rol externo
    const [[rolExternoRow]] = await pool.query("SELECT id FROM roles WHERE nombre = 'externo' LIMIT 1");

    if (rolExternoRow) {
      const permisosExterno = ['convocatorias.leer', 'convocatorias.crear', 'documentos.leer'];
      for (const p of permisosExterno) {
        await pool.query("INSERT IGNORE INTO permisos (nombre) VALUES (?)", [p]);
        const [[pRow]] = await pool.query("SELECT id FROM permisos WHERE nombre = ? LIMIT 1", [p]);
        if (pRow) {
          await pool.query("INSERT IGNORE INTO rol_permiso (rol_id, permiso_id) VALUES (?, ?)", [rolExternoRow.id, pRow.id]);
        }
      }

      // Asignar rol 'externo' a cualquier usuario que no tenga ningún rol
      await pool.query(`
        INSERT IGNORE INTO usuario_rol (usuario_id, rol_id)
        SELECT u.id, ? FROM usuarios u
        LEFT JOIN usuario_rol ur ON ur.usuario_id = u.id
        WHERE ur.rol_id IS NULL;
      `, [rolExternoRow.id]);
    }

    console.log('✅ Migraciones y sincronización de esquemas completadas');
  } catch (err) {
    console.error('⚠️  Aviso en autoMigrate:', err.message);
  }
}

module.exports = autoMigrate;
