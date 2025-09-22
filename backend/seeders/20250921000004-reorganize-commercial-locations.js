'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Actualizar ubicaciones con descripciones comerciales apropiadas
    // Basado en los precios: Fútbol 11 ($50k) > Fútbol 7 ($35k) > Fútbol 5 ($25k)
    
    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Cancha Premium - Sector Central'
    }, {
      id: 1 // Cancha Principal - Fútbol 11 (más cara)
    });

    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Cancha Estándar - Sector Norte'
    }, {
      id: 2 // Cancha Norte - Fútbol 7
    });

    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Cancha Económica - Sector Sur'
    }, {
      id: 3 // Cancha Sur - Fútbol 5 (más barata)
    });

    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Cancha Estándar - Sector Este'
    }, {
      id: 4 // Cancha Este - Fútbol 7
    });

    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Cancha Económica - Sector Oeste'
    }, {
      id: 5 // Cancha Oeste - Fútbol 5 (más barata)
    });

    console.log('✅ Ubicaciones reorganizadas con criterio comercial');
  },

  async down(queryInterface, Sequelize) {
    // Revertir a ubicaciones anteriores
    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Norte - Campo Principal'
    }, {
      id: 1
    });

    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Norte - Campo Secundario'
    }, {
      id: 2
    });

    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Sur - Campo de Práctica'
    }, {
      id: 3
    });

    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Este - Campo de Entrenamiento'
    }, {
      id: 4
    });

    await queryInterface.bulkUpdate('Canchas', {
      ubicacion: 'Sector Oeste - Campo Recreativo'
    }, {
      id: 5
    });

    console.log('⏪ Ubicaciones revertidas');
  }
};