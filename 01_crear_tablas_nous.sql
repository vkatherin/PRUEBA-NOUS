-- ============================================================
-- NOUS — Sistema Integral de Gestión para la Investigación
-- Fundación Universitaria Católica del Sur
-- Script de creación de base de datos (46 tablas, 7 módulos)
-- Motor: MySQL 8.x | Charset: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS nous_db
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE nous_db;

SET FOREIGN_KEY_CHECKS = 0;

-- ============================================================
-- MÓDULO 1: AUTENTICACIÓN, ROLES Y CONVOCATORIAS
-- ============================================================

CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_completo VARCHAR(150) NOT NULL,
    correo_institucional VARCHAR(150) NOT NULL UNIQUE,
    cedula VARCHAR(20),
    password_hash VARCHAR(255),
    mfa_habilitado BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE COMMENT 'Administrador, Directivos, Director_Investigacion, Coordinador, Lider, Docente, Estudiante, Evaluador, Financiero, Compras, Consulta',
    descripcion VARCHAR(255)
) ENGINE=InnoDB;

CREATE TABLE usuario_rol (
    usuario_id INT NOT NULL,
    rol_id INT NOT NULL,
    PRIMARY KEY (usuario_id, rol_id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE permisos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL COMMENT 'observar, comentar, aprobar, filtrar_cargar, acceso_total, etc.',
    modulo VARCHAR(50)
) ENGINE=InnoDB;

CREATE TABLE rol_permiso (
    rol_id INT NOT NULL,
    permiso_id INT NOT NULL,
    PRIMARY KEY (rol_id, permiso_id),
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE CASCADE,
    FOREIGN KEY (permiso_id) REFERENCES permisos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE log_auditoria (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    accion VARCHAR(100) NOT NULL,
    entidad_afectada VARCHAR(100),
    entidad_id INT,
    fecha_hora DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE convocatorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    tipo VARCHAR(50),
    fecha_apertura DATE,
    fecha_cierre DATE,
    rubro_disponible DECIMAL(14,2),
    estado VARCHAR(30) DEFAULT 'borrador' COMMENT 'borrador, publicada, cerrada',
    requisitos TEXT,
    plantilla_base_url VARCHAR(255),
    creado_por INT,
    aprobada_comite BOOLEAN DEFAULT FALSE,
    fecha_aprobacion DATE,
    FOREIGN KEY (creado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE convocatoria_externa (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(200) NOT NULL,
    entidad_externa VARCHAR(150),
    fecha_apertura DATE,
    fecha_cierre DATE,
    descripcion TEXT
) ENGINE=InnoDB;

-- ============================================================
-- MÓDULO 2: GESTIÓN DE PROYECTOS — CATÁLOGOS Y NÚCLEO
-- ============================================================

CREATE TABLE lineas_investigacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE sublineas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    linea_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    FOREIGN KEY (linea_id) REFERENCES lineas_investigacion(id)
) ENGINE=InnoDB;

CREATE TABLE programas_academicos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    facultad VARCHAR(150)
) ENGINE=InnoDB;

CREATE TABLE areas_conocimiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE ods (
    id INT AUTO_INCREMENT PRIMARY KEY,
    numero INT NOT NULL,
    nombre VARCHAR(150) NOT NULL
) ENGINE=InnoDB;

CREATE TABLE grupos_investigacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(50),
    categoria_minciencias VARCHAR(20),
    lider_id INT,
    FOREIGN KEY (lider_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE semilleros (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    codigo VARCHAR(50) UNIQUE,
    programa_id INT,
    lider_profesor_id INT,
    lider_estudiante_nombre VARCHAR(150),
    cedula_lider VARCHAR(20),
    cvlac_url VARCHAR(255),
    formacion_pregrado VARCHAR(150),
    formacion_posgrado VARCHAR(150),
    modalidad_contratacion VARCHAR(100),
    horas_asignadas DECIMAL(5,2),
    vision TEXT,
    mision TEXT,
    tema_interes VARCHAR(255),
    estado_arte TEXT,
    vobo_programa BOOLEAN DEFAULT FALSE,
    vobo_vicerrectoria BOOLEAN DEFAULT FALSE,
    fecha_creacion DATE,
    FOREIGN KEY (programa_id) REFERENCES programas_academicos(id),
    FOREIGN KEY (lider_profesor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE proyectos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(250) NOT NULL,
    codigo_unico VARCHAR(50) UNIQUE,
    tipo_proyecto VARCHAR(30) COMMENT 'formal, formativa, innovacion',
    convocatoria_id INT,
    linea_investigacion_id INT,
    sublinea_id INT,
    programa_id INT,
    area_conocimiento_id INT,
    fecha_inicio DATE,
    duracion_meses INT,
    lugar_ejecucion VARCHAR(255),
    valor_total DECIMAL(14,2),
    estado VARCHAR(30) DEFAULT 'propuesta' COMMENT 'propuesta, eval_etica, eval_investigaciones, aprobado, en_ejecucion, terminado, inactivo',
    investigador_principal_id INT,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (convocatoria_id) REFERENCES convocatorias(id),
    FOREIGN KEY (linea_investigacion_id) REFERENCES lineas_investigacion(id),
    FOREIGN KEY (sublinea_id) REFERENCES sublineas(id),
    FOREIGN KEY (programa_id) REFERENCES programas_academicos(id),
    FOREIGN KEY (area_conocimiento_id) REFERENCES areas_conocimiento(id),
    FOREIGN KEY (investigador_principal_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE proyecto_descripcion (
    proyecto_id INT PRIMARY KEY,
    palabras_clave VARCHAR(255),
    resumen_ejecutivo TEXT,
    justificacion TEXT,
    pertinencia TEXT,
    contexto VARCHAR(255),
    estado_arte TEXT,
    planteamiento_problema TEXT,
    pregunta_investigacion TEXT,
    marco_teorico TEXT,
    objetivo_general TEXT,
    objetivos_especificos TEXT,
    consideraciones_eticas_bioeticas TEXT,
    conocimiento_generado TEXT,
    aporte_social TEXT,
    bibliografia TEXT,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE proyecto_metodologia (
    proyecto_id INT PRIMARY KEY,
    tipo_estudio VARCHAR(100),
    variables TEXT,
    etapas TEXT,
    fuentes_instrumentos TEXT,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE proyecto_ods (
    proyecto_id INT NOT NULL,
    ods_id INT NOT NULL,
    PRIMARY KEY (proyecto_id, ods_id),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (ods_id) REFERENCES ods(id)
) ENGINE=InnoDB;

-- ============================================================
-- MÓDULO 2b: EQUIPO, FINANCIACIÓN Y ALIANZAS
-- ============================================================

CREATE TABLE proyecto_equipo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    usuario_id INT NOT NULL,
    rol_en_proyecto VARCHAR(50) COMMENT 'investigador_principal, coinvestigador, auxiliar',
    entidad VARCHAR(150),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE patrocinadores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    nombre_patrocinador VARCHAR(150) NOT NULL,
    nit VARCHAR(20),
    tipo_financiacion VARCHAR(30) COMMENT 'propia, cofinanciacion_externa',
    monto_dinero DECIMAL(14,2) DEFAULT 0,
    monto_especie DECIMAL(14,2) DEFAULT 0,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE entidades_externas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL,
    nit VARCHAR(20),
    pais VARCHAR(80),
    representante_legal VARCHAR(150)
) ENGINE=InnoDB;

CREATE TABLE proyecto_entidad_externa (
    proyecto_id INT NOT NULL,
    entidad_id INT NOT NULL,
    aval_rectoria BOOLEAN DEFAULT FALSE,
    fecha_aval DATE,
    PRIMARY KEY (proyecto_id, entidad_id),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (entidad_id) REFERENCES entidades_externas(id)
) ENGINE=InnoDB;

CREATE TABLE proyecto_grupo (
    proyecto_id INT NOT NULL,
    grupo_id INT NOT NULL,
    PRIMARY KEY (proyecto_id, grupo_id),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (grupo_id) REFERENCES grupos_investigacion(id)
) ENGINE=InnoDB;

CREATE TABLE proyecto_semillero (
    proyecto_id INT NOT NULL,
    semillero_id INT NOT NULL,
    PRIMARY KEY (proyecto_id, semillero_id),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (semillero_id) REFERENCES semilleros(id)
) ENGINE=InnoDB;

-- ============================================================
-- MÓDULO 2c: SEGUIMIENTO, PRODUCTOS, RIESGOS E IMPACTOS
-- ============================================================

CREATE TABLE proyecto_cronograma (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    actividad VARCHAR(255) NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    indicador_resultado VARCHAR(255),
    responsable_id INT,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (responsable_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE tipologia_productos_minciencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipologia VARCHAR(150) NOT NULL,
    subtipo_categoria VARCHAR(150)
) ENGINE=InnoDB;

CREATE TABLE proyecto_productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    tipologia_id INT,
    descripcion VARCHAR(255),
    cantidad INT DEFAULT 1,
    peso_relativo DECIMAL(5,2),
    fecha_entrega DATE,
    estado VARCHAR(30) DEFAULT 'planeado',
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (tipologia_id) REFERENCES tipologia_productos_minciencias(id)
) ENGINE=InnoDB;

CREATE TABLE proyecto_riesgos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    nombre_riesgo VARCHAR(200) NOT NULL,
    causa TEXT,
    efecto TEXT,
    manejo_previsto TEXT,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE proyecto_impactos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    tipo_impacto VARCHAR(100),
    alcance_tiempo VARCHAR(50),
    justificacion TEXT,
    indicadores TEXT,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE proyecto_estrategias_divulgacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    estrategia VARCHAR(200),
    justificacion TEXT,
    alcance_esperado VARCHAR(255),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE proyecto_formacion_comunidad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    nivel_formacion VARCHAR(100),
    personas_vinculadas VARCHAR(255),
    beneficios TEXT,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE proyecto_estado_historial (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30),
    fecha_cambio DATETIME DEFAULT CURRENT_TIMESTAMP,
    usuario_id INT,
    comentario TEXT,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE comite_evaluacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    comite VARCHAR(30) COMMENT 'etica, investigaciones',
    fecha_evaluacion DATE,
    resultado VARCHAR(30) COMMENT 'aprobado, ajustes, rechazado',
    observaciones TEXT,
    evaluado_por INT,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluado_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- ============================================================
-- MÓDULO 3: SEMILLEROS (integrantes y planes)
-- ============================================================

CREATE TABLE semillero_integrantes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semillero_id INT NOT NULL,
    usuario_id INT NOT NULL,
    documento_identidad VARCHAR(20),
    horas_semanales DECIMAL(5,2),
    correo_personal VARCHAR(150),
    semestre INT,
    fecha_ingreso DATE,
    fecha_retiro DATE,
    estado VARCHAR(20) DEFAULT 'activo' COMMENT 'activo, inactivo',
    FOREIGN KEY (semillero_id) REFERENCES semilleros(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE semillero_cronograma_formacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semillero_id INT NOT NULL,
    semana INT,
    mes INT,
    semestre VARCHAR(20),
    actividad VARCHAR(255),
    FOREIGN KEY (semillero_id) REFERENCES semilleros(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE semillero_cronograma_difusion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semillero_id INT NOT NULL,
    semana INT,
    mes INT,
    semestre VARCHAR(20),
    actividad VARCHAR(255),
    FOREIGN KEY (semillero_id) REFERENCES semilleros(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE semillero_proyectos_formativos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semillero_id INT NOT NULL,
    nombre_proyecto VARCHAR(200),
    semilleristas VARCHAR(255),
    fecha_inicio DATE,
    fecha_fin DATE,
    tipo_producto VARCHAR(100),
    estado VARCHAR(30),
    producto_final VARCHAR(255),
    FOREIGN KEY (semillero_id) REFERENCES semilleros(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE semillero_certificados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    semillero_id INT NOT NULL,
    usuario_id INT NOT NULL,
    tipo VARCHAR(50),
    fecha_emision DATE,
    mencion_honor BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (semillero_id) REFERENCES semilleros(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- ============================================================
-- MÓDULO 4: EVALUACIÓN, LEGAL, ASESORÍAS, DOCUMENTAL
-- ============================================================

CREATE TABLE evaluaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    evaluador_id INT,
    tipo VARCHAR(30) COMMENT 'protocolo_60pts, sustentacion_40pts, poster',
    fecha_asignacion DATE,
    fecha_limite DATE,
    estado VARCHAR(20) DEFAULT 'pendiente' COMMENT 'pendiente, completada',
    puntaje_total DECIMAL(5,2),
    observaciones TEXT,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (evaluador_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE evaluacion_criterios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    evaluacion_id INT NOT NULL,
    criterio VARCHAR(150),
    puntaje_maximo DECIMAL(5,2),
    puntaje_obtenido DECIMAL(5,2),
    FOREIGN KEY (evaluacion_id) REFERENCES evaluaciones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE actas_sustentacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    numero_acta VARCHAR(50) UNIQUE,
    fecha DATE,
    hora TIME,
    lugar VARCHAR(150),
    autores VARCHAR(255),
    asesores VARCHAR(255),
    jurados VARCHAR(255),
    aspectos_evaluados TEXT,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE consentimientos_informados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    participante_nombre VARCHAR(150),
    fecha DATE,
    firmado BOOLEAN DEFAULT FALSE,
    documento_url VARCHAR(255),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE acuerdos_confidencialidad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    investigador_id INT,
    asesor_id INT,
    fecha DATE,
    documento_url VARCHAR(255),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (investigador_id) REFERENCES usuarios(id),
    FOREIGN KEY (asesor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE bitacora_asesorias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT NOT NULL,
    fecha DATE,
    programa VARCHAR(150),
    estudiantes VARCHAR(255),
    asesor_tematico_id INT,
    asesor_metodologico_id INT,
    semestre VARCHAR(20),
    actividad_realizada TEXT,
    tiempo_dedicado_horas DECIMAL(5,2),
    observaciones_compromisos TEXT,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (asesor_tematico_id) REFERENCES usuarios(id),
    FOREIGN KEY (asesor_metodologico_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE documentos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT,
    convocatoria_id INT,
    semillero_id INT,
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(50),
    url VARCHAR(255),
    version INT DEFAULT 1,
    fecha_creacion DATE,
    subido_por INT,
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (convocatoria_id) REFERENCES convocatorias(id) ON DELETE CASCADE,
    FOREIGN KEY (semillero_id) REFERENCES semilleros(id) ON DELETE CASCADE,
    FOREIGN KEY (subido_por) REFERENCES usuarios(id)
) ENGINE=InnoDB;

-- ============================================================
-- MÓDULO 5: GESTIÓN FINANCIERA Y EMPRENDIMIENTO — FUTURA
-- (fuera del alcance del MVP; se deja la base lista)
-- ============================================================

CREATE TABLE presupuesto_areas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    area VARCHAR(100) NOT NULL,
    monto_asignado DECIMAL(14,2),
    monto_ejecutado DECIMAL(14,2) DEFAULT 0,
    periodo VARCHAR(20)
) ENGINE=InnoDB;

CREATE TABLE financiaciones_matricula (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT,
    monto DECIMAL(12,2),
    cronograma_cuotas VARCHAR(255),
    estado_cartera VARCHAR(20) COMMENT 'al_dia, mora, pendiente',
    FOREIGN KEY (estudiante_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE solicitudes_compra (
    id INT AUTO_INCREMENT PRIMARY KEY,
    area_solicitante VARCHAR(100),
    descripcion TEXT,
    area_presupuesto_id INT,
    cotizaciones TEXT,
    proveedor_elegido VARCHAR(150),
    estado VARCHAR(30),
    FOREIGN KEY (area_presupuesto_id) REFERENCES presupuesto_areas(id)
) ENGINE=InnoDB;

CREATE TABLE solicitudes_viaticos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    proyecto_id INT,
    solicitante_id INT,
    transporte DECIMAL(10,2) DEFAULT 0,
    alimentacion DECIMAL(10,2) DEFAULT 0,
    alojamiento DECIMAL(10,2) DEFAULT 0,
    estado VARCHAR(30),
    FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE CASCADE,
    FOREIGN KEY (solicitante_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE protocolos_emprendimiento (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT,
    titulo VARCHAR(200),
    asesor_id INT,
    documento_url VARCHAR(255),
    FOREIGN KEY (estudiante_id) REFERENCES usuarios(id),
    FOREIGN KEY (asesor_id) REFERENCES usuarios(id)
) ENGINE=InnoDB;

CREATE TABLE lean_canvas (
    protocolo_id INT PRIMARY KEY,
    problema TEXT,
    solucion TEXT,
    propuesta_valor TEXT,
    segmentos_clientes TEXT,
    canales TEXT,
    FOREIGN KEY (protocolo_id) REFERENCES protocolos_emprendimiento(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inscripcion_semillero_externo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inscripcion_id INT NOT NULL UNIQUE,
    tipo_institucion VARCHAR(100) NOT NULL,
    procedencia VARCHAR(100) NOT NULL DEFAULT 'Semillero externo',
    institucion_procedencia VARCHAR(200) NOT NULL,
    semillero_nombre VARCHAR(200) NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscripcion_id) REFERENCES convocatoria_inscripciones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

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
    FOREIGN KEY (inscripcion_id) REFERENCES convocatoria_inscripciones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inscripcion_semillero_info_general (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inscripcion_id INT NOT NULL UNIQUE,
    titulo_trabajo VARCHAR(300) NOT NULL,
    linea_investigacion VARCHAR(150) NULL,
    palabras_clave VARCHAR(300) NOT NULL,
    resumen TEXT NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscripcion_id) REFERENCES convocatoria_inscripciones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS inscripcion_semillero_contenido (
    id INT AUTO_INCREMENT PRIMARY KEY,
    inscripcion_id INT NOT NULL UNIQUE,
    planteamiento_problema TEXT NOT NULL,
    objetivo_general TEXT NOT NULL,
    objetivos_especificos TEXT NOT NULL,
    metodologia TEXT NOT NULL,
    resultados_esperados TEXT NOT NULL,
    fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (inscripcion_id) REFERENCES convocatoria_inscripciones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

SET FOREIGN_KEY_CHECKS = 1;

-- ============================================================
-- Fin del script
-- ============================================================
