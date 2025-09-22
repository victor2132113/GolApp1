'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Cambiar hora_inicio y hora_fin de DATE a TIME
    await queryInterface.changeColumn('Reservas', 'hora_inicio', {
      type: Sequelize.TIME,
      allowNull: false
    });
    
    await queryInterface.changeColumn('Reservas', 'hora_fin', {
      type: Sequelize.TIME,
      allowNull: false
    });
    
    // Cambiar fecha_reserva para asegurar que sea DATE (no DATETIME)
    await queryInterface.changeColumn('Reservas', 'fecha_reserva', {
      type: Sequelize.DATEONLY,
      allowNull: false
    });
    
    // Cambiar estado a ENUM con los valores correctos
    await queryInterface.changeColumn('Reservas', 'estado', {
      type: Sequelize.ENUM('pendiente', 'confirmada', 'cancelada', 'finalizada'),
      defaultValue: 'pendiente',
      allowNull: false
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertir los cambios
    await queryInterface.changeColumn('Reservas', 'hora_inicio', {
      type: Sequelize.DATE
    });
    
    await queryInterface.changeColumn('Reservas', 'hora_fin', {
      type: Sequelize.DATE
    });
    
    await queryInterface.changeColumn('Reservas', 'fecha_reserva', {
      type: Sequelize.DATE
    });
    
    await queryInterface.changeColumn('Reservas', 'estado', {
      type: Sequelize.STRING
    });
  }
};