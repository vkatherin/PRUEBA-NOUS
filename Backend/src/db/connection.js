const mysql = require('mysql2/promise');

function createPostgresPool() {
  const { Pool } = require('pg');
  const tablesWithGeneratedId = new Set([
    'usuarios', 'convocatorias', 'convocatoria_externa', 'convocatoria_inscripciones',
    'convocatoria_inscripcion_documentos', 'inscripcion_semillero_externo',
    'inscripcion_semillero_integrantes', 'inscripcion_semillero_info_general',
    'inscripcion_semillero_contenido', 'proyectos', 'evaluaciones', 'evaluacion_criterios',
    'semilleros', 'reportes_soporte', 'formatos_institucionales', 'documentos', 'usuario_mfa',
  ]);
  // Supabase muestra [PASSWORD] como marcador; quitar esos corchetes evita
  // que pg rechace la URL antes de intentar autenticar.
  const connectionString = process.env.DATABASE_URL?.replace(
    /:\[([^\]]+)\]@/,
    ':$1@'
  );
  const config = process.env.PGHOST
    ? {
        host: process.env.PGHOST || process.env.DB_HOST,
        port: process.env.PGPORT || process.env.DB_PORT || 5432,
        user: process.env.PGUSER || process.env.DB_USER,
        password: process.env.PGPASSWORD || process.env.DB_PASSWORD,
        database: process.env.PGDATABASE || process.env.DB_NAME || 'postgres',
        ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
      }
    : { connectionString, ssl: { rejectUnauthorized: false } };

  const pool = new Pool(config);
  const rawPoolQuery = pool.query.bind(pool);

  function translateSql(sql) {
    let parameterIndex = 0;
    return sql
      .replace(/\?/g, () => `$${++parameterIndex}`)
      .replace(/NOW\(\)/gi, 'CURRENT_TIMESTAMP')
      .replace(/CURDATE\(\)/gi, 'CURRENT_DATE')
      .replace(/JSON_ARRAYAGG\(/gi, 'JSON_AGG(');
  }

  async function execute(client, sql, params) {
    let postgresSql = translateSql(sql);
    const insertMatch = postgresSql.match(/INSERT\s+INTO\s+([a-z_]+)/i);
    if (insertMatch && tablesWithGeneratedId.has(insertMatch[1].toLowerCase()) && !/\bRETURNING\b/i.test(postgresSql)) {
      postgresSql = `${postgresSql.trim().replace(/;$/, '')} RETURNING id`;
    }
    const result = await (client === pool ? rawPoolQuery(postgresSql, params) : client.query(postgresSql, params));
    const command = result.command.toUpperCase();
    if (command === 'SELECT' || command === 'SHOW' || command === 'WITH') {
      return [result.rows, { affectedRows: result.rowCount }];
    }

    return [{
      insertId: result.rows[0]?.id || null,
      affectedRows: result.rowCount,
    }, result.fields];
  }

  // Mantiene el contrato [rows, metadata] que usa actualmente el backend.
  pool.query = (sql, params) => execute(pool, sql, params);

  // Adaptador de transacciones para módulos que antes usaban mysql2.
  pool.getConnection = async () => {
    const client = await pool.connect();
    return {
      query: (sql, params) => execute(client, sql, params),
      beginTransaction: () => client.query('BEGIN'),
      commit: () => client.query('COMMIT'),
      rollback: () => client.query('ROLLBACK'),
      release: () => client.release(),
    };
  };

  return pool;
}

const isPostgres = (process.env.DB_CLIENT || 'mysql').toLowerCase() === 'postgres';
const pool = isPostgres
  ? createPostgresPool()
  : mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

// Verifica la conexión al arrancar el servidor.
const connectionCheck = isPostgres
  ? pool.query('SELECT 1')
      .then(() => console.log('✅ Conectado a PostgreSQL/Supabase'))
  : pool.getConnection()
      .then((conn) => {
        console.log('✅ Conectado a MySQL');
        conn.release();
      });

connectionCheck.catch((err) => {
  console.error(`❌ Error al conectar a ${isPostgres ? 'PostgreSQL/Supabase' : 'MySQL'}:`, err.message);
});

module.exports = pool;