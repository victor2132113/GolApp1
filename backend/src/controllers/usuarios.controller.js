const db = require('../../models');
const Usuario = db.Usuario;

// Crear un nuevo usuario
exports.create = async (req, res) => {
  console.log("Datos recibidos:", req.body);
  try {
    // Extraemos los datos del req.body de forma explícita
    const { nombre, email, password, telefono, role } = req.body;

    // Pasamos un objeto con solo los datos que queremos guardar
    const nuevoUsuario = await Usuario.create({
      nombre,
      correo: email,
      contrasena: password,
      rol: role,
      telefono,
    });

    res.status(201).json(nuevoUsuario);
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({ error: "Error al crear el usuario", detalle: error.message });
  }
};

// Obtener todos los usuarios
exports.findAll = async (req, res) => {
  try {
    const usuarios = await Usuario.findAll();
    res.status(200).json(usuarios);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los usuarios' });
  }
};

// Obtener un solo usuario por su ID
exports.findOne = async (req, res) => {
  try {
    const usuario = await Usuario.findByPk(req.params.id);
    if (!usuario) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json(usuario);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el usuario' });
  }
};

// Actualizar un usuario
exports.update = async (req, res) => {
  try {
    const [updated] = await Usuario.update(req.body, {
      where: { id: req.params.id }
    });
    if (updated) {
      const updatedUsuario = await Usuario.findByPk(req.params.id);
      return res.status(200).json(updatedUsuario);
    }
    throw new Error('Usuario no encontrado');
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar el usuario' });
  }
};

// Eliminar un usuario
exports.delete = async (req, res) => {
  try {
    const deleted = await Usuario.destroy({
      where: { id: req.params.id }
    });
    if (deleted) {
      return res.status(204).json({ message: 'Usuario eliminado' });
    }
    throw new Error('Usuario no encontrado');
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar el usuario' });
  }
};
// Autenticar usuario (login)
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const usuario = await Usuario.findOne({ where: { correo: email } });

    if (!usuario) {
      return res.status(200).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }

    // TODO: Implementar la comparación de contraseñas de forma segura (ej: con bcrypt)
    if (usuario.contrasena !== password) {
      return res.status(200).json({ 
        success: false, 
        error: 'Contraseña incorrecta' 
      });
    }

    res.status(200).json({ 
      success: true,
      data: {
        token: 'temp_token_' + Date.now(), // Token temporal para desarrollo
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
          telefono: usuario.telefono
        }
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(200).json({ 
      success: false, 
      error: 'Error de conexión' 
    });
  }
};

// Cerrar sesión (logout)
exports.logout = async (req, res) => {
  try {
    // En una implementación con JWT, aquí invalidarías el token
    // Por ahora, simplemente enviamos una respuesta exitosa
    res.status(200).json({ mensaje: 'Sesión cerrada exitosamente' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cerrar sesión' });
  }
};