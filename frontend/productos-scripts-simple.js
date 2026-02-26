// ===== SISTEMA SIMPLIFICADO DE PRODUCTOS =====

const API_BASE_URL = 'http://localhost:4000';

// Variable global para almacenar todos los productos
let todosLosProductos = [];
let productosFiltrados = [];

// Función principal para cargar productos
async function cargarProductos() {
    console.log('🚀 Iniciando carga de productos...');
    
    try {
        console.log('📡 Conectando a:', `${API_BASE_URL}/api/products`);
        
        const respuesta = await fetch(`${API_BASE_URL}/api/products?limit=100`);
        
        console.log('📊 Estado de respuesta:', respuesta.status, respuesta.statusText);
        
        if (!respuesta.ok) {
            throw new Error(`Error del servidor: ${respuesta.status} - ${respuesta.statusText}`);
        }
        
        const data = await respuesta.json();
        console.log('✅ Datos recibidos:', data);
        
        const productos = data.data || data.products || [];
        console.log(`📦 Total de productos: ${productos.length}`);
        
        // Guardar todos los productos en la variable global
        todosLosProductos = productos;
        productosFiltrados = [...productos];
        
        // Renderizar productos
        renderizarProductos();
        
        // Actualizar iconos de corazón después de un breve delay para que favoritos esté inicializado
        setTimeout(() => {
            if (typeof favoritos !== 'undefined' && favoritos) {
                favoritos.actualizarIconosCorazon();
            }
        }, 500);
        
        console.log('✅ Productos cargados exitosamente!');
        
    } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        
        const contenedor = document.getElementById('products-container');
        if (contenedor) {
            contenedor.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 3rem; color: #e74c3c;">
                    <h3>⚠️ Error al cargar productos</h3>
                    <p><strong>Error:</strong> ${error.message}</p>
                    <div style="margin-top: 2rem; text-align: left; max-width: 600px; margin-left: auto; margin-right: auto;">
                        <p><strong>Verifica que:</strong></p>
                        <ul style="text-align: left;">
                            <li>El backend esté corriendo: <code>cd backend && npm start</code></li>
                            <li>MongoDB esté conectado (verifica el archivo .env)</li>
                            <li>Haya productos en la base de datos</li>
                            <li>La URL sea correcta: ${API_BASE_URL}</li>
                        </ul>
                    </div>
                    <button onclick="cargarProductos()" style="margin-top: 2rem; padding: 12px 24px; background: #e74c3c; color: white; border: none; border-radius: 8px; cursor: pointer; font-size: 1rem;">
                        🔄 Reintentar
                    </button>
                </div>
            `;
        }
    }
}

// Función para renderizar productos en el contenedor
function renderizarProductos() {
    const contenedor = document.getElementById('products-container');
    
    if (!contenedor) {
        console.error('❌ No se encontró el contenedor con id="products-container"');
        return;
    }
    
    // Limpiar contenedor
    contenedor.innerHTML = '';
    
    if (productosFiltrados.length === 0) {
        contenedor.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 3rem;">
                <h3>No hay productos disponibles</h3>
                <p>No se encontraron productos con los filtros seleccionados</p>
            </div>
        `;
        return;
    }
    
    // Crear una tarjeta por cada producto filtrado
    productosFiltrados.forEach(producto => {
        const card = crearTarjetaProducto(producto);
        contenedor.appendChild(card);
    });
}

// Función para crear tarjeta de producto
function crearTarjetaProducto(producto) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Extraer datos del producto
    const nombre = producto.name || producto.nombre || 'Sin nombre';
    const precio = producto.price || producto.precio || 0;
    const precioOriginal = producto.originalPrice || producto.precioOriginal;
    const descuento = producto.discount || producto.descuento || 0;
    const imagen = producto.image || producto.imageUrl || producto.imagen || '';
    const categoria = producto.category || producto.categoria || '';
    
    // Agregar atributo data-category para filtrado
    if (categoria) {
        card.setAttribute('data-category', categoria);
    }
    
    // Calcular si hay descuento
    let tieneDescuento = descuento > 0;
    let porcentajeDescuento = descuento;
    
    // Si no tiene descuento pero tiene precio original, calcular
    if (!porcentajeDescuento && precioOriginal && precioOriginal > precio) {
        porcentajeDescuento = Math.round(((precioOriginal - precio) / precioOriginal) * 100);
        tieneDescuento = true;
    }
    
    // Escapar comillas simples en el nombre para evitar errores en onclick
    const nombreEscapado = nombre.replace(/'/g, "\\'");
    const imagenEscapada = imagen.replace(/'/g, "\\'");
    
    // Obtener ID del producto
    const productId = producto._id || producto.id || Date.now().toString();
    
    // Verificar si está en favoritos (se actualizará después de renderizar)
    const estaEnFavoritos = typeof favoritos !== 'undefined' && favoritos && favoritos.existeProducto(productId);
    
    // Construir HTML - click en imagen/título abre detalle
    card.innerHTML = `
        <div class="product-image" onclick="window.location.href='producto-detalle.html?id=${productId}'" style="cursor: pointer;">
            <img src="${imagen}" 
                 alt="${nombre}"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22280%22 height=%22250%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22280%22 height=%22250%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2218%22%3ESin imagen%3C/text%3E%3C/svg%3E'">
            ${tieneDescuento ? `<div class="product-badge sale">-${porcentajeDescuento}%</div>` : ''}
            <div class="product-actions" onclick="event.stopPropagation()">
                <i class="fas fa-heart ${estaEnFavoritos ? 'active' : ''}" 
                   data-product-id="${productId}" 
                   style="${estaEnFavoritos ? 'color: #e74c3c;' : ''}"
                   title="${estaEnFavoritos ? 'Eliminar de favoritos' : 'Agregar a favoritos'}"></i>
            </div>
        </div>
        <div class="product-info">
            <h3 class="product-title" onclick="window.location.href='producto-detalle.html?id=${productId}'" style="cursor: pointer;">${nombre}</h3>
            <div class="product-price">
                <span class="current-price">$${formatearPrecio(precio)}</span>
                ${precioOriginal ? `<span class="original-price">$${formatearPrecio(precioOriginal)}</span>` : ''}
            </div>
            <div class="product-actions-bottom" onclick="event.stopPropagation()">
                <button class="add-to-cart-btn" onclick="agregarProductoAlCarritoDesdeCard('${productId}', '${nombreEscapado}', ${precio}, '${imagenEscapada}')">
                    Agregar al Carrito
                </button>
                <button class="favorito-btn-card ${estaEnFavoritos ? 'active' : ''}" 
                        onclick="toggleFavoritoDesdeCard('${productId}', '${nombreEscapado}', ${precio}, '${imagenEscapada}', '${categoria}')"
                        title="${estaEnFavoritos ? 'Eliminar de favoritos' : 'Agregar a favoritos'}">
                    <i class="fas fa-heart"></i>
                </button>
            </div>
        </div>
    `;
    
    return card;
}

// Función para formatear precio
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-AR').format(precio);
}

// Función para agregar producto al carrito desde la tarjeta
function agregarProductoAlCarritoDesdeCard(id, nombre, precio, imagen) {
    console.log('🛒 Agregando al carrito:', id, nombre, precio);
    
    // Verificar si el carrito está inicializado
    if (typeof carrito === 'undefined' || !carrito) {
        console.warn('⚠️ Carrito aún no está inicializado, guardando en localStorage temporal');
        // Fallback: guardar en localStorage y mostrar notificación
        const productoTemp = { id, nombre, precio, imagen };
        localStorage.setItem('producto_pendiente', JSON.stringify(productoTemp));
        setTimeout(() => agregarProductoAlCarritoDesdeCard(id, nombre, precio, imagen), 500);
        return;
    }
    
    // Agregar producto usando la instancia del carrito
    const producto = {
        id: id,
        nombre: nombre,
        precio: precio,
        imagen: imagen
    };
    
    carrito.agregarProducto(producto);
}

// Función para toggle de favoritos desde la tarjeta
function toggleFavoritoDesdeCard(id, nombre, precio, imagen, categoria) {
    console.log('❤️ Toggle favorito:', id, nombre);
    
    // Verificar si favoritos está inicializado
    if (typeof favoritos === 'undefined' || !favoritos) {
        console.warn('⚠️ Favoritos aún no está inicializado, esperando...');
        setTimeout(() => toggleFavoritoDesdeCard(id, nombre, precio, imagen, categoria), 500);
        return;
    }
    
    const producto = {
        id: id,
        nombre: nombre,
        precio: precio,
        imagen: imagen,
        categoria: categoria || ''
    };
    
    // Verificar si ya está en favoritos
    if (favoritos.existeProducto(id)) {
        favoritos.eliminarProducto(id);
        // Actualizar el botón
        actualizarBotonFavorito(id, false);
    } else {
        favoritos.agregarProducto(producto);
        // Actualizar el botón
        actualizarBotonFavorito(id, true);
    }
}

// Función para actualizar el estado visual del botón de favoritos
function actualizarBotonFavorito(productId, estaEnFavoritos) {
    // Buscar el botón en la tarjeta usando el onclick que contiene el productId
    const favoritoBtns = document.querySelectorAll('.favorito-btn-card');
    favoritoBtns.forEach(btn => {
        const onclickAttr = btn.getAttribute('onclick') || '';
        if (onclickAttr.includes(`'${productId}'`) || onclickAttr.includes(`"${productId}"`)) {
            if (estaEnFavoritos) {
                btn.classList.add('active');
                btn.title = 'Eliminar de favoritos';
                btn.querySelector('.fa-heart').style.color = 'white';
            } else {
                btn.classList.remove('active');
                btn.title = 'Agregar a favoritos';
                btn.querySelector('.fa-heart').style.color = '#e74c3c';
            }
        }
    });
    
    // También actualizar el icono en la parte superior de la imagen
    const iconosCorazon = document.querySelectorAll(`.fa-heart[data-product-id="${productId}"]`);
    iconosCorazon.forEach(icono => {
        if (estaEnFavoritos) {
            icono.classList.add('active');
            icono.style.color = '#e74c3c';
        } else {
            icono.classList.remove('active');
            icono.style.color = '';
        }
    });
}

// Exportar función globalmente
window.toggleFavoritoDesdeCard = toggleFavoritoDesdeCard;

// ===== FUNCIONES DE FILTRADO Y ORDENAMIENTO =====

// Filtrar productos por categoría
function filtrarPorCategoria(categoria) {
    if (!categoria || categoria === '') {
        productosFiltrados = [...todosLosProductos];
    } else {
        productosFiltrados = todosLosProductos.filter(producto => {
            const categoriaProducto = (producto.category || producto.categoria || '').toLowerCase();
            return categoriaProducto === categoria.toLowerCase();
        });
    }
    
    // Aplicar ordenamiento actual después de filtrar
    const ordenSelect = document.querySelectorAll('.filter-select')[1];
    if (ordenSelect && ordenSelect.value) {
        ordenarProductos(ordenSelect.value);
    } else {
        renderizarProductos();
    }
}

// Ordenar productos
function ordenarProductos(orden) {
    if (!orden || orden === '') {
        renderizarProductos();
        return;
    }
    
    productosFiltrados.sort((a, b) => {
        switch (orden) {
            case 'price-low':
                // Precio: Menor a Mayor
                const precioA = a.price || a.precio || 0;
                const precioB = b.price || b.precio || 0;
                return precioA - precioB;
                
            case 'price-high':
                // Precio: Mayor a Menor
                const precioAHigh = a.price || a.precio || 0;
                const precioBHigh = b.price || b.precio || 0;
                return precioBHigh - precioAHigh;
                
            case 'name':
                // Nombre A-Z
                const nombreA = (a.name || a.nombre || '').toLowerCase();
                const nombreB = (b.name || b.nombre || '').toLowerCase();
                return nombreA.localeCompare(nombreB, 'es');
                
            default:
                return 0;
        }
    });
    
    renderizarProductos();
}

// Inicializar eventos de filtros
function inicializarFiltros() {
    // Selector de categoría (primer select)
    const categoriaSelect = document.querySelectorAll('.filter-select')[0];
    if (categoriaSelect) {
        categoriaSelect.addEventListener('change', function() {
            const categoria = this.value;
            filtrarPorCategoria(categoria);
        });
    }
    
    // Selector de ordenamiento (segundo select)
    const ordenSelect = document.querySelectorAll('.filter-select')[1];
    if (ordenSelect) {
        ordenSelect.addEventListener('change', function() {
            const orden = this.value;
            ordenarProductos(orden);
        });
    }
}

// Cargar productos al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 Página cargada');
    cargarProductos();
    inicializarFiltros();
});

// Actualizar productos cada 10 segundos (opcional)
// setInterval(cargarProductos, 10000);


