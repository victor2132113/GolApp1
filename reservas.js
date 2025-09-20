// Usar la configuración global de la API
const API_BASE_URL = CONFIG.API_BASE_URL;
let reservations = [];
let canchas = [];
let currentUser = null;

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
    try {
        const response = await fetch(`${API_BASE_URL}/reservas`);
        if (response.ok) {
            reservations = await response.json();
            updateStats();
            displayReservations();
        }
    } catch (error) {
        console.error('Error loading reservations:', error);
        alert('Error al cargar las reservas');
    }
}

// Actualizar estadísticas
function updateStats() {
    const today = new Date().toISOString().split('T')[0];
    const todayReservations = reservations.filter(r => r.fecha === today);
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
    
    if (reservations.length === 0) {
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
        const cancha = canchas.find(c => c.id === reservation.id_cancha);
        const statusClass = reservation.estado === 'confirmada' ? 'confirmed' : 
                          reservation.estado === 'pendiente' ? 'pending' : 'cancelled';
        
        return `
            <div class="reservation-card ${statusClass}">
                <div class="reservation-header">
                    <div class="reservation-info">
                        <h3>${cancha ? cancha.nombre : 'Cancha no encontrada'}</h3>
                        <span class="reservation-status status-${statusClass}">
                            ${reservation.estado.charAt(0).toUpperCase() + reservation.estado.slice(1)}
                        </span>
                    </div>
                    <div class="reservation-price">
                        $${parseFloat(reservation.precio_total || 0).toLocaleString()}
                    </div>
                </div>
                <div class="reservation-details">
                    <div class="detail-row">
                        <i class="fas fa-calendar"></i>
                        <span>${formatDate(reservation.fecha)}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-clock"></i>
                        <span>${reservation.hora_inicio} - ${reservation.hora_fin}</span>
                    </div>
                    <div class="detail-row">
                        <i class="fas fa-user"></i>
                        <span>${reservation.usuario?.nombre || 'Usuario no encontrado'}</span>
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
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Abrir modal para crear
function openCreateModal() {
    document.getElementById('modalTitle').textContent = 'Nueva Reserva';
    document.getElementById('reservationForm').reset();
    document.getElementById('reservationId').value = '';
    document.getElementById('reservationModal').classList.add('show');
}

// Editar reserva
function editReservation(id) {
    const reservation = reservations.find(r => r.id === id);
    if (!reservation) return;

    document.getElementById('modalTitle').textContent = 'Editar Reserva';
    document.getElementById('reservationId').value = reservation.id;
    document.getElementById('canchaId').value = reservation.id_cancha;
    document.getElementById('fecha').value = reservation.fecha;
    document.getElementById('horaInicio').value = reservation.hora_inicio;
    document.getElementById('horaFin').value = reservation.hora_fin;
    document.getElementById('precioTotal').value = reservation.precio_total;
    document.getElementById('observaciones').value = reservation.observaciones || '';
    document.getElementById('reservationModal').classList.add('show');
}

// Cerrar modal
function closeModal() {
    document.getElementById('reservationModal').classList.remove('show');
}

// Guardar reserva
async function saveReservation() {
    const form = document.getElementById('reservationForm');
    const formData = new FormData(form);
    const reservationId = document.getElementById('reservationId').value;
    
    const reservationData = {
        id_cancha: parseInt(formData.get('canchaId')),
        id_usuario: currentUser.id,
        fecha: formData.get('fecha'),
        hora_inicio: formData.get('horaInicio'),
        hora_fin: formData.get('horaFin'),
        precio_total: parseFloat(formData.get('precioTotal')),
        observaciones: formData.get('observaciones'),
        estado: 'confirmada'
    };

    try {
        let response;
        if (reservationId) {
            // Actualizar
            response = await fetch(`${API_BASE_URL}/reservas/${reservationId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reservationData)
            });
        } else {
            // Crear
            response = await fetch(`${API_BASE_URL}/reservas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(reservationData)
            });
        }

        if (response.ok) {
            closeModal();
            loadReservations();
            alert(reservationId ? 'Reserva actualizada exitosamente' : 'Reserva creada exitosamente');
        } else {
            const error = await response.json();
            alert('Error: ' + (error.message || 'No se pudo guardar la reserva'));
        }
    } catch (error) {
        console.error('Error saving reservation:', error);
        alert('Error de conexión');
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
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const statusFilter = document.getElementById('filterStatus').value;
    const canchaFilter = document.getElementById('filterCancha').value;

    let filteredReservations = reservations;

    if (searchTerm) {
        filteredReservations = filteredReservations.filter(reservation => {
            const cancha = canchas.find(c => c.id === reservation.id_cancha);
            const canchaName = cancha ? cancha.nombre.toLowerCase() : '';
            const userName = reservation.usuario?.nombre?.toLowerCase() || '';
            
            return canchaName.includes(searchTerm) || 
                   userName.includes(searchTerm) ||
                   reservation.fecha.includes(searchTerm);
        });
    }

    if (statusFilter) {
        filteredReservations = filteredReservations.filter(r => r.estado === statusFilter);
    }

    if (canchaFilter) {
        filteredReservations = filteredReservations.filter(r => r.id_cancha == canchaFilter);
    }

    // Actualizar vista con reservas filtradas
    const originalReservations = reservations;
    reservations = filteredReservations;
    displayReservations();
    reservations = originalReservations;
}

// Limpiar filtros
function clearFilters() {
    document.getElementById('searchInput').value = '';
    document.getElementById('filterStatus').value = '';
    document.getElementById('filterCancha').value = '';
    displayReservations();
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
});