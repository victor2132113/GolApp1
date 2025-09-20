'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Reservas', 'observaciones', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Observaciones adicionales para la reserva'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Reservas', 'observaciones');
  }
};
