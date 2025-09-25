'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Agregar la columna estado
    await queryInterface.addColumn('Prestamos', 'estado', {
      type: Sequelize.ENUM('activo', 'devuelto', 'vencido', 'perdido', 'dañado'),
      allowNull: false,
      defaultValue: 'activo'
    });

    // 2. Migrar datos existentes basándose en el estado de las reservas
    console.log('🔄 Migrando estados de préstamos existentes...');
    
    // Actualizar préstamos de reservas finalizadas a 'devuelto'
    await queryInterface.sequelize.query(`
      UPDATE Prestamos 
      SET estado = 'devuelto' 
      WHERE id_reserva IN (
        SELECT id FROM Reservas WHERE estado = 'finalizada'
      )
    `);

    // Actualizar préstamos de reservas confirmadas a 'activo'
    await queryInterface.sequelize.query(`
      UPDATE Prestamos 
      SET estado = 'activo' 
      WHERE id_reserva IN (
        SELECT id FROM Reservas WHERE estado = 'confirmada'
      )
    `);

    // 3. Verificar la migración
    const [results] = await queryInterface.sequelize.query(`
      SELECT 
        p.estado as prestamo_estado,
        r.estado as reserva_estado,
        COUNT(*) as cantidad
      FROM Prestamos p
      JOIN Reservas r ON p.id_reserva = r.id
      GROUP BY p.estado, r.estado
      ORDER BY p.estado, r.estado
    `);

    console.log('✅ Migración de estados completada:');
    results.forEach(row => {
      console.log(`   - ${row.cantidad} préstamos en estado '${row.prestamo_estado}' (reservas '${row.reserva_estado}')`);
    });
  },

  async down(queryInterface, Sequelize) {
    // Eliminar la columna estado
    await queryInterface.removeColumn('Prestamos', 'estado');
  }
};