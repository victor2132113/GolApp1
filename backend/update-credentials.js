const db = require('./models');
const Usuario = db.Usuario;

async function updateCredentials() {
  try {
    console.log('Conectando a la base de datos...');
    
    // Primero, verificar qué usuarios existen
    const usuarios = await Usuario.findAll();
    console.log('Usuarios existentes:');
    usuarios.forEach(user => {
      console.log(`- ID: ${user.id}, Email: ${user.correo}, Rol: ${user.rol}, Nombre: ${user.nombre}`);
    });

    // Buscar el primer usuario administrador o el primer usuario en general
    let adminUser = await Usuario.findOne({ where: { rol: 'administrador' } });
    
    if (!adminUser) {
      // Si no hay administrador, tomar el primer usuario
      adminUser = await Usuario.findOne();
      console.log('No se encontró administrador, actualizando el primer usuario...');
    }

    if (!adminUser) {
      console.log('❌ No hay usuarios en la base de datos. Creando nuevo usuario administrador...');
      
      // Crear nuevo usuario administrador
      const nuevoAdmin = await Usuario.create({
        nombre: 'Kaleth Admin',
        correo: 'kalethpro4@gmail.com',
        contrasena: 'kale123',
        rol: 'administrador',
        telefono: '3001234567'
      });
      
      console.log('✅ Usuario administrador creado exitosamente');
      console.log('📧 Email: kalethpro4@gmail.com');
      console.log('🔑 Contraseña: kale123');
      console.log('👤 Nombre: Kaleth Admin');
    } else {
      // Actualizar usuario existente
      await adminUser.update({
        nombre: 'Kaleth Admin',
        correo: 'kalethpro4@gmail.com',
        contrasena: 'kale123',
        rol: 'administrador'
      });

      console.log('✅ Credenciales actualizadas exitosamente');
      console.log('📧 Nuevo email: kalethpro4@gmail.com');
      console.log('🔑 Nueva contraseña: kale123');
      console.log('👤 Nombre actualizado: Kaleth Admin');
    }

    // Verificar la actualización
    const userVerification = await Usuario.findOne({ 
      where: { correo: 'kalethpro4@gmail.com' } 
    });

    if (userVerification) {
      console.log('\n✅ Verificación exitosa:');
      console.log(`Usuario: ${userVerification.nombre}`);
      console.log(`Email: ${userVerification.correo}`);
      console.log(`Rol: ${userVerification.rol}`);
    } else {
      console.log('❌ Error: No se encontró el usuario actualizado');
    }

    console.log('\n🎉 Actualización completada. Ahora puedes usar las nuevas credenciales para iniciar sesión.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Detalles:', error);
    process.exit(1);
  }
}

updateCredentials();