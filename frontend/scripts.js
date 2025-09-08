// ==========================
// Configuración
// ==========================
const API_BASE_URL = "http://localhost:4000";

// ==========================
// Utilidades
// ==========================
function showNotification(message, type = "info") {
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.className = `notification ${type}`;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// ==========================
// LOGIN
// ==========================
async function handleLogin() {
    const emailInput = document.querySelector("#login-email");
    const passwordInput = document.querySelector("#login-password");
    const submitBtn = document.querySelector("#login-submit");

    if (!emailInput.value || !passwordInput.value) {
        showNotification("Por favor, complete todos los campos", "error");
        return;
    }

    submitBtn.textContent = "Iniciando...";
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include', // ← IMPORTANTE: Para cookies de sesión
            body: JSON.stringify({
                email: emailInput.value.toLowerCase().trim(), // ← Normalizar email
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification("¡Inicio de sesión exitoso!", "success");
            // Guardar información del usuario en localStorage
            localStorage.setItem("usuario", JSON.stringify(data.user));

            setTimeout(() => {
                window.location.href = "mode-selection.html";
            }, 1500);
        } else {
            showNotification(data.error || "Error en el inicio de sesión", "error");
        }
    } catch (error) {
        console.error("Error en login:", error);
        showNotification("Error de conexión con el servidor. Verifica que el backend esté ejecutándose.", "error");
    } finally {
        submitBtn.textContent = "Iniciar Sesión";
        submitBtn.disabled = false;
    }
}

// ==========================
// REGISTRO
// ==========================
async function handleSignup() {
    const nameInput = document.querySelector("#signup-name");
    const emailInput = document.querySelector("#signup-email");
    const passwordInput = document.querySelector("#signup-password");
    const submitBtn = document.querySelector("#signup-submit");

    if (!nameInput.value || !emailInput.value || !passwordInput.value) {
        showNotification("Por favor, complete todos los campos", "error");
        return;
    }

    if (passwordInput.value.length < 6) {
        showNotification("La contraseña debe tener al menos 6 caracteres", "error");
        return;
    }

    submitBtn.textContent = "Registrando...";
    submitBtn.disabled = true;

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include', // ← IMPORTANTE: Para cookies de sesión
            body: JSON.stringify({
                name: nameInput.value.trim(),
                email: emailInput.value.toLowerCase().trim(), // ← Normalizar email
                password: passwordInput.value
            })
        });

        const data = await response.json();

        if (response.ok) {
            showNotification("¡Cuenta creada exitosamente!", "success");
            // Guardar información del usuario en localStorage
            localStorage.setItem("usuario", JSON.stringify(data));

            setTimeout(() => {
                window.location.href = "Index.html";
            }, 1500);
        } else {
            showNotification(data.error || "Error al registrar usuario", "error");
        }
    } catch (error) {
        console.error("Error en registro:", error);
        showNotification("Error de conexión con el servidor. Verifica que el backend esté ejecutándose.", "error");
    } finally {
        submitBtn.textContent = "Crear Cuenta";
        submitBtn.disabled = false;
    }
}

// ==========================
// MODE SELECTION
// ==========================
function selectMode(mode) {
    const usuario = JSON.parse(localStorage.getItem("usuario") || "{}");
    usuario.mode = mode;
    localStorage.setItem("usuario", JSON.stringify(usuario));
    
    showNotification(`Modo ${mode} seleccionado`, "success");
    
    // Aquí puedes agregar la lógica para redirigir según el modo
    setTimeout(() => {
        if (mode === 'admin') {
            // Redirigir a panel de administrador
            window.location.href = "admin-dashboard.html";
        } else {
            // Redirigir a panel de usuario
            window.location.href = "user-dashboard.html";
        }
    }, 1500);
}

// ==========================
// Verificar estado del backend
// ==========================
async function checkBackendStatus() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/health`, {
            method: 'GET',
            headers: { "Content-Type": "application/json" }
        });
        
        if (response.ok) {
            console.log('✅ Backend conectado correctamente');
            return true;
        }
    } catch (error) {
        console.error('❌ Backend no disponible:', error);
        showNotification('El servidor no está disponible. Ejecuta "npm run dev" en la carpeta backend.', 'error');
        return false;
    }
}

// ==========================
// Inicialización
// ==========================
document.addEventListener("DOMContentLoaded", async () => {
    // Verificar estado del backend al cargar la página
    await checkBackendStatus();

    // Eventos del formulario de login
    const loginForm = document.querySelector("#login-form");
    if (loginForm) {
        loginForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handleLogin();
        });
    }

    // Eventos del formulario de registro
    const signupForm = document.querySelector("#signup-form");
    if (signupForm) {
        signupForm.addEventListener("submit", (e) => {
            e.preventDefault();
            handleSignup();
        });
    }
});