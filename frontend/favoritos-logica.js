// ===== SISTEMA COMPLETO DE FAVORITOS =====
// Similar al carrito pero más simple

// ===== CONFIGURACIÓN =====
const FAVORITOS_CONFIG = {
    STORAGE_KEY: 'mmdr_favoritos',
    EXPIRACION_KEY: 'mmdr_favoritos_expiracion',
    DURACION_HORAS: 30 * 24, // 30 días en horas
    DURACION_MS: 30 * 24 * 60 * 60 * 1000 // 30 días en milisegundos
};

// ===== CLASE PRINCIPAL DE FAVORITOS =====
class Favoritos {
    constructor() {
        this.items = [];
        this.inicializar();
    }

    // Inicializar favoritos
    inicializar() {
        this.verificarExpiracion();
        this.cargarDesdeStorage();
        this.actualizarUI();
    }

    // Verificar si los favoritos expiraron
    verificarExpiracion() {
        const expiracion = localStorage.getItem(FAVORITOS_CONFIG.EXPIRACION_KEY);
        
        if (expiracion) {
            const ahora = new Date().getTime();
            const tiempoExpiracion = parseInt(expiracion);
            
            if (ahora > tiempoExpiracion) {
                console.log('⏰ Favoritos expirados - Limpiando...');
                this.limpiarFavoritos();
                return true;
            }
        } else {
            // Si no hay fecha de expiración, establecer una nueva
            this.actualizarExpiracion();
        }
        
        return false;
    }

    // Actualizar fecha de expiración
    actualizarExpiracion() {
        const ahora = new Date().getTime();
        const expiracion = ahora + FAVORITOS_CONFIG.DURACION_MS;
        localStorage.setItem(FAVORITOS_CONFIG.EXPIRACION_KEY, expiracion.toString());
        console.log(`⏰ Favoritos válidos por ${FAVORITOS_CONFIG.DURACION_HORAS / 24} días`);
    }

    // Cargar favoritos desde localStorage
    cargarDesdeStorage() {
        try {
            const favoritosGuardados = localStorage.getItem(FAVORITOS_CONFIG.STORAGE_KEY);
            if (favoritosGuardados) {
                this.items = JSON.parse(favoritosGuardados);
                console.log(`✅ Favoritos cargados: ${this.items.length} items`);
            }
        } catch (error) {
            console.error('❌ Error cargando favoritos:', error);
            this.items = [];
        }
    }

    // Guardar favoritos en localStorage
    guardarEnStorage() {
        try {
            localStorage.setItem(FAVORITOS_CONFIG.STORAGE_KEY, JSON.stringify(this.items));
            this.actualizarExpiracion();
            console.log('💾 Favoritos guardados');
        } catch (error) {
            console.error('❌ Error guardando favoritos:', error);
        }
    }

    // Agregar producto a favoritos
    agregarProducto(producto) {
        // Verificar que el producto tenga los datos necesarios
        if (!producto || !producto.id) {
            console.error('❌ Producto inválido');
            return false;
        }

        // Verificar si el producto ya existe
        const itemExistente = this.items.find(item => item.id === producto.id);

        if (itemExistente) {
            console.log(`❤️ Producto ya está en favoritos: ${producto.nombre || producto.name}`);
            return false;
        }

        // Agregar nuevo item
        const nuevoItem = {
            id: producto.id,
            nombre: producto.nombre || producto.name,
            precio: producto.precio || producto.price,
            imagen: producto.imagen || producto.image,
            categoria: producto.categoria || producto.category,
            agregadoEl: new Date().getTime()
        };
        
        this.items.push(nuevoItem);
        console.log(`✅ Producto agregado a favoritos: ${nuevoItem.nombre}`);

        this.guardarEnStorage();
        this.actualizarUI();
        
        return true;
    }

    // Eliminar producto de favoritos
    eliminarProducto(productoId) {
        const indexAntes = this.items.length;
        this.items = this.items.filter(item => item.id !== productoId);
        
        if (this.items.length < indexAntes) {
            console.log(`🗑️ Producto eliminado de favoritos`);
            this.guardarEnStorage();
            this.actualizarUI();
            return true;
        }
        
        return false;
    }

    // Verificar si un producto está en favoritos
    existeProducto(productoId) {
        return this.items.some(item => item.id === productoId);
    }

    // Obtener todos los items de favoritos
    obtenerItems() {
        return [...this.items];
    }

    // Obtener cantidad total de favoritos
    obtenerCantidadTotal() {
        return this.items.length;
    }

    // Limpiar todos los favoritos
    limpiarFavoritos() {
        this.items = [];
        localStorage.removeItem(FAVORITOS_CONFIG.STORAGE_KEY);
        localStorage.removeItem(FAVORITOS_CONFIG.EXPIRACION_KEY);
        this.actualizarUI();
        console.log('🗑️ Favoritos limpiados completamente');
    }

    // Actualizar todos los elementos de UI
    actualizarUI() {
        this.actualizarBadge();
        this.actualizarIconosCorazon();
        this.actualizarListaFavoritos();
    }

    // Actualizar badge de favoritos (contador)
    actualizarBadge() {
        const badges = document.querySelectorAll('.favoritos-badge, [data-favoritos-badge]');
        const cantidad = this.obtenerCantidadTotal();
        
        badges.forEach(badge => {
            badge.textContent = cantidad;
            if (cantidad > 0) {
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        });
        
        console.log(`❤️ Badge actualizado: ${cantidad} favoritos`);
    }

    // Actualizar iconos de corazón en las tarjetas de productos
    actualizarIconosCorazon() {
        const iconosCorazon = document.querySelectorAll('.fa-heart[data-product-id]');
        
        iconosCorazon.forEach(icono => {
            const productId = icono.getAttribute('data-product-id');
            if (this.existeProducto(productId)) {
                icono.classList.add('active');
                icono.style.color = '#e74c3c';
            } else {
                icono.classList.remove('active');
                icono.style.color = '';
            }
        });
        
        // También actualizar los botones de favoritos en las tarjetas
        const favoritoBtns = document.querySelectorAll('.favorito-btn-card');
        favoritoBtns.forEach(btn => {
            const onclickAttr = btn.getAttribute('onclick') || '';
            // Extraer el productId del onclick
            const match = onclickAttr.match(/toggleFavoritoDesdeCard\(['"]([^'"]+)['"]/);
            if (match && match[1]) {
                const productId = match[1];
                if (this.existeProducto(productId)) {
                    btn.classList.add('active');
                    btn.title = 'Eliminar de favoritos';
                    const heartIcon = btn.querySelector('.fa-heart');
                    if (heartIcon) heartIcon.style.color = 'white';
                } else {
                    btn.classList.remove('active');
                    btn.title = 'Agregar a favoritos';
                    const heartIcon = btn.querySelector('.fa-heart');
                    if (heartIcon) heartIcon.style.color = '#e74c3c';
                }
            }
        });
    }

    // Actualizar lista de favoritos (si existe el contenedor)
    actualizarListaFavoritos() {
        const listaFavoritos = document.getElementById('favoritos-lista');
        const contador = document.getElementById('favoritos-contador');
        
        // Actualizar contador
        if (contador) {
            contador.textContent = this.items.length;
        }

        if (!listaFavoritos) return;

        if (this.items.length === 0) {
            listaFavoritos.innerHTML = '<p class="favoritos-vacio">No tienes productos en favoritos</p>';
            return;
        }

        // Renderizar items
        listaFavoritos.innerHTML = this.items.map(item => `
            <div class="favorito-item" data-id="${item.id}">
                <img src="${item.imagen}" alt="${item.nombre}" class="favorito-imagen" 
                     onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22100%22 height=%22100%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22100%22 height=%22100%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2212%22%3ESin imagen%3C/text%3E%3C/svg%3E'">
                <div class="favorito-info">
                    <h4 class="favorito-nombre">${item.nombre}</h4>
                    <p class="favorito-precio">$${this.formatearPrecio(item.precio)}</p>
                </div>
                <div class="favorito-acciones">
                    <button class="favorito-eliminar" onclick="favoritos.eliminarProducto('${item.id}')" title="Eliminar de favoritos">
                        <i class="fas fa-trash"></i>
                    </button>
                    <button class="favorito-agregar-carrito" onclick="agregarProductoAlCarritoDesdeFavoritos('${item.id}', '${item.nombre.replace(/'/g, "\\'")}', ${item.precio}, '${item.imagen.replace(/'/g, "\\'")}')" title="Agregar al carrito">
                        <i class="fas fa-shopping-cart"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    // Toggle del panel de favoritos
    togglePanelFavoritos() {
        const panelFavoritos = document.getElementById('panel-favoritos');
        if (panelFavoritos) {
            panelFavoritos.classList.toggle('active');
        }
    }

    // Cerrar panel de favoritos
    cerrarPanelFavoritos() {
        const panelFavoritos = document.getElementById('panel-favoritos');
        if (panelFavoritos) {
            panelFavoritos.classList.remove('active');
        }
    }

    // Formatear precio
    formatearPrecio(precio) {
        return new Intl.NumberFormat('es-AR').format(precio);
    }

    // Mostrar notificación
    mostrarNotificacion(mensaje, tipo = 'success') {
        // Crear elemento de notificación
        const notif = document.createElement('div');
        notif.className = `favoritos-notificacion ${tipo}`;
        notif.textContent = mensaje;
        
        // Estilos inline para que funcione sin CSS
        Object.assign(notif.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            padding: '1rem 1.5rem',
            background: tipo === 'success' ? '#27ae60' : '#e74c3c',
            color: 'white',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
            zIndex: '10000',
            fontWeight: '600',
            transform: 'translateX(400px)',
            transition: 'transform 0.3s ease'
        });
        
        document.body.appendChild(notif);
        
        // Animar entrada
        setTimeout(() => notif.style.transform = 'translateX(0)', 100);
        
        // Remover después de 3 segundos
        setTimeout(() => {
            notif.style.transform = 'translateX(400px)';
            setTimeout(() => document.body.removeChild(notif), 300);
        }, 3000);
    }

    // Obtener información de favoritos
    obtenerInfo() {
        return {
            items: this.obtenerItems(),
            cantidadTotal: this.obtenerCantidadTotal()
        };
    }
}

// ===== INSTANCIA GLOBAL DE FAVORITOS =====
let favoritos;

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('❤️ Inicializando sistema de favoritos...');
    favoritos = new Favoritos();
    inicializarEventosFavoritos();
    console.log('✅ Sistema de favoritos listo');
});

// ===== EVENTOS DE FAVORITOS =====
function inicializarEventosFavoritos() {
    // Event listener para iconos de corazón en el header
    const iconosCorazonHeader = document.querySelectorAll('.nav-actions .fa-heart, .favoritos-icono');
    console.log('❤️ Iconos de favoritos en header encontrados:', iconosCorazonHeader.length);
    
    iconosCorazonHeader.forEach(icono => {
        icono.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('❤️ Click en favoritos detectado');
            if (favoritos) {
                favoritos.togglePanelFavoritos();
            }
        });
    });

    // Event listener para iconos de corazón en tarjetas de productos
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('fa-heart') && e.target.hasAttribute('data-product-id')) {
            e.preventDefault();
            e.stopPropagation();
            
            const productId = e.target.getAttribute('data-product-id');
            const productCard = e.target.closest('.product-card');
            
            if (!productCard) return;
            
            // Obtener datos del producto desde la tarjeta
            // Intentar diferentes selectores para compatibilidad
            const nombre = productCard.querySelector('.product-title')?.textContent || 
                          productCard.querySelector('h3')?.textContent || '';
            const precioText = productCard.querySelector('.current-price')?.textContent || 
                              productCard.querySelector('.price .current-price')?.textContent || '$0';
            const precio = parseFloat(precioText.replace(/[^0-9]/g, '')) || 0;
            const imagen = productCard.querySelector('.product-image img')?.src || 
                          productCard.querySelector('img')?.src || '';
            const categoria = productCard.getAttribute('data-category') || '';
            
            const producto = {
                id: productId,
                nombre: nombre.trim(),
                precio: precio,
                imagen: imagen,
                categoria: categoria
            };
            
            if (favoritos.existeProducto(productId)) {
                favoritos.eliminarProducto(productId);
            } else {
                favoritos.agregarProducto(producto);
            }
        }
    });

    // Event listener para cerrar panel de favoritos al hacer clic fuera
    document.addEventListener('click', (e) => {
        const panelFavoritos = document.getElementById('panel-favoritos');
        const iconosFavoritos = document.querySelectorAll('.fa-heart, .favoritos-icono');
        
        if (panelFavoritos && panelFavoritos.classList.contains('active')) {
            const clickEnPanel = panelFavoritos.contains(e.target);
            const clickEnIcono = Array.from(iconosFavoritos).some(icono => icono.contains(e.target));
            
            if (!clickEnPanel && !clickEnIcono) {
                favoritos.cerrarPanelFavoritos();
            }
        }
    });

    // Verificar expiración periódicamente (cada 5 minutos)
    setInterval(() => {
        if (favoritos && favoritos.verificarExpiracion()) {
            favoritos.mostrarNotificacion('Tus favoritos han expirado y fueron limpiados', 'error');
        }
    }, 5 * 60 * 1000);
}

// Función para agregar producto desde favoritos al carrito
function agregarProductoAlCarritoDesdeFavoritos(productoId, productoNombre, productoPrecio, productoImagen) {
    if (typeof carrito === 'undefined' || !carrito) {
        console.error('❌ Carrito no inicializado');
        return;
    }

    const producto = {
        id: productoId,
        nombre: productoNombre,
        precio: productoPrecio,
        imagen: productoImagen
    };

    carrito.agregarProducto(producto);
}

// Función global para cerrar panel de favoritos
function cerrarPanelFavoritos() {
    if (favoritos) {
        favoritos.cerrarPanelFavoritos();
    } else {
        // Fallback si los favoritos no están inicializados
        const panelFavoritos = document.getElementById('panel-favoritos');
        if (panelFavoritos) {
            panelFavoritos.classList.remove('active');
        }
    }
}

// Exportar favoritos para uso global
window.favoritos = favoritos;
window.cerrarPanelFavoritos = cerrarPanelFavoritos;
window.agregarProductoAlCarritoDesdeFavoritos = agregarProductoAlCarritoDesdeFavoritos;

console.log('✅ favoritos-logica.js cargado');

