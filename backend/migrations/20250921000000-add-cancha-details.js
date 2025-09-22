'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('Canchas', 'ubicacion', {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: 'Ubicación no especificada'
    });
    
    await queryInterface.addColumn('Canchas', 'capacidad', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 22
    });
    
    await queryInterface.addColumn('Canchas', 'horario_inicio', {
      type: Sequelize.TIME,
      allowNull: true,
      defaultValue: '06:00:00'
    });
    
    await queryInterface.addColumn('Canchas', 'horario_fin', {
      type: Sequelize.TIME,
      allowNull: true,
      defaultValue: '22:00:00'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('Canchas', 'ubicacion');
    await queryInterface.removeColumn('Canchas', 'capacidad');
    await queryInterface.removeColumn('Canchas', 'horario_inicio');
    await queryInterface.removeColumn('Canchas', 'horario_fin');
  }
};