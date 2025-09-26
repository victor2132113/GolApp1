// Configuración de la API
const API_BASE_URL = 'http://localhost:3000/api';

// Variables globales
let prestamos = [];
let productos = [];
let reservas = [];
let editingPrestamo = null;

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    loadPrestamos();
    loadStats();
    loadProductos();
    loadReservas();
    setupEventListeners();
});

// Configurar event listeners
function setupEventListeners() {
    // Búsqueda en tiempo real
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            filterPrestamos(this.value);
        });
    }

    // Cerrar modal con ESC
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });

    // Cerrar modal al hacer clic fuera
    const modal = document.getElementById('prestamo-modal');
    if (modal) {
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
}

// Cargar productos desde la API
async function loadProductos() {
    console.log('🔄 Cargando productos...');
    try {
        console.log('📡 Haciendo fetch a:', `${API_BASE_URL}/productos`);
        const response = await fetch(`${API_BASE_URL}/productos`);
        console.log('📡 Response status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('📦 Respuesta completa de productos:', data);
        
        if (data.success) {
            productos = data.data;
            console.log('✅ Productos cargados:', productos.length, 'productos');
            console.log('📋 Lista de productos:', productos);
            populateProductSelect();
        } else {
            console.error('❌ Error al cargar productos:', data.error);
        }
    } catch (error) {
        console.error('❌ Error al cargar productos:', error);
    }
}

// Cargar reservas
async function loadReservas() {
    console.log('🔄 Cargando reservas...');
    try {
        console.log('📡 Haciendo fetch a:', `${API_BASE_URL}/reservas`);
        const response = await fetch(`${API_BASE_URL}/reservas`);
        console.log('📡 Response status:', response.status, response.statusText);
        
        const data = await response.json();
        console.log('📦 Respuesta completa de reservas:', data);
        
        if (response.ok) {
            // La API devuelve directamente un array de reservas
            if (Array.isArray(data)) {
                reservas = data;
            } else if (data.rows && Array.isArray(data.rows)) {
                reservas = data.rows;
            } else {
                console.error('❌ Formato de respuesta inesperado');
                console.error('📦 Data recibida:', data);
                return;
            }
            
            console.log('✅ Reservas cargadas:', reservas.length, 'reservas');
            console.log('📋 Lista de reservas:', reservas);
            populateReservaSelect();
        } else {
            console.error('❌ Error al cargar reservas: Respuesta no exitosa');
            console.error('📦 Data recibida:', data);
        }
    } catch (error) {
        console.error('❌ Error al cargar reservas:', error);
    }
}

// Poblar el select de productos
function populateProductSelect() {
    console.log('🔄 Poblando select de productos...');
    const select = document.getElementById('id_producto');
    console.log('🔍 Select element encontrado:', select);
    
    if (!select) {
        console.error('❌ Select de productos no encontrado');
        return;
    }
    
    // Limpiar opciones existentes excepto la primera
    select.innerHTML = '<option value="">Seleccionar implemento...</option>';
    console.log('🧹 Select limpiado, opciones actuales:', select.options.length);
    
    // Agregar productos
    productos.forEach((producto, index) => {
        const option = document.createElement('option');
        option.value = producto.id;
        option.textContent = `${producto.nombre_producto} (Disponible: ${producto.cantidad_disponible || 0})`;
        select.appendChild(option);
        console.log(`➕ Producto ${index + 1} agregado:`, producto.nombre_producto, 'ID:', producto.id, 'Value:', option.value);
    });
    
    console.log('✅ Select poblado con', productos.length, 'productos');
    console.log('🔍 Total de opciones en select:', select.options.length);
    
    // Verificar que las opciones se agregaron correctamente
    for (let i = 0; i < select.options.length; i++) {
        console.log(`Opción ${i}:`, select.options[i].value, '-', select.options[i].text);
    }
}

// Poblar el select de reservas
function populateReservaSelect() {
    console.log('🔄 Poblando select de reservas...');
    const select = document.getElementById('id_reserva');
    console.log('🔍 Select de reservas encontrado:', select);
    
    if (!select) {
        console.error('❌ Select de reservas no encontrado');
        return;
    }
    
    // Limpiar opciones existentes excepto la primera
    select.innerHTML = '<option value="">Seleccionar reserva...</option>';
    console.log('🧹 Select de reservas limpiado, opciones actuales:', select.options.length);
    
    // Filtrar reservas disponibles (confirmadas y pendientes)
    const reservasDisponibles = reservas.filter(reserva => 
        reserva.estado === 'confirmada' || reserva.estado === 'pendiente'
    );
    
    console.log('🔍 Total de reservas cargadas:', reservas.length);
    console.log('🔍 Reservas confirmadas encontradas:', reservasDisponibles.length);
    console.log('📋 Estados de todas las reservas:', reservas.map(r => ({ id: r.id, estado: r.estado, cliente: r.usuario?.nombre })));
    
    // Agregar reservas
    reservasDisponibles.forEach((reserva, index) => {
        const option = document.createElement('option');
        option.value = reserva.id;
        
        // Formatear la fecha y hora con validación
        let fecha = 'Fecha no disponible';
        if (reserva.fecha_reserva) {
            const fechaObj = new Date(reserva.fecha_reserva);
            if (!isNaN(fechaObj.getTime())) {
                fecha = fechaObj.toLocaleDateString('es-ES');
            }
        }
        
        const horaInicio = reserva.hora_inicio ? reserva.hora_inicio.substring(0, 5) : '00:00'; // HH:MM
        const horaFin = reserva.hora_fin ? reserva.hora_fin.substring(0, 5) : '00:00'; // HH:MM
        const nombreCliente = reserva.usuario ? reserva.usuario.nombre : 'Cliente no especificado';
        
        option.textContent = `${nombreCliente} - ${fecha} (${horaInicio}-${horaFin})`;
        select.appendChild(option);
        console.log(`➕ Reserva ${index + 1} agregada:`, nombreCliente, 'ID:', reserva.id, 'Fecha:', fecha);
    });
    
    console.log('✅ Select de reservas poblado con', reservasDisponibles.length, 'reservas disponibles');
    console.log('🔍 Total de opciones en select de reservas:', select.options.length);
    
    // Verificar que las opciones se agregaron correctamente
    for (let i = 0; i < select.options.length; i++) {
        console.log(`Opción reserva ${i}:`, select.options[i].value, '-', select.options[i].text);
    }
}

// Cargar préstamos desde la API
async function loadPrestamos(timeFilter = '') {
    try {
        showLoading(true);
        let url = `${API_BASE_URL}/prestamos`;
        
        // Agregar filtro de tiempo si se especifica
        if (timeFilter) {
            url += `?timeFilter=${timeFilter}`;
        }
        
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`Error HTTP: ${response.status}`);
        }
        
        const data = await response.json();
        prestamos = data.data || data; // Manejar tanto formato con 'data' como array directo
        displayPrestamos(prestamos);
        showLoading(false);
    } catch (error) {
        console.error('Error al cargar préstamos:', error);
        showError('Error al cargar los préstamos. Verifica tu conexión.');
        showLoading(false);
    }
}

// Cargar estadísticas
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE_URL}/prestamos/stats`);
        
        if (!response.ok) {
            // Si no existe el endpoint de stats, usar el método anterior
            const prestamosResponse = await fetch(`${API_BASE_URL}/prestamos`);
            if (!prestamosResponse.ok) {
                throw new Error(`Error HTTP: ${prestamosResponse.status}`);
            }
            const prestamos = await prestamosResponse.json();
            updateStatsDisplayLegacy(prestamos);
            return;
        }
        
        const stats = await response.json();
        updateStatsDisplay(stats);
    } catch (error) {
        console.error('Error al cargar estadísticas:', error);
        // Mostrar estadísticas por defecto en caso de error
        updateStatsDisplay([]);
    }
}

// Actualizar display de estadísticas (nuevo método con estados)
function updateStatsDisplay(stats) {
    // Verificar si stats es un array o un objeto con datos
    if (!stats) {
        console.warn('Stats es null/undefined, usando valores por defecto');
        stats = {};
    } else if (typeof stats === 'object' && !Array.isArray(stats)) {
        // Si stats es un objeto, intentar extraer los datos
        if (stats.data && typeof stats.data === 'object') {
            stats = stats.data;
        } else if (stats.rows && Array.isArray(stats.rows)) {
            // Convertir array de stats a objeto
            const statsObj = { total: 0, activo: 0, devuelto: 0, vencido: 0, perdido: 0, dañado: 0 };
            stats.rows.forEach(stat => {
                statsObj[stat.estado] = parseInt(stat.cantidad || 0);
                statsObj.total += parseInt(stat.cantidad || 0);
            });
            stats = statsObj;
        } else {
            console.warn('Stats es un objeto pero no tiene formato esperado, usando valores por defecto');
            console.log('Stats recibido:', stats);
            stats = {};
        }
    } else if (Array.isArray(stats)) {
        // Convertir array de stats a objeto
        const statsObj = { total: 0, activo: 0, devuelto: 0, vencido: 0, perdido: 0, dañado: 0 };
        stats.forEach(stat => {
            statsObj[stat.estado] = parseInt(stat.cantidad || 0);
            statsObj.total += parseInt(stat.cantidad || 0);
        });
        stats = statsObj;
    } else {
        console.warn('Stats no es un array ni objeto válido, usando valores por defecto');
        console.log('Stats recibido:', stats);
        stats = {};
    }
    
    // Usar las claves correctas que devuelve el backend
    const totalPrestamos = stats.total || 0;
    const prestamosActivos = stats.activo || 0;  // El backend usa 'activo' no 'activos'
    const prestamosDevueltos = stats.devuelto || 0;
    const prestamosVencidos = stats.vencido || 0;
    const prestamosPerdidos = stats.perdido || 0;

    document.getElementById('total-prestamos').textContent = totalPrestamos;
    document.getElementById('prestamos-activos').textContent = prestamosActivos;
    document.getElementById('prestamos-devueltos').textContent = prestamosDevueltos;
    document.getElementById('prestamos-vencidos').textContent = prestamosVencidos;
    document.getElementById('prestamos-perdidos').textContent = prestamosPerdidos;
}

// Actualizar display de estadísticas (método legacy)
function updateStatsDisplayLegacy(prestamos) {
    const totalPrestamos = prestamos.length;
    const prestamosActivos = prestamos.filter(p => p.estado === 'activo').length;
    const prestamosDevueltos = prestamos.filter(p => p.estado === 'devuelto').length;
    const prestamosVencidos = prestamos.filter(p => p.estado === 'vencido').length;
    const prestamosPerdidos = prestamos.filter(p => p.estado === 'perdido').length;

    document.getElementById('total-prestamos').textContent = totalPrestamos;
    document.getElementById('prestamos-activos').textContent = prestamosActivos;
    document.getElementById('prestamos-devueltos').textContent = prestamosDevueltos;
    document.getElementById('prestamos-vencidos').textContent = prestamosVencidos;
    document.getElementById('prestamos-perdidos').textContent = prestamosPerdidos;
}

// Mostrar préstamos en la tabla
function displayPrestamos(prestamosToShow) {
    const tbody = document.getElementById('prestamos-tbody');
    const table = document.getElementById('prestamos-table');
    const emptyState = document.getElementById('empty-state');

    if (!prestamosToShow || prestamosToShow.length === 0) {
        table.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    table.style.display = 'table';
    emptyState.style.display = 'none';

    tbody.innerHTML = prestamosToShow.map(prestamo => `
        <tr>
            <td>${prestamo.id_reserva || 'N/A'}</td>
            <td>${prestamo.producto ? prestamo.producto.nombre_producto : 'Producto no encontrado'}</td>
            <td>${prestamo.cantidad_prestada}</td>
            <td>${formatDate(prestamo.createdAt)}</td>
            <td>${prestamo.reserva && prestamo.reserva.usuario ? prestamo.reserva.usuario.nombre : 'Cliente no encontrado'}</td>
            <td>
                <span class="status-badge status-${prestamo.estado || 'activo'}">
                    ${getEstadoLabel(prestamo.estado || 'activo')}
                </span>
            </td>
            <td class="actions">
                ${getActionButtons(prestamo)}
            </td>
        </tr>
    `).join('');
}

// Obtener etiqueta del estado
function getEstadoLabel(estado) {
    const labels = {
        'activo': 'Activo',
        'devuelto': 'Devuelto',
        'vencido': 'Vencido',
        'perdido': 'Perdido',
        'dañado': 'Dañado'
    };
    return labels[estado] || 'Desconocido';
}

// Obtener botones de acción según el estado
function getActionButtons(prestamo) {
    let buttons = '';
    
    // Botón de editar (siempre disponible)
    buttons += `<button class="btn-action edit" onclick="editPrestamo(${prestamo.id})" title="Editar">
                    <i class="fas fa-edit"></i>
                </button>`;
    
    // Botones de cambio de estado según el estado actual
    if (prestamo.estado === 'activo') {
        buttons += `<button class="btn-action success" onclick="changeStatus(${prestamo.id}, 'devuelto')" title="Marcar como devuelto">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-action warning" onclick="changeStatus(${prestamo.id}, 'vencido')" title="Marcar como vencido">
                        <i class="fas fa-clock"></i>
                    </button>`;
    } else if (prestamo.estado === 'vencido') {
        buttons += `<button class="btn-action success" onclick="changeStatus(${prestamo.id}, 'devuelto')" title="Marcar como devuelto">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-action danger" onclick="changeStatus(${prestamo.id}, 'perdido')" title="Marcar como perdido">
                        <i class="fas fa-times"></i>
                    </button>`;
    }
    
    // Botón de eliminar (solo para préstamos devueltos)
    if (prestamo.estado === 'devuelto') {
        buttons += `<button class="btn-action delete" onclick="deletePrestamo(${prestamo.id})" title="Eliminar">
                        <i class="fas fa-trash"></i>
                    </button>`;
    }
    
    return buttons;
}

// Filtrar préstamos
function filterPrestamos(searchTerm) {
    if (!searchTerm.trim()) {
        displayPrestamos(prestamos);
        return;
    }

    const filtered = prestamos.filter(prestamo => {
        const productoNombre = prestamo.producto ? prestamo.producto.nombre.toLowerCase() : '';
        const clienteNombre = prestamo.reserva && prestamo.reserva.usuario ? prestamo.reserva.usuario.nombre.toLowerCase() : '';
        const idReserva = prestamo.id_reserva ? prestamo.id_reserva.toString() : '';
        
        return productoNombre.includes(searchTerm.toLowerCase()) ||
               clienteNombre.includes(searchTerm.toLowerCase()) ||
               idReserva.includes(searchTerm);
    });

    displayPrestamos(filtered);
}

// Mostrar/ocultar loading
function showLoading(show) {
    const loading = document.getElementById('loading');
    const table = document.getElementById('prestamos-table');
    const emptyState = document.getElementById('empty-state');

    if (show) {
        loading.style.display = 'block';
        table.style.display = 'none';
        emptyState.style.display = 'none';
    } else {
        loading.style.display = 'none';
    }
}

// Abrir modal
async function openModal(prestamoId = null) {
    const modal = document.getElementById('prestamo-modal');
    const modalTitle = document.getElementById('modal-title');
    const form = document.getElementById('prestamo-form');
    const productoSelect = document.getElementById('id_producto');
    const reservaSelect = document.getElementById('id_reserva');

    console.log('🔄 Abriendo modal...');
    console.log('📦 Productos actuales en memoria:', productos.length);
    console.log('📦 Reservas actuales en memoria:', reservas.length);

    // Asegurar que los productos estén cargados ANTES de mostrar el modal
    if (productos.length === 0) {
        console.log('🔄 Productos no cargados, cargando antes de abrir modal...');
        await loadProductos();
    } else {
        console.log('✅ Productos ya cargados, repoblando select...');
        populateProductSelect();
    }

    // Asegurar que las reservas estén cargadas ANTES de mostrar el modal
    if (reservas.length === 0) {
        console.log('🔄 Reservas no cargadas, cargando antes de abrir modal...');
        await loadReservas();
    } else {
        console.log('✅ Reservas ya cargadas, repoblando select...');
        populateReservaSelect();
    }

    if (prestamoId) {
        editingPrestamo = prestamos.find(p => p.id === prestamoId);
        modalTitle.textContent = 'Editar Préstamo';
        
        // Llenar formulario con datos existentes
        document.getElementById('id_reserva').value = editingPrestamo.id_reserva || '';
        document.getElementById('id_producto').value = editingPrestamo.id_producto || '';
        document.getElementById('cantidad_prestada').value = editingPrestamo.cantidad_prestada || '';
        
        // Si el préstamo tiene información de reserva completa, mostrarla
        if (editingPrestamo.reserva && editingPrestamo.reserva.usuario) {
            const reservaInfo = editingPrestamo.reserva;
            const fecha = new Date(reservaInfo.fecha_reserva).toLocaleDateString('es-ES');
            const horaInicio = reservaInfo.hora_inicio.substring(0, 5);
            const horaFin = reservaInfo.hora_fin.substring(0, 5);
            const nombreCliente = reservaInfo.usuario.nombre;
            
            // Crear una opción temporal con la información completa
            const tempOption = document.createElement('option');
            tempOption.value = editingPrestamo.id_reserva;
            tempOption.textContent = `${nombreCliente} - ${fecha} (${horaInicio}-${horaFin})`;
            tempOption.selected = true;
            
            // Limpiar el select y agregar solo esta opción
            reservaSelect.innerHTML = '';
            reservaSelect.appendChild(tempOption);
        }
        
        // Deshabilitar el campo de implemento para préstamos existentes
        productoSelect.disabled = true;
        productoSelect.style.backgroundColor = '#f5f5f5';
        productoSelect.style.cursor = 'not-allowed';
        
        // Deshabilitar el campo de reserva para préstamos existentes
        reservaSelect.disabled = true;
        reservaSelect.style.backgroundColor = '#f5f5f5';
        reservaSelect.style.cursor = 'not-allowed';
        
        // Agregar mensaje informativo para implemento
        let infoMessage = document.getElementById('producto-info-message');
        if (!infoMessage) {
            infoMessage = document.createElement('small');
            infoMessage.id = 'producto-info-message';
            infoMessage.style.color = '#666';
            infoMessage.style.fontStyle = 'italic';
            infoMessage.textContent = 'No se puede cambiar el implemento de un préstamo existente. Para otro implemento, cree un nuevo préstamo.';
            productoSelect.parentNode.appendChild(infoMessage);
        }
        infoMessage.style.display = 'block';
        
        // Agregar mensaje informativo para reserva
        let reservaInfoMessage = document.getElementById('reserva-info-message');
        if (!reservaInfoMessage) {
            reservaInfoMessage = document.createElement('small');
            reservaInfoMessage.id = 'reserva-info-message';
            reservaInfoMessage.style.color = '#666';
            reservaInfoMessage.style.fontStyle = 'italic';
            reservaInfoMessage.textContent = 'No se puede cambiar la reserva de un préstamo existente.';
            reservaSelect.parentNode.appendChild(reservaInfoMessage);
        }
        reservaInfoMessage.style.display = 'block';
    } else {
        editingPrestamo = null;
        modalTitle.textContent = 'Nuevo Préstamo';
        form.reset();
        
        // Habilitar el campo de implemento para nuevos préstamos
        productoSelect.disabled = false;
        productoSelect.style.backgroundColor = '';
        productoSelect.style.cursor = '';
        
        // Habilitar el campo de reserva para nuevos préstamos
        reservaSelect.disabled = false;
        reservaSelect.style.backgroundColor = '';
        reservaSelect.style.cursor = '';
        
        // Ocultar mensaje informativo de implemento
        const infoMessage = document.getElementById('producto-info-message');
        if (infoMessage) {
            infoMessage.style.display = 'none';
        }
        
        // Ocultar mensaje informativo de reserva
        const reservaInfoMessage = document.getElementById('reserva-info-message');
        if (reservaInfoMessage) {
            reservaInfoMessage.style.display = 'none';
        }
    }

    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    console.log('✅ Modal abierto con', productos.length, 'productos y', reservas.length, 'reservas disponibles');
    
    // Verificar el estado final de ambos selects después de abrir el modal
    setTimeout(() => {
        const finalProductSelect = document.getElementById('id_producto');
        const finalReservaSelect = document.getElementById('id_reserva');
        
        console.log('🔍 Estado final del select de productos:');
        console.log('  - Elemento encontrado:', !!finalProductSelect);
        console.log('  - Opciones disponibles:', finalProductSelect ? finalProductSelect.options.length : 0);
        console.log('  - Valor actual:', finalProductSelect ? finalProductSelect.value : 'N/A');
        
        console.log('🔍 Estado final del select de reservas:');
        console.log('  - Elemento encontrado:', !!finalReservaSelect);
        console.log('  - Opciones disponibles:', finalReservaSelect ? finalReservaSelect.options.length : 0);
        console.log('  - Valor actual:', finalReservaSelect ? finalReservaSelect.value : 'N/A');
        
        if (finalProductSelect && finalProductSelect.options.length > 0) {
            for (let i = 0; i < Math.min(3, finalProductSelect.options.length); i++) {
                console.log(`  - Producto opción ${i}: value="${finalProductSelect.options[i].value}" text="${finalProductSelect.options[i].text}"`);
            }
        }
        
        if (finalReservaSelect && finalReservaSelect.options.length > 0) {
            for (let i = 0; i < Math.min(3, finalReservaSelect.options.length); i++) {
                console.log(`  - Reserva opción ${i}: value="${finalReservaSelect.options[i].value}" text="${finalReservaSelect.options[i].text}"`);
            }
        }
    }, 100);
}

// Cerrar modal
function closeModal() {
    const modal = document.getElementById('prestamo-modal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    editingPrestamo = null;
}

// Guardar préstamo
async function savePrestamo() {
    console.log('🔄 Iniciando savePrestamo...');
    
    const form = document.getElementById('prestamo-form');
    console.log('📋 Formulario encontrado:', form);
    
    // Verificar el select específicamente
    const selectElement = document.getElementById('id_producto');
    console.log('🔍 Select element:', selectElement);
    console.log('🔍 Select value:', selectElement ? selectElement.value : 'NO ENCONTRADO');
    console.log('🔍 Select selectedIndex:', selectElement ? selectElement.selectedIndex : 'NO ENCONTRADO');
    console.log('🔍 Select options length:', selectElement ? selectElement.options.length : 'NO ENCONTRADO');
    
    if (selectElement && selectElement.selectedIndex >= 0) {
        console.log('🔍 Opción seleccionada:', selectElement.options[selectElement.selectedIndex].text);
        console.log('🔍 Valor de la opción seleccionada:', selectElement.options[selectElement.selectedIndex].value);
    }
    
    const formData = new FormData(form);
    
    // Verificar todos los valores del FormData
    console.log('📋 Valores del FormData:');
    for (let [key, value] of formData.entries()) {
        console.log(`  ${key}: ${value}`);
    }
    
    const prestamoData = {
        id_reserva: editingPrestamo ? editingPrestamo.id_reserva : parseInt(formData.get('id_reserva')),
        id_producto: editingPrestamo ? editingPrestamo.id_producto : parseInt(formData.get('id_producto')),
        cantidad_prestada: parseInt(formData.get('cantidad_prestada'))
    };

    console.log('📋 Datos del préstamo procesados:', prestamoData);
    console.log('📋 Verificación de NaN:');
    console.log('  id_reserva es NaN:', isNaN(prestamoData.id_reserva));
    console.log('  id_producto es NaN:', isNaN(prestamoData.id_producto));
    console.log('  cantidad_prestada es NaN:', isNaN(prestamoData.cantidad_prestada));

    // Validaciones básicas
    if (!prestamoData.id_reserva || !prestamoData.id_producto || !prestamoData.cantidad_prestada) {
        console.log('❌ Error de validación: campos faltantes');
        console.log('  id_reserva válido:', !!prestamoData.id_reserva);
        console.log('  id_producto válido:', !!prestamoData.id_producto);
        console.log('  cantidad_prestada válida:', !!prestamoData.cantidad_prestada);
        showError('Por favor, completa todos los campos obligatorios.');
        return;
    }

    if (prestamoData.cantidad_prestada <= 0) {
        console.log('❌ Error de validación: cantidad inválida');
        showError('La cantidad prestada debe ser mayor a 0.');
        return;
    }

    // Validación de disponibilidad en el frontend
    if (!editingPrestamo) { // Solo validar para nuevos préstamos
        try {
            console.log('🔍 Validando disponibilidad en el frontend...');
            
            // Obtener información del producto seleccionado
            const productoSeleccionado = productos.find(p => p.id === prestamoData.id_producto);
            if (!productoSeleccionado) {
                showError('Producto no encontrado.');
                return;
            }

            // Verificar disponibilidad antes de enviar
            const response = await fetch(`${API_BASE_URL}/productos/${prestamoData.id_producto}`);
            if (!response.ok) {
                throw new Error('Error al verificar disponibilidad');
            }
            
            const productoActual = await response.json();
            const cantidadDisponible = productoActual.cantidad_disponible || 0;
            
            if (prestamoData.cantidad_prestada > cantidadDisponible) {
                showError(`Stock insuficiente. Disponible: ${cantidadDisponible}, Solicitado: ${prestamoData.cantidad_prestada}`);
                return;
            }
            
            console.log('✅ Validación de disponibilidad pasada');
        } catch (error) {
            console.error('Error al validar disponibilidad:', error);
            showError('Error al verificar disponibilidad. Inténtalo de nuevo.');
            return;
        }
    }

    console.log('✅ Validaciones pasadas, enviando solicitud...');

    try {
        let response;
        
        if (editingPrestamo) {
            console.log('🔄 Actualizando préstamo existente:', editingPrestamo.id);
            // Actualizar préstamo existente
            response = await fetch(`${API_BASE_URL}/prestamos/${editingPrestamo.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(prestamoData)
            });
        } else {
            console.log('🆕 Creando nuevo préstamo');
            // Crear nuevo préstamo
            response = await fetch(`${API_BASE_URL}/prestamos`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(prestamoData)
            });
        }

        console.log('📡 Respuesta del servidor:', response.status, response.statusText);

        if (response.ok) {
            const result = await response.json();
            console.log('✅ Préstamo guardado exitosamente:', result);
            showSuccess(editingPrestamo ? 'Préstamo actualizado exitosamente' : 'Préstamo creado exitosamente');
            closeModal();
            loadPrestamos(); // Recargar la lista
            loadStats(); // Actualizar estadísticas
        } else {
            const error = await response.json();
            console.log('❌ Error del servidor:', error);
            showError(error.error || 'Error al guardar el préstamo');
        }
    } catch (error) {
        console.error('❌ Error al guardar préstamo:', error);
        showError('Error de conexión al guardar el préstamo');
    }
}

// Editar préstamo
function editPrestamo(id) {
    openModal(id);
}

// Eliminar préstamo
async function deletePrestamo(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar este préstamo?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/prestamos/${id}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error al eliminar el préstamo');
        }

        showSuccess('Préstamo eliminado exitosamente');
        loadPrestamos();
        loadStats();
    } catch (error) {
        console.error('Error al eliminar préstamo:', error);
        showError(error.message || 'Error al eliminar el préstamo');
    }
}

// Cambiar estado de un préstamo
async function changeStatus(prestamoId, nuevoEstado) {
    try {
        const response = await fetch(`${API_BASE_URL}/prestamos/${prestamoId}/estado`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        showSuccess(`Estado cambiado a ${getEstadoLabel(nuevoEstado)} exitosamente`);
        
        // Recargar datos
        await loadPrestamos();
        await loadStats();
        
    } catch (error) {
        console.error('Error al cambiar estado:', error);
        showError('Error al cambiar el estado del préstamo: ' + error.message);
    }
}

// Marcar préstamos vencidos automáticamente
async function markOverdue() {
    try {
        const response = await fetch(`${API_BASE_URL}/prestamos/mark-overdue`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error HTTP: ${response.status}`);
        }

        const result = await response.json();
        showSuccess(`${result.updated} préstamos marcados como vencidos`);
        
        // Recargar datos
        await loadPrestamos();
        await loadStats();
        
    } catch (error) {
        console.error('Error al marcar vencidos:', error);
        showError('Error al marcar préstamos vencidos: ' + error.message);
    }
}

// Mostrar mensaje de éxito
function showSuccess(message) {
    const alert = document.getElementById('alert-success');
    const messageSpan = document.getElementById('success-message');
    
    messageSpan.textContent = message;
    alert.style.display = 'flex';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// Mostrar mensaje de error
function showError(message) {
    const alert = document.getElementById('alert-error');
    const messageSpan = document.getElementById('error-message');
    
    messageSpan.textContent = message;
    alert.style.display = 'flex';
    
    setTimeout(() => {
        alert.style.display = 'none';
    }, 5000);
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Función para navegar a implementos
function goToImplementos() {
    window.location.href = 'implementos.html';
}

// Función para navegar al panel de administrador
function goToAdmin() {
    window.location.href = 'admin.html';
}

// Función para aplicar filtros de tiempo
function applyTimeFilter() {
    const timeFilter = document.getElementById('time-filter').value;
    console.log('🔍 Aplicando filtro de tiempo:', timeFilter);
    loadPrestamos(timeFilter);
}

// Event listeners para conexión
window.addEventListener('online', function() {
    showSuccess('Conexión restaurada');
});

window.addEventListener('offline', function() {
    showError('Sin conexión a internet');
});

// Exportar funciones globales
window.openModal = openModal;
window.closeModal = closeModal;
window.savePrestamo = savePrestamo;
window.editPrestamo = editPrestamo;
window.deletePrestamo = deletePrestamo;
window.changeStatus = changeStatus;
window.markOverdue = markOverdue;
window.goToImplementos = goToImplementos;
window.goToAdmin = goToAdmin;
window.applyTimeFilter = applyTimeFilter;