-- Migración 03: Autorización de Tratamiento de Datos Personales (Ley 1581 de 2012)
-- Agrega a la tabla `usuarios` los campos para registrar la aceptación explícita
-- de la política de tratamiento de datos.
--
-- Los usuarios existentes quedan con acepto_tratamiento_datos = FALSE por defecto,
-- por lo que se les pedirá aceptar la próxima vez que inicien sesión.
--
-- Ejecutar con: node src/db/migrations/run_migration_03.js

ALTER TABLE usuarios
  ADD COLUMN acepto_tratamiento_datos   BOOLEAN     NOT NULL DEFAULT FALSE,
  ADD COLUMN fecha_aceptacion_datos     DATETIME    NULL,
  ADD COLUMN version_politica_aceptada  VARCHAR(20) NULL;
