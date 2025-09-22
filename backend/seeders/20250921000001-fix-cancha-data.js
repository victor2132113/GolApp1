'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Corregir la Cancha Sur para que coincida con su ubicación
    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Sur - Campo Secundario',
      capacidad: 14,
      horario_inicio: '07:00:00',
      horario_fin: '21:00:00'
    }, {
      id: 3,
      nombre_cancha: 'Cancha Sur'
    });

    // Asegurar que la Cancha Norte tenga datos correctos
    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Norte - Campo Secundario',
      capacidad: 14,
      horario_inicio: '07:00:00',
      horario_fin: '21:00:00'
    }, {
      id: 2,
      nombre_cancha: 'Cancha Norte'
    });

    // Crear una nueva cancha para el Sector Centro si es necesario
    // o actualizar una existente para que sea coherente
    await queryInterface.bulkUpdate('Canchas', {
      nombre_cancha: 'Cancha Centro',
      ubicacion: 'Sector Centro - Campo Múltiple',
      capacidad: 10,
      horario_inicio: '08:00:00',
      horario_fin: '20:00:00'
    }, {
      id: 5,
      nombre_cancha: 'Cancha Oeste'
    });

    // Actualizar la antigua Cancha Oeste para ser más coherente
    await queryInterface.bulkUpdate('Canchas', {
      nombre_cancha: 'Cancha Oeste',
      ubicacion: 'Sector Oeste - Campo Recreativo',
      capacidad: 10,
      horario_inicio: '09:00:00',
      horario_fin: '19:00:00'
    }, {
      id: 4,
      nombre_cancha: 'Cancha Este'
    });

    // Mantener la Cancha Este con datos correctos
    await queryInterface.bulkUpdate('Canchas', {
      nombre_cancha: 'Cancha Este',
      ubicacion: 'Sector Este - Campo de Entrenamiento',
      capacidad: 14,
      horario_inicio: '06:00:00',
      horario_fin: '22:00:00'
    }, {
      id: 4
    });
  },

  async down(queryInterface, Sequelize) {
    // Revertir cambios si es necesario
    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Ubicación no especificada',
      capacidad: 22,
      horario_inicio: '06:00:00',
      horario_fin: '22:00:00'
    }, {});
  }
};