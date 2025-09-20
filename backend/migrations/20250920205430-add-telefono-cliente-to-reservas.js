'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('Reservas', 'telefono_cliente', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Teléfono del cliente para la reserva'
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('Reservas', 'telefono_cliente');
  }
};
