'use strict';
/**
 * Seed de datos de prueba para NOUS
 * Crea usuarios con distintos roles, convocatorias, semilleros,
 * proyectos completos (descripción + metodología + equipo +
 * cronograma + productos + riesgos), y evaluaciones asignadas.
 *
 * Seguro de correr varias veces: verifica existencia antes de
 * insertar en cada tabla (por correo, título o código según aplique).
 *
 * Uso:  cd Backend && node ../seed_datos_prueba.js
 * (o colócalo dentro de Backend/src/db/ y ajusta la ruta del require
 *  de connection.js si lo mueves)
 */
require('dotenv').config();
const bcrypt = require('bcryptjs');
const pool = require('./src/db/connection');

const PASSWORD_PRUEBA = 'Prueba2026!';

async function main() {
  console.log('\n🌱  Sembrando datos de prueba para NOUS...\n');
  const passwordHash = await bcrypt.hash(PASSWORD_PRUEBA, 12);

  // ── 1. Roles: mapa nombre -> id ──────────────────────────────────────────
  const [rolesRows] = await pool.query('SELECT id, nombre FROM roles');
  const rolId = {};
  rolesRows.forEach(r => { rolId[r.nombre] = r.id; });

  function requireRol(nombre) {
    if (!rolId[nombre]) throw new Error(`El rol '${nombre}' no existe en la tabla roles. Corrige el nombre o créalo primero.`);
    return rolId[nombre];
  }

  // ── 2. Usuarios de prueba ─────────────────────────────────────────────────
  const usuariosDef = [
    { correo: 'director.investigacion@unicatolicadelsur.edu.co', nombre: 'Marta Elena Rodríguez', cedula: '10100001', rol: 'director_investigacion' },
    { correo: 'coordinador.investigacion@unicatolicadelsur.edu.co', nombre: 'Jorge Andrés Muñoz', cedula: '10100002', rol: 'coordinador_investigacion' },
    { correo: 'lider1.investigacion@unicatolicadelsur.edu.co', nombre: 'Diana Carolina Ortega', cedula: '10100003', rol: 'lider_investigacion' },
    { correo: 'lider2.investigacion@unicatolicadelsur.edu.co', nombre: 'Fernando José Delgado', cedula: '10100004', rol: 'lider_investigacion' },
    { correo: 'docente.prueba@unicatolicadelsur.edu.co', nombre: 'Ana Lucía Benavides', cedula: '10100005', rol: 'docente' },
    { correo: 'estudiante.prueba@unicatolicadelsur.edu.co', nombre: 'Cristian David Erazo', cedula: '10100006', rol: 'estudiante' },
    { correo: 'evaluador1@unicatolicadelsur.edu.co', nombre: 'Patricia Isabel Guerrero', cedula: '10100007', rol: 'evaluador' },
    { correo: 'evaluador2@unicatolicadelsur.edu.co', nombre: 'Ricardo Andrés Solarte', cedula: '10100008', rol: 'evaluador' },
    { correo: 'comite.etica@unicatolicadelsur.edu.co', nombre: 'Gloria Stella Narváez', cedula: '10100009', rol: 'comite_etica' },
    { correo: 'comite.investigaciones@unicatolicadelsur.edu.co', nombre: 'Hernán Darío Chamorro', cedula: '10100010', rol: 'comite_investigacion' },
    { correo: 'director.semilleros@unicatolicadelsur.edu.co', nombre: 'Sandra Milena Paz', cedula: '10100011', rol: 'director_semilleros' },
    { correo: 'coordinador.semilleros@unicatolicadelsur.edu.co', nombre: 'Wilson Fabián Portilla', cedula: '10100012', rol: 'coordinador_semilleros' },
    { correo: 'lider.semillero1@unicatolicadelsur.edu.co', nombre: 'Claudia Ximena Rosero', cedula: '10100013', rol: 'lider_semilleros' },
    { correo: 'lider.semillero2@unicatolicadelsur.edu.co', nombre: 'Édgar Mauricio Bastidas', cedula: '10100014', rol: 'lider_semilleros' },
  ];

  const usuarioId = {};
  for (const u of usuariosDef) {
    const [[existente]] = await pool.query('SELECT id FROM usuarios WHERE correo_institucional = ?', [u.correo]);
    let id;
    if (existente) {
      id = existente.id;
    } else {
      const [result] = await pool.query(`
        INSERT INTO usuarios
          (nombre_completo, correo_institucional, cedula, password_hash, mfa_habilitado, activo,
           fecha_creacion, acepto_tratamiento_datos, fecha_aceptacion_datos, version_politica_aceptada)
        VALUES (?, ?, ?, ?, 0, 1, NOW(), 1, NOW(), '1.0')
      `, [u.nombre, u.correo, u.cedula, passwordHash]);
      id = result.insertId;
      console.log(`✅  Usuario creado: ${u.nombre} (${u.correo})`);
    }
    usuarioId[u.correo] = id;
    await pool.query('INSERT IGNORE INTO usuario_rol (usuario_id, rol_id) VALUES (?, ?)', [id, requireRol(u.rol)]);
  }
  console.log(`\n📌  Contraseña para TODOS los usuarios de prueba: ${PASSWORD_PRUEBA}\n`);

  // ── 3. Catálogos base (solo si están vacíos) ─────────────────────────────
  async function seedCatalogoSiVacio(tabla, columnas, filas) {
    const [[{ total }]] = await pool.query(`SELECT COUNT(*) as total FROM ${tabla}`);
    if (total > 0) return;
    for (const fila of filas) {
      await pool.query(`INSERT INTO ${tabla} (${columnas.join(',')}) VALUES (${columnas.map(() => '?').join(',')})`, fila);
    }
    console.log(`✅  Catálogo '${tabla}' sembrado (${filas.length} filas)`);
  }

  await seedCatalogoSiVacio('lineas_investigacion', ['nombre'], [
    ['Salud y Bienestar'], ['Tecnología e Innovación'], ['Ciencias Sociales y Educación'],
  ]);
  await seedCatalogoSiVacio('programas_academicos', ['nombre', 'facultad'], [
    ['Ingeniería de Sistemas', 'Facultad de Ingeniería'],
    ['Administración de Empresas', 'Facultad de Ciencias Económicas'],
  ]);
  await seedCatalogoSiVacio('areas_conocimiento', ['nombre'], [
    ['Ciencias de la Computación'], ['Ciencias Sociales'],
  ]);
  await seedCatalogoSiVacio('ods', ['numero', 'nombre'], [
    [3, 'Salud y bienestar'], [4, 'Educación de calidad'], [9, 'Industria, innovación e infraestructura'],
  ]);

  const [[linea1]] = await pool.query('SELECT id FROM lineas_investigacion LIMIT 1');
  const [[prog1]] = await pool.query('SELECT id FROM programas_academicos LIMIT 1');

  // ── 4. Convocatorias ──────────────────────────────────────────────────────
  async function getOrCrearConvocatoria(titulo, data) {
    const [[existente]] = await pool.query('SELECT id FROM convocatorias WHERE titulo = ?', [titulo]);
    if (existente) return existente.id;
    const [result] = await pool.query(`
      INSERT INTO convocatorias
        (titulo, tipo, dirigida_a, descripcion, fecha_apertura, fecha_cierre,
         rubro_disponible, estado, requisitos, creado_por, aprobada_comite)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      titulo, data.tipo, data.dirigida_a, data.descripcion, data.fecha_apertura, data.fecha_cierre,
      data.rubro_disponible || 0, data.estado, data.requisitos || null,
      usuarioId['coordinador.investigacion@unicatolicadelsur.edu.co'], data.aprobada_comite ? 1 : 0,
    ]);
    console.log(`✅  Convocatoria creada: ${titulo}`);
    return result.insertId;
  }

  const hoy = new Date();
  const en5dias = new Date(hoy.getTime() + 5 * 86400000).toISOString().slice(0, 10);
  const hace10dias = new Date(hoy.getTime() - 10 * 86400000).toISOString().slice(0, 10);
  const en60dias = new Date(hoy.getTime() + 60 * 86400000).toISOString().slice(0, 10);

  const convocatoriaActivaId = await getOrCrearConvocatoria('Fondo de Investigación Institucional 2026-II', {
    tipo: 'Interna', dirigida_a: 'Docente',
    descripcion: 'Convocatoria de prueba para financiar proyectos de investigación formal.',
    fecha_apertura: hace10dias, fecha_cierre: en5dias, rubro_disponible: 50000000,
    estado: 'publicada', aprobada_comite: true,
    requisitos: 'Anteproyecto de investigación|Hoja de vida CvLAC|Aval del programa',
  });

  await getOrCrearConvocatoria('Convocatoria Semilleros 2026-II', {
    tipo: 'Interna', dirigida_a: 'Estudiante',
    descripcion: 'Convocatoria de prueba dirigida a semilleros de investigación.',
    fecha_apertura: hace10dias, fecha_cierre: en60dias, rubro_disponible: 10000000,
    estado: 'borrador', aprobada_comite: false,
  });

  // ── 5. Semilleros ─────────────────────────────────────────────────────────
  async function getOrCrearSemillero(nombre, data) {
    const [[existente]] = await pool.query('SELECT id FROM semilleros WHERE nombre = ?', [nombre]);
    if (existente) return existente.id;
    const [result] = await pool.query(`
      INSERT INTO semilleros
        (nombre, codigo, programa_id, lider_profesor_id, tema_interes, vision, mision,
         vobo_programa, vobo_vicerrectoria, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE())
    `, [nombre, data.codigo, prog1.id, data.lider_profesor_id, data.tema_interes, data.vision, data.mision, 1, 1]);
    console.log(`✅  Semillero creado: ${nombre}`);
    return result.insertId;
  }

  const semillero1Id = await getOrCrearSemillero('Semillero de Investigación en Tecnología Aplicada', {
    codigo: 'SEM-PRUEBA-001',
    lider_profesor_id: usuarioId['lider.semillero1@unicatolicadelsur.edu.co'],
    tema_interes: 'Desarrollo de software y transformación digital',
    vision: 'Ser un semillero referente en innovación tecnológica regional.',
    mision: 'Formar jóvenes investigadores en tecnología aplicada a problemas reales.',
  });

  await pool.query(`
    INSERT IGNORE INTO semillero_integrantes
      (semillero_id, usuario_id, documento_identidad, horas_semanales, semestre, fecha_ingreso, estado)
    VALUES (?, ?, ?, ?, ?, CURDATE(), 'activo')
  `, [semillero1Id, usuarioId['estudiante.prueba@unicatolicadelsur.edu.co'], '10100006', 8, 6]);

  // ── 6. Proyectos completos ───────────────────────────────────────────────
  async function getOrCrearProyecto(titulo, data) {
    const [[existente]] = await pool.query('SELECT id FROM proyectos WHERE titulo = ?', [titulo]);
    if (existente) return existente.id;

    const [result] = await pool.query(`
      INSERT INTO proyectos
        (titulo, codigo_unico, tipo_proyecto, convocatoria_id, linea_investigacion_id, programa_id,
         fecha_inicio, duracion_meses, lugar_ejecucion, valor_total, estado, investigador_principal_id, fecha_creacion)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
    `, [
      titulo, data.codigo_unico, data.tipo_proyecto, data.convocatoria_id || null, linea1.id, prog1.id,
      data.fecha_inicio, data.duracion_meses, 'Sede principal - Pasto', data.valor_total, data.estado,
      data.investigador_principal_id,
    ]);
    const proyectoId = result.insertId;
    console.log(`✅  Proyecto creado: ${titulo} (${data.estado})`);

    await pool.query(`
      INSERT INTO proyecto_descripcion
        (proyecto_id, palabras_clave, resumen_ejecutivo, justificacion, contexto,
         planteamiento_problema, pregunta_investigacion, objetivo_general, objetivos_especificos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      proyectoId, data.palabras_clave,
      data.resumen, data.justificacion, data.contexto,
      data.planteamiento, data.pregunta, data.objetivo_general, data.objetivos_especificos,
    ]);

    await pool.query(`
      INSERT INTO proyecto_metodologia (proyecto_id, tipo_estudio, variables, etapas, fuentes_instrumentos)
      VALUES (?, ?, ?, ?, ?)
    `, [proyectoId, data.tipo_estudio, data.variables, data.etapas, data.fuentes]);

    await pool.query(`
      INSERT INTO proyecto_equipo (proyecto_id, usuario_id, rol_en_proyecto, entidad)
      VALUES (?, ?, 'investigador_principal', 'Fundación Universitaria Católica del Sur')
    `, [proyectoId, data.investigador_principal_id]);

    for (const act of data.cronograma) {
      await pool.query(`
        INSERT INTO proyecto_cronograma (proyecto_id, actividad, fecha_inicio, fecha_fin, indicador_resultado, responsable_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [proyectoId, act.actividad, act.inicio, act.fin, act.indicador, data.investigador_principal_id]);
    }

    for (const prod of data.productos) {
      await pool.query(`
        INSERT INTO proyecto_productos (proyecto_id, descripcion, cantidad, fecha_entrega, estado)
        VALUES (?, ?, ?, ?, ?)
      `, [proyectoId, prod.descripcion, prod.cantidad, prod.fecha, prod.estado]);
    }

    await pool.query(`
      INSERT INTO proyecto_riesgos (proyecto_id, nombre_riesgo, causa, efecto, manejo_previsto)
      VALUES (?, ?, ?, ?, ?)
    `, [proyectoId, data.riesgo_nombre, data.riesgo_causa, data.riesgo_efecto, data.riesgo_manejo]);

    return proyectoId;
  }

  const proyecto1Id = await getOrCrearProyecto('Sistema de Alerta Temprana para Deserción Universitaria', {
    codigo_unico: 'PRY-PRUEBA-001', tipo_proyecto: 'formal', convocatoria_id: convocatoriaActivaId,
    fecha_inicio: hace10dias, duracion_meses: 12, valor_total: 35000000, estado: 'en_ejecucion',
    investigador_principal_id: usuarioId['lider1.investigacion@unicatolicadelsur.edu.co'],
    palabras_clave: 'deserción, analítica de datos, educación superior',
    resumen: 'Proyecto de prueba que desarrolla un modelo predictivo para identificar estudiantes en riesgo de deserción.',
    justificacion: 'La deserción universitaria representa un reto institucional que requiere intervención temprana basada en datos.',
    contexto: 'Fundación Universitaria Católica del Sur, sede Pasto',
    planteamiento: '¿Cómo identificar tempranamente a estudiantes en riesgo de deserción usando datos académicos históricos?',
    pregunta: '¿Qué variables académicas predicen con mayor precisión el riesgo de deserción?',
    objetivo_general: 'Desarrollar un modelo predictivo de riesgo de deserción estudiantil.',
    objetivos_especificos: 'Recolectar datos históricos; entrenar modelo predictivo; validar con casos reales; construir tablero de alertas.',
    tipo_estudio: 'Cuantitativo',
    variables: 'Promedio académico, asistencia, estrato socioeconómico, programa académico.',
    etapas: 'Recolección de datos, preprocesamiento, modelado, validación, despliegue.',
    fuentes: 'Base de datos académica institucional, encuestas a estudiantes.',
    cronograma: [
      { actividad: 'Recolección y limpieza de datos históricos', inicio: hace10dias, fin: en5dias, indicador: 'Dataset limpio y documentado' },
      { actividad: 'Entrenamiento del modelo predictivo', inicio: en5dias, fin: en60dias, indicador: 'Modelo con precisión >80%' },
    ],
    productos: [
      { descripcion: 'Artículo científico sobre el modelo predictivo', cantidad: 1, fecha: en60dias, estado: 'planeado' },
    ],
    riesgo_nombre: 'Calidad insuficiente de los datos históricos',
    riesgo_causa: 'Registros incompletos en el sistema académico institucional',
    riesgo_efecto: 'Modelo predictivo con baja precisión',
    riesgo_manejo: 'Validación y limpieza exhaustiva antes del modelado, con imputación de valores faltantes',
  });

  await getOrCrearProyecto('Estrategias Pedagógicas para la Enseñanza Virtual en Zonas Rurales', {
    codigo_unico: 'PRY-PRUEBA-002', tipo_proyecto: 'formativa', convocatoria_id: null,
    fecha_inicio: hace10dias, duracion_meses: 8, valor_total: 12000000, estado: 'propuesta',
    investigador_principal_id: usuarioId['lider2.investigacion@unicatolicadelsur.edu.co'],
    palabras_clave: 'educación rural, virtualidad, brecha digital',
    resumen: 'Proyecto de prueba que analiza estrategias pedagógicas efectivas en contextos rurales con conectividad limitada.',
    justificacion: 'La virtualidad educativa enfrenta retos particulares en zonas rurales del departamento de Nariño.',
    contexto: 'Zona rural de Nariño, instituciones educativas asociadas',
    planteamiento: '¿Qué estrategias pedagógicas funcionan mejor en entornos virtuales con conectividad limitada?',
    pregunta: '¿Cómo adaptar contenidos virtuales a condiciones de baja conectividad?',
    objetivo_general: 'Diseñar estrategias pedagógicas adaptadas a la enseñanza virtual rural.',
    objetivos_especificos: 'Diagnosticar condiciones de conectividad; diseñar estrategias; pilotear con docentes.',
    tipo_estudio: 'Cualitativo',
    variables: 'Nivel de conectividad, engagement estudiantil, percepción docente.',
    etapas: 'Diagnóstico, diseño, pilotaje, evaluación.',
    fuentes: 'Entrevistas a docentes, encuestas a estudiantes.',
    cronograma: [
      { actividad: 'Diagnóstico de condiciones de conectividad', inicio: hace10dias, fin: en5dias, indicador: 'Informe diagnóstico' },
    ],
    productos: [
      { descripcion: 'Guía de estrategias pedagógicas rurales', cantidad: 1, fecha: en60dias, estado: 'planeado' },
    ],
    riesgo_nombre: 'Baja disponibilidad de docentes para el pilotaje',
    riesgo_causa: 'Carga académica de las instituciones asociadas',
    riesgo_efecto: 'Retraso en la fase de validación',
    riesgo_manejo: 'Coordinación anticipada con rectores de las instituciones educativas',
  });

  const proyecto3Id = await getOrCrearProyecto('Caracterización de Emprendimientos Locales Post-Pandemia', {
    codigo_unico: 'PRY-PRUEBA-003', tipo_proyecto: 'formal', convocatoria_id: null,
    fecha_inicio: hace10dias, duracion_meses: 10, valor_total: 20000000, estado: 'terminado',
    investigador_principal_id: usuarioId['lider1.investigacion@unicatolicadelsur.edu.co'],
    palabras_clave: 'emprendimiento, reactivación económica, pandemia',
    resumen: 'Proyecto de prueba (ya finalizado) que caracteriza los emprendimientos surgidos tras la pandemia en Pasto.',
    justificacion: 'Comprender los nuevos emprendimientos permite diseñar políticas de apoyo económico local.',
    contexto: 'Municipio de Pasto, Nariño',
    planteamiento: '¿Qué características tienen los emprendimientos surgidos después de la pandemia?',
    pregunta: '¿Qué factores explican la sostenibilidad de estos emprendimientos?',
    objetivo_general: 'Caracterizar los emprendimientos locales surgidos post-pandemia.',
    objetivos_especificos: 'Identificar emprendimientos; encuestar a emprendedores; analizar factores de sostenibilidad.',
    tipo_estudio: 'Mixto',
    variables: 'Sector económico, tiempo de operación, número de empleados, acceso a financiación.',
    etapas: 'Identificación, encuesta, análisis, informe final.',
    fuentes: 'Encuestas a emprendedores, registros de Cámara de Comercio.',
    cronograma: [
      { actividad: 'Encuesta a emprendedores locales', inicio: hace10dias, fin: en5dias, indicador: '100 encuestas aplicadas' },
    ],
    productos: [
      { descripcion: 'Informe de caracterización de emprendimientos', cantidad: 1, fecha: hace10dias, estado: 'entregado' },
    ],
    riesgo_nombre: 'Baja tasa de respuesta de emprendedores',
    riesgo_causa: 'Desconfianza a compartir información del negocio',
    riesgo_efecto: 'Muestra insuficiente para conclusiones robustas',
    riesgo_manejo: 'Alianza con la Cámara de Comercio para facilitar el contacto',
  });

  // ── 7. Evaluaciones asignadas ─────────────────────────────────────────────
  async function getOrCrearEvaluacion(proyectoId, evaluadorId, tipo, data) {
    const [[existente]] = await pool.query(
      'SELECT id FROM evaluaciones WHERE proyecto_id = ? AND evaluador_id = ? AND tipo = ?',
      [proyectoId, evaluadorId, tipo]
    );
    if (existente) return existente.id;
    const [result] = await pool.query(`
      INSERT INTO evaluaciones (proyecto_id, evaluador_id, tipo, fecha_asignacion, fecha_limite, estado, puntaje_total, observaciones)
      VALUES (?, ?, ?, CURDATE(), ?, ?, ?, ?)
    `, [proyectoId, evaluadorId, tipo, data.fecha_limite, data.estado, data.puntaje || null, data.observaciones || null]);
    console.log(`✅  Evaluación asignada (proyecto ${proyectoId} → evaluador ${evaluadorId})`);
    return result.insertId;
  }

  await getOrCrearEvaluacion(
    proyecto1Id, usuarioId['evaluador1@unicatolicadelsur.edu.co'], 'protocolo_60pts',
    { fecha_limite: en5dias, estado: 'pendiente' }
  );
  await getOrCrearEvaluacion(
    proyecto3Id, usuarioId['evaluador2@unicatolicadelsur.edu.co'], 'sustentacion_40pts',
    { fecha_limite: hace10dias, estado: 'completada', puntaje: 88.5, observaciones: 'Buen desarrollo metodológico y resultados claros. Evaluación de prueba.' }
  );

  console.log('\n🎉  Datos de prueba sembrados correctamente.\n');
  console.log('Resumen de usuarios creados (todos con la misma contraseña):');
  console.log(`  Contraseña: ${PASSWORD_PRUEBA}\n`);
  usuariosDef.forEach(u => console.log(`  · ${u.correo}  →  ${u.rol}`));
  console.log('');

  await pool.end();
}

main().catch((err) => {
  console.error('\n❌  Error sembrando datos de prueba:', err.message);
  console.error(err);
  process.exit(1);
});
