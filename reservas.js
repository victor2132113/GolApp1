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
    
    // Formatear el rol con emoji
    const userRole = currentUser.rol || 'usuario';
    const roleElement = document.getElementById('userRole');
    if (roleElement) {
        if (userRole.toLowerCase() === 'administrador' || userRole.toLowerCase() === 'admin') {
            roleElement.textContent = '👑 Administrador';
            roleElement.className = 'role-badge admin';
        } else {
            roleElement.textContent = userRole.charAt(0).toUpperCase() + userRole.slice(1);
            roleElement.className = 'role-badge';
        }
    }
    
    document.getElementById('userEmail').textContent = '📧 ' + (currentUser.correo || currentUser.email || 'victorino@golapp.com');
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

// Seleccionar cliente - CORREGIDO: No borrar el correo al seleccionar nombre
function selectClient(id, nombre, email, telefono) {
    selectedClient = { id, nombre, email, telefono };
    
    // Actualizar campos del formulario - NO limpiar el buscador
    document.getElementById('clienteBuscador').value = nombre; // Mostrar solo el nombre en el buscador
    document.getElementById('clienteId').value = id;
    document.getElementById('clienteTelefono').value = telefono || '';
    
    // Mostrar cliente seleccionado con toda la información
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
        if (totalPriceElement) totalPriceElement.textContent = '$0';
        if (nightSurchargeNote) nightSurchargeNote.style.display = 'none';
        return 0;
    }
    
    const selectedOption = canchaSelect.options[canchaSelect.selectedIndex];
    const precioPorHora = parseFloat(selectedOption.dataset.precio.replace(/[^\d]/g, '')) || 0;
    
    // Calcular duración en horas
    const inicio = new Date(`2000-01-01T${horaInicio}:00`);
    const fin = new Date(`2000-01-01T${horaFin}:00`);
    
    if (fin <= inicio) {
        alert('La hora de fin debe ser posterior a la hora de inicio');
        document.getElementById('horaFin').value = '';
        return 0;
    }
    
    const duracionHoras = (fin - inicio) / (1000 * 60 * 60);
    
    // Validar máximo 2 horas
    if (duracionHoras > 2) {
        alert('No se pueden reservar más de 2 horas consecutivas');
        document.getElementById('horaFin').value = '';
        return 0;
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
    
    if (totalPriceElement) totalPriceElement.textContent = formatPrice(precioTotal);
    if (nightSurchargeNote) nightSurchargeNote.style.display = hasNightSurcharge ? 'block' : 'none';
    
    return precioTotal;
}

// Función para formatear precio
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(price);
}

// Función para filtrar horas disponibles según la fecha seleccionada
function filterAvailableHours() {
    const fechaInput = document.getElementById('fecha');
    const horaInicioSelect = document.getElementById('horaInicio');
    const horaFinSelect = document.getElementById('horaFin');
    
    if (!fechaInput || !horaInicioSelect) return;
    
    const selectedDate = new Date(fechaInput.value + 'T00:00:00');
    const today = new Date();
    const currentHour = today.getHours();
    
    // Si la fecha seleccionada es hoy, filtrar horas pasadas
    const isToday = selectedDate.toDateString() === today.toDateString();
    
    // Definir todas las horas disponibles
    const allHours = [
        { value: "06:00", text: "6:00 AM", hour: 6 },
        { value: "07:00", text: "7:00 AM", hour: 7 },
        { value: "08:00", text: "8:00 AM", hour: 8 },
        { value: "09:00", text: "9:00 AM", hour: 9 },
        { value: "10:00", text: "10:00 AM", hour: 10 },
        { value: "11:00", text: "11:00 AM", hour: 11 },
        { value: "12:00", text: "12:00 PM", hour: 12 },
        { value: "13:00", text: "1:00 PM", hour: 13 },
        { value: "14:00", text: "2:00 PM", hour: 14 },
        { value: "15:00", text: "3:00 PM", hour: 15 },
        { value: "16:00", text: "4:00 PM", hour: 16 },
        { value: "17:00", text: "5:00 PM", hour: 17 },
        { value: "18:00", text: "6:00 PM", hour: 18 },
        { value: "19:00", text: "7:00 PM", hour: 19 },
        { value: "20:00", text: "8:00 PM", hour: 20 },
        { value: "21:00", text: "9:00 PM", hour: 21 },
        { value: "22:00", text: "10:00 PM", hour: 22 }
    ];
    
    const endHours = [
        { value: "07:00", text: "7:00 AM", hour: 7 },
        { value: "08:00", text: "8:00 AM", hour: 8 },
        { value: "09:00", text: "9:00 AM", hour: 9 },
        { value: "10:00", text: "10:00 AM", hour: 10 },
        { value: "11:00", text: "11:00 AM", hour: 11 },
        { value: "12:00", text: "12:00 PM", hour: 12 },
        { value: "13:00", text: "1:00 PM", hour: 13 },
        { value: "14:00", text: "2:00 PM", hour: 14 },
        { value: "15:00", text: "3:00 PM", hour: 15 },
        { value: "16:00", text: "4:00 PM", hour: 16 },
        { value: "17:00", text: "5:00 PM", hour: 17 },
        { value: "18:00", text: "6:00 PM", hour: 18 },
        { value: "19:00", text: "7:00 PM", hour: 19 },
        { value: "20:00", text: "8:00 PM", hour: 20 },
        { value: "21:00", text: "9:00 PM", hour: 21 },
        { value: "22:00", text: "10:00 PM", hour: 22 },
        { value: "23:00", text: "11:00 PM", hour: 23 }
    ];
    
    // Guardar valores seleccionados
    const selectedStartHour = horaInicioSelect.value;
    const selectedEndHour = horaFinSelect ? horaFinSelect.value : '';
    
    // Limpiar opciones actuales
    horaInicioSelect.innerHTML = '<option value="">Selecciona una hora...</option>';
    if (horaFinSelect) {
        horaFinSelect.innerHTML = '<option value="">Selecciona la hora final...</option>';
    }
    
    // Filtrar horas de inicio
    const availableStartHours = isToday ? 
        allHours.filter(hour => hour.hour > currentHour) : 
        allHours;
    
    // Agregar opciones de hora de inicio
    availableStartHours.forEach(hour => {
        const option = document.createElement('option');
        option.value = hour.value;
        option.textContent = hour.text;
        horaInicioSelect.appendChild(option);
    });
    
    // Agregar opciones de hora de fin
    if (horaFinSelect) {
        const availableEndHours = isToday ? 
            endHours.filter(hour => hour.hour > currentHour) : 
            endHours;
            
        availableEndHours.forEach(hour => {
            const option = document.createElement('option');
            option.value = hour.value;
            option.textContent = hour.text;
            horaFinSelect.appendChild(option);
        });
    }
    
    // Restaurar valores seleccionados si aún están disponibles
    if (selectedStartHour && availableStartHours.some(h => h.value === selectedStartHour)) {
        horaInicioSelect.value = selectedStartHour;
    }
    if (selectedEndHour && horaFinSelect) {
        const availableEndHours = isToday ? 
            endHours.filter(hour => hour.hour > currentHour) : 
            endHours;
        if (availableEndHours.some(h => h.value === selectedEndHour)) {
            horaFinSelect.value = selectedEndHour;
        }
    }
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
    const today = new Date();
    const todayString = today.toISOString().split('T')[0]; // YYYY-MM-DD
    
    const todayReservations = reservations.filter(r => {
        const reservationDate = r.fecha_reserva || r.fecha;
        if (!reservationDate) return false;
        
        // Convertir la fecha de la reserva a formato YYYY-MM-DD para comparar
        let dateToCompare;
        try {
            if (typeof reservationDate === 'string') {
                // Si es string, puede ser YYYY-MM-DD o DD/MM/YYYY
                if (reservationDate.includes('/')) {
                    // Formato DD/MM/YYYY
                    const [day, month, year] = reservationDate.split('/');
                    dateToCompare = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
                } else if (reservationDate.includes('-')) {
                    // Formato YYYY-MM-DD o similar
                    dateToCompare = new Date(reservationDate).toISOString().split('T')[0];
                } else {
                    return false;
                }
            } else {
                // Si es objeto Date
                dateToCompare = new Date(reservationDate).toISOString().split('T')[0];
            }
            
            return dateToCompare === todayString;
        } catch (error) {
            console.warn('Error al procesar fecha de reserva:', reservationDate, error);
            return false;
        }
    });
    
    const activeReservations = reservations.filter(r => r.estado === 'confirmada');
    const completedReservations = reservations.filter(r => r.estado === 'finalizada');
    
    // Actualizar contadores
    document.getElementById('reservasActivas').textContent = activeReservations.length;
    document.getElementById('reservasCompletadas').textContent = completedReservations.length;
    document.getElementById('totalReservas').textContent = reservations.length;
    document.getElementById('reservasHoy').textContent = todayReservations.length;
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
    
    // Ocultar elementos específicos de edición
    const estadoGroup = document.getElementById('estadoGroup');
    
    if (estadoGroup) {
        estadoGroup.style.display = 'none';
    }
    
    paymentCompleted = false; // Resetear estado de pago
    
    // Limpiar cliente seleccionado al abrir modal para nueva reserva
    clearSelectedClient();
    
    updateSaveButton();
    
    // Actualizar información de pago para nueva reserva
    updatePaymentDisplay();
    
    // Filtrar horas disponibles al abrir el modal
    filterAvailableHours();
    
    document.getElementById('reservationModal').classList.add('show');
}

// Funciones para el modal de pago
function openPaymentModal() {
    const modal = document.getElementById('paymentModal');
    if (modal) {
        modal.style.display = 'flex';
    }
}

function closePaymentModal() {
    document.getElementById('paymentModal').style.display = 'none';
}

function confirmPayment() {
    // Simular procesamiento de pago
    paymentCompleted = true;
    
    // Mostrar estado de pago completado
    const paymentStatusElement = document.getElementById('paymentStatus');
    if (paymentStatusElement) {
        paymentStatusElement.style.display = 'block';
    }
    
    // Actualizar botón de guardar
    updateSaveButton();
    
    // Actualizar visualización del pago (abono en verde)
    updatePaymentDisplay();
    
    // Cerrar modal de pago
    closePaymentModal();
    
    // Mostrar mensaje de éxito
    Utils.showToast('Pago procesado exitosamente. La reserva quedará pendiente de confirmación.', 'success');
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
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) {
        console.error('Reserva no encontrada:', id);
        return;
    }

    // Establecer elementos del modal
    document.getElementById('modalTitle').textContent = 'Editar Reserva';
    document.getElementById('reservationId').value = reservation.id;
    document.getElementById('canchaId').value = reservation.id_cancha;
    
    // Formatear la fecha correctamente para el input date
    const fechaReserva = new Date(reservation.fecha_reserva);
    const fechaFormateada = fechaReserva.toISOString().split('T')[0];
    document.getElementById('fecha').value = fechaFormateada;
    
    // Filtrar horas disponibles para la fecha seleccionada
    filterAvailableHours();
    
    // Establecer horas después de filtrar
    setTimeout(() => {
        const horaString = reservation.hora_inicio;
        const horaFormateada = horaString.substring(0, 5);
        document.getElementById('horaInicio').value = horaFormateada;
        
        const horaFinString = reservation.hora_fin;
        const horaFinFormateada = horaFinString.substring(0, 5);
        document.getElementById('horaFin').value = horaFinFormateada;
    }, 100);
    
    document.getElementById('observaciones').value = reservation.observaciones || '';

    // Establecer información del cliente si existe
    if (reservation.usuario) {
        document.getElementById('clienteId').value = reservation.id_usuario;
        document.getElementById('clienteBuscador').value = reservation.usuario.nombre;
        hideSearchResults();

        // Mostrar información del cliente seleccionado
        selectedClient = {
            id: reservation.id_usuario,
            nombre: reservation.usuario.nombre,
            email: reservation.usuario.correo,
            telefono: reservation.usuario.telefono
        };

        document.getElementById('clienteSeleccionado').style.display = 'block';
        document.getElementById('clienteNombreSeleccionado').textContent = selectedClient.nombre;
        document.getElementById('clienteEmailSeleccionado').textContent = selectedClient.email;
        document.getElementById('clienteTelefono').value = selectedClient.telefono || '';
    }

    // Mostrar elementos específicos de edición
    const estadoGroup = document.getElementById('estadoGroup');
    
    if (estadoGroup) {
        estadoGroup.style.display = 'block';
        const estadoSelect = document.getElementById('estadoReserva');
        if (estadoSelect) {
            estadoSelect.value = reservation.estado;
        }
    }

    // Actualizar información de pago según el estado
    updatePaymentDisplay();

    document.getElementById('reservationModal').classList.add('show');
}

// Cerrar modal
function closeModal() {
    // Ocultar elementos específicos de edición al cerrar
    const estadoGroup = document.getElementById('estadoGroup');
    
    if (estadoGroup) {
        estadoGroup.style.display = 'none';
    }
    
    document.getElementById('reservationModal').classList.remove('show');
}

// Función para actualizar la visualización de pago según el estado - CORREGIDO
function updatePaymentDisplay() {
    const estadoSelect = document.getElementById('estadoReserva');
    const abonoPago = document.getElementById('abonoPago');
    const pagoRestante = document.getElementById('pagoRestante');
    const pagoRestanteValue = document.getElementById('pagoRestanteValue');
    
    if (!abonoPago || !pagoRestante) {
        return;
    }
    
    // Calcular precio total y pago restante
    const precioTotal = calculatePrice();
    const abono = 15000;
    const restante = Math.max(0, precioTotal - abono);
    
    if (pagoRestanteValue) {
        pagoRestanteValue.textContent = `$${restante.toLocaleString()} COP`;
    }
    
    // Remover todas las clases de estado
    abonoPago.classList.remove('confirmada');
    pagoRestante.classList.remove('confirmada');
    
    // Aplicar estilos según el estado
    if (estadoSelect && (estadoSelect.value === 'confirmada' || estadoSelect.value === 'finalizada')) {
        // Ambos campos en verde cuando está confirmada o finalizada
        abonoPago.classList.add('confirmada');
        pagoRestante.classList.add('confirmada');
    } else {
        // Estado pendiente: abono verde SOLO si el pago fue completado
        if (paymentCompleted) {
            abonoPago.classList.add('confirmada');
        }
        // Pago restante mantiene estilos por defecto (rojo)
    }
}

// Guardar reserva
async function saveReservation() {
    // Verificar que el pago haya sido completado para nuevas reservas
    const reservationId = document.getElementById('reservationId').value;
    
    if (!reservationId && !paymentCompleted) {
        Utils.showToast('Debe completar el pago antes de crear la reserva', 'error');
        return;
    }

    // Obtener datos del formulario
    const form = document.getElementById('reservationForm');
    if (!form) {
        Utils.showToast('Error: Formulario no encontrado', 'error');
        return;
    }

    const formData = new FormData(form);
    
    // Validar campos requeridos
    const canchaId = formData.get('canchaId');
    const fecha = formData.get('fecha');
    const horaInicio = formData.get('horaInicio');
    const horaFin = formData.get('horaFin');
    
    // Validar que se haya seleccionado un cliente
    const clienteId = document.getElementById('clienteId').value;
    
    if (!clienteId) {
        Utils.showToast('Debe seleccionar un cliente registrado', 'error');
        return;
    }

    if (!canchaId || !fecha || !horaInicio || !horaFin) {
        Utils.showToast('Por favor complete todos los campos requeridos', 'error');
        return;
    }

    if (!currentUser || !currentUser.id) {
        Utils.showToast('Error: Usuario no autenticado', 'error');
        return;
    }

    // Obtener observaciones del formulario
    const observaciones = document.getElementById('observaciones').value.trim();
    
    // Obtener teléfono del cliente seleccionado
    const telefonoCliente = selectedClient?.telefono || document.getElementById('clienteTelefono').value.trim();

    // Obtener estado de la reserva (solo para edición)
    let estadoReserva = 'pendiente'; // Estado por defecto para nuevas reservas
    if (reservationId) {
        const estadoSelect = document.getElementById('estadoReserva');
        if (estadoSelect && estadoSelect.value) {
            estadoReserva = estadoSelect.value;
        }
    } else if (paymentCompleted) {
        estadoReserva = 'pendiente'; // Nueva reserva con pago completado
    }

    // Crear objeto de datos con formato correcto para la base de datos
    const reservationData = {
        id_cancha: parseInt(canchaId),
        id_usuario: parseInt(clienteId), // Usar el ID del cliente seleccionado
        fecha_reserva: fecha, // Enviar solo la fecha sin conversión a ISO
        hora_inicio: horaInicio + ':00', // Formato HH:MM:SS
        hora_fin: horaFin + ':00', // Formato HH:MM:SS
        estado: estadoReserva,
        observaciones: observaciones || null,
        telefono_cliente: telefonoCliente || null
    };

    try {
        let url, method;
        
        if (reservationId) {
            // Actualizar reserva existente
            url = `${API_BASE_URL}/reservas/${reservationId}`;
            method = 'PUT';
        } else {
            // Crear nueva reserva
            url = `${API_BASE_URL}/reservas`;
            method = 'POST';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(reservationData)
        });

        // Intentar leer la respuesta como JSON
        let responseData;
        const responseText = await response.text();

        try {
            responseData = JSON.parse(responseText);
        } catch (parseError) {
            responseData = { error: 'Respuesta del servidor no válida', rawResponse: responseText };
        }

        if (response.ok) {
            closeModal();
            await loadReservations(); // Esperar a que se recarguen las reservas
            Utils.showToast(reservationId ? 'Reserva actualizada exitosamente' : 'Reserva creada exitosamente', 'success');
            // Resetear el estado del pago después de crear la reserva
            paymentCompleted = false;
        } else {
            Utils.showToast(responseData.error || `Error del servidor: ${response.status}`, 'error');
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        Utils.showToast('Error de conexión con el servidor. Verifique su conexión a internet.', 'error');
    }
}

// Eliminar reserva
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
            Utils.showToast('Reserva eliminada exitosamente', 'success');
        } else {
            Utils.showToast('Error al eliminar la reserva', 'error');
        }
    } catch (error) {
        console.error('Error deleting reservation:', error);
        Utils.showToast('Error de conexión', 'error');
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
            const canchaName = cancha ? (cancha.nombre_cancha || cancha.nombre || '').toLowerCase() : '';
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
    initializeClientSearch();
    
    // Agregar event listener para el cambio de fecha
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.addEventListener('change', filterAvailableHours);
        // Ejecutar al cargar para filtrar horas iniciales
        filterAvailableHours();
    }
    
    // Agregar event listener para el checkbox de "pagar por nequi"
    const pagarPorNequi = document.getElementById('pagarPorNequi');
    if (pagarPorNequi) {
        pagarPorNequi.addEventListener('change', updatePaymentDisplay);
    }
    
    // Configurar el evento submit del formulario
    const reservationForm = document.getElementById('reservationForm');
    if (reservationForm) {
        reservationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            await saveReservation();
        });
    }
    
    // Configurar event listeners para los filtros
    const searchInput = document.getElementById('searchInput');
    const filterStatus = document.getElementById('filterStatus');
    const filterCancha = document.getElementById('filterCancha');
    const filterDate = document.getElementById('filterDate');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterReservations);
    }
    
    if (filterStatus) {
        filterStatus.addEventListener('change', filterReservations);
    }
    
    if (filterCancha) {
        filterCancha.addEventListener('change', filterReservations);
    }
    
    if (filterDate) {
        filterDate.addEventListener('change', filterReservations);
    }
});