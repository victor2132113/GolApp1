const db = require('./models');

async function syncDatabase() {
  try {
    console.log('Conectando a MySQL...');
    
    // Primero crear la base de datos si no existe
    const sequelize = db.sequelize;
    
    // Crear la base de datos
    await sequelize.query('CREATE DATABASE IF NOT EXISTS golapp_db');
    console.log('Base de datos golapp_db creada o ya existe');
    
    // Usar la base de datos
    await sequelize.query('USE golapp_db');
    console.log('Usando base de datos golapp_db');
    
    // Sincronizar todos los modelos
    await db.sequelize.sync({ force: true }); // force: true recreará las tablas
    console.log('Todas las tablas han sido sincronizadas exitosamente');
    
    // Mostrar las tablas creadas
    const [results] = await sequelize.query('SHOW TABLES');
    console.log('Tablas creadas:', results.map(row => Object.values(row)[0]));
    
    process.exit(0);
  } catch (error) {
    console.error('Error al sincronizar la base de datos:', error);
    process.exit(1);
  }
}

syncDatabase();
