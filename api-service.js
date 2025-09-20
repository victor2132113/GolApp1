// Servicio para manejar todas las llamadas a la API
const ApiService = {
    // Usuarios
    usuarios: {
        // Crear nuevo usuario
        create: async (userData) => {
            return await API.post('/usuarios', userData);
        },

        // Registrar nuevo usuario (alias para create)
        register: async (userData) => {
            return await API.post('/usuarios', userData);
        },

        // Iniciar sesión
        login: async (email, password) => {
            return await API.post('/usuarios/login', { email, password });
        },

        // Cerrar sesión
        logout: async () => {
            return await API.post('/usuarios/logout', {});
        },

        // Obtener todos los usuarios
        getAll: async () => {
            return await API.get('/usuarios');
        },

        // Obtener usuario por ID
        getById: async (id) => {
            return await API.get(`/usuarios/${id}`);
        },

        // Actualizar usuario
        update: async (id, userData) => {
            return await API.put(`/usuarios/${id}`, userData);
        },

        // Eliminar usuario
        delete: async (id) => {
            return await API.delete(`/usuarios/${id}`);
        }
    },

    // Canchas
    canchas: {
        // Crear nueva cancha
        create: async (canchaData) => {
            return await API.post('/canchas', canchaData);
        },

        // Obtener todas las canchas
        getAll: async () => {
            return await API.get('/canchas');
        },

        // Obtener cancha por ID
        getById: async (id) => {
            return await API.get(`/canchas/${id}`);
        },

        // Actualizar cancha
        update: async (id, canchaData) => {
            return await API.put(`/canchas/${id}`, canchaData);
        },

        // Eliminar cancha
        delete: async (id) => {
            return await API.delete(`/canchas/${id}`);
        }
    },

    // Tipos de Cancha
    tipoCanchas: {
        // Crear nuevo tipo de cancha
        create: async (tipoData) => {
            return await API.post('/tipocanchas', tipoData);
        },

        // Obtener todos los tipos de cancha
        getAll: async () => {
            return await API.get('/tipocanchas');
        },

        // Obtener tipo de cancha por ID
        getById: async (id) => {
            return await API.get(`/tipocanchas/${id}`);
        },

        // Actualizar tipo de cancha
        update: async (id, tipoData) => {
            return await API.put(`/tipocanchas/${id}`, tipoData);
        },

        // Eliminar tipo de cancha
        delete: async (id) => {
            return await API.delete(`/tipocanchas/${id}`);
        }
    },

    // Reservas
    reservas: {
        // Crear nueva reserva
        create: async (reservaData) => {
            return await API.post('/reservas', reservaData);
        },

        // Obtener todas las reservas
        getAll: async () => {
            return await API.get('/reservas');
        },

        // Obtener reserva por ID
        getById: async (id) => {
            return await API.get(`/reservas/${id}`);
        },

        // Actualizar reserva
        update: async (id, reservaData) => {
            return await API.put(`/reservas/${id}`, reservaData);
        },

        // Eliminar reserva
        delete: async (id) => {
            return await API.delete(`/reservas/${id}`);
        }
    },

    // Productos
    productos: {
        // Crear nuevo producto
        create: async (productoData) => {
            return await API.post('/productos', productoData);
        },

        // Obtener todos los productos
        getAll: async () => {
            return await API.get('/productos');
        },

        // Obtener producto por ID
        getById: async (id) => {
            return await API.get(`/productos/${id}`);
        },

        // Actualizar producto
        update: async (id, productoData) => {
            return await API.put(`/productos/${id}`, productoData);
        },

        // Eliminar producto
        delete: async (id) => {
            return await API.delete(`/productos/${id}`);
        }
    },

    // Préstamos
    prestamos: {
        // Crear nuevo préstamo
        create: async (prestamoData) => {
            return await API.post('/prestamos', prestamoData);
        },

        // Obtener todos los préstamos
        getAll: async () => {
            return await API.get('/prestamos');
        },

        // Obtener préstamo por ID
        getById: async (id) => {
            return await API.get(`/prestamos/${id}`);
        },

        // Actualizar préstamo
        update: async (id, prestamoData) => {
            return await API.put(`/prestamos/${id}`, prestamoData);
        },

        // Eliminar préstamo
        delete: async (id) => {
            return await API.delete(`/prestamos/${id}`);
        }
    },

    // Tarifas
    tarifas: {
        // Crear nueva tarifa
        create: async (tarifaData) => {
            return await API.post('/tarifas', tarifaData);
        },

        // Obtener todas las tarifas
        getAll: async () => {
            return await API.get('/tarifas');
        },

        // Obtener tarifa por ID
        getById: async (id) => {
            return await API.get(`/tarifas/${id}`);
        },

        // Actualizar tarifa
        update: async (id, tarifaData) => {
            return await API.put(`/tarifas/${id}`, tarifaData);
        },

        // Eliminar tarifa
        delete: async (id) => {
            return await API.delete(`/tarifas/${id}`);
        }
    }
};

// Hacer disponible globalmente
window.ApiService = ApiService;