-- =====================================================
-- BASE DE DATOS GOLAPP - SISTEMA DE RESERVAS DEPORTIVAS
-- =====================================================

-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS golapp_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE golapp_db;

-- =====================================================
-- TABLA: TipoCanchas
-- =====================================================
CREATE TABLE TipoCanchas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo VARCHAR(50) NOT NULL,
    precio VARCHAR(20) NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: Canchas
-- =====================================================
CREATE TABLE Canchas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_cancha VARCHAR(100) NOT NULL,
    estado VARCHAR(20) DEFAULT 'disponible',
    id_tipo INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_tipo) REFERENCES TipoCanchas(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: Usuarios
-- =====================================================
CREATE TABLE Usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(150) UNIQUE NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('cliente', 'administrador') DEFAULT 'cliente',
    telefono VARCHAR(15),
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: Tarifas
-- =====================================================
CREATE TABLE Tarifas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    precio DECIMAL(10, 2) NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    id_cancha INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cancha) REFERENCES Canchas(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: Reservas
-- =====================================================
CREATE TABLE Reservas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    fecha_reserva DATE NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    estado ENUM('pendiente', 'confirmada', 'cancelada', 'finalizada') DEFAULT 'pendiente',
    id_cancha INT NOT NULL,
    id_usuario INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_cancha) REFERENCES Canchas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id) ON DELETE CASCADE
);

-- =====================================================
-- TABLA: Productos (Implementos Deportivos)
-- =====================================================
CREATE TABLE Productos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre_producto VARCHAR(100) NOT NULL,
    cantidad_total INT DEFAULT 0,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- TABLA: Prestamos
-- =====================================================
CREATE TABLE Prestamos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cantidad_prestada INT NOT NULL,
    id_reserva INT NOT NULL,
    id_producto INT NOT NULL,
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (id_reserva) REFERENCES Reservas(id) ON DELETE CASCADE,
    FOREIGN KEY (id_producto) REFERENCES Productos(id) ON DELETE CASCADE
);

-- =====================================================
-- DATOS DE EJEMPLO
-- =====================================================

-- Insertar tipos de cancha
INSERT INTO TipoCanchas (tipo, precio) VALUES
('Fútbol 11', '$50.000'),
('Fútbol 7', '$35.000'),
('Fútbol 5', '$25.000'),
('Tenis', '$20.000'),
('Básquetbol', '$30.000'),
('Vóleibol', '$25.000');

-- Insertar canchas
INSERT INTO Canchas (nombre_cancha, estado, id_tipo) VALUES
('Cancha Principal', 'disponible', 1),
('Cancha Norte', 'disponible', 2),
('Cancha Sur', 'disponible', 3),
('Cancha Este', 'mantenimiento', 2),
('Cancha Oeste', 'disponible', 3),
('Cancha Tenis 1', 'disponible', 4),
('Cancha Tenis 2', 'disponible', 4),
('Cancha Básquet', 'disponible', 5),
('Cancha Vóleibol', 'disponible', 6);

-- Insertar usuario administrador
INSERT INTO Usuarios (nombre, correo, contrasena, rol, telefono) VALUES
('Administrador', 'admin@golapp.com', '$2b$10$rQZ9QmjytWIAp8tJxs.cKOXvKzKzKzKzKzKzKzKzKzKzKzKzKzKzK', 'administrador', '3001234567'),
('Juan Pérez', 'juan@email.com', '$2b$10$rQZ9QmjytWIAp8tJxs.cKOXvKzKzKzKzKzKzKzKzKzKzKzKzKzKzK', 'cliente', '3007654321'),
('María García', 'maria@email.com', '$2b$10$rQZ9QmjytWIAp8tJxs.cKOXvKzKzKzKzKzKzKzKzKzKzKzKzKzKzK', 'cliente', '3009876543'),
('Carlos López', 'carlos@email.com', '$2b$10$rQZ9QmjytWIAp8tJxs.cKOXvKzKzKzKzKzKzKzKzKzKzKzKzKzKzK', 'cliente', '3005432109');

-- Insertar tarifas por horarios
INSERT INTO Tarifas (precio, hora_inicio, hora_fin, id_cancha) VALUES
-- Cancha Principal (Fútbol 11)
(45000.00, '06:00:00', '08:00:00', 1),
(50000.00, '08:00:00', '18:00:00', 1),
(55000.00, '18:00:00', '22:00:00', 1),
-- Cancha Norte (Fútbol 7)
(30000.00, '06:00:00', '08:00:00', 2),
(35000.00, '08:00:00', '18:00:00', 2),
(40000.00, '18:00:00', '22:00:00', 2),
-- Cancha Sur (Fútbol 5)
(20000.00, '06:00:00', '08:00:00', 3),
(25000.00, '08:00:00', '18:00:00', 3),
(30000.00, '18:00:00', '22:00:00', 3);

-- Insertar productos/implementos
INSERT INTO Productos (nombre_producto, cantidad_total) VALUES
('Balón Fútbol', 15),
('Balón Básquetbol', 8),
('Balón Vóleibol', 6),
('Raqueta Tenis', 12),
('Pelotas Tenis', 50),
('Conos', 20),
('Chalecos', 30),
('Arcos Portátiles', 4);

-- Insertar algunas reservas de ejemplo
INSERT INTO Reservas (fecha_reserva, hora_inicio, hora_fin, estado, id_cancha, id_usuario) VALUES
('2024-01-20', '09:00:00', '11:00:00', 'confirmada', 1, 2),
('2024-01-20', '15:00:00', '17:00:00', 'pendiente', 2, 3),
('2024-01-21', '19:00:00', '21:00:00', 'confirmada', 3, 4),
('2024-01-22', '10:00:00', '12:00:00', 'pendiente', 1, 2);

-- Insertar algunos préstamos de ejemplo
INSERT INTO Prestamos (cantidad_prestada, id_reserva, id_producto) VALUES
(2, 1, 1), -- 2 balones de fútbol para la reserva 1
(10, 1, 7), -- 10 chalecos para la reserva 1
(1, 3, 1), -- 1 balón de fútbol para la reserva 3
(4, 3, 6); -- 4 conos para la reserva 3

-- =====================================================
-- ÍNDICES PARA OPTIMIZACIÓN
-- =====================================================
CREATE INDEX idx_reservas_fecha ON Reservas(fecha_reserva);
CREATE INDEX idx_reservas_cancha ON Reservas(id_cancha);
CREATE INDEX idx_reservas_usuario ON Reservas(id_usuario);
CREATE INDEX idx_usuarios_correo ON Usuarios(correo);
CREATE INDEX idx_canchas_tipo ON Canchas(id_tipo);

-- =====================================================
-- VISTAS ÚTILES
-- =====================================================

-- Vista para reservas con información completa
CREATE VIEW vista_reservas_completa AS
SELECT 
    r.id,
    r.fecha_reserva,
    r.hora_inicio,
    r.hora_fin,
    r.estado,
    c.nombre_cancha,
    tc.tipo as tipo_cancha,
    u.nombre as nombre_usuario,
    u.correo,
    u.telefono
FROM Reservas r
JOIN Canchas c ON r.id_cancha = c.id
JOIN TipoCanchas tc ON c.id_tipo = tc.id
JOIN Usuarios u ON r.id_usuario = u.id;

-- Vista para disponibilidad de canchas
CREATE VIEW vista_canchas_disponibles AS
SELECT 
    c.id,
    c.nombre_cancha,
    c.estado,
    tc.tipo,
    tc.precio
FROM Canchas c
JOIN TipoCanchas tc ON c.id_tipo = tc.id
WHERE c.estado = 'disponible';

-- =====================================================
-- PROCEDIMIENTOS ALMACENADOS
-- =====================================================

DELIMITER //

-- Procedimiento para verificar disponibilidad de cancha
CREATE PROCEDURE VerificarDisponibilidad(
    IN p_id_cancha INT,
    IN p_fecha DATE,
    IN p_hora_inicio TIME,
    IN p_hora_fin TIME
)
BEGIN
    SELECT COUNT(*) as conflictos
    FROM Reservas 
    WHERE id_cancha = p_id_cancha 
    AND fecha_reserva = p_fecha
    AND estado IN ('pendiente', 'confirmada')
    AND (
        (hora_inicio <= p_hora_inicio AND hora_fin > p_hora_inicio) OR
        (hora_inicio < p_hora_fin AND hora_fin >= p_hora_fin) OR
        (hora_inicio >= p_hora_inicio AND hora_fin <= p_hora_fin)
    );
END //

DELIMITER ;

-- =====================================================
-- MENSAJE DE CONFIRMACIÓN
-- =====================================================
SELECT 'Base de datos GolApp creada exitosamente!' as mensaje;
SELECT COUNT(*) as total_tablas FROM information_schema.tables WHERE table_schema = 'golapp_db';