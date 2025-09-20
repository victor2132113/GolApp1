const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');

// Cargar las variables de entorno
dotenv.config();

// Crear una nueva instancia de Sequelize para MySQL local
const sequelize = new Sequelize(
  process.env.DB_NAME || 'golapp_db',
  process.env.DB_USER || 'root',
  process.env.DB_PASSWORD || '',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: console.log, // Activar logs para debug
    define: {
      timestamps: true,
      underscored: false
    }
  }
);

// Exportar la instancia para usarla en otros archivos del proyecto
module.exports = sequelize;
