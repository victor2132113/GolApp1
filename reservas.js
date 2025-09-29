// Variables globales
const API_BASE_URL = CONFIG.API_BASE_URL;
let reservations = [];
let canchas = [];
let currentUser = null;
let paymentCompleted = false; // Nueva variable para controlar el estado del pago
let selectedClient = null; // Variable para almacenar el cliente seleccionado
let searchTimeout = null; // Para debounce en la búsqueda
let autoRefreshInterval = null; // Para el auto-refresh

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
            console.log('🏟️ Canchas cargadas:', canchas.length);
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
        // Actualizar información de pago después del cálculo
        updatePaymentDisplay();
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
    
    console.log('🧮 Calculando precio:', {
        cancha: canchaSelect?.value,
        horaInicio,
        horaFin
    });
    
    if (!canchaSelect?.value || !horaInicio || !horaFin) {
        if (totalPriceElement) totalPriceElement.textContent = '$0 COP';
        if (nightSurchargeNote) nightSurchargeNote.style.display = 'none';
        console.log('❌ Faltan datos para calcular precio');
        return 0;
    }
    
    // Obtener precio de la cancha desde la relación: cancha -> tipo_cancha -> precio
    let precioPorHora = 0;
    const canchaId = parseInt(canchaSelect.value);
    const cancha = canchas.find(c => c.id === canchaId);
    
    console.log('🔍 Datos de cancha encontrada:', cancha);
    
    if (cancha && cancha.tipoCancha && cancha.tipoCancha.precio) {
        // El precio puede venir como string con formato "$XX,XXX" o solo números
        const precioStr = cancha.tipoCancha.precio.toString();
        // Extraer solo números y convertir a float
        precioPorHora = parseFloat(precioStr.replace(/[^\d.]/g, '')) || 0;
        
        console.log('💰 Precio extraído:', {
            original: precioStr,
            procesado: precioPorHora
        });
    } else {
        console.warn('⚠️ Estructura de datos incorrecta:', {
            cancha: !!cancha,
            tipoCancha: cancha?.tipoCancha,
            precio: cancha?.tipoCancha?.precio
        });
    }
    
    if (precioPorHora === 0) {
        console.warn('⚠️ No se pudo obtener el precio de la cancha');
        if (totalPriceElement) totalPriceElement.textContent = '$0 COP';
        return 0;
    }
    
    // Calcular duración en horas: hora_fin - hora_inicio
    // Convertir las horas a números para el cálculo
    const horaInicioNum = parseFloat(horaInicio.replace(':', '.'));
    const horaFinNum = parseFloat(horaFin.replace(':', '.'));
    
    console.log('🕐 Conversión de horas:', {
        horaInicio: horaInicio,
        horaFin: horaFin,
        horaInicioNum: horaInicioNum,
        horaFinNum: horaFinNum
    });
    
    if (horaFinNum <= horaInicioNum) {
        console.log('❌ Hora de fin debe ser posterior a hora de inicio');
        if (totalPriceElement) totalPriceElement.textContent = '$0 COP';
        return 0;
    }
    
    // Calcular duración correctamente: convertir formato HH:MM a decimal
    const duracionHoras = horaFinNum - horaInicioNum;
    console.log('⏱️ Duración en horas (decimal):', duracionHoras);
    
    // Para administradores, no aplicar límite de 2 horas en edición
    const isEditing = document.getElementById('reservationId').value;
    if (!isEditing && duracionHoras > 2) {
        alert('No se pueden reservar más de 2 horas consecutivas');
        document.getElementById('horaFin').value = '';
        return 0;
    }
    
    // Paso 1: Calcular precio base = (hora_fin - hora_inicio) * precio_cancha
    let precioTotal = duracionHoras * precioPorHora;
    let hasNightSurcharge = false;
    
    // Paso 2: Aplicar recargo nocturno del 20% si pasa de las 6 PM
    // Usar las horas ya convertidas a decimal para la verificación nocturna
    if (horaInicioNum >= 18 || horaFinNum > 18) {
        precioTotal = precioTotal * 1.2; // 20% de recargo
        hasNightSurcharge = true;
        console.log('🌙 Recargo nocturno aplicado (20%)');
    }
    
    // Paso 3: Restar el abono fijo de $15,000 COP
    const abono = 15000;
    const totalAPagar = Math.max(0, precioTotal - abono);
    
    console.log('💵 Cálculo de precio:', {
        duracionHoras: duracionHoras,
        precioPorHora: precioPorHora,
        precioBase: duracionHoras * precioPorHora,
        recargoNocturno: hasNightSurcharge,
        precioTotal: precioTotal,
        abono: abono,
        totalAPagar: totalAPagar
    });
    
    // Mostrar el total que debe pagar (después del abono)
    if (totalPriceElement) {
        totalPriceElement.textContent = `$${totalAPagar.toLocaleString()} COP`;
    }
    if (nightSurchargeNote) {
        nightSurchargeNote.style.display = hasNightSurcharge ? 'block' : 'none';
    }
    
    // Retornar el total a pagar
    return totalAPagar;
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
async function filterAvailableHours() {
    console.log('🔍 Ejecutando filterAvailableHours()...');
    const fechaInput = document.getElementById('fecha');
    const horaInicioSelect = document.getElementById('horaInicio');
    const horaFinSelect = document.getElementById('horaFin');
    const canchaSelect = document.getElementById('canchaId');
    
    console.log('📋 Elementos encontrados:', {
        fechaInput: !!fechaInput,
        horaInicioSelect: !!horaInicioSelect,
        horaFinSelect: !!horaFinSelect,
        canchaSelect: !!canchaSelect
    });
    
    if (!fechaInput || !horaInicioSelect) {
        console.log('❌ Elementos requeridos no encontrados, saliendo de función');
        return;
    }
    
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
    
    // Obtener horarios ocupados si hay cancha y fecha seleccionadas
    let occupiedTimes = [];
    console.log('🏟️ Valores actuales:', {
        cancha: canchaSelect ? canchaSelect.value : 'null',
        fecha: fechaInput ? fechaInput.value : 'null'
    });
    
    if (canchaSelect && canchaSelect.value && fechaInput.value) {
        try {
            console.log('🌐 Consultando horarios ocupados...');
            const response = await fetch(`${API_BASE_URL}/reservas/horarios-ocupados?id_cancha=${canchaSelect.value}&fecha=${fechaInput.value}`, {
                headers: {
                    'Authorization': `Bearer ${Auth.getToken()}`
                }
            });
            
            console.log('📡 Respuesta recibida:', response.status);
            if (response.ok) {
                const data = await response.json();
                occupiedTimes = data.horarios_ocupados || [];
                console.log('✅ Horarios ocupados obtenidos:', occupiedTimes);
            } else {
                console.log('❌ Error en respuesta:', response.status, response.statusText);
            }
        } catch (error) {
            console.error('❌ Error al obtener horarios ocupados:', error);
        }
    } else {
        console.log('⚠️ No se consultarán horarios ocupados - faltan cancha o fecha');
    }
    
    // Función para verificar si una hora está ocupada
    function isTimeOccupied(timeValue) {
        console.log(`🔍 === Verificando disponibilidad de ${timeValue} ===`);
        console.log(`📋 Horarios ocupados totales:`, occupiedTimes);
        
        const isOccupied = occupiedTimes.some(occupied => {
            const startTime = occupied.hora_inicio;
            const endTime = occupied.hora_fin;
            
            console.log(`⏰ Comparando ${timeValue} con reserva ${occupied.estado}:`);
            console.log(`   - Inicio: ${startTime}`);
            console.log(`   - Fin: ${endTime}`);
            
            // Usar la misma lógica numérica que funciona para las 2 horas máximas
            const timeValueNum = parseInt(timeValue.split(':')[0]);
            const startTimeNum = parseInt(startTime.toString().split(':')[0]);
            const endTimeNum = parseInt(endTime.toString().split(':')[0]);
            
            console.log(`� Valores numéricos:`);
            console.log(`   - timeValue: ${timeValueNum}`);
            console.log(`   - startTime: ${startTimeNum}`);
            console.log(`   - endTime: ${endTimeNum}`);
            
            // Bloquear si la hora cae dentro del rango ocupado
            // Para reservas confirmadas o pendientes, bloquear todo el rango
            const blocked = timeValueNum >= startTimeNum && timeValueNum < endTimeNum;
            
            console.log(`🧮 Comparación numérica:`);
            console.log(`   - ${timeValueNum} >= ${startTimeNum}: ${timeValueNum >= startTimeNum}`);
            console.log(`   - ${timeValueNum} < ${endTimeNum}: ${timeValueNum < endTimeNum}`);
            console.log(`   - Bloqueada: ${blocked}`);
            
            if (blocked) {
                console.log(`❌ Hora ${timeValue} bloqueada por reserva ${occupied.estado}: ${startTime}-${endTime}`);
            }
            
            return blocked;
        });
        console.log(`🎯 Resultado final: Hora ${timeValue} ocupada: ${isOccupied}`);
        return isOccupied;
    }
    
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
    
    // Agregar opciones de hora de inicio - ADMINISTRADORES PUEDEN VER TODAS LAS HORAS
    console.log('🕐 Procesando horas de inicio para administrador...');
    availableStartHours.forEach(hour => {
        const option = document.createElement('option');
        option.value = hour.value;
        option.textContent = hour.text;
        
        // Para administradores: NO deshabilitar horas ocupadas
        // Permitir seleccionar cualquier hora para modificar reservas
        
        horaInicioSelect.appendChild(option);
    });
    console.log(`✅ ${availableStartHours.length} horas de inicio disponibles para administrador`);
    
    // Agregar opciones de hora de fin - ADMINISTRADORES PUEDEN VER TODAS LAS HORAS
    if (horaFinSelect) {
        const availableEndHours = isToday ? 
            endHours.filter(hour => hour.hour > currentHour) : 
            endHours;
            
        availableEndHours.forEach(hour => {
            const option = document.createElement('option');
            option.value = hour.value;
            option.textContent = hour.text;
            
            // Para administradores: NO deshabilitar horas ocupadas
            // Permitir seleccionar cualquier hora para modificar reservas
            
            horaFinSelect.appendChild(option);
        });
        console.log(`✅ ${availableEndHours.length} horas de fin disponibles para administrador`);
    }
    
    // Restaurar valores seleccionados - ADMINISTRADORES PUEDEN RESTAURAR CUALQUIER HORA
    if (selectedStartHour && availableStartHours.some(h => h.value === selectedStartHour)) {
        horaInicioSelect.value = selectedStartHour;
        console.log(`🔄 Hora de inicio restaurada para administrador: ${selectedStartHour}`);
    }
    if (selectedEndHour && horaFinSelect) {
        const availableEndHours = isToday ? 
            endHours.filter(hour => hour.hour > currentHour) : 
            endHours;
        if (availableEndHours.some(h => h.value === selectedEndHour)) {
            horaFinSelect.value = selectedEndHour;
            console.log(`🔄 Hora de fin restaurada para administrador: ${selectedEndHour}`);
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
        
        console.log('🔄 Cargando reservas desde:', url);
        
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Datos recibidos de la API:', data);
            
            // La API devuelve un objeto con reservations array y Count
            let allReservations = [];
            
            // Manejar diferentes estructuras de respuesta
            if (Array.isArray(data)) {
                // Si la respuesta es directamente un array
                allReservations = data;
            } else if (data.reservations && Array.isArray(data.reservations)) {
                // Si la respuesta tiene una propiedad reservations
                allReservations = data.reservations;
            } else if (data.data && Array.isArray(data.data)) {
                // Si la respuesta tiene una propiedad data
                allReservations = data.data;
            } else {
                console.warn('⚠️ Estructura de datos no reconocida:', data);
                allReservations = [];
            }
            
            console.log('📋 Reservas procesadas:', allReservations.length, 'elementos');
            
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
            console.log('✅ Reservas cargadas:', reservations.length);
            updateStats();
            displayReservations();
        } else {
            console.error('❌ Error response:', response.status, response.statusText);
            Utils.showToast('Error al cargar las reservas', 'error');
        }
    } catch (error) {
        console.error('❌ Error loading reservations:', error);
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
                          reservation.estado === 'pendiente' ? 'pending' : 
                          reservation.estado === 'finalizada' ? 'completed' : 'cancelled';
        
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
    
    // Establecer la fecha de hoy por defecto
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0]; // YYYY-MM-DD
        fechaInput.value = todayStr;
        console.log('📅 Fecha establecida por defecto:', todayStr);
    }
    
    // Seleccionar la primera cancha por defecto si hay canchas disponibles
    const canchaSelect = document.getElementById('canchaId');
    if (canchaSelect && canchas.length > 0 && !canchaSelect.value) {
        canchaSelect.value = canchas[0].id;
        console.log('🏟️ Cancha seleccionada por defecto:', canchas[0].nombre);
        updatePriceInfo(); // Actualizar información de precio cuando se selecciona cancha
    }
    
    // Ocultar elementos específicos de edición
    const estadoGroup = document.getElementById('estadoGroup');
    
    if (estadoGroup) {
        estadoGroup.style.display = 'none';
    }
    
    // Mostrar el campo de búsqueda de cliente para nueva reserva
    document.getElementById('clienteBuscador').style.display = 'block';
    document.getElementById('clienteSeleccionado').style.display = 'none';
    
    paymentCompleted = false; // Resetear estado de pago
    
    // Limpiar cliente seleccionado al abrir modal para nueva reserva
    clearSelectedClient();
    
    updateSaveButton();
    
    // Actualizar información de pago para nueva reserva
    updatePaymentDisplay();
    
    // Filtrar horas disponibles al abrir el modal
    setTimeout(() => filterAvailableHours(), 100); // Pequeño delay para asegurar que el DOM esté listo
    
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
async function editReservation(id) {
    try {
        const reservation = await ApiService.reservas.getById(id);
        console.log('🔍 Datos de la reserva recibidos:', reservation);
        
        // Configurar el modal para edición
        document.getElementById('modalTitle').textContent = 'Editar Reserva';
        document.getElementById('reservationId').value = id;
        
        // Llenar los campos del formulario
        document.getElementById('canchaId').value = reservation.id_cancha;
        document.getElementById('fecha').value = reservation.fecha_reserva;
        
        // Mostrar el selector de estado
        document.getElementById('estadoGroup').style.display = 'block';
        document.getElementById('estadoReserva').value = reservation.estado;
        
        // Configurar cliente - usar los datos enriquecidos del API
        document.getElementById('clienteId').value = reservation.id_usuario;
        
        // El API devuelve customerName y customerPhone como datos enriquecidos
        const clienteName = reservation.customerName || reservation.usuario?.nombre || 'Cliente no encontrado';
        const clientePhone = reservation.customerPhone || reservation.usuario?.telefono || '';
        const clienteEmail = reservation.usuario?.email || '';
        
        console.log('👤 Datos del cliente:', {
            name: clienteName,
            phone: clientePhone,
            email: clienteEmail
        });
        
        document.getElementById('clienteBuscador').value = clienteName;
        document.getElementById('clienteTelefono').value = clientePhone;
        document.getElementById('observaciones').value = reservation.observaciones || '';
        
        // Mostrar cliente seleccionado
        document.getElementById('clienteSeleccionado').style.display = 'block';
        document.getElementById('clienteNombreSeleccionado').textContent = clienteName;
        document.getElementById('clienteEmailSeleccionado').textContent = clienteEmail;
        document.getElementById('clienteBuscador').style.display = 'none';
        
        // Como administrador, siempre permitir edición libre de horarios
        // Mostrar dropdowns normales
        document.getElementById('horaInicio').style.display = 'block';
        document.getElementById('horaFin').style.display = 'block';
        document.getElementById('horaInicioReadonly').style.display = 'none';
        document.getElementById('horaFinReadonly').style.display = 'none';
        
        // Asegurar que los campos tengan el atributo required
        document.getElementById('horaInicio').setAttribute('required', 'required');
        document.getElementById('horaFin').setAttribute('required', 'required');
        
        // Filtrar horarios disponibles (pero permitir seleccionar cualquier horario)
        await filterAvailableHours();
        
        // Establecer valores de hora DESPUÉS de que filterAvailableHours complete
        console.log('🕐 Estableciendo horas de la reserva:', {
            horaInicio: reservation.hora_inicio,
            horaFin: reservation.hora_fin
        });
        
        // Asegurar que las opciones estén disponibles antes de establecer valores
        const horaInicioSelect = document.getElementById('horaInicio');
        const horaFinSelect = document.getElementById('horaFin');
        
        if (horaInicioSelect && reservation.hora_inicio) {
            // Buscar la opción exacta o crear una nueva si no existe
            let optionExists = false;
            for (let option of horaInicioSelect.options) {
                if (option.value === reservation.hora_inicio) {
                    optionExists = true;
                    break;
                }
            }
            
            if (!optionExists) {
                const newOption = new Option(reservation.hora_inicio, reservation.hora_inicio);
                horaInicioSelect.add(newOption);
            }
            
            horaInicioSelect.value = reservation.hora_inicio;
            console.log('✅ Hora de inicio establecida:', horaInicioSelect.value);
        }
        
        if (horaFinSelect && reservation.hora_fin) {
            // Buscar la opción exacta o crear una nueva si no existe
            let optionExists = false;
            for (let option of horaFinSelect.options) {
                if (option.value === reservation.hora_fin) {
                    optionExists = true;
                    break;
                }
            }
            
            if (!optionExists) {
                const newOption = new Option(reservation.hora_fin, reservation.hora_fin);
                horaFinSelect.add(newOption);
            }
            
            horaFinSelect.value = reservation.hora_fin;
            console.log('✅ Hora de fin establecida:', horaFinSelect.value);
        }
        
        // Calcular precio después de establecer las horas
        calculatePrice();
        
        // Actualizar información de precios
        updatePriceInfo();
        updatePaymentDisplay();
        
        // Mostrar el modal
        document.getElementById('reservationModal').classList.add('show');
        
    } catch (error) {
        console.error('Error al cargar la reserva:', error);
        alert('Error al cargar los datos de la reserva');
    }
}

// Función para verificar si se puede modificar el horario de una reserva
async function canModifyReservationSchedule(reservation) {
    try {
        // Obtener horarios ocupados para la fecha y cancha
        const response = await fetch(`${API_BASE_URL}/reservas/horarios-ocupados?id_cancha=${reservation.id_cancha}&fecha=${reservation.fecha_reserva}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener horarios ocupados');
        }
        
        const data = await response.json();
        const occupiedTimes = data.horarios_ocupados || [];
        
        // Filtrar horarios ocupados excluyendo la reserva actual
        const otherOccupiedTimes = occupiedTimes.filter(time => 
            time.reservation_id !== reservation.id
        );
        
        // Si no hay otros horarios ocupados, se puede modificar
        if (otherOccupiedTimes.length === 0) {
            return true;
        }
        
        // Verificar si el horario actual está en conflicto con otros
        const currentStart = reservation.hora_inicio;
        const currentEnd = reservation.hora_fin;
        
        for (const occupiedTime of otherOccupiedTimes) {
            // Verificar si hay solapamiento
            if (
                (currentStart >= occupiedTime.hora_inicio && currentStart < occupiedTime.hora_fin) ||
                (currentEnd > occupiedTime.hora_inicio && currentEnd <= occupiedTime.hora_fin) ||
                (currentStart <= occupiedTime.hora_inicio && currentEnd >= occupiedTime.hora_fin)
            ) {
                return false; // Hay conflicto, no se puede modificar
            }
        }
        
        return true; // No hay conflictos, se puede modificar
        
    } catch (error) {
        console.error('Error al verificar disponibilidad de horarios:', error);
        return false; // En caso de error, no permitir modificación
    }
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
    
    // Obtener el total a pagar directamente de calculatePrice (ya incluye el cálculo correcto)
    const totalAPagar = calculatePrice();
    
    if (pagoRestanteValue) {
        pagoRestanteValue.textContent = `$${totalAPagar.toLocaleString()} COP`;
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
    
    console.log('💳 Actualización de pago:', {
        totalAPagar: totalAPagar,
        estado: estadoSelect?.value,
        pagoCompletado: paymentCompleted
    });
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
        hora_inicio: horaInicio, // Formato HH:MM (sin segundos)
        hora_fin: horaFin, // Formato HH:MM (sin segundos)
        estado: estadoReserva,
        observaciones: observaciones || null,
        telefono_cliente: telefonoCliente || null
    };
    
    console.log('📤 Datos a enviar al servidor:', reservationData);

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
            console.error('❌ Error del servidor:', response.status, responseData);
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
                          reservation.estado === 'pendiente' ? 'pending' : 
                          reservation.estado === 'finalizada' ? 'completed' : 'cancelled';
        
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

// Función para inicializar el auto-refresh
function startAutoRefresh() {
    // Limpiar cualquier intervalo existente
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
    }
    
    // Configurar auto-refresh cada 30 segundos
    autoRefreshInterval = setInterval(() => {
        console.log('🔄 Auto-refresh: Actualizando reservas...');
        loadReservations();
    }, 30000); // 30 segundos
    
    console.log('✅ Auto-refresh iniciado (cada 30 segundos)');
}

// Función para detener el auto-refresh
function stopAutoRefresh() {
    if (autoRefreshInterval) {
        clearInterval(autoRefreshInterval);
        autoRefreshInterval = null;
        console.log('⏹️ Auto-refresh detenido');
    }
}

// Inicializar
window.addEventListener('load', () => {
    checkAuth();
    loadCanchas();
    loadReservations();
    initializeClientSearch();
    
    // Iniciar auto-refresh
    startAutoRefresh();
    
    // Agregar event listener para el cambio de fecha
    const fechaInput = document.getElementById('fecha');
    if (fechaInput) {
        fechaInput.addEventListener('change', filterAvailableHours);
        // Ejecutar al cargar para filtrar horas iniciales
        filterAvailableHours();
    }
    
    // Agregar event listener para el cambio de cancha
    const canchaSelect = document.getElementById('canchaId');
    if (canchaSelect) {
        canchaSelect.addEventListener('change', filterAvailableHours);
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

// Detener auto-refresh cuando se cierra la página
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});