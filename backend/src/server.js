require('dotenv').config();
const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');

// ==================== DEBUG: HABILITAR LOGS DETALLADOS ====================
console.log('🔍 Iniciando servidor con logs detallados...');
console.log('📋 Variables de entorno cargadas:');
console.log('   PORT:', process.env.PORT);
console.log('   NODE_ENV:', process.env.NODE_ENV);
console.log('   MONGO_URI:', process.env.MONGO_URI ? '✅ Presente' : '❌ Faltante');
console.log('   SESSION_SECRET:', process.env.SESSION_SECRET ? '✅ Presente' : '❌ Faltante');

// Habilitar logs detallados de Mongoose
mongoose.set('debug', true);
mongoose.set('strictQuery', false);

// Log middleware para ver todas las requests
const requestLogger = (req, res, next) => {
    console.log('📨 Request:', {
        method: req.method,
        url: req.url,
        body: req.body,
        time: new Date().toISOString()
    });
    next();
};

const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 4000;

// Middlewares
app.use(requestLogger); // ← Agregar este middleware para loggear requests
app.use(helmet());
app.use(express.json());
app.use(cookieParser());
app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

// Rate limiter
app.use(rateLimit({ 
    windowMs: 15 * 60 * 1000, 
    max: 200 
}));

// Session middleware
app.use(session({
    name: 'sid',
    secret: process.env.SESSION_SECRET || 'fallback_secret_usa_una_clave_real_en_env',
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({ 
        mongoUrl: process.env.MONGO_URI,
        collectionName: 'sessions'
    }),
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 24
    }
}));

// Routes
app.use('/api/auth', authRoutes);

// Ruta de prueba de salud
app.get('/api/health', (req, res) => {
    console.log('✅ Health check recibido');
    res.json({ 
        message: 'Server is running', 
        timestamp: new Date().toISOString(),
        database: mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected'
    });
});

// Ruta de prueba para registro
app.post('/api/test/register', async (req, res) => {
    console.log('🧪 Test register endpoint hit', req.body);
    try {
        // Simular una respuesta exitosa para testing
        res.json({ 
            success: true, 
            message: 'Test endpoint working',
            dataReceived: req.body 
        });
    } catch (error) {
        console.error('❌ Test error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Manejo de errores
// Manejo de errores
app.use((err, req, res, next) => {
  console.error('🔥 Error no manejado:', err);
  res.status(500).json({ 
      error: 'Error interno del servidor',
      message: err.message 
  });
});

// ✅ Ruta 404 CORREGIDA para Express 5 (sin '*')
app.use((req, res) => {
  console.log('❌ Ruta no encontrada:', req.originalUrl);
  res.status(404).json({ error: 'Ruta no encontrada' });
});

// Conexión a MongoDB
async function connectDB() {
    try {
        console.log('🔄 Intentando conectar a MongoDB...');
        const uri = process.env.MONGO_URI;
        
        if (!uri) {
            throw new Error('❌ MONGO_URI no definido en .env');
        }

        console.log('🔗 URI de MongoDB:', uri);
        
        await mongoose.connect(uri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ MongoDB conectado exitosamente');
        
    } catch (error) {
        console.error('❌ Error crítico conectando a MongoDB:');
        console.error('   - Mensaje:', error.message);
        console.error('   - Code:', error.code);
        console.error('   - Name:', error.name);
        
        if (error.code === 'ENOTFOUND') {
            console.error('   🔍 Problema de DNS - verifica la URL de MongoDB');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('   ⏰ Timeout - verifica tu conexión a internet');
        }
        
        process.exit(1);
    }
}

// Iniciar servidor
async function startServer() {
    try {
        await connectDB();
        
        app.listen(PORT, () => {
            console.log('\n🎉 ====================================');
            console.log('✅ Servidor ejecutándose en http://localhost:' + PORT);
            console.log('🔍 Health check: http://localhost:' + PORT + '/api/health');
            console.log('🧪 Test endpoint: http://localhost:' + PORT + '/api/test/register');
            console.log('====================================\n');
        });
        
    } catch (error) {
        console.error('❌ Error fatal al iniciar el servidor:', error);
        process.exit(1);
    }
}

// Manejar cierre graceful
process.on('SIGINT', async () => {
    console.log('\n🛑 Cerrando servidor...');
    await mongoose.connection.close();
    process.exit(0);
});

startServer();