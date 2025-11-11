// ===== SCRIPT PARA CHECKOUT CON SIMULACIÓN DE PAGO =====

// Configuración
const CHECKOUT_CONFIG = {
    API_BASE_URL: 'http://localhost:4000',
    STORAGE_KEY: 'mmdr_checkout_data',
    SIMULATION_DELAY: 2000 // 2 segundos de simulación
};

// Variables globales
let checkoutData = null;
let currentStep = 1;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('💳 Inicializando checkout...');
    inicializarCheckout();
    configurarEventosCheckout();
    console.log('✅ Checkout listo');
});

// ===== FUNCIONES PRINCIPALES =====

function inicializarCheckout() {
    // Cargar datos del checkout
    cargarDatosCheckout();
    
    // Renderizar resumen del pedido
    renderizarResumenPedido();
    
    // Configurar pasos
    mostrarPaso(1);
}

function cargarDatosCheckout() {
    try {
        const datosGuardados = localStorage.getItem(CHECKOUT_CONFIG.STORAGE_KEY);
        if (datosGuardados) {
            checkoutData = JSON.parse(datosGuardados);
            console.log('✅ Datos del checkout cargados:', checkoutData);
        } else {
            console.warn('⚠️ No hay datos del checkout, redirigiendo al carrito');
            window.location.href = 'card.html';
            return;
        }
    } catch (error) {
        console.error('❌ Error cargando datos del checkout:', error);
        window.location.href = 'card.html';
    }
}

function renderizarResumenPedido() {
    if (!checkoutData) return;

    const contenedor = document.getElementById('summary-items');
    if (!contenedor) return;

    contenedor.innerHTML = checkoutData.items.map(item => `
        <div class="summary-item">
            <div class="summary-item-image">
                <img src="${item.imagen}" alt="${item.nombre}" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2250%22 height=%2250%22%3E%3Crect fill=%22%23f0f0f0%22 width=%2250%22 height=%2250%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2212%22%3ESin imagen%3C/text%3E%3C/svg%3E'">
            </div>
            <div class="summary-item-info">
                <h4>${item.nombre}</h4>
                <p>Cantidad: ${item.cantidad}</p>
            </div>
            <div class="summary-item-price">
                $${formatearPrecio(item.precio * item.cantidad)}
            </div>
        </div>
    `).join('');

    // Actualizar totales
    const subtotalEl = document.getElementById('summary-subtotal');
    const envioEl = document.getElementById('summary-shipping');
    const totalEl = document.getElementById('summary-total');

    if (subtotalEl) subtotalEl.textContent = `$${formatearPrecio(checkoutData.subtotal)}`;
    if (envioEl) envioEl.textContent = 'Gratis';
    if (totalEl) totalEl.textContent = `$${formatearPrecio(checkoutData.total)}`;
}

function configurarEventosCheckout() {
    // Formulario de checkout
    const form = document.getElementById('checkout-form');
    if (form) {
        form.addEventListener('submit', manejarSubmitFormulario);
    }

    // Formulario de pago con tarjeta
    const cardForm = document.getElementById('card-payment-form');
    if (cardForm) {
        cardForm.addEventListener('submit', manejarPagoConTarjeta);
    }

    // Validación en tiempo real para checkout
    const inputs = document.querySelectorAll('#checkout-form input, #checkout-form select');
    inputs.forEach(input => {
        input.addEventListener('blur', validarCampo);
        input.addEventListener('input', limpiarError);
    });

    // Validación en tiempo real para tarjeta
    const cardInputs = document.querySelectorAll('#card-payment-form input');
    cardInputs.forEach(input => {
        input.addEventListener('blur', validarCampoTarjeta);
        input.addEventListener('input', limpiarErrorTarjeta);
    });

    // Formateo automático de número de tarjeta
    const cardNumberInput = document.getElementById('card-number');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', formatearNumeroTarjeta);
    }

    // Formateo automático de fecha de vencimiento
    const expiryInput = document.getElementById('card-expiry');
    if (expiryInput) {
        expiryInput.addEventListener('input', formatearFechaVencimiento);
    }
}

// ===== MANEJO DE PASOS =====

function mostrarPaso(paso) {
    // Ocultar todos los pasos
    const pasos = document.querySelectorAll('.checkout-step');
    pasos.forEach(p => p.style.display = 'none');

    // Mostrar paso actual
    const pasoActual = document.getElementById(`step-${paso}`);
    if (pasoActual) {
        pasoActual.style.display = 'block';
    }

    // Actualizar indicadores de pasos
    const indicadores = document.querySelectorAll('.step');
    indicadores.forEach((indicador, index) => {
        indicador.classList.remove('active', 'completed');
        if (index + 1 < paso) {
            indicador.classList.add('completed');
        } else if (index + 1 === paso) {
            indicador.classList.add('active');
        }
    });

    currentStep = paso;
}

function siguientePaso() {
    if (currentStep < 3) {
        mostrarPaso(currentStep + 1);
    }
}

function pasoAnterior() {
    if (currentStep > 1) {
        mostrarPaso(currentStep - 1);
    }
}

// ===== VALIDACIÓN DEL FORMULARIO =====

function validarCampo(evento) {
    const campo = evento.target;
    const valor = campo.value.trim();
    const tipo = campo.type;
    const nombre = campo.name;

    let esValido = true;
    let mensaje = '';

    // Validaciones específicas
    switch (nombre) {
        case 'firstName':
        case 'lastName':
            esValido = valor.length >= 2;
            mensaje = esValido ? '' : 'Debe tener al menos 2 caracteres';
            break;
        
        case 'email':
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            esValido = emailRegex.test(valor);
            mensaje = esValido ? '' : 'Email inválido';
            break;
        
        case 'phone':
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            esValido = phoneRegex.test(valor) && valor.length >= 8;
            mensaje = esValido ? '' : 'Teléfono inválido';
            break;
        
        case 'street':
            esValido = valor.length >= 5;
            mensaje = esValido ? '' : 'Dirección muy corta';
            break;
        
        case 'city':
            esValido = valor.length >= 2;
            mensaje = esValido ? '' : 'Ciudad inválida';
            break;
        
        case 'state':
            esValido = valor !== '';
            mensaje = esValido ? '' : 'Selecciona una provincia';
            break;
        
        case 'zipCode':
            const zipRegex = /^\d{4,8}$/;
            esValido = zipRegex.test(valor);
            mensaje = esValido ? '' : 'Código postal inválido';
            break;
    }

    mostrarErrorCampo(campo, esValido, mensaje);
    return esValido;
}

function mostrarErrorCampo(campo, esValido, mensaje) {
    const errorEl = campo.parentNode.querySelector('.error-message');
    
    if (errorEl) {
        errorEl.textContent = mensaje;
        errorEl.style.display = esValido ? 'none' : 'block';
    }

    campo.style.borderColor = esValido ? '#e0e0e0' : '#e74c3c';
}

function limpiarError(evento) {
    const campo = evento.target;
    const errorEl = campo.parentNode.querySelector('.error-message');
    
    if (errorEl) {
        errorEl.style.display = 'none';
    }
    
    campo.style.borderColor = '#e0e0e0';
}

function validarFormularioCompleto() {
    const campos = document.querySelectorAll('#checkout-form input[required], #checkout-form select[required]');
    let esValido = true;

    campos.forEach(campo => {
        const campoValido = validarCampo({ target: campo });
        if (!campoValido) {
            esValido = false;
        }
    });

    // Validar método de pago
    const metodoPago = document.querySelector('input[name="paymentMethod"]:checked');
    if (!metodoPago) {
        mostrarNotificacion('Selecciona un método de pago', 'error');
        esValido = false;
    }

    return esValido;
}

// ===== MANEJO DEL FORMULARIO =====

function manejarSubmitFormulario(evento) {
    evento.preventDefault();
    
    if (!validarFormularioCompleto()) {
        mostrarNotificacion('Por favor completa todos los campos correctamente', 'error');
        return;
    }

    // Recopilar datos del formulario
    const formData = new FormData(evento.target);
    const datosCliente = Object.fromEntries(formData.entries());
    
    // Agregar datos del cliente al checkout
    checkoutData.cliente = datosCliente;
    
    // Guardar datos actualizados
    localStorage.setItem(CHECKOUT_CONFIG.STORAGE_KEY, JSON.stringify(checkoutData));
    
    // Ir al siguiente paso
    siguientePaso();
}

function procederAlPago() {
    if (!checkoutData) {
        mostrarNotificacion('Error: No hay datos del pedido', 'error');
        return;
    }

    // Mostrar loading
    const loadingEl = document.querySelector('.payment-loading');
    const detailsEl = document.getElementById('payment-details');
    
    if (loadingEl) loadingEl.style.display = 'block';
    if (detailsEl) detailsEl.style.display = 'none';

    // Simular procesamiento del pago
    setTimeout(() => {
        procesarPagoSimulado();
    }, CHECKOUT_CONFIG.SIMULATION_DELAY);
}

// ===== DATOS DE TARJETAS FICTICIAS =====
const TARJETAS_PRUEBA = {
    visa: {
        numero: '4111 1111 1111 1111',
        vencimiento: '12/25',
        cvv: '123',
        titular: 'Juan Pérez',
        tipo: 'Visa'
    },
    mastercard: {
        numero: '5555 5555 5555 4444',
        vencimiento: '12/25',
        cvv: '123',
        titular: 'María González',
        tipo: 'Mastercard'
    },
    amex: {
        numero: '3782 822463 10005',
        vencimiento: '12/25',
        cvv: '1234',
        titular: 'Carlos López',
        tipo: 'American Express'
    }
};

// ===== FUNCIONES DE TARJETAS DE PRUEBA =====
function fillTestCard(tipo) {
    const tarjeta = TARJETAS_PRUEBA[tipo];
    if (!tarjeta) return;

    document.getElementById('card-number').value = tarjeta.numero;
    document.getElementById('card-expiry').value = tarjeta.vencimiento;
    document.getElementById('card-cvv').value = tarjeta.cvv;
    document.getElementById('cardholder-name').value = tarjeta.titular;

    // Actualizar método de pago seleccionado
    const metodoSeleccionado = document.getElementById('selected-payment-method');
    if (metodoSeleccionado) {
        metodoSeleccionado.innerHTML = `
            <i class="fab fa-cc-${tipo === 'amex' ? 'amex' : tipo}"></i>
            <span>${tarjeta.tipo}</span>
        `;
    }

    mostrarNotificacion(`Datos de ${tarjeta.tipo} cargados`, 'success');
}

// ===== VALIDACIÓN DE TARJETAS =====
function validarNumeroTarjeta(numero) {
    // Remover espacios y guiones
    const numeroLimpio = numero.replace(/[\s-]/g, '');
    
    // Verificar que solo contenga dígitos
    if (!/^\d+$/.test(numeroLimpio)) return false;
    
    // Verificar longitud mínima
    if (numeroLimpio.length < 13 || numeroLimpio.length > 19) return false;
    
    // Algoritmo de Luhn
    let suma = 0;
    let esPar = false;
    
    for (let i = numeroLimpio.length - 1; i >= 0; i--) {
        let digito = parseInt(numeroLimpio.charAt(i));
        
        if (esPar) {
            digito *= 2;
            if (digito > 9) {
                digito -= 9;
            }
        }
        
        suma += digito;
        esPar = !esPar;
    }
    
    return suma % 10 === 0;
}

function validarFechaVencimiento(fecha) {
    const regex = /^(0[1-9]|1[0-2])\/([0-9]{2})$/;
    if (!regex.test(fecha)) return false;
    
    const [mes, año] = fecha.split('/');
    const fechaActual = new Date();
    const añoActual = fechaActual.getFullYear() % 100;
    const mesActual = fechaActual.getMonth() + 1;
    
    const añoVencimiento = parseInt(año) + 2000;
    const mesVencimiento = parseInt(mes);
    
    if (añoVencimiento < fechaActual.getFullYear()) return false;
    if (añoVencimiento === fechaActual.getFullYear() && mesVencimiento < mesActual) return false;
    
    return true;
}

function validarCVV(cvv, numeroTarjeta) {
    if (!/^\d+$/.test(cvv)) return false;
    
    const numeroLimpio = numeroTarjeta.replace(/[\s-]/g, '');
    
    // Amex tiene 4 dígitos, otras tarjetas 3
    if (numeroLimpio.startsWith('37') || numeroLimpio.startsWith('34')) {
        return cvv.length === 4;
    } else {
        return cvv.length === 3;
    }
}

// ===== SIMULACIÓN DE PAGO =====

async function procesarPagoSimulado() {
    try {
        console.log('💳 Iniciando simulación de pago...');
        
        // Generar datos de la transacción
        const transaccion = generarTransaccion();
        
        // Simular respuesta del pago
        const resultadoPago = simularRespuestaPago(transaccion);
        
        if (resultadoPago.exitoso) {
            // Guardar venta en la base de datos
            await guardarVentaEnBD(transaccion);
            
            // Ir al paso de confirmación
            setTimeout(() => {
                mostrarPaso(3);
                mostrarConfirmacion(transaccion);
            }, 1000);
            
        } else {
            mostrarErrorPago(resultadoPago.mensaje);
        }
        
    } catch (error) {
        console.error('❌ Error en simulación de pago:', error);
        mostrarErrorPago('Error interno del sistema');
    }
}

function generarTransaccion() {
    const ahora = new Date();
    const numeroOrden = `MMDR-${ahora.getFullYear()}${(ahora.getMonth() + 1).toString().padStart(2, '0')}${ahora.getDate().toString().padStart(2, '0')}-${Math.random().toString(36).substr(2, 8).toUpperCase()}`;
    
    return {
        id: `txn_${Date.now()}`,
        numeroOrden: numeroOrden,
        cliente: checkoutData.cliente,
        items: checkoutData.items,
        subtotal: checkoutData.subtotal,
        envio: checkoutData.envio,
        total: checkoutData.total,
        metodoPago: checkoutData.cliente.paymentMethod,
        estado: 'pendiente',
        fechaCreacion: ahora.toISOString(),
        fechaActualizacion: ahora.toISOString()
    };
}

function simularRespuestaPago(transaccion) {
    // Simular diferentes escenarios de pago
    const escenarios = [
        { exitoso: true, probabilidad: 0.85 }, // 85% éxito
        { exitoso: false, mensaje: 'Tarjeta rechazada', probabilidad: 0.10 },
        { exitoso: false, mensaje: 'Fondos insuficientes', probabilidad: 0.03 },
        { exitoso: false, mensaje: 'Error de conexión', probabilidad: 0.02 }
    ];

    const random = Math.random();
    let probabilidadAcumulada = 0;

    for (const escenario of escenarios) {
        probabilidadAcumulada += escenario.probabilidad;
        if (random <= probabilidadAcumulada) {
            return {
                exitoso: escenario.exitoso,
                mensaje: escenario.mensaje || 'Pago procesado exitosamente',
                transaccion: escenario.exitoso ? { ...transaccion, estado: 'aprobado' } : transaccion
            };
        }
    }

    // Fallback
    return { exitoso: true, mensaje: 'Pago procesado exitosamente', transaccion };
}

async function guardarVentaEnBD(transaccion) {
    try {
        console.log('💾 Guardando venta en base de datos...');
        
        const ventaData = {
            numeroOrden: transaccion.numeroOrden,
            cliente: {
                nombre: `${transaccion.cliente.firstName} ${transaccion.cliente.lastName}`,
                email: transaccion.cliente.email,
                telefono: transaccion.cliente.phone,
                direccion: {
                    calle: transaccion.cliente.street,
                    ciudad: transaccion.cliente.city,
                    provincia: transaccion.cliente.state,
                    codigoPostal: transaccion.cliente.zipCode
                }
            },
            productos: transaccion.items.map(item => ({
                id: item.id,
                nombre: item.nombre,
                precio: item.precio,
                cantidad: item.cantidad,
                subtotal: item.precio * item.cantidad
            })),
            totales: {
                subtotal: transaccion.subtotal,
                envio: transaccion.envio,
                total: transaccion.total
            },
            pago: {
                metodo: transaccion.metodoPago,
                estado: transaccion.estado,
                fecha: transaccion.fechaCreacion
            },
            estado: 'completado',
            fechaCreacion: transaccion.fechaCreacion
        };

        const respuesta = await fetch(`${CHECKOUT_CONFIG.API_BASE_URL}/api/sales`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(ventaData)
        });

        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status}`);
        }

        const resultado = await respuesta.json();
        console.log('✅ Venta guardada:', resultado);
        
        return resultado;
        
    } catch (error) {
        console.error('❌ Error guardando venta:', error);
        // En caso de error, guardar localmente como respaldo
        guardarVentaLocal(transaccion);
        throw error;
    }
}

function guardarVentaLocal(transaccion) {
    try {
        const ventasLocales = JSON.parse(localStorage.getItem('mmdr_ventas_locales') || '[]');
        ventasLocales.push(transaccion);
        localStorage.setItem('mmdr_ventas_locales', JSON.stringify(ventasLocales));
        console.log('💾 Venta guardada localmente como respaldo');
    } catch (error) {
        console.error('❌ Error guardando venta local:', error);
    }
}

function mostrarDetallesPago(transaccion) {
    const loadingEl = document.querySelector('.payment-loading');
    const detailsEl = document.getElementById('payment-details');
    const orderNumberEl = document.getElementById('payment-order-number');
    const totalEl = document.getElementById('payment-total');

    if (loadingEl) loadingEl.style.display = 'none';
    if (detailsEl) detailsEl.style.display = 'block';
    if (orderNumberEl) orderNumberEl.textContent = transaccion.numeroOrden;
    if (totalEl) totalEl.textContent = `$${formatearPrecio(transaccion.total)}`;
}

function limpiarCarritoCompleto() {
    // Limpiar usando el objeto carrito si está disponible
    if (typeof carrito !== 'undefined' && carrito && typeof carrito.limpiarCarrito === 'function') {
        carrito.limpiarCarrito();
        console.log('✅ Carrito limpiado usando objeto carrito');
    } else {
        // Fallback: limpiar directamente el localStorage
        localStorage.removeItem('mmdr_carrito');
        localStorage.removeItem('mmdr_carrito_expiracion');
        console.log('✅ Carrito limpiado directamente del localStorage');
    }
    
    // Limpiar datos del checkout
    localStorage.removeItem(CHECKOUT_CONFIG.STORAGE_KEY);
    console.log('✅ Datos del checkout limpiados');
}

function mostrarConfirmacion(transaccion) {
    const orderNumberEl = document.getElementById('confirmation-order-number');
    const totalEl = document.getElementById('confirmation-total');
    const dateEl = document.getElementById('confirmation-date');
    const paymentMethodEl = document.getElementById('confirmation-payment-method');

    if (orderNumberEl) orderNumberEl.textContent = transaccion.numeroOrden;
    if (totalEl) totalEl.textContent = `$${formatearPrecio(transaccion.total)}`;
    if (dateEl) dateEl.textContent = new Date(transaccion.fechaCreacion).toLocaleDateString('es-AR');
    if (paymentMethodEl) {
        const metodoPago = transaccion.metodoPago || 'Tarjeta de Crédito';
        paymentMethodEl.textContent = metodoPago;
    }

    // Limpiar carrito inmediatamente después de confirmación exitosa
    limpiarCarritoCompleto();
    
    console.log('✅ Carrito limpiado después de compra exitosa');
}

function mostrarErrorPago(mensaje) {
    const loadingEl = document.querySelector('.payment-loading');
    if (loadingEl) {
        loadingEl.innerHTML = `
            <i class="fas fa-exclamation-triangle" style="color: #e74c3c; font-size: 3rem;"></i>
            <h3 style="color: #e74c3c;">Error en el Pago</h3>
            <p>${mensaje}</p>
            <button class="btn-primary" onclick="volverAlPaso1()" style="margin-top: 1rem;">
                <i class="fas fa-arrow-left"></i>
                Intentar Nuevamente
            </button>
        `;
    }
}

// ===== FUNCIONES DE NAVEGACIÓN =====

function goBack() {
    window.location.href = 'card.html';
}

function goToProducts() {
    window.location.href = 'productos.html';
}

function viewOrder() {
    // En una implementación real, esto llevaría a una página de seguimiento
    mostrarNotificacion('Funcionalidad de seguimiento en desarrollo', 'info');
}

function volverAlPaso1() {
    mostrarPaso(1);
    // Recargar la página para resetear el formulario
    setTimeout(() => {
        window.location.reload();
    }, 500);
}

// ===== FUNCIONES AUXILIARES =====

function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-AR').format(precio);
}

function mostrarNotificacion(mensaje, tipo = 'success') {
    const notif = document.createElement('div');
    notif.className = `checkout-notificacion ${tipo}`;
    notif.textContent = mensaje;
    
    Object.assign(notif.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        background: tipo === 'success' ? '#27ae60' : tipo === 'error' ? '#e74c3c' : '#3498db',
        color: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: '10000',
        fontWeight: '600',
        transform: 'translateX(400px)',
        transition: 'transform 0.3s ease'
    });
    
    document.body.appendChild(notif);
    
    setTimeout(() => notif.style.transform = 'translateX(0)', 100);
    
    setTimeout(() => {
        notif.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notif)) {
                document.body.removeChild(notif);
            }
        }, 300);
    }, 3000);
}

// ===== MANEJO DE PAGO CON TARJETA =====

function manejarPagoConTarjeta(evento) {
    evento.preventDefault();
    
    if (!validarFormularioTarjeta()) {
        mostrarNotificacion('Por favor completa todos los campos correctamente', 'error');
        return;
    }

    // Mostrar loading
    mostrarLoadingPago();
    
    // Simular procesamiento
    setTimeout(() => {
        procesarPagoSimulado();
    }, 2000);
}

function validarFormularioTarjeta() {
    const numeroTarjeta = document.getElementById('card-number').value;
    const fechaVencimiento = document.getElementById('card-expiry').value;
    const cvv = document.getElementById('card-cvv').value;
    const titular = document.getElementById('cardholder-name').value;

    let esValido = true;

    // Validar número de tarjeta
    if (!validarNumeroTarjeta(numeroTarjeta)) {
        mostrarErrorCampoTarjeta('card-number', false, 'Número de tarjeta inválido');
        esValido = false;
    }

    // Validar fecha de vencimiento
    if (!validarFechaVencimiento(fechaVencimiento)) {
        mostrarErrorCampoTarjeta('card-expiry', false, 'Fecha de vencimiento inválida');
        esValido = false;
    }

    // Validar CVV
    if (!validarCVV(cvv, numeroTarjeta)) {
        mostrarErrorCampoTarjeta('card-cvv', false, 'CVV inválido');
        esValido = false;
    }

    // Validar titular
    if (titular.trim().length < 2) {
        mostrarErrorCampoTarjeta('cardholder-name', false, 'Nombre del titular inválido');
        esValido = false;
    }

    return esValido;
}

function validarCampoTarjeta(evento) {
    const campo = evento.target;
    const valor = campo.value.trim();
    const nombre = campo.name;

    let esValido = true;
    let mensaje = '';

    switch (nombre) {
        case 'cardNumber':
            esValido = validarNumeroTarjeta(valor);
            mensaje = esValido ? '' : 'Número de tarjeta inválido';
            break;
        case 'cardExpiry':
            esValido = validarFechaVencimiento(valor);
            mensaje = esValido ? '' : 'Fecha de vencimiento inválida';
            break;
        case 'cardCvv':
            const numeroTarjeta = document.getElementById('card-number').value;
            esValido = validarCVV(valor, numeroTarjeta);
            mensaje = esValido ? '' : 'CVV inválido';
            break;
        case 'cardholderName':
            esValido = valor.length >= 2;
            mensaje = esValido ? '' : 'Nombre del titular inválido';
            break;
    }

    mostrarErrorCampoTarjeta(campo.id, esValido, mensaje);
    return esValido;
}

function mostrarErrorCampoTarjeta(campoId, esValido, mensaje) {
    const campo = document.getElementById(campoId);
    const errorEl = campo.parentNode.querySelector('.error-message');
    
    if (errorEl) {
        errorEl.textContent = mensaje;
        errorEl.style.display = esValido ? 'none' : 'block';
    }

    campo.style.borderColor = esValido ? '#e0e0e0' : '#e74c3c';
}

function limpiarErrorTarjeta(evento) {
    const campo = evento.target;
    const errorEl = campo.parentNode.querySelector('.error-message');
    
    if (errorEl) {
        errorEl.style.display = 'none';
    }
    
    campo.style.borderColor = '#e0e0e0';
}

function formatearNumeroTarjeta(evento) {
    let valor = evento.target.value.replace(/\s/g, '').replace(/[^0-9]/gi, '');
    let valorFormateado = valor.match(/.{1,4}/g)?.join(' ') || valor;
    
    if (valorFormateado.length > 19) {
        valorFormateado = valorFormateado.substr(0, 19);
    }
    
    evento.target.value = valorFormateado;
}

function formatearFechaVencimiento(evento) {
    let valor = evento.target.value.replace(/\D/g, '');
    
    if (valor.length >= 2) {
        valor = valor.substring(0, 2) + '/' + valor.substring(2, 4);
    }
    
    evento.target.value = valor;
}

function mostrarLoadingPago() {
    const form = document.getElementById('card-payment-form');
    const loading = document.getElementById('payment-processing');
    
    if (form) form.style.display = 'none';
    if (loading) loading.style.display = 'block';
}

// ===== GENERACIÓN DE FACTURAS =====

function descargarFactura() {
    if (!checkoutData) {
        mostrarNotificacion('No hay datos de la compra', 'error');
        return;
    }

    const factura = generarFacturaPDF();
    descargarPDF(factura, `factura-${checkoutData.numeroOrden || 'MMDR'}.pdf`);
    mostrarNotificacion('Factura descargada exitosamente', 'success');
}

function enviarFacturaPorEmail() {
    if (!checkoutData) {
        mostrarNotificacion('No hay datos de la compra', 'error');
        return;
    }

    // Simular envío por email
    mostrarNotificacion('Factura enviada por email a ' + checkoutData.cliente.email, 'success');
}

function generarFacturaPDF() {
    const ahora = new Date();
    const numeroFactura = checkoutData.numeroOrden || `FAC-${Date.now()}`;
    
    const facturaHTML = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Factura ${numeroFactura}</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .company-info { margin-bottom: 30px; }
                .invoice-details { margin-bottom: 30px; }
                .items-table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
                .items-table th, .items-table td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                .items-table th { background-color: #f2f2f2; }
                .total-section { text-align: right; }
                .footer { margin-top: 50px; text-align: center; font-size: 12px; color: #666; }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>MMDR E-COMMERCE</h1>
                <h2>FACTURA</h2>
            </div>
            
            <div class="company-info">
                <strong>MMDR E-COMMERCE</strong><br>
                Av. Corrientes 1234, Buenos Aires<br>
                CUIT: 20-12345678-9<br>
                Email: info@mmdr.com
            </div>
            
            <div class="invoice-details">
                <strong>Factura N°:</strong> ${numeroFactura}<br>
                <strong>Fecha:</strong> ${ahora.toLocaleDateString('es-AR')}<br>
                <strong>Cliente:</strong> ${checkoutData.cliente.firstName} ${checkoutData.cliente.lastName}<br>
                <strong>Email:</strong> ${checkoutData.cliente.email}<br>
                <strong>Dirección:</strong> ${checkoutData.cliente.street}, ${checkoutData.cliente.city}
            </div>
            
            <table class="items-table">
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Cantidad</th>
                        <th>Precio Unit.</th>
                        <th>Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${checkoutData.items.map(item => `
                        <tr>
                            <td>${item.nombre}</td>
                            <td>${item.cantidad}</td>
                            <td>$${formatearPrecio(item.precio)}</td>
                            <td>$${formatearPrecio(item.precio * item.cantidad)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            
            <div class="total-section">
                <p><strong>Subtotal: $${formatearPrecio(checkoutData.subtotal)}</strong></p>
                <p><strong>Envío: $${formatearPrecio(checkoutData.envio)}</strong></p>
                <p><strong>TOTAL: $${formatearPrecio(checkoutData.total)}</strong></p>
            </div>
            
            <div class="footer">
                <p>Gracias por su compra!</p>
                <p>Esta es una factura de prueba generada por el sistema de simulación de pagos.</p>
            </div>
        </body>
        </html>
    `;
    
    return facturaHTML;
}

function descargarPDF(contenidoHTML, nombreArchivo) {
    // Crear un blob con el contenido HTML
    const blob = new Blob([contenidoHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    
    // Crear un enlace temporal para descargar
    const enlace = document.createElement('a');
    enlace.href = url;
    enlace.download = nombreArchivo;
    document.body.appendChild(enlace);
    enlace.click();
    document.body.removeChild(enlace);
    
    // Limpiar el URL del objeto
    URL.revokeObjectURL(url);
}

// ===== FUNCIONES GLOBALES =====

window.goBack = goBack;
window.goToProducts = goToProducts;
window.viewOrder = viewOrder;
window.volverAlPaso1 = volverAlPaso1;
window.fillTestCard = fillTestCard;
window.descargarFactura = descargarFactura;
window.enviarFacturaPorEmail = enviarFacturaPorEmail;

console.log('✅ checkout-scripts.js cargado');
