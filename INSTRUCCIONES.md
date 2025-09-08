# Instrucciones para Configurar el Proyecto

## Configuración del Backend

### 1. Crear archivo .env
Crea un archivo `.env` en la carpeta `backend` con el siguiente contenido:

```env
# MongoDB Connection
MONGO_URI=mongodb+srv://tu_usuario:tu_password@tu_cluster.mongodb.net/tu_database?retryWrites=true&w=majority

# Session Secret
SESSION_SECRET=tu_clave_secreta_muy_segura_aqui

# Frontend URL
FRONTEND_URL=http://localhost:5000

# Server Port
PORT=4000

# Environment
NODE_ENV=development
```

**Importante:** Reemplaza `tu_usuario`, `tu_password`, `tu_cluster` y `tu_database` con los valores reales de tu MongoDB Cloud.

### 2. Instalar dependencias del backend
```bash
cd backend
npm install
```

### 3. Ejecutar el backend
```bash
npm run dev
```

El backend estará disponible en `http://localhost:4000`

## Configuración del Frontend

### 1. Servir el frontend
Puedes usar cualquier servidor HTTP simple. Algunas opciones:

**Opción 1: Python (si tienes Python instalado)**
```bash
cd frontend
python -m http.server 5000
```

**Opción 2: Node.js (si tienes http-server instalado)**
```bash
cd frontend
npx http-server -p 5000
```

**Opción 3: Live Server (si usas VS Code)**
- Instala la extensión "Live Server"
- Click derecho en `Index.html` y selecciona "Open with Live Server"

El frontend estará disponible en `http://localhost:5000`

## Flujo de la Aplicación

1. **Registro**: El usuario va a `signup.html`, completa el formulario y se crea una cuenta en MongoDB
2. **Redirección automática**: Después del registro exitoso, se redirige a `Index.html` (login)
3. **Login**: El usuario ingresa sus credenciales en `Index.html`
4. **Validación**: Si las credenciales son correctas, se redirige a `mode-selection.html`
5. **Selección de modo**: El usuario elige entre modo Administrador o Usuario

## Características Implementadas

- ✅ Registro de usuarios con validación
- ✅ Login con validación de credenciales
- ✅ Almacenamiento seguro de contraseñas con bcrypt
- ✅ Sesiones con MongoDB
- ✅ Notificaciones visuales de éxito/error
- ✅ Redirección automática entre páginas
- ✅ Validación de formularios
- ✅ Interfaz responsive

## Estructura de la Base de Datos

La colección `users` en MongoDB tendrá la siguiente estructura:
```json
{
  "_id": "ObjectId",
  "email": "usuario@ejemplo.com",
  "passwordHash": "hash_bcrypt",
  "name": "Nombre del Usuario",
  "role": "user",
  "isActive": true,
  "failedLogins": 0,
  "lockedUntil": null,
  "lastLoginAt": "2025-01-27T...",
  "createdAt": "2025-01-27T...",
  "updatedAt": "2025-01-27T..."
}
```

## Solución de Problemas

### Error de CORS
Si ves errores de CORS, verifica que:
- El backend esté corriendo en puerto 4000
- El frontend esté corriendo en puerto 5000
- La variable `FRONTEND_URL` en `.env` sea correcta

### Error de conexión a MongoDB
Verifica que:
- La URL de MongoDB en `.env` sea correcta
- Tu IP esté en la whitelist de MongoDB Cloud
- Las credenciales sean correctas

### Error 404 en las rutas
Asegúrate de que:
- El backend esté corriendo
- Las rutas en `scripts.js` coincidan con las del backend
- No haya errores de sintaxis en el código
