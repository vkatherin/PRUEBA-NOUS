const pool = require('./src/db/connection');
pool.query("INSERT IGNORE INTO roles (nombre) VALUES ('externo')")
  .then(() => { console.log('Rol externo creado'); process.exit(0); })
  .catch(e => console.error(e));
