// ===== PRODUCTOS SCRIPTS - VERSIÓN SIMPLIFICADA =====

// Configuración de la API
const API_BASE_URL = 'http://localhost:4000';

// Esperar a que cargue el DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Página cargada, iniciando carga de productos...');
    cargarProductos();
});

// ===== WISHLIST FUNCTIONALITY =====
let wishlistItems = JSON.parse(localStorage.getItem('wishlist')) || [];

function initializeWishlist() {
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    const wishlistBadge = document.querySelector('.wishlist-icon .badge');
    
    // Update wishlist badge count
    updateWishlistBadge();
    
    // Update wishlist button states
    updateWishlistButtons();
    
    wishlistButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const productCard = this.closest('.product-card');
            const productId = getProductId(productCard);
            const productData = getProductData(productCard);
            
            toggleWishlistItem(productId, productData, this);
        });
    });
}

function toggleWishlistItem(productId, productData, button) {
    const existingIndex = wishlistItems.findIndex(item => item.id === productId);
    
    if (existingIndex > -1) {
        // Remove from wishlist
        wishlistItems.splice(existingIndex, 1);
        button.classList.remove('active');
        showNotification('Producto eliminado de favoritos', 'info');
    } else {
        // Add to wishlist
        wishlistItems.push({
            id: productId,
            ...productData,
            addedAt: new Date().toISOString()
        });
        button.classList.add('active');
        showNotification('Producto agregado a favoritos', 'success');
    }
    
    localStorage.setItem('wishlist', JSON.stringify(wishlistItems));
    updateWishlistBadge();
}

function updateWishlistBadge() {
    const wishlistBadge = document.querySelector('.wishlist-icon .badge');
    if (wishlistBadge) {
        wishlistBadge.textContent = wishlistItems.length;
    }
}

function updateWishlistButtons() {
    const wishlistButtons = document.querySelectorAll('.wishlist-btn');
    wishlistButtons.forEach(button => {
        const productCard = button.closest('.product-card');
        const productId = getProductId(productCard);
        
        if (wishlistItems.some(item => item.id === productId)) {
            button.classList.add('active');
        }
    });
}

// ===== CART FUNCTIONALITY =====
let cartItems = JSON.parse(localStorage.getItem('cart')) || [];

function initializeCart() {
    const addToCartButtons = document.querySelectorAll('.add-to-cart-btn');
    const cartBadge = document.querySelector('.cart-icon .badge');
    
    // Update cart badge count
    updateCartBadge();
    
    addToCartButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            const productCard = this.closest('.product-card');
            const productId = getProductId(productCard);
            const productData = getProductData(productCard);
            
            addToCart(productId, productData, this);
        });
    });
}

function addToCart(productId, productData, button) {
    const existingItem = cartItems.find(item => item.id === productId);
    
    if (existingItem) {
        existingItem.quantity += 1;
        showNotification('Cantidad actualizada en el carrito', 'info');
    } else {
        cartItems.push({
            id: productId,
            ...productData,
            quantity: 1,
            addedAt: new Date().toISOString()
        });
        showNotification('Producto agregado al carrito', 'success');
    }
    
    localStorage.setItem('cart', JSON.stringify(cartItems));
    updateCartBadge();
    
    // Add visual feedback
    animateAddToCart(button);
}

function updateCartBadge() {
    const cartBadge = document.querySelector('.cart-icon .badge');
    if (cartBadge) {
        const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
        cartBadge.textContent = totalItems;
    }
}

function animateAddToCart(button) {
    const originalText = button.textContent;
    button.textContent = 'Agregado ✓';
    button.style.background = '#27ae60';
    
    setTimeout(() => {
        button.textContent = originalText;
        button.style.background = '';
    }, 1500);
}

// ===== FILTERS FUNCTIONALITY =====
function initializeFilters() {
    const categoryFilter = document.querySelector('.filter-select[value=""]');
    const sortFilter = document.querySelectorAll('.filter-select')[1];
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            filterByCategory(this.value);
        });
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            sortProducts(this.value);
        });
    }
}

function filterByCategory(category) {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        if (category === '' || card.dataset.category === category) {
            card.style.display = 'block';
            card.style.animation = 'fadeInUp 0.6s ease forwards';
        } else {
            card.style.display = 'none';
        }
    });
}

function sortProducts(sortType) {
    const container = document.querySelector('.products-grid');
    const products = Array.from(container.querySelectorAll('.product-card'));
    
    products.sort((a, b) => {
        switch (sortType) {
            case 'price-low':
                return getProductPrice(a) - getProductPrice(b);
            case 'price-high':
                return getProductPrice(b) - getProductPrice(a);
            case 'name':
                return getProductName(a).localeCompare(getProductName(b));
            case 'rating':
                return getProductRating(b) - getProductRating(a);
            default:
                return 0;
        }
    });
    
    // Re-append sorted products
    products.forEach(product => container.appendChild(product));
}

// ===== VIEW TOGGLE FUNCTIONALITY =====
function initializeViewToggle() {
    const viewButtons = document.querySelectorAll('.view-btn');
    const productsGrid = document.querySelector('.products-grid');
    
    viewButtons.forEach(button => {
        button.addEventListener('click', function() {
            const view = this.dataset.view;
            
            // Update active button
            viewButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Update grid view
            if (view === 'list') {
                productsGrid.classList.add('list-view');
            } else {
                productsGrid.classList.remove('list-view');
            }
            
            localStorage.setItem('preferredView', view);
        });
    });
    
    // Load saved view preference
    const savedView = localStorage.getItem('preferredView');
    if (savedView === 'list') {
        document.querySelector('[data-view="list"]').click();
    }
}

// ===== QUICK VIEW FUNCTIONALITY =====
function initializeQuickView() {
    const quickViewButtons = document.querySelectorAll('.quick-view-btn');
    
    quickViewButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            
            const productCard = this.closest('.product-card');
            const productData = getProductData(productCard);
            
            showQuickView(productData);
        });
    });
}

function showQuickView(productData) {
    // Create modal overlay
    const modal = document.createElement('div');
    modal.className = 'modal-overlay active';
    modal.innerHTML = `
        <div class="quick-view-modal">
            <button class="close-modal">&times;</button>
            <div class="modal-content">
                <div class="modal-image">
                    <img src="${productData.image}" alt="${productData.title}">
                </div>
                <div class="modal-info">
                    <h2>${productData.title}</h2>
                    <div class="modal-rating">
                        ${generateStars(productData.rating)}
                        <span>(${productData.reviewCount})</span>
                    </div>
                    <div class="modal-price">
                        <span class="current-price">${productData.currentPrice}</span>
                        ${productData.originalPrice ? `<span class="original-price">${productData.originalPrice}</span>` : ''}
                    </div>
                    <p class="product-description">
                        Descripción detallada del producto. Características principales y beneficios.
                    </p>
                    <div class="modal-actions">
                        <button class="add-to-cart-btn">Añadir al Carrito</button>
                        <button class="wishlist-btn">♡ Favoritos</button>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Close modal functionality
    const closeBtn = modal.querySelector('.close-modal');
    closeBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        setTimeout(() => document.body.removeChild(modal), 300);
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeBtn.click();
        }
    });
}

// ===== LOAD MORE FUNCTIONALITY =====
function initializeLoadMore() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            this.innerHTML = '<span class="loading"></span> Cargando...';
            this.disabled = true;
            
            // Simulate loading more products
            setTimeout(() => {
                loadMoreProducts();
                this.innerHTML = 'Ver Más Productos';
                this.disabled = false;
            }, 1500);
        });
    }
}

function loadMoreProducts() {
    // This would typically fetch more products from the API
    // For now, we'll duplicate existing products
    const container = document.querySelector('.products-grid');
    const existingProducts = container.querySelectorAll('.product-card');
    
    // Clone first 4 products
    for (let i = 0; i < Math.min(4, existingProducts.length); i++) {
        const clone = existingProducts[i].cloneNode(true);
        container.appendChild(clone);
    }
    
    // Re-initialize functionality for new products
    initializeWishlist();
    initializeCart();
    initializeQuickView();
    
    showNotification('Más productos cargados', 'success');
}

// ===== PRODUCT ANIMATIONS =====
function initializeProductAnimations() {
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Stop observing once visible
            }
        });
    }, {
        threshold: 0.1
    });
    
    document.querySelectorAll('.product-card:not(.observed)').forEach(card => {
        card.classList.add('observed');
        observer.observe(card);
    });
}

// ===== UTILITY FUNCTIONS =====
function getProductId(productCard) {
    // Generate ID based on product title for now
    const title = productCard.querySelector('.product-title').textContent;
    return title.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
}

function getProductData(productCard) {
    const title = productCard.querySelector('.product-title').textContent;
    const currentPrice = productCard.querySelector('.current-price').textContent;
    const originalPrice = productCard.querySelector('.original-price')?.textContent || null;
    const image = productCard.querySelector('.product-image img').src;
    const rating = productCard.querySelectorAll('.star.filled').length;
    const reviewCount = productCard.querySelector('.rating-count').textContent.replace(/[()]/g, '');
    
    return {
        title,
        currentPrice,
        originalPrice,
        image,
        rating,
        reviewCount
    };
}

function getProductPrice(productCard) {
    const priceText = productCard.querySelector('.current-price').textContent;
    return parseInt(priceText.replace(/[^\d]/g, ''));
}

function getProductName(productCard) {
    return productCard.querySelector('.product-title').textContent;
}

function getProductRating(productCard) {
    return productCard.querySelectorAll('.star.filled').length;
}

function generateStars(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= rating ? 'filled' : ''}">★</span>`;
    }
    return `<div class="stars">${stars}</div>`;
}

function showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Style the notification
    Object.assign(notification.style, {
        position: 'fixed',
        top: '20px',
        right: '20px',
        padding: '1rem 1.5rem',
        borderRadius: '10px',
        color: 'white',
        fontWeight: '600',
        zIndex: '10000',
        transform: 'translateX(400px)',
        transition: 'transform 0.3s ease',
        backgroundColor: type === 'success' ? '#27ae60' : 
                        type === 'error' ? '#e74c3c' : '#3498db'
    });
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// ===== SEARCH FUNCTIONALITY =====
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            filterProductsBySearch(searchTerm);
        });
    }
}

function filterProductsBySearch(searchTerm) {
    const productCards = document.querySelectorAll('.product-card');
    
    productCards.forEach(card => {
        const title = card.querySelector('.product-title').textContent.toLowerCase();
        
        if (title.includes(searchTerm) || searchTerm === '') {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Initialize search when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
});

// ===== KEYBOARD NAVIGATION =====
document.addEventListener('keydown', function(e) {
    // ESC key to close modals
    if (e.key === 'Escape') {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (activeModal) {
            activeModal.querySelector('.close-modal').click();
        }
    }
});

// ===== PERFORMANCE OPTIMIZATION =====
// Debounce function for search
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Apply debounce to search
const debouncedSearch = debounce(filterProductsBySearch, 300);

// ===== FUNCIÓN PRINCIPAL PARA CARGAR PRODUCTOS =====

async function cargarProductos() {
    const container = document.getElementById('products-container');
    
    if (!container) {
        console.error('❌ No se encontró el contenedor de productos');
        return;
    }

    // Mostrar mensaje de carga
    container.innerHTML = `
        <div class="loading-products">
            <div class="loading-spinner"></div>
            <p>Cargando productos...</p>
        </div>
    `;

    try {
        console.log('📡 Intentando conectar con:', `${API_BASE_URL}/api/products`);
        
        const response = await fetch(`${API_BASE_URL}/api/products?limit=100`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        console.log('📊 Respuesta recibida:', response.status, response.statusText);

        if (!response.ok) {
            throw new Error(`Error del servidor: ${response.status}`);
        }

        const data = await response.json();
        console.log('✅ Datos recibidos:', data);

        const productos = data.data || data.products || [];
        console.log(`📦 Total de productos: ${productos.length}`);

        if (productos.length === 0) {
            container.innerHTML = `
                <div class="no-products">
                    <p style="grid-column: 1/-1; text-align: center; font-size: 1.2rem;">
                        No hay productos disponibles en la base de datos.
                    </p>
                </div>
            `;
            return;
        }

        // Limpiar contenedor y mostrar productos
        container.innerHTML = '';
        productos.forEach(producto => {
            const card = crearCardProducto(producto);
            container.appendChild(card);
        });

        console.log('✅ Productos renderizados correctamente');

    } catch (error) {
        console.error('❌ Error al cargar productos:', error);
        container.innerHTML = `
            <div class="error-products">
                <p style="grid-column: 1/-1; text-align: center; color: #e74c3c;">
                    ⚠️ Error al cargar productos: ${error.message}<br><br>
                    <strong>Verifica que:</strong><br>
                    1. El servidor backend esté corriendo en http://localhost:4000<br>
                    2. MongoDB esté conectado<br>
                    3. Haya productos en la base de datos<br><br>
                    <button onclick="cargarProductos()" style="padding: 10px 20px; cursor: pointer; background: #e74c3c; color: white; border: none; border-radius: 5px;">
                        🔄 Reintentar
                    </button>
                </p>
            </div>
        `;
    }
}

// ===== CREAR TARJETA DE PRODUCTO (SIMPLIFICADA) =====

function crearCardProducto(producto) {
    const card = document.createElement('div');
    card.className = 'product-card';
    
    // Obtener datos del producto con fallbacks
    const nombre = producto.name || producto.nombre || 'Producto sin nombre';
    const precio = producto.price || producto.precio || 0;
    const precioOriginal = producto.originalPrice || producto.precioOriginal;
    const descuento = producto.discount || producto.descuento || 0;
    const imagen = producto.image || producto.imageUrl || producto.imagen || '';
    
    // Calcular si tiene descuento
    const tieneDescuento = descuento > 0 || (precioOriginal && precioOriginal > precio);
    let porcentajeDescuento = descuento;
    
    // Si no tiene descuento directo pero tiene precio original, calcularlo
    if (!porcentajeDescuento && precioOriginal && precioOriginal > precio) {
        porcentajeDescuento = Math.round(((precioOriginal - precio) / precioOriginal) * 100);
    }

    // Construir HTML de la tarjeta
    card.innerHTML = `
        <div class="product-image">
            <img src="${imagen}" 
                 alt="${nombre}"
                 onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22280%22 height=%22250%22%3E%3Crect width=%22280%22 height=%22250%22 fill=%22%23f0f0f0%22/%3E%3Ctext x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22 fill=%22%23999%22 font-size=%2220%22%3ESin imagen%3C/text%3E%3C/svg%3E'">
            ${tieneDescuento ? `<div class="product-badge sale">-${porcentajeDescuento}%</div>` : ''}
        </div>
        <div class="product-info">
            <h3 class="product-title">${nombre}</h3>
            <div class="product-price">
                <span class="current-price">$${formatearPrecio(precio)}</span>
                ${precioOriginal ? `<span class="original-price">$${formatearPrecio(precioOriginal)}</span>` : ''}
            </div>
            <button class="add-to-cart-btn" onclick="alert('Función de carrito en desarrollo')">
                Agregar al Carrito
            </button>
        </div>
    `;

    return card;
}

// Función auxiliar para formatear precios
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-AR').format(precio);
}

// Funciones auxiliares antiguas - mantener para compatibilidad
function generateStarsHTML(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="star ${i <= rating ? 'filled' : ''}">★</span>`;
    }
    return stars;
}

function formatPrice(price) {
    return formatearPrecio(price);
}

// Mostrar estado de carga
function showLoadingState() {
    const container = document.getElementById('products-container');
    if (!container) return;

    if (currentApiPage === 1) {
        container.innerHTML = `
            <div class="loading-products">
                <div class="loading-spinner"></div>
                <p>Cargando productos...</p>
            </div>
        `;
    }
}

// Mostrar estado de error
function showErrorState() {
    const container = document.getElementById('products-container');
    if (!container) return;

    container.innerHTML = `
        <div class="error-products">
            <i class="fas fa-exclamation-triangle"></i>
            <h3>Error al cargar productos</h3>
            <p>No se pudieron cargar los productos. Verifica tu conexión.</p>
            <button onclick="retryLoadProducts()" class="retry-btn">Reintentar</button>
        </div>
    `;
}

// Reintentar carga de productos
window.retryLoadProducts = function() {
    currentApiPage = 1;
    loadProductsFromAPI();
};

// Actualizar botón "Cargar más"
function updateLoadMoreButton(pagination) {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    if (!loadMoreBtn) return;

    if (pagination && pagination.hasNextPage) {
        loadMoreBtn.style.display = 'block';
        loadMoreBtn.disabled = false;
        loadMoreBtn.innerHTML = 'Ver Más Productos';
    } else {
        loadMoreBtn.style.display = 'none';
    }
}

// Actualizar función de "Cargar más"
function initializeLoadMore() {
    const loadMoreBtn = document.querySelector('.load-more-btn');
    
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function() {
            if (isLoadingProducts) return;
            
            this.innerHTML = '<span class="loading"></span> Cargando...';
            this.disabled = true;
            
            currentApiPage++;
            loadProductsFromAPI();
        });
    }
}

// Actualizar filtros para trabajar con la API
function initializeFilters() {
    const categoryFilter = document.querySelector('.filter-select');
    const sortFilter = document.querySelectorAll('.filter-select')[1];
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', function() {
            if (this.value) {
                currentApiFilters.category = this.value;
            } else {
                delete currentApiFilters.category;
            }
            currentApiPage = 1;
            loadProductsFromAPI();
        });
    }
    
    if (sortFilter) {
        sortFilter.addEventListener('change', function() {
            const [sortBy, sortOrder] = this.value.split('-');
            if (sortBy && sortOrder) {
                currentApiFilters.sortBy = sortBy === 'price' ? 'price' : sortBy;
                currentApiFilters.sortOrder = sortOrder === 'low' ? 'asc' : 'desc';
            } else {
                delete currentApiFilters.sortBy;
                delete currentApiFilters.sortOrder;
            }
            currentApiPage = 1;
            loadProductsFromAPI();
        });
    }
}

// Actualizar búsqueda para trabajar con la API
function initializeSearch() {
    const searchInput = document.querySelector('.search-input');
    
    if (searchInput) {
        searchInput.addEventListener('input', debounce(function() {
            const searchTerm = this.value.trim();
            if (searchTerm) {
                currentApiFilters.search = searchTerm;
            } else {
                delete currentApiFilters.search;
            }
            currentApiPage = 1;
            loadProductsFromAPI();
        }, 500));
    }
}

// Obtener datos del producto para wishlist/carrito desde el DOM
function getProductData(productCard) {
    const title = productCard.querySelector('.product-title').textContent;
    const currentPrice = productCard.querySelector('.current-price').textContent;
    const originalPrice = productCard.querySelector('.original-price')?.textContent || null;
    const image = productCard.querySelector('.product-image img').src;
    const rating = productCard.querySelectorAll('.star.filled').length;
    const reviewCount = productCard.querySelector('.rating-count').textContent.replace(/[()]/g, '');
    
    return {
        title,
        currentPrice,
        originalPrice,
        image,
        rating,
        reviewCount
    };
}

// Cargar productos de ejemplo para la página pública
function loadSampleProductsForPublic() {
    const sampleProducts = [
        {
            _id: '1',
            name: 'Cubre Asientos Universal',
            price: 25000,
            originalPrice: 36000,
            stock: 15,
            category: 'asientos',
            isActive: true,
            image: 'Imagenes/cubreasientosuniversal.webp',
            description: 'Cubre asientos universal de alta calidad',
            discount: 31,
            rating: 5,
            ratingCount: 65,
            featured: true
        },
        {
            _id: '2',
            name: 'Cubre Volante Universal',
            price: 16000,
            originalPrice: 18800,
            stock: 8,
            category: 'volantes',
            isActive: true,
            image: 'Imagenes/cubrevolanteuniversal.webp',
            description: 'Cubre volante universal ergonómico',
            discount: 15,
            rating: 5,
            ratingCount: 66,
            featured: false
        },
        {
            _id: '3',
            name: 'Pomo Reicing',
            price: 8000,
            originalPrice: 17000,
            stock: 3,
            category: 'accesorios',
            isActive: true,
            image: 'Imagenes/pomoreicing.webp',
            description: 'Pomo de palanca deportivo',
            discount: 53,
            rating: 5,
            ratingCount: 65,
            featured: false
        },
        {
            _id: '4',
            name: 'Volante MOMO edición limitada',
            price: 78000,
            stock: 2,
            category: 'volantes',
            isActive: true,
            image: 'Imagenes/VolanteMOMOedicionlimitada.jpg',
            description: 'Volante deportivo MOMO edición especial',
            discount: 0,
            rating: 5,
            ratingCount: 65,
            featured: true
        },
        {
            _id: '5',
            name: 'Kit Suspensión Neumática',
            price: 242000,
            originalPrice: 400000,
            stock: 1,
            category: 'suspension',
            isActive: true,
            image: 'Imagenes/kitsuspensionneumatica.webp',
            description: 'Sistema completo de suspensión neumática',
            discount: 40,
            rating: 5,
            ratingCount: 65,
            featured: true
        },
        {
            _id: '6',
            name: 'Kit LED Premium',
            price: 15000,
            stock: 12,
            category: 'electronica',
            isActive: true,
            image: 'Imagenes/kitled.jpg',
            description: 'Kit de luces LED de alta intensidad',
            discount: 0,
            rating: 4,
            ratingCount: 42,
            featured: false
        },
        {
            _id: '7',
            name: 'Kit Turbo Completo',
            price: 350000,
            stock: 1,
            category: 'accesorios',
            isActive: true,
            image: 'Imagenes/kitturbo.jpg',
            description: 'Sistema turbo completo para mayor potencia',
            discount: 0,
            rating: 5,
            ratingCount: 23,
            featured: true
        }
    ];

    console.log('✅ Productos de ejemplo cargados para página pública:', sampleProducts.length);
    renderAPIProducts(sampleProducts);
    
    // Simular paginación
    updateLoadMoreButton({ hasNextPage: false });
}

// Inicializar búsqueda mejorada
document.addEventListener('DOMContentLoaded', function() {
    initializeSearch();
});
