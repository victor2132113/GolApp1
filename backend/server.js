const express = require('express');
const dotenv = require('dotenv');
const sequelize = require('./config/db.config.js');
const cors = require('cors');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3100;

// Probar la conexión a la base de datos
async function testConnection() {
  try {
    await sequelize.authenticate();
    console.log('¡Conexión a la base de datos exitosa!');
  } catch (error) {
    console.error('Error al conectar a la base de datos:', error);
  }
}

testConnection();

app.use(express.json());

// **IMPORTANTE: Configuración de CORS corregida**
app.use(cors({
  origin: '*', // Permitir todos los orígenes temporalmente para desarrollo
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept']
}));

// Importar todos los archivos de rutas
const tipocanchasRoutes = require('./src/routes/tipocanchas.routes');
const canchasRoutes = require('./src/routes/canchas.routes');
const usuariosRoutes = require('./src/routes/usuarios.routes');
const reservasRoutes = require('./src/routes/reservas.routes');
const productosRoutes = require('./src/routes/productos.routes');
const prestamosRoutes = require('./src/routes/prestamos.routes');
const tarifasRoutes = require('./src/routes/tarifas.routes');

// **IMPORTANTE: Usar las rutas con el prefijo correcto**
app.use('/api/tipocanchas', tipocanchasRoutes);
app.use('/api/canchas', canchasRoutes);
app.use('/api/usuarios', usuariosRoutes); // <--- La clave para solucionar el error
app.use('/api/reservas', reservasRoutes);
app.use('/api/productos', productosRoutes);
app.use('/api/prestamos', prestamosRoutes);
app.use('/api/tarifas', tarifasRoutes);


app.get('/', (req, res) => {
  res.send('¡Servidor de GolApp funcionando!');
});

app.listen(PORT, () => {
  console.log(`Servidor escuchando en el puerto ${PORT}`);
});