require('dotenv').config();
const mysql = require('mysql2/promise');

async function seedPermisos() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  try {
    // 1. Definir todos los permisos
    const permisos = [
      'dashboard.leer',
      'proyectos.leer', 'proyectos.crear', 'proyectos.editar', 'proyectos.eliminar',
      'convocatorias.leer', 'convocatorias.crear', 'convocatorias.editar', 'convocatorias.eliminar',
      'convocatorias.publicar', 'convocatorias.cerrar', 'convocatorias.comentar', 'convocatorias.consolidar',
      'semilleros.leer', 'semilleros.crear', 'semilleros.editar', 'semilleros.eliminar',
      'evaluaciones.leer', 'evaluaciones.evaluar',
      'usuarios.leer', 'usuarios.crear', 'usuarios.editar', 'usuarios.eliminar',
      'etica.aprobar', 'investigaciones.aprobar'
    ];

    console.log('Insertando permisos...');
    for (const p of permisos) {
      await pool.query('INSERT IGNORE INTO permisos (nombre) VALUES (?)', [p]);
    }

    // 2. Mapeo Rol -> Permisos
    const rolPermisoMap = {
      'administrador': permisos, // todos
      'directivos': ['dashboard.leer', 'proyectos.leer', 'convocatorias.leer', 'semilleros.leer', 'evaluaciones.leer', 'usuarios.leer', 'convocatorias.comentar'],
      'director_investigacion': ['dashboard.leer', 'proyectos.leer', 'convocatorias.leer', 'convocatorias.comentar', 'convocatorias.consolidar'],
      'director_semilleros': ['dashboard.leer', 'semilleros.leer', 'convocatorias.leer', 'convocatorias.comentar', 'convocatorias.consolidar'],
      'coordinador_investigacion': ['convocatorias.leer', 'convocatorias.crear', 'convocatorias.editar', 'convocatorias.publicar', 'convocatorias.cerrar'],
      'coordinador_semilleros': ['convocatorias.leer', 'convocatorias.crear', 'convocatorias.editar', 'convocatorias.publicar', 'convocatorias.cerrar'],
      'lider_investigacion': ['proyectos.leer', 'proyectos.editar'],
      'lider_semilleros': ['semilleros.leer', 'semilleros.editar'],
      'docente': ['proyectos.leer', 'convocatorias.leer', 'semilleros.leer'],
      'estudiante': ['convocatorias.leer', 'semilleros.leer'],
      'evaluador': ['evaluaciones.leer', 'evaluaciones.evaluar'],
      'comite_etica': ['convocatorias.leer', 'etica.aprobar'],
      'comite_investigacion': ['convocatorias.leer', 'investigaciones.aprobar'], // fix nombre: comite_investigaciones
      'externo': ['convocatorias.leer'],
    };

    // Fix name matching the DB which has `comité_investigación` or `comite_investigaciones` ? Let's check what we logged earlier.
    // Wait, the DB had 'comité_investigación' in the list I queried earlier! Let's ensure it maps to whatever is in DB.
    // I'll query roles first to map dynamically.
    const [rolesDb] = await pool.query('SELECT id, nombre FROM roles');
    const roleIdMap = {};
    rolesDb.forEach(r => { roleIdMap[r.nombre.toLowerCase()] = r.id; });

    // Handle character differences just in case
    const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    
    console.log('Asignando permisos a roles...');
    for (const [rolKey, asignados] of Object.entries(rolPermisoMap)) {
      const normKey = normalize(rolKey);
      const rolMatch = rolesDb.find(r => normalize(r.nombre) === normKey);
      
      if (!rolMatch) {
        console.warn(`Rol no encontrado en BD: ${rolKey}`);
        continue;
      }
      const rolId = rolMatch.id;

      for (const p of asignados) {
        const [[permisoDb]] = await pool.query('SELECT id FROM permisos WHERE nombre = ?', [p]);
        if (permisoDb) {
          await pool.query('INSERT IGNORE INTO rol_permiso (rol_id, permiso_id) VALUES (?, ?)', [rolId, permisoDb.id]);
        }
      }
    }

    console.log('✅ Permisos sembrados correctamente');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e);
    process.exit(1);
  }
}

seedPermisos();
