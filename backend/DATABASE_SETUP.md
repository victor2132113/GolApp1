# Configuración de Base de Datos Local - GolApp

## Requisitos Previos

1. **MySQL Server** instalado y ejecutándose
2. **Node.js** y **npm** instalados
3. Acceso a MySQL con permisos para crear bases de datos

## Configuración Paso a Paso

### 1. Configurar Variables de Entorno

El archivo `.env` ya está configurado con los valores por defecto:

```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=golapp_db
DB_USER=root
DB_PASSWORD=
PORT=3100
NODE_ENV=development
```

**Importante:** Si tu configuración de MySQL es diferente, modifica estos valores:
- `DB_PASSWORD`: Si tu usuario root tiene contraseña
- `DB_USER`: Si usas un usuario diferente a root
- `DB_PORT`: Si MySQL usa un puerto diferente a 3306

### 2. Instalar Dependencias

```bash
npm install
```

### 3. Configurar la Base de Datos

**Opción 1: Configuración Completa (Recomendada)**
```bash
npm run setup-db
```
Este comando:
- Crea la base de datos `golapp_db`
- Crea todas las tablas
- Inserta datos de ejemplo
- Configura usuarios, canchas, tarifas, etc.

**Opción 2: Solo Crear Base de Datos**
```bash
npm run create-db
```

**Opción 3: Sincronizar Modelos de Sequelize**
```bash
npm run sync-db
```

### 4. Iniciar el Servidor

```bash
npm start
# o para desarrollo
npm run dev
```

El servidor estará disponible en: `http://localhost:3100`

## Verificación de la Configuración

### Probar Conexión
Cuando inicies el servidor, deberías ver:
```
¡Conexión a la base de datos exitosa!
Servidor escuchando en el puerto 3100
```

### Endpoints de Prueba
- `GET http://localhost:3100/` - Página principal
- `GET http://localhost:3100/api/usuarios` - Lista de usuarios
- `GET http://localhost:3100/api/canchas` - Lista de canchas

## Datos de Ejemplo Incluidos

### Usuario Administrador Principal
- **Email:** kalethpro4@gmail.com
- **Contraseña:** kale123
- **Rol:** administrador

### Usuario Administrador Secundario
- **Email:** admin@golapp.com
- **Contraseña:** admin123
- **Rol:** administrador

### Usuarios de Prueba
- juan@email.com
- maria@email.com  
- carlos@email.com
- **Contraseña para todos:** 123456

### Canchas Disponibles
- Cancha Principal (Fútbol 11)
- Cancha Norte (Fútbol 7)
- Cancha Sur (Fútbol 5)
- Canchas de Tenis, Básquetbol y Vóleibol

## Solución de Problemas

### Error: "Access denied for user"
- Verificar credenciales en `.env`
- Asegurar que MySQL esté ejecutándose
- Verificar permisos del usuario

### Error: "Database already exists"
- Normal si ya ejecutaste la configuración antes
- La configuración es segura para ejecutar múltiples veces

### Error: "Connection refused"
- Verificar que MySQL esté ejecutándose
- Verificar el puerto en `.env`
- Verificar la dirección del host

### Reiniciar Base de Datos
Si necesitas empezar desde cero:
```sql
DROP DATABASE IF EXISTS golapp_db;
```
Luego ejecuta: `npm run setup-db`

## Estructura de la Base de Datos

- **TipoCanchas**: Tipos de canchas deportivas
- **Canchas**: Canchas específicas
- **Usuarios**: Clientes y administradores
- **Tarifas**: Precios por horarios
- **Reservas**: Reservas de canchas
- **Productos**: Implementos deportivos
- **Prestamos**: Préstamos de implementos

## Comandos Útiles

```bash
# Configuración completa
npm run setup-db

# Solo crear base de datos
npm run create-db

# Sincronizar modelos
npm run sync-db

# Iniciar servidor
npm start

# Desarrollo
npm run dev
```