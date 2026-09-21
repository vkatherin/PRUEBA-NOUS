CREATE TABLE IF NOT EXISTS formatos_institucionales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  codigo VARCHAR(20) NOT NULL UNIQUE,
  nombre VARCHAR(255) NOT NULL,
  categoria VARCHAR(100) NOT NULL,
  version VARCHAR(10) NOT NULL,
  archivo_nombre_original VARCHAR(255) NOT NULL,
  archivo_ruta VARCHAR(255) NOT NULL,
  fecha_actualizacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  subido_por INT NULL,
  FOREIGN KEY (subido_por) REFERENCES usuarios(id)
);
