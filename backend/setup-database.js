const { Sequelize } = require('sequelize');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

async function setupDatabase() {
  console.log('🚀 Iniciando configuración de la base de datos GolApp...\n');

  // Conexión sin especificar base de datos para crearla
  const sequelize = new Sequelize('', process.env.DB_USER || 'root', process.env.DB_PASSWORD || '', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql',
    logging: false // Desactivar logs para una salida más limpia
  });

  try {
    console.log('📡 Conectando a MySQL...');
    await sequelize.authenticate();
    console.log('✅ Conexión exitosa a MySQL\n');

    // Leer el archivo SQL
    const sqlFilePath = path.join(__dirname, 'golapp_database.sql');
    console.log('📄 Leyendo archivo SQL:', sqlFilePath);
    
    if (!fs.existsSync(sqlFilePath)) {
      throw new Error('No se encontró el archivo golapp_database.sql');
    }

    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    console.log('✅ Archivo SQL leído correctamente\n');

    // Dividir el contenido SQL en declaraciones individuales
    const sqlStatements = sqlContent
      .split(';')
      .map(statement => statement.trim())
      .filter(statement => statement.length > 0 && !statement.startsWith('--'));

    console.log('🔧 Ejecutando declaraciones SQL...');
    
    // Ejecutar cada declaración SQL
    for (let i = 0; i < sqlStatements.length; i++) {
      const statement = sqlStatements[i];
      
      if (statement.includes('DELIMITER')) {
        continue; // Saltar declaraciones DELIMITER
      }
      
      try {
        await sequelize.query(statement);
        
        // Mostrar progreso para declaraciones importantes
        if (statement.includes('CREATE DATABASE')) {
          console.log('✅ Base de datos creada');
        } else if (statement.includes('CREATE TABLE')) {
          const tableName = statement.match(/CREATE TABLE (\w+)/i)?.[1];
          console.log(`✅ Tabla ${tableName} creada`);
        } else if (statement.includes('INSERT INTO')) {
          const tableName = statement.match(/INSERT INTO (\w+)/i)?.[1];
          console.log(`📝 Datos insertados en ${tableName}`);
        }
      } catch (error) {
        if (!error.message.includes('already exists')) {
          console.warn(`⚠️  Advertencia en declaración ${i + 1}:`, error.message);
        }
      }
    }

    console.log('\n🎉 ¡Base de datos configurada exitosamente!');
    console.log('\n📊 Resumen de la configuración:');
    console.log('   - Base de datos: golapp_db');
    console.log('   - Host:', process.env.DB_HOST || 'localhost');
    console.log('   - Puerto:', process.env.DB_PORT || 3306);
    console.log('   - Usuario:', process.env.DB_USER || 'root');
    console.log('\n🔐 Usuario administrador creado:');
    console.log('   - Email: admin@golapp.com');
    console.log('   - Contraseña: admin123 (cambiar en producción)');
    
    await sequelize.close();
    console.log('\n✅ Conexión cerrada correctamente');
    
  } catch (error) {
    console.error('\n❌ Error durante la configuración:', error.message);
    console.error('\n🔍 Posibles soluciones:');
    console.error('   1. Verificar que MySQL esté ejecutándose');
    console.error('   2. Verificar las credenciales en el archivo .env');
    console.error('   3. Verificar que el usuario tenga permisos para crear bases de datos');
    process.exit(1);
  }
}

// Ejecutar la configuración
setupDatabase();