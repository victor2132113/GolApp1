const db = require('./models');
const Usuario = db.Usuario;

async function updatePassword() {
  try {
    console.log('Actualizando contraseña para kalethpro4@gmail.com...');
    
    // Buscar el usuario por email
    const user = await Usuario.findOne({ 
      where: { correo: 'kalethpro4@gmail.com' } 
    });

    if (!user) {
      console.log('❌ Usuario no encontrado');
      process.exit(1);
    }

    console.log(`Usuario encontrado: ${user.nombre} (ID: ${user.id})`);

    // Actualizar solo la contraseña
    await user.update({
      contrasena: 'kale123'
    });

    console.log('✅ Contraseña actualizada exitosamente');
    console.log('📧 Email: kalethpro4@gmail.com');
    console.log('🔑 Nueva contraseña: kale123');
    console.log('👤 Nombre: ' + user.nombre);
    console.log('🎯 Rol: ' + user.rol);

    // Verificar la actualización
    const updatedUser = await Usuario.findOne({ 
      where: { correo: 'kalethpro4@gmail.com' } 
    });

    if (updatedUser && updatedUser.contrasena === 'kale123') {
      console.log('\n✅ Verificación exitosa: La contraseña se actualizó correctamente');
    } else {
      console.log('\n❌ Error en la verificación');
    }

    console.log('\n🎉 ¡Listo! Ahora puedes iniciar sesión con:');
    console.log('   Email: kalethpro4@gmail.com');
    console.log('   Contraseña: kale123');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

updatePassword();