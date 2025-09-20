const db = require('./models');
const Usuario = db.Usuario;

async function checkUsers() {
  try {
    const users = await Usuario.findAll();
    console.log('Usuarios existentes en la base de datos:');
    console.log('=====================================');
    
    if (users.length === 0) {
      console.log('No hay usuarios en la base de datos.');
    } else {
      users.forEach(user => {
        console.log(`ID: ${user.id}`);
        console.log(`Nombre: ${user.nombre}`);
        console.log(`Email: ${user.correo}`);
        console.log(`Rol: ${user.rol}`);
        console.log(`Teléfono: ${user.telefono || 'N/A'}`);
        console.log('---');
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUsers();