/**
 * Script de prueba de conexión a la base de datos
 * Ejecutar con: node src/db/test-connection.js
 */

const { Sequelize } = require('sequelize');
require('dotenv').config();

console.log('\n🔍 Intentando conectar con los siguientes datos:');
console.log(`   Host     : ${process.env.DB_HOST}`);
console.log(`   Puerto   : ${process.env.DB_PORT || 3306}`);
console.log(`   Base datos: ${process.env.DB_NAME}`);
console.log(`   Usuario  : ${process.env.DB_USER}`);
console.log('   Password : ****\n');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false,
  }
);

(async () => {
  try {
    // 1. Probar autenticación
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa a la base de datos!');

    // 2. Listar las tablas existentes en nous_db
    const [tables] = await sequelize.query('SHOW TABLES;');
    console.log(`\n📋 Tablas encontradas en "${process.env.DB_NAME}" (${tables.length} tablas):`);
    tables.forEach((t, i) => {
      const tableName = Object.values(t)[0];
      console.log(`   ${i + 1}. ${tableName}`);
    });

    console.log('\n🎉 Todo listo! Tu backend puede hablar con la base de datos.\n');
  } catch (error) {
    console.error('\n❌ Error de conexión:');
    console.error(`   ${error.message}\n`);

    // Ayuda según el tipo de error
    if (error.message.includes('ECONNREFUSED')) {
      console.log('💡 Solución: El puerto 3306 está bloqueado.');
      console.log('   → Usa un túnel SSH: ssh -L 3307:localhost:3306 usuario@yeshua.unicatolicadelsur.edu.co -N');
      console.log('   → Luego cambia DB_HOST=127.0.0.1 y DB_PORT=3307 en tu .env\n');
    } else if (error.message.includes('Access denied')) {
      console.log('💡 Solución: Usuario o contraseña incorrectos.');
      console.log('   → Revisa DB_USER y DB_PASSWORD en tu archivo .env\n');
    } else if (error.message.includes('Unknown database')) {
      console.log('💡 Solución: La base de datos no existe.');
      console.log('   → Verifica que DB_NAME=nous_db sea correcto en tu .env\n');
    } else if (error.message.includes('ETIMEDOUT')) {
      console.log('💡 Solución: El servidor no responde (timeout).');
      console.log('   → Verifica que el host sea correcto en DB_HOST\n');
    }

    process.exit(1);
  } finally {
    await sequelize.close();
  }
})();
