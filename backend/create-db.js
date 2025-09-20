const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

dotenv.config();

async function createDatabase() {
  // Conexión sin especificar base de datos para crearla
  const sequelize = new Sequelize('', 'root', '', {
    host: 'localhost',
    port: 3306,
    dialect: 'mysql',
    logging: console.log
  });

  try {
    console.log('Conectando a MySQL...');
    await sequelize.authenticate();
    console.log('Conexión exitosa a MySQL');

    // Crear la base de datos
    await sequelize.query('CREATE DATABASE IF NOT EXISTS golapp_db');
    console.log('Base de datos golapp_db creada exitosamente');

    await sequelize.close();
    console.log('Conexión cerrada');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

createDatabase();
