// Variables globales
const API_BASE_URL = CONFIG.API_BASE_URL;
let reservations = [];
let canchas = [];
let currentUser = null;
let paymentCompleted = false; // Nueva variable para controlar el estado del pago
let selectedClient = null; // Variable para almacenar el cliente seleccionado
let searchTimeout = null; // Para debounce en la búsqueda

// Verificar autenticación
function checkAuth() {
    const user = localStorage.getItem(CONFIG.AUTH.USER_KEY);
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = JSON.parse(user);
    
    // Mostrar información completa del usuario
    document.getElementById('userName').textContent = currentUser.nombre || 'Usuario';
    document.getElementById('userRole').textContent = currentUser.rol || 'Usuario';
    document.getElementById('userEmail').textContent = currentUser.email || 'email@ejemplo.com';
}

// Función para buscar clientes
async function searchClients(query) {
    if (!query || query.length < 2) {
        hideSearchResults();
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/usuarios/search?q=${encodeURIComponent(query)}`);
        if (response.ok) {
            const clients = await response.json();
            displaySearchResults(clients);
        } else {
            console.error('Error searching clients:', response.statusText);
            hideSearchResults();
        }
    } catch (error) {
        console.error('Error searching clients:', error);
        hideSearchResults();
    }
}

// Mostrar resultados de búsqueda
function displaySearchResults(clients) {
    const resultsContainer = document.getElementById('clienteResultados');
    
    if (!clients || clients.length === 0) {
        resultsContainer.innerHTML = '<div class="no-results">No se encontraron clientes</div>';
        resultsContainer.classList.add('show');
        return;
    }

    const resultsHTML = clients.map(client => `
        <div class="search-result-item" onclick="selectClient(${client.id}, '${client.nombre}', '${client.email}', '${client.telefono || ''}')">
            <div class="client-name">${client.nombre}</div>
            <div class="client-email">${client.email}</div>
        </div>
    `).join('');

    resultsContainer.innerHTML = resultsHTML;
    resultsContainer.classList.add('show');
}

// Ocultar resultados de búsqueda
function hideSearchResults() {
    const resultsContainer = document.getElementById('clienteResultados');
    resultsContainer.classList.remove('show');
    resultsContainer.innerHTML = '';
}

// Seleccionar cliente
function selectClient(id, nombre, email, telefono) {
    selectedClient = { id, nombre, email, telefono };
    
    // Actualizar campos del formulario
    document.getElementById('clienteBuscador').value = '';
    document.getElementById('clienteId').value = id;
    document.getElementById('clienteTelefono').value = telefono || '';
    
    // Mostrar cliente seleccionado
    document.getElementById('clienteNombreSeleccionado').textContent = nombre;
    document.getElementById('clienteEmailSeleccionado').textContent = email;
    document.getElementById('clienteSeleccionado').style.display = 'block';
    
    // Ocultar resultados
    hideSearchResults();
}

// Limpiar cliente seleccionado
function clearSelectedClient() {
    selectedClient = null;
    document.getElementById('clienteBuscador').value = '';
    document.getElementById('clienteId').value = '';
    document.getElementById('clienteTelefono').value = '';
    document.getElementById('clienteSeleccionado').style.display = 'none';
}

// Inicializar eventos del buscador de clientes
function initializeClientSearch() {
    const searchInput = document.getElementById('clienteBuscador');
    const clearButton = document.getElementById('limpiarCliente');
    
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const query = e.target.value.trim();
            
            // Limpiar timeout anterior
            if (searchTimeout) {
                clearTimeout(searchTimeout);
            }
            
            // Debounce: esperar 300ms antes de buscar
            searchTimeout = setTimeout(() => {
                searchClients(query);
            }, 300);
        });

        // Ocultar resultados cuando se pierde el foco (con delay para permitir clicks)
        searchInput.addEventListener('blur', () => {
            setTimeout(() => {
                hideSearchResults();
            }, 200);
        });
    }
    
    if (clearButton) {
        clearButton.addEventListener('click', clearSelectedClient);
    }
}

// Cargar canchas
async function loadCanchas() {
    try {
        const response = await fetch(`${API_BASE_URL}/canchas`);
        if (response.ok) {
            canchas = await response.json();
            populateCanchaSelects();
        }
    } catch (error) {
        console.error('Error loading canchas:', error);
    }
}

// Poblar select de canchas
function populateCanchaSelects() {
    const canchaSelect = document.getElementById('canchaId');
    const filterCancha = document.getElementById('filterCancha');
    
    // Limpiar opciones existentes (excepto la primera)
    canchaSelect.innerHTML = '<option value="">Seleccionar cancha</option>';
    if (filterCancha) {
        filterCancha.innerHTML = '<option value="">Todas las canchas</option>';
    }
    
    canchas.forEach(cancha => {
        if (cancha.estado === 'disponible') {
            const option = document.createElement('option');
            option.value = cancha.id;
            option.textContent = `${cancha.nombre_cancha} - ${cancha.tipoCancha?.tipo || 'Sin tipo'}`;
            option.dataset.precio = cancha.tipoCancha?.precio || '0';
            canchaSelect.appendChild(option);
        }
        
        if (filterCancha) {
            const filterOption = document.createElement('option');
            filterOption.value = cancha.id;
            filterOption.textContent = cancha.nombre_cancha;
            filterCancha.appendChild(filterOption);
        }
    });
}

// Actualizar información de precio cuando se selecciona una cancha
function updatePriceInfo() {
    const canchaSelect = document.getElementById('canchaId');
    const priceInfo = document.getElementById('priceInfo');
    const pricePerHour = document.getElementById('pricePerHour');
    
    if (canchaSelect.value) {
        const selectedOption = canchaSelect.options[canchaSelect.selectedIndex];
        const precio = parseFloat(selectedOption.dataset.precio.replace(/[^\d]/g, '')) || 0;
        
        pricePerHour.textContent = formatPrice(precio);
        priceInfo.style.display = 'block';
        
        // Calcular precio si ya hay horas seleccionadas
        calculatePrice();
    } else {
        priceInfo.style.display = 'none';
    }
}

// Calcular precio total basado en horas seleccionadas
function calculatePrice() {
    const canchaSelect = document.getElementById('canchaId');
    const horaInicio = document.getElementById('horaInicio').value;
    const horaFin = document.getElementById('horaFin').value;
    const totalPriceElement = document.getElementById('totalPrice');
    const nightSurchargeNote = document.getElementById('nightSurchargeNote');
    
    if (!canchaSelect.value || !horaInicio || !horaFin) {
        totalPriceElement.textContent = '$0';
        nightSurchargeNote.style.display = 'none';
        return;
    }
    
    const selectedOption = canchaSelect.options[canchaSelect.selectedIndex];
    const precioPorHora = parseFloat(selectedOption.dataset.precio.replace(/[^\d]/g, '')) || 0;
    
    // Calcular duración en horas
    const inicio = new Date(`2000-01-01T${horaInicio}:00`);
    const fin = new Date(`2000-01-01T${horaFin}:00`);
    
    if (fin <= inicio) {
        alert('La hora de fin debe ser posterior a la hora de inicio');
        document.getElementById('horaFin').value = '';
        return;
    }
    
    const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
    
    // Validar máximo 2 horas
    if (duracionHoras > 2) {
        alert('No se pueden reservar más de 2 horas consecutivas');
        document.getElementById('horaFin').value = '';
        return;
    }
    
    let precioTotal = precioPorHora * duracionHoras;
    let hasNightSurcharge = false;
    
    // Verificar recargo nocturno (después de las 6 PM)
    const horaInicioNum = parseInt(horaInicio.split(':')[0]);
    const horaFinNum = parseInt(horaFin.split(':')[0]);
    
    if (horaInicioNum >= 18 || horaFinNum > 18) {
        precioTotal *= 1.2; // 20% de recargo
        hasNightSurcharge = true;
    }
    
    totalPriceElement.textContent = formatPrice(precioTotal);
    nightSurchargeNote.style.display = hasNightSurcharge ? 'block' : 'none';
}

// Función para formatear precio
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(price);
}

// Cargar reservas
async function loadReservations() {
    const loading = document.getElementById('loading');
    
    try {
        // Mostrar loading
        if (loading) loading.style.display = 'block';
        
        // Obtener el filtro de fecha si existe
        const dateFilter = document.getElementById('filterDate')?.value;
        
        let url = `${API_BASE_URL}/reservas`;
        if (dateFilter) {
            url += `?fecha=${dateFilter}`;
        }
        
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            // La API devuelve un objeto con reservations array y count
            let allReservations = data.reservations || data || [];
            
            // Si hay filtro de fecha, filtrar localmente también por si acaso
            if (dateFilter) {
                allReservations = allReservations.filter(reservation => {
                    const reservationDate = reservation.fecha_reserva || reservation.fecha;
                    if (!reservationDate) return false;
                    
                    // Normalizar fechas para comparación
                    const filterDate = new Date(dateFilter).toISOString().split('T')[0];
                    const resDate = new Date(reservationDate).toISOString().split('T')[0];
                    
                    return resDate === filterDate;
                });
            }
            
            reservations = allReservations;
            console.log('=== DATOS COMPLETOS DE RESERVAS ===');
            console.log('Total reservas cargadas:', reservations.length);
            if (dateFilter) {
                console.log('Filtro de fecha aplicado:', dateFilter);
            }
            if (reservations.length > 0) {
                console.log('Estructura de la primera reserva:', reservations[0]);
                console.log('Campos disponibles:', Object.keys(reservations[0]));
                if (reservations[0].cancha) {
                    console.log('Datos de cancha:', reservations[0].cancha);
                }
                if (reservations[0].usuario) {
                    console.log('Datos de usuario:', reservations[0].usuario);
                }
            }
            console.log('=== FIN DATOS RESERVAS ===');
            updateStats();
            displayReservations();
        } else {
            console.error('Error response:', response.status, response.statusText);
            Utils.showToast('Error al cargar las reservas', 'error');
        }
    } catch (error) {
        console.error('Error loading reservations:', error);
        Utils.showToast('Error de conexión al cargar las reservas', 'error');
    } finally {
        // Ocultar loading siempre
        if (loading) loading.style.display = 'none';
    }
}

// Actualizar estadísticas
function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = reservations.filter(r => {
        const reservationDate = r.fecha_reserva || r.fecha;
        return reservationDate === today;
    });
    const activeReservations = reservations.filter(r => r.estado === 'confirmada');
    const completedReservations = reservations.filter(r => r.estado === 'completada');

    document.getElementById('totalReservas').textContent = reservations.length;
    document.getElementById('reservasHoy').textContent = todayReservations.length;
    document.getElementById('reservasActivas').textContent = activeReservations.length;
    document.getElementById('reservasCompletadas').textContent = completedReservations.length;
}

// Mostrar reservas
function displayReservations() {
    const container = document.getElementById('reservationsGrid');
    
    if (!reservations || reservations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No hay reservas</h3>
                <p>Aún no se han registrado reservas en el sistema</p>
            </div>
        `;
        return;
    }

    container.innerHTML = reservations.map(reservation => {
        // Buscar cancha por id, considerando la estructura anidada de la API
        const cancha = reservation.cancha || canchas.find(c => c.id === reservation.id_cancha);
        const usuario = reservation.usuario;
        
        const statusClass = reservation.estado === 'confirmada' ? 'confirmed' : 
                          reservation.estado === 'pendiente' ? 'pending' : 'cancelled';
        
        return `
            <div class="reservation-card ${statusClass}">
                <div class="reservation-header">
                    <div class="reservation-info">
                        <h3>${cancha ? (cancha.nombre_cancha || cancha.nombre) : 'Cancha no encontrada'}</h3>
                        <span class="reservation-status status-${statusClass}">
                            ${reservation.estado.charAt(0).toUpperCase() + reservation.estado.slice(1)}
                        </span>
                    </div>
                    <div class="reservation-price">
                        $${parseFloat(reservation.precio_total || reservation.totalPrice || 0).toLocaleString()}
                    </div>
                </div>
                <div class="reservation-details">
                    <div class="detail-row">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(reservation.fecha_reserva || reservation.fecha)}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-clock"></i>
                        <span>${formatTime(reservation.hora_inicio)} - ${formatTime(reservation.hora_fin)}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-user"></i>
                        <span>${usuario?.nombre || reservation.customerName || 'Usuario no encontrado'}</span>
                    </div>
                    ${reservation.observaciones ? `
                    <div class="detail-row">
                        <i class="fas fa-comment"></i>
                        <span>${reservation.observaciones}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="reservation-actions">
                    <button class="btn btn-primary" onclick="editReservation(${reservation.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteReservation(${reservation.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Formatear fecha
function formatDate(dateString) {
    if (!dateString) return 'Fecha no disponible';
    const date = new Date(dateString + 'T00:00:00');
    if (isNaN(date.getTime())) return 'Fecha inválida';
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function formatTime(timeString) {
    if (!timeString) return 'Hora no disponible';
    
    // Si ya está en formato HH:MM, devolverlo tal como está
    if (timeString.match(/^\d{2}:\d{2}$/)) {
        return timeString;
    }
    
    // Si es un timestamp o fecha completa, extraer solo la hora
    try {
        const date = new Date(timeString);
        if (!isNaN(date.getTime())) {
            return date.toLocaleTimeString('es-ES', { 
                hour: '2-digit', 
                minute: '2-digit',
                hour12: false
            });
        }
    } catch (e) {
        console.warn('Error formateando hora:', timeString, e);
    }
    
    return timeString; // Devolver el valor original si no se puede formatear
}

// Abrir modal para crear
function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Nueva Reserva';
    document.getElementById('reservationForm').reset();
    document.getElementById('reservationId').value = '';
    document.getElementById('priceInfo').style.display = 'none';
    document.getElementById('paymentStatus').style.display = 'none';
    paymentCompleted = false; // Resetear estado de pago
    
    // Limpiar cliente seleccionado al abrir modal para nueva reserva
    clearSelectedClient();
    
    updateSaveButton();
    document.getElementById('reservationModal').classList.add('show');
}

// Funciones para el modal de pago
function openPaymentModal() {
    console.log('openPaymentModal called'); // Debug
    const modal = document.getElementById('paymentModal');
    console.log('Modal element:', modal); // Debug
    if (modal) {
        modal.style.display = 'flex';
        console.log('Modal display set to flex'); // Debug
    } else {
        console.error('Payment modal not found!');
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

function confirmPayment() {
    console.log('=== CONFIRMANDO PAGO ===');
    
    // Simular procesamiento de pago
    paymentCompleted = true;
    console.log('Estado de pago actualizado:', paymentCompleted);
    
    // Mostrar estado de pago completado
    const paymentStatusElement = document.getElementById('paymentStatus');
    if (paymentStatusElement) {
        paymentStatusElement.style.display = 'block';
        console.log('Elemento paymentStatus mostrado');
    } else {
        console.error('ERROR: Elemento paymentStatus no encontrado');
    }
    
    // Actualizar botón de guardar
    updateSaveButton();
    console.log('Botón de guardar actualizado');
    
    // Cerrar modal de pago
    closePaymentModal();
    console.log('Modal de pago cerrado');
    
    // Mostrar mensaje de éxito
    Utils.showToast('Pago procesado exitosamente. La reserva quedará pendiente de confirmación.', 'success');
    console.log('=== PAGO CONFIRMADO EXITOSAMENTE ===');
}

function updateSaveButton() {
    const saveBtn = document.getElementById('saveReservationBtn');
    const reservationId = document.getElementById('reservationId').value;
    
    // Si es una edición de reserva existente, permitir guardar
    if (reservationId) {
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Actualizar Reserva';
        saveBtn.disabled = false;
        return;
    }
    
    // Para nuevas reservas, verificar el pago
    if (paymentCompleted) {
        saveBtn.innerHTML = '<i class="fas fa-clock"></i> Crear Reserva Pendiente';
        saveBtn.disabled = false;
    } else {
        saveBtn.innerHTML = '<i class="fas fa-lock"></i> Pago Requerido';
        saveBtn.disabled = true;
    }
}

// Editar reserva
function editReservation(id) {
    console.log('=== EDITANDO RESERVA ===', id);
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) {
        console.error('Reserva no encontrada:', id);
        return;
    }

    console.log('Datos de la reserva:', reservation);

    // Verificar y establecer elementos del modal
    const modalTitle = document.getElementById('modalTitle');
    if (modalTitle) {
        modalTitle.textContent = 'Editar Reserva';
    } else {
        console.error('Elemento modalTitle no encontrado');
    }

    const reservationIdField = document.getElementById('reservationId');
    if (reservationIdField) {
        reservationIdField.value = reservation.id;
    } else {
        console.error('Elemento reservationId no encontrado');
    }

    const canchaIdField = document.getElementById('canchaId');
    if (canchaIdField) {
        canchaIdField.value = reservation.id_cancha;
    } else {
        console.error('Elemento canchaId no encontrado');
    }

    const fechaField = document.getElementById('fecha');
    if (fechaField) {
        // Formatear la fecha correctamente para el input date
        const fechaReserva = new Date(reservation.fecha_reserva);
        const fechaFormateada = fechaReserva.toISOString().split('T')[0];
        fechaField.value = fechaFormateada;
        console.log('Fecha establecida:', fechaFormateada);
    } else {
        console.error('Elemento fecha no encontrado');
    }

    const horaInicioField = document.getElementById('horaInicio');
    if (horaInicioField) {
        // Formatear la hora correctamente para el input time
        const horaInicio = new Date(reservation.hora_inicio);
        const horaFormateada = horaInicio.toTimeString().slice(0, 5);
        horaInicioField.value = horaFormateada;
        console.log('Hora inicio establecida:', horaFormateada);
    } else {
        console.error('Elemento horaInicio no encontrado');
    }

    const horaFinField = document.getElementById('horaFin');
    if (horaFinField) {
        // Formatear la hora correctamente para el input time
        const horaFin = new Date(reservation.hora_fin);
        const horaFormateada = horaFin.toTimeString().slice(0, 5);
        horaFinField.value = horaFormateada;
        console.log('Hora fin establecida:', horaFormateada);
    } else {
        console.error('Elemento horaFin no encontrado');
    }

    // El campo precioTotal no existe en el formulario, lo omitimos
    // document.getElementById('precioTotal').value = reservation.precio_total;

    const observacionesField = document.getElementById('observaciones');
    if (observacionesField) {
        observacionesField.value = reservation.observaciones || '';
    } else {
        console.error('Elemento observaciones no encontrado');
    }

    // Establecer información del cliente si existe
    if (reservation.usuario) {
        const clienteIdField = document.getElementById('clienteId');
        if (clienteIdField) {
            clienteIdField.value = reservation.id_usuario;
        }

        // Limpiar el campo de búsqueda y ocultar resultados
        const clienteBuscador = document.getElementById('clienteBuscador');
        if (clienteBuscador) {
            clienteBuscador.value = `${reservation.usuario.nombre} - ${reservation.usuario.correo}`;
        }
        hideSearchResults();

        // Mostrar información del cliente seleccionado
        selectedClient = {
            id: reservation.id_usuario,
            nombre: reservation.usuario.nombre,
            email: reservation.usuario.correo,
            telefono: reservation.usuario.telefono
        };

        const clienteSeleccionado = document.getElementById('clienteSeleccionado');
        const clienteNombre = document.getElementById('clienteNombreSeleccionado');
        const clienteEmail = document.getElementById('clienteEmailSeleccionado');
        const clienteTelefono = document.getElementById('clienteTelefono');

        if (clienteSeleccionado && clienteNombre && clienteEmail) {
            clienteSeleccionado.style.display = 'block';
            clienteNombre.textContent = selectedClient.nombre;
            clienteEmail.textContent = selectedClient.email;
        }

        if (clienteTelefono) {
            clienteTelefono.value = selectedClient.telefono || '';
        }

        console.log('Cliente autocompletado:', selectedClient);
    }

    const modal = document.getElementById('reservationModal');
    if (modal) {
        modal.classList.add('show');
    } else {
        console.error('Elemento reservationModal no encontrado');
    }

    console.log('=== MODAL DE EDICIÓN ABIERTO ===');
}

// Cerrar modal
function closeModal() {
    document.getElementById('reservationModal').classList.remove('show');
}

// Guardar reserva
async function saveReservation() {
    console.log('=== INICIANDO PROCESO DE GUARDADO DE RESERVA ===');
    console.log('Estado actual de paymentCompleted:', paymentCompleted);
    
    // Verificar que el pago haya sido completado para nuevas reservas
    const reservationId = document.getElementById('reservationId').value;
    console.log('ID de reserva (para edición):', reservationId);
    
    if (!reservationId && !paymentCompleted) {
        console.log('ERROR: Pago no completado para nueva reserva');
        console.log('reservationId:', reservationId, 'paymentCompleted:', paymentCompleted);
        Utils.showToast('Debe completar el pago antes de crear la reserva', 'error');
        return;
    }
    
    console.log('✅ Validación de pago pasada, continuando...');

    // Obtener datos del formulario
    const form = document.getElementById('reservationForm');
    if (!form) {
        console.error('ERROR: No se encontró el formulario de reserva');
        Utils.showToast('Error: Formulario no encontrado', 'error');
        return;
    }

    console.log('✅ Formulario encontrado, obteniendo datos...');
    const formData = new FormData(form);
    
    // Validar campos requeridos
    const canchaId = formData.get('canchaId');
    const fecha = formData.get('fecha');
    const horaInicio = formData.get('horaInicio');
    const horaFin = formData.get('horaFin');
    
    console.log('Datos básicos del formulario:', {
        canchaId,
        fecha,
        horaInicio,
        horaFin
    });
    
    // Validar que se haya seleccionado un cliente
    const clienteId = document.getElementById('clienteId').value;
    console.log('Cliente seleccionado - ID:', clienteId, 'selectedClient:', selectedClient);
    
    if (!clienteId) {
        console.error('ERROR: No se ha seleccionado un cliente');
        Utils.showToast('Debe seleccionar un cliente registrado', 'error');
        return;
    }

    console.log('✅ Cliente validado, continuando...');

    console.log('Datos del formulario:', {
        canchaId,
        fecha,
        horaInicio,
        horaFin,
        clienteId,
        selectedClient
    });

    if (!canchaId || !fecha || !horaInicio || !horaFin) {
        console.error('ERROR: Campos requeridos faltantes');
        Utils.showToast('Por favor complete todos los campos requeridos', 'error');
        return;
    }

    if (!currentUser || !currentUser.id) {
        console.error('ERROR: Usuario no autenticado');
        Utils.showToast('Error: Usuario no autenticado', 'error');
        return;
    }

    // Obtener observaciones del formulario
    const observaciones = document.getElementById('observaciones').value.trim();
    
    // Obtener teléfono del cliente seleccionado
    const telefonoCliente = selectedClient?.telefono || document.getElementById('clienteTelefono').value.trim();

    // Crear objeto de datos con formato correcto para la base de datos
    const reservationData = {
        id_cancha: parseInt(canchaId),
        id_usuario: parseInt(clienteId), // Usar el ID del cliente seleccionado
        fecha_reserva: new Date(fecha + 'T00:00:00.000Z').toISOString(),
        hora_inicio: new Date(fecha + 'T' + horaInicio + ':00.000Z').toISOString(),
        hora_fin: new Date(fecha + 'T' + horaFin + ':00.000Z').toISOString(),
        estado: (!reservationId && paymentCompleted) ? 'pendiente' : 'confirmada',
        observaciones: observaciones || null,
        telefono_cliente: telefonoCliente || null
    };

    console.log('Datos de reserva preparados para envío:', reservationData);
    console.log('URL del API:', API_BASE_URL);

    try {
        let url, method;
        
        if (reservationId) {
            // Actualizar reserva existente
            url = `${API_BASE_URL}/reservas/${reservationId}`;
            method = 'PUT';
            console.log('Actualizando reserva existente:', reservationId);
        } else {
            // Crear nueva reserva
            url = `${API_BASE_URL}/reservas`;
            method = 'POST';
            console.log('Creando nueva reserva');
        }

        console.log('Enviando petición:', { url, method });

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(reservationData)
        });

        console.log('Respuesta recibida:', {
            status: response.status,
            statusText: response.statusText,
            ok: response.ok,
            headers: Object.fromEntries(response.headers.entries())
        });

        // Intentar leer la respuesta como JSON
        let responseData;
        const responseText = await response.text();
        console.log('Texto de respuesta crudo:', responseText);

        try {
            responseData = JSON.parse(responseText);
        } catch (parseError) {
            console.error('Error al parsear JSON:', parseError);
            responseData = { error: 'Respuesta del servidor no válida', rawResponse: responseText };
        }

        if (response.ok) {
            console.log('✅ RESERVA GUARDADA EXITOSAMENTE:', responseData);
            closeModal();
            await loadReservations(); // Esperar a que se recarguen las reservas
            Utils.showToast(reservationId ? 'Reserva actualizada exitosamente' : 'Reserva creada exitosamente', 'success');
            // Resetear el estado del pago después de crear la reserva
            paymentCompleted = false;
        } else {
            console.error('❌ ERROR DEL SERVIDOR:', responseData);
            Utils.showToast(responseData.error || `Error del servidor: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('❌ ERROR DE CONEXIÓN:', error);
        console.error('Stack trace:', error.stack);
        Utils.showToast('Error de conexión con el servidor. Verifique su conexión a internet.', 'error');
    }

    console.log('=== FIN DEL PROCESO DE GUARDADO ===');
}

// Editar reserva
async function deleteReservation(id) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta reserva?')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/reservas/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            loadReservations();
            alert('Reserva eliminada exitosamente');
        } else {
            alert('Error al eliminar la reserva');
        }
    } catch (error) {
        console.error('Error deleting reservation:', error);
        alert('Error de conexión');
    }
}

// Filtrar reservas
function filterReservations() {
    const searchInput = document.getElementById('searchInput');
    const statusFilterEl = document.getElementById('filterStatus');
    const canchaFilterEl = document.getElementById('filterCancha');
    const dateFilterEl = document.getElementById('filterDate');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const statusFilter = statusFilterEl ? statusFilterEl.value : '';
    const canchaFilter = canchaFilterEl ? canchaFilterEl.value : '';
    const dateFilter = dateFilterEl ? dateFilterEl.value : '';

    let filteredReservations = [...reservations]; // Crear copia para no modificar el original

    if (searchTerm) {
        filteredReservations = filteredReservations.filter(reservation => {
            const cancha = canchas.find(c => c.id === reservation.id_cancha);
            const canchaName = cancha ? cancha.nombre.toLowerCase() : '';
            const userName = reservation.usuario?.nombre?.toLowerCase() || '';
            
            return canchaName.includes(searchTerm) || 
                   userName.includes(searchTerm) ||
                   (reservation.fecha_reserva || reservation.fecha || '').includes(searchTerm);
        });
    }

    if (statusFilter) {
        filteredReservations = filteredReservations.filter(r => r.estado === statusFilter);
    }

    if (canchaFilter) {
        filteredReservations = filteredReservations.filter(r => r.id_cancha == canchaFilter);
    }

    if (dateFilter) {
        filteredReservations = filteredReservations.filter(reservation => {
            const reservationDate = reservation.fecha_reserva || reservation.fecha;
            if (!reservationDate) return false;
            
            // Normalizar fechas para comparación
            const filterDate = new Date(dateFilter).toISOString().split('T')[0];
            const resDate = new Date(reservationDate).toISOString().split('T')[0];
            
            return resDate === filterDate;
        });
    }

    // Mostrar reservas filtradas sin modificar el array original
    displayFilteredReservations(filteredReservations);
}

// Nueva función para mostrar reservas filtradas
function displayFilteredReservations(filteredReservations) {
    const container = document.getElementById('reservationsGrid');
    
    if (!filteredReservations || filteredReservations.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-calendar-times"></i>
                <h3>No hay reservas</h3>
                <p>No se encontraron reservas que coincidan con los filtros aplicados</p>
            </div>
        `;
        return;
    }

    container.innerHTML = filteredReservations.map(reservation => {
        // Buscar cancha por id, considerando la estructura anidada de la API
        const cancha = reservation.cancha || canchas.find(c => c.id === reservation.id_cancha);
        const usuario = reservation.usuario;
        
        const statusClass = reservation.estado === 'confirmada' ? 'confirmed' : 
                          reservation.estado === 'pendiente' ? 'pending' : 'cancelled';
        
        return `
            <div class="reservation-card ${statusClass}">
                <div class="reservation-header">
                    <div class="reservation-info">
                        <h3>${cancha ? (cancha.nombre_cancha || cancha.nombre) : 'Cancha no encontrada'}</h3>
                        <span class="reservation-status status-${statusClass}">
                            ${reservation.estado.charAt(0).toUpperCase() + reservation.estado.slice(1)}
                        </span>
                    </div>
                    <div class="reservation-price">
                        $${parseFloat(reservation.precio_total || reservation.totalPrice || 0).toLocaleString()}
                    </div>
                </div>
                <div class="reservation-details">
                    <div class="detail-row">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(reservation.fecha_reserva || reservation.fecha)}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-clock"></i>
                        <span>${formatTime(reservation.hora_inicio)} - ${formatTime(reservation.hora_fin)}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-user"></i>
                        <span>${usuario?.nombre || reservation.customerName || 'Usuario no encontrado'}</span>
                    </div>
                    ${reservation.observaciones ? `
                    <div class="detail-row">
                        <i class="fas fa-comment"></i>
                        <span>${reservation.observaciones}</span>
                    </div>
                    ` : ''}
                </div>
                <div class="reservation-actions">
                    <button class="btn btn-primary" onclick="editReservation(${reservation.id})">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-danger" onclick="deleteReservation(${reservation.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Limpiar filtros
function clearFilters() {
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    const filterCancha = document.getElementById('filterCancha');
    const filterDate = document.getElementById('filterDate');
    
    if (searchInput) searchInput.value = '';
    if (filterStatus) filterStatus.value = '';
    if (filterCancha) filterCancha.value = '';
    if (filterDate) filterDate.value = '';
    
    loadReservations();
}

// Logout
function logout() {
    localStorage.removeItem(CONFIG.AUTH.USER_KEY);
    localStorage.removeItem(CONFIG.AUTH.TOKEN_KEY);
    window.location.href = 'login.html';
}

// Inicializar
window.addEventListener('load', () => {
    checkAuth();
    loadCanchas();
    loadReservations();
    initializeClientSearch(); // Inicializar el buscador de clientes
    
    // Configurar el evento submit del formulario
    const reservationForm = document.getElementById('reservationForm');
    if (reservationForm) {
        reservationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            console.log('=== FORMULARIO ENVIADO ===');
            await saveReservation();
        });
    } else {
        console.error('ERROR: No se encontró el formulario reservationForm');
    }
    
    // Configurar event listeners para los filtros
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    const filterCancha = document.getElementById('filterCancha');
    const filterDate = document.getElementById('filterDate');
    
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            console.log('Filtro de búsqueda cambiado:', searchInput.value);
            filterReservations();
        });
    }
    
    if (filterStatus) {
        filterStatus.addEventListener('change', () => {
            console.log('Filtro de estado cambiado:', filterStatus.value);
            filterReservations();
        });
    }
    
    if (filterCancha) {
        filterCancha.addEventListener('change', () => {
            console.log('Filtro de cancha cambiado:', filterCancha.value);
            filterReservations();
        });
    }
    
    if (filterDate) {
        filterDate.addEventListener('change', () => {
            console.log('Filtro de fecha cambiado:', filterDate.value);
            filterReservations();
        });
    }
});