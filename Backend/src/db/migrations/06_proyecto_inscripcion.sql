ALTER TABLE proyectos
  ADD COLUMN inscripcion_id INT NULL AFTER convocatoria_id,
  ADD CONSTRAINT fk_proyecto_inscripcion
    FOREIGN KEY (inscripcion_id) REFERENCES convocatoria_inscripciones(id);
