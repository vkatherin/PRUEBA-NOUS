const pool = require('./src/db/connection');

async function check() {
  try {
    const [[user]] = await pool.query('SELECT id, correo_institucional FROM usuarios WHERE correo_institucional = ?', ['admin@unicatolicadelsur.edu.co']);
    if (!user) {
      console.log('User not found');
      return;
    }
    console.log('User ID:', user.id);
    const [roles] = await pool.query('SELECT r.nombre FROM usuario_rol ur JOIN roles r ON ur.rol_id = r.id WHERE ur.usuario_id = ?', [user.id]);
    console.log('Roles for user:', roles.map(r => r.nombre));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit(0);
  }
}

check();
