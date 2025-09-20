const db = require('./models');

async function syncTables() {
  try {
    console.log('Conectando a la base de datos golapp_db...');
    
    // Probar la conexión
    await db.sequelize.authenticate();
    console.log('Conexión exitosa a MySQL');
    
    // Sincronizar todos los modelos (crear tablas)
    await db.sequelize.sync({ force: true }); // force: true recreará las tablas
    console.log('Todas las tablas han sido sincronizadas exitosamente');
    
    // Mostrar las tablas creadas
    const [results] = await db.sequelize.query('SHOW TABLES');
    console.log('Tablas creadas:');
    results.forEach(row => {
      console.log('- ' + Object.values(row)[0]);
    });
    
    await db.sequelize.close();
    console.log('Conexión cerrada');
    process.exit(0);
  } catch (error) {
    console.error('Error al sincronizar las tablas:', error.message);
    process.exit(1);
  }
}

syncTables();
