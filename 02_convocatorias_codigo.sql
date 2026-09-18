-- ============================================================
-- Migración 02: Código automático para convocatorias
-- Agrega soporte para el código institucional (ej. IPDE2026001)
-- generado en convocatorias.service.js (generarCodigoConvocatoriaExterna)
-- ============================================================

USE nous_db;

-- 1. Columnas nuevas que necesita convocatorias
ALTER TABLE convocatorias
  ADD COLUMN codigo VARCHAR(50) UNIQUE AFTER id,
  ADD COLUMN tipo_investigacion VARCHAR(50) AFTER codigo,
  ADD COLUMN dirigida_a VARCHAR(50) AFTER tipo,
  ADD COLUMN descripcion TEXT AFTER dirigida_a,
  ADD COLUMN observaciones_comite TEXT AFTER fecha_aprobacion;

-- 2. Tabla de consecutivos para generar códigos automáticos (ej. IPDE2026001)
CREATE TABLE IF NOT EXISTS consecutivos_convocatorias (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tipo_codigo VARCHAR(10) NOT NULL,
  anio INT NOT NULL,
  ultimo_consecutivo INT NOT NULL DEFAULT 0,
  UNIQUE KEY uq_tipo_anio (tipo_codigo, anio)
) ENGINE=InnoDB;

-- ============================================================
-- Fin de la migración 02
-- ============================================================
