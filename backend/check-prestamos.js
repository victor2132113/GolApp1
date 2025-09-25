const { Prestamo } = require('./models');

async function checkPrestamos() {
    try {
        const prestamos = await Prestamo.findAll({ 
            attributes: ['id', 'estado', 'cantidad_prestada'] 
        });
        
        console.log('=== PRÉSTAMOS EN BD ===');
        console.log('Total:', prestamos.length);
        
        const estados = {};
        prestamos.forEach(p => {
            estados[p.estado] = (estados[p.estado] || 0) + 1;
            console.log(`ID: ${p.id} - Estado: '${p.estado}' - Cantidad: ${p.cantidad_prestada}`);
        });
        
        console.log('\n=== RESUMEN POR ESTADO ===');
        Object.entries(estados).forEach(([estado, count]) => {
            console.log(`${estado}: ${count}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkPrestamos();