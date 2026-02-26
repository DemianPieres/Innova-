/**
 * Página de detalle de producto - Datos dinámicos desde API
 */

const API_BASE_URL = 'http://localhost:4000';
let productoActual = null;
let ratingSeleccionado = 0;

// Obtener ID de producto desde URL
function getProductId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

// Formatear precio
function formatearPrecio(precio) {
    return new Intl.NumberFormat('es-AR').format(precio);
}

// Cargar producto
async function cargarProducto() {
    const id = getProductId();
    if (!id) {
        mostrarError();
        return;
    }

    try {
        const res = await fetch(`${API_BASE_URL}/api/products/${id}`);
        if (!res.ok) {
            mostrarError();
            return;
        }

        const json = await res.json();
        productoActual = json.data || json;
        renderizarProducto();
        cargarProductosRelacionados();
        cargarResenas();
    } catch (err) {
        console.error('Error cargando producto:', err);
        mostrarError();
    }
}

function mostrarError() {
    document.getElementById('product-loading').style.display = 'none';
    document.getElementById('product-error').style.display = 'block';
}

function renderizarProducto() {
    document.getElementById('product-loading').style.display = 'none';
    document.getElementById('product-content').style.display = 'grid';

    const p = productoActual;
    const nombre = p.name || p.nombre || 'Sin nombre';
    const precio = p.price || p.precio || 0;
    const descripcion = p.description || p.descripcion || '';
    const imagen = p.image || p.imagen || '';
    const stock = p.stock ?? 0;
    const descuento = p.discount || p.descuento || 0;
    const rating = p.rating ?? 5;

    // Imágenes (una principal; si hay más en tags u otro campo, se pueden agregar)
    const imagenes = [imagen];
    renderizarGaleria(imagenes);

    document.getElementById('product-title').textContent = nombre;
    document.getElementById('product-price').textContent = `$ ${formatearPrecio(precio)}`;

    const cuotas = Math.ceil(precio / 12);
    document.getElementById('product-cuotas').textContent = `12 cuotas de $ ${formatearPrecio(cuotas)}`;
    document.getElementById('product-tax-note').textContent = `Precio sin impuestos nacionales: $${formatearPrecio(precio)}`;

    document.getElementById('stock-label').textContent = stock > 0 ? 'Stock disponible' : 'Sin stock';
    document.getElementById('stock-available').textContent = stock > 0 ? `(+${stock} disponibles)` : '';

    const qtySelect = document.getElementById('product-quantity');
    qtySelect.innerHTML = '';
    const maxQty = Math.min(stock || 1, 50);
    for (let i = 1; i <= maxQty; i++) {
        const opt = document.createElement('option');
        opt.value = i;
        opt.textContent = `${i} unidad${i > 1 ? 'es' : ''}`;
        qtySelect.appendChild(opt);
    }

    if (descuento > 0) {
        document.getElementById('product-badge').style.display = 'inline-block';
        document.getElementById('product-badge').textContent = `-${descuento}%`;
    }

    if (descripcion) {
        document.getElementById('product-description-section').style.display = 'block';
        document.getElementById('product-description-text').textContent = descripcion;
    }

    document.getElementById('btn-add-cart').disabled = stock <= 0;
    document.getElementById('btn-buy-now').disabled = stock <= 0;

    actualizarFavorito();
    configurarAcciones();
}

function renderizarGaleria(imagenes) {
    const thumbsContainer = document.getElementById('gallery-thumbnails');
    const mainImg = document.getElementById('product-main-image');

    thumbsContainer.innerHTML = '';
    const imgs = imagenes.filter(Boolean);
    if (imgs.length === 0) {
        mainImg.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ESin imagen%3C/text%3E%3C/svg%3E';
        return;
    }

    mainImg.src = imgs[0];
    mainImg.alt = productoActual?.name || 'Producto';
    mainImg.onerror = function() {
        this.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f0f0f0" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%23999"%3ESin imagen%3C/text%3E%3C/svg%3E';
    };

    imgs.forEach((src, i) => {
        const thumb = document.createElement('div');
        thumb.className = `gallery-thumb ${i === 0 ? 'active' : ''}`;
        const img = document.createElement('img');
        img.src = src;
        img.alt = '';
        thumb.appendChild(img);
        thumb.addEventListener('click', () => {
            document.querySelectorAll('.gallery-thumb').forEach(t => t.classList.remove('active'));
            thumb.classList.add('active');
            mainImg.src = src;
        });
        thumbsContainer.appendChild(thumb);
    });
}

async function cargarProductosRelacionados() {
    const container = document.getElementById('related-products');
    try {
        const res = await fetch(`${API_BASE_URL}/api/products?limit=6`);
        const json = await res.json();
        const productos = json.data || json.products || [];
        const idActual = productoActual?._id?.toString();
        const relacionados = productos.filter(p => p._id?.toString() !== idActual).slice(0, 4);

        container.innerHTML = '';
        relacionados.forEach(p => {
            const card = document.createElement('div');
            card.className = 'related-product-card';
            const nombre = p.name || p.nombre || '';
            const precio = p.price || p.precio || 0;
            const img = p.image || p.imagen || '';
            const id = p._id || p.id;
            card.innerHTML = `
                <img src="${img}" alt="${nombre}" onerror="this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22%3E%3Crect fill=%22%23f0f0f0%22 width=%22200%22 height=%22200%22/%3E%3C/svg%3E'">
                <div class="related-product-info">
                    <h3>${nombre}</h3>
                    <span class="related-product-price">$${formatearPrecio(precio)}</span>
                </div>
            `;
            card.onclick = () => window.location.href = `producto-detalle.html?id=${id}`;
            container.appendChild(card);
        });
    } catch (err) {
        console.error('Error cargando relacionados:', err);
    }
}

function configurarAcciones() {
    document.getElementById('btn-add-cart')?.addEventListener('click', agregarAlCarrito);
    document.getElementById('btn-buy-now')?.addEventListener('click', comprarAhora);
    document.getElementById('btn-favorite')?.addEventListener('click', toggleFavorito);
}

function agregarAlCarrito() {
    if (!productoActual) return;
    const cantidad = parseInt(document.getElementById('product-quantity').value) || 1;
    const producto = {
        id: productoActual._id,
        nombre: productoActual.name || productoActual.nombre,
        precio: productoActual.price || productoActual.precio,
        imagen: productoActual.image || productoActual.imagen
    };
    for (let i = 0; i < cantidad; i++) {
        if (typeof carrito !== 'undefined' && carrito) {
            carrito.agregarProducto(producto);
        } else {
            localStorage.setItem('producto_pendiente', JSON.stringify({ ...producto, cantidad }));
        }
    }
    mostrarNotificacion('Producto agregado al carrito', 'success');
}

function comprarAhora() {
    agregarAlCarrito();
    setTimeout(() => { window.location.href = 'checkout.html'; }, 500);
}

function actualizarFavorito() {
    if (!productoActual) return;
    const id = productoActual._id?.toString();
    const estaEnFavoritos = typeof favoritos !== 'undefined' && favoritos?.existeProducto(id);
    const btn = document.getElementById('btn-favorite');
    if (btn) {
        btn.classList.toggle('active', estaEnFavoritos);
        btn.querySelector('i').className = estaEnFavoritos ? 'fas fa-heart' : 'far fa-heart';
    }
}

function toggleFavorito() {
    if (!productoActual || typeof favoritos === 'undefined') return;
    const p = productoActual;
    const prod = {
        id: p._id,
        nombre: p.name || p.nombre,
        precio: p.price || p.precio,
        imagen: p.image || p.imagen,
        categoria: p.category || p.categoria || ''
    };
    if (favoritos.existeProducto(p._id)) {
        favoritos.eliminarProducto(p._id);
    } else {
        favoritos.agregarProducto(prod);
    }
    actualizarFavorito();
}

function mostrarNotificacion(msg, tipo) {
    const div = document.createElement('div');
    div.className = `notification ${tipo}`;
    div.textContent = msg;
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 3000);
}

// ===== RESEÑAS =====

async function cargarResenas() {
    const id = productoActual?._id;
    if (!id) return;

    try {
        const res = await fetch(`${API_BASE_URL}/api/reviews/product/${id}`);
        const json = await res.json();
        const reviews = json.data || [];
        const stats = json.stats || { avgRating: productoActual?.rating || 0, totalReviews: reviews.length };

        document.getElementById('reviews-avg').textContent = stats.avgRating?.toFixed(1) || '0';
        document.getElementById('reviews-count').textContent = `${stats.totalReviews || reviews.length} reseñas`;

        const starsEl = document.getElementById('reviews-stars');
        const r = Math.round(stats.avgRating || 0);
        starsEl.innerHTML = '<i class="fas fa-star"></i>'.repeat(r) + '<i class="far fa-star"></i>'.repeat(5 - r);

        const listEl = document.getElementById('reviews-list');
        if (reviews.length === 0) {
            listEl.innerHTML = '<div class="reviews-empty">No hay reseñas aún. ¡Sé el primero en opinar!</div>';
        } else {
            listEl.innerHTML = reviews.map(r => `
                <div class="review-item" data-review-id="${r._id}">
                    <div class="review-item-header">
                        <span class="review-item-author">${r.userName || 'Anónimo'}</span>
                        <span class="review-item-date">${formatearFecha(r.createdAt)}</span>
                    </div>
                    <div class="review-item-stars">${'<i class="fas fa-star"></i>'.repeat(r.rating)}${'<i class="far fa-star"></i>'.repeat(5 - r.rating)}</div>
                    ${r.comment ? `<p class="review-item-comment">${r.comment}</p>` : ''}
                </div>
            `).join('');
        }
    } catch (err) {
        console.error('Error cargando reseñas:', err);
        document.getElementById('reviews-list').innerHTML = '<div class="reviews-empty">No se pudieron cargar las reseñas.</div>';
    }

    configurarFormularioResena();
}

function formatearFecha(dateStr) {
    const d = new Date(dateStr);
    return d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' });
}

function configurarFormularioResena() {
    const btnEscribir = document.getElementById('btn-write-review');
    const formContainer = document.getElementById('review-form-container');
    const form = document.getElementById('review-form');
    const btnCancel = document.getElementById('btn-cancel-review');
    const ratingSelect = document.getElementById('rating-select');
    const charCount = document.getElementById('review-char-count');
    const textarea = document.getElementById('review-comment');

    btnEscribir?.addEventListener('click', () => {
        formContainer.style.display = formContainer.style.display === 'none' ? 'block' : 'none';
        ratingSeleccionado = 0;
        actualizarEstrellasInput(0);
        form?.reset();
        charCount.textContent = '0';
    });

    btnCancel?.addEventListener('click', () => { formContainer.style.display = 'none'; });

    ratingSelect?.addEventListener('click', (e) => {
        const span = e.target.closest('span[data-rating]');
        if (span) {
            ratingSeleccionado = parseInt(span.dataset.rating);
            actualizarEstrellasInput(ratingSeleccionado);
        }
    });

    textarea?.addEventListener('input', () => {
        charCount.textContent = textarea.value.length;
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (ratingSeleccionado < 1) {
            mostrarNotificacion('Seleccioná una calificación', 'error');
            return;
        }
        const userName = document.getElementById('review-user-name').value.trim();
        const userEmail = document.getElementById('review-user-email').value.trim();
        const comment = document.getElementById('review-comment').value.trim();

        try {
            const res = await fetch(`${API_BASE_URL}/api/reviews/product/${productoActual._id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName, userEmail, rating: ratingSeleccionado, comment })
            });
            const json = await res.json();
            if (json.success) {
                mostrarNotificacion('¡Reseña publicada!', 'success');
                formContainer.style.display = 'none';
                form.reset();
                cargarResenas();
            } else {
                mostrarNotificacion(json.message || 'Error al publicar', 'error');
            }
        } catch (err) {
            mostrarNotificacion('Error de conexión', 'error');
        }
    });
}

function actualizarEstrellasInput(rating) {
    const spans = document.querySelectorAll('#rating-select span');
    spans.forEach((s, i) => {
        const r = parseInt(s.dataset.rating);
        s.classList.toggle('active', r <= rating);
        s.querySelector('i').className = r <= rating ? 'fas fa-star' : 'far fa-star';
    });
}

document.addEventListener('DOMContentLoaded', () => {
    cargarProducto();
    setTimeout(() => {
        if (typeof favoritos !== 'undefined') favoritos.actualizarIconosCorazon();
        if (typeof carrito !== 'undefined' && carrito?.actualizarBadge) carrito.actualizarBadge();
    }, 500);
});
