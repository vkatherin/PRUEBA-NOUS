CREATE TABLE IF NOT EXISTS preferencias_notificacion (
  usuario_id INT PRIMARY KEY,
  notif_convocatoria_nueva BOOLEAN NOT NULL DEFAULT TRUE,
  notif_convocatoria_por_vencer BOOLEAN NOT NULL DEFAULT TRUE,
  notif_evaluacion_asignada BOOLEAN NOT NULL DEFAULT TRUE,
  notif_cambio_estado BOOLEAN NOT NULL DEFAULT TRUE,
  notif_resumen_semanal BOOLEAN NOT NULL DEFAULT FALSE,
  idioma VARCHAR(5) NOT NULL DEFAULT 'es',
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS notificaciones_simuladas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  destinatario VARCHAR(255) NOT NULL,
  asunto VARCHAR(255) NOT NULL,
  cuerpo TEXT NOT NULL,
  tipo VARCHAR(50) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
