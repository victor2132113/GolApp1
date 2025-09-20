const express = require('express');
const router = express.Router();
const usuariosController = require('../controllers/usuarios.controller');

// Nota: La ruta base '/usuarios' se define en el archivo principal de tu servidor.
// Por eso, aquí solo se usan las rutas secundarias.

// Ruta para buscar usuarios
router.get('/search', usuariosController.search);

// Ruta para registrar un nuevo usuario
router.post('/', usuariosController.create);

// Ruta para iniciar sesión
router.post('/login', usuariosController.login);

// Ruta para cerrar sesión
router.post('/logout', usuariosController.logout);

// Obtener todos los usuarios
router.get('/', usuariosController.findAll);

// Obtener un solo usuario por su ID
router.get('/:id', usuariosController.findOne);

// Actualizar un usuario
router.put('/:id', usuariosController.update);

// Eliminar un usuario
router.delete('/:id', usuariosController.delete);

module.exports = router;