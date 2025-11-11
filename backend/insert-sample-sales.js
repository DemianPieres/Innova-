require('dotenv').config();
const mongoose = require('mongoose');
const Sale = require('./src/models/sale');
const Product = require('./src/models/product');
const User = require('./src/models/user');

// Conexión a MongoDB
async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Conectado a MongoDB');
    } catch (error) {
        console.error('❌ Error conectando a MongoDB:', error);
        process.exit(1);
    }
}

// Función para generar datos de ventas de ejemplo
async function insertSampleSales() {
    try {
        // Obtener productos existentes
        const productos = await Product.find({ isActive: true });
        if (productos.length === 0) {
            console.log('❌ No hay productos disponibles. Ejecuta insert-sample-products.js primero.');
            return;
        }

        // Obtener usuarios existentes
        const usuarios = await User.find({});
        if (usuarios.length === 0) {
            console.log('❌ No hay usuarios disponibles. Ejecuta insert-sample-users.js primero.');
            return;
        }

        // Limpiar ventas existentes (opcional - comentar si quieres mantener las existentes)
        const ventasExistentes = await Sale.countDocuments();
        if (ventasExistentes > 0) {
            console.log(`📊 Ya existen ${ventasExistentes} ventas en la base de datos.`);
            console.log('💡 Si quieres insertar datos nuevos, ejecuta: node backend/delete-sales.js primero');
            return;
        }

        console.log('🚀 Insertando datos de ventas de ejemplo...');

        const ventasGeneradas = [];
        const fechaActual = new Date();
        const anioActual = fechaActual.getFullYear();
        
        // Generar ventas desde enero hasta octubre del año actual
        const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre'];
        const metodosPago = ['credit-card', 'debit-card', 'prepaid-card', 'paypal', 'apple-pay', 'google-pay', 'bank-transfer', 'bnpl', 'cash-on-delivery'];
        
        let numeroOrdenContador = 1000;

        for (let mes = 0; mes < 10; mes++) {
            const diasEnMes = new Date(anioActual, mes + 1, 0).getDate();
            // Generar entre 8 y 15 ventas por mes
            let ventasEnMes = Math.floor(Math.random() * 8) + 8;
            
            // Para los últimos meses (agosto, septiembre, octubre), generar más ventas
            if (mes >= 7) {
                ventasEnMes = Math.floor(Math.random() * 12) + 12;
            }

            for (let i = 0; i < ventasEnMes; i++) {
                // Fecha aleatoria del mes
                const dia = Math.floor(Math.random() * diasEnMes) + 1;
                const fechaVenta = new Date(anioActual, mes, dia, Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));

                // Seleccionar entre 1 y 4 productos aleatorios
                const numProductos = Math.floor(Math.random() * 4) + 1;
                const productosVenta = [];
                const productosUsados = new Set();

                for (let j = 0; j < numProductos; j++) {
                    let productoAleatorio;
                    do {
                        productoAleatorio = productos[Math.floor(Math.random() * productos.length)];
                    } while (productosUsados.has(productoAleatorio._id.toString()));
                    
                    productosUsados.add(productoAleatorio._id.toString());
                    
                    const cantidad = Math.floor(Math.random() * 3) + 1;
                    const subtotal = productoAleatorio.price * cantidad;
                    
                    productosVenta.push({
                        id: productoAleatorio._id.toString(),
                        nombre: productoAleatorio.name,
                        precio: productoAleatorio.price,
                        cantidad: cantidad,
                        subtotal: subtotal
                    });
                }

                const subtotal = productosVenta.reduce((sum, p) => sum + p.subtotal, 0);
                const envio = subtotal < 50000 ? 5000 : 0;
                const total = subtotal + envio;

                // Seleccionar usuario aleatorio
                const usuarioAleatorio = usuarios[Math.floor(Math.random() * usuarios.length)];
                
                // Seleccionar método de pago aleatorio
                const metodoPagoAleatorio = metodosPago[Math.floor(Math.random() * metodosPago.length)];

                const venta = {
                    numeroOrden: `V-${numeroOrdenContador}`,
                    cliente: {
                        nombre: usuarioAleatorio.name,
                        email: usuarioAleatorio.email,
                        telefono: `+54 9 11 ${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
                        direccion: {
                            calle: `Av. Ejemplo ${Math.floor(Math.random() * 9999)}`,
                            ciudad: 'Buenos Aires',
                            provincia: 'Buenos Aires',
                            codigoPostal: `${Math.floor(Math.random() * 9000) + 1000}`
                        }
                    },
                    productos: productosVenta,
                    totales: {
                        subtotal: subtotal,
                        envio: envio,
                        total: total
                    },
                    pago: {
                        metodo: metodoPagoAleatorio,
                        estado: 'aprobado',
                        fecha: fechaVenta,
                        referencia: `REF-${Math.floor(Math.random() * 999999)}`
                    },
                    estado: 'completado',
                    fechaCreacion: fechaVenta,
                    canal: Math.random() > 0.7 ? 'mobile' : 'web',
                    dispositivo: {
                        tipo: Math.random() > 0.5 ? 'desktop' : 'mobile',
                        userAgent: 'Sample Data Generator'
                    }
                };

                ventasGeneradas.push(venta);
                numeroOrdenContador++;
            }
        }

        // Generar ventas adicionales en los últimos 14 días para tener datos en el gráfico de ingresos diarios
        console.log('📅 Generando ventas recientes (últimos 14 días)...');
        const ventasRecientes = 20; // Generar ~20 ventas en los últimos 14 días

        for (let i = 0; i < ventasRecientes; i++) {
            // Fecha aleatoria en los últimos 14 días
            const diasAtras = Math.floor(Math.random() * 14);
            const fechaVenta = new Date(ahora);
            fechaVenta.setDate(fechaVenta.getDate() - diasAtras);
            fechaVenta.setHours(Math.floor(Math.random() * 12) + 8, Math.floor(Math.random() * 60));

            // Seleccionar entre 1 y 3 productos aleatorios
            const numProductos = Math.floor(Math.random() * 3) + 1;
            const productosVenta = [];
            const productosUsados = new Set();

            for (let j = 0; j < numProductos; j++) {
                let productoAleatorio;
                do {
                    productoAleatorio = productos[Math.floor(Math.random() * productos.length)];
                } while (productosUsados.has(productoAleatorio._id.toString()));
                
                productosUsados.add(productoAleatorio._id.toString());
                
                const cantidad = Math.floor(Math.random() * 2) + 1;
                const subtotal = productoAleatorio.price * cantidad;
                
                productosVenta.push({
                    id: productoAleatorio._id.toString(),
                    nombre: productoAleatorio.name,
                    precio: productoAleatorio.price,
                    cantidad: cantidad,
                    subtotal: subtotal
                });
            }

            const subtotal = productosVenta.reduce((sum, p) => sum + p.subtotal, 0);
            const envio = subtotal < 50000 ? 5000 : 0;
            const total = subtotal + envio;

            // Seleccionar usuario aleatorio
            const usuarioAleatorio = usuarios[Math.floor(Math.random() * usuarios.length)];
            
            // Seleccionar método de pago aleatorio
            const metodoPagoAleatorio = metodosPago[Math.floor(Math.random() * metodosPago.length)];

            const venta = {
                numeroOrden: `V-${numeroOrdenContador}`,
                cliente: {
                    nombre: usuarioAleatorio.name,
                    email: usuarioAleatorio.email,
                    telefono: `+54 9 11 ${Math.floor(Math.random() * 9000) + 1000}-${Math.floor(Math.random() * 9000) + 1000}`,
                    direccion: {
                        calle: `Av. Ejemplo ${Math.floor(Math.random() * 9999)}`,
                        ciudad: 'Buenos Aires',
                        provincia: 'Buenos Aires',
                        codigoPostal: `${Math.floor(Math.random() * 9000) + 1000}`
                    }
                },
                productos: productosVenta,
                totales: {
                    subtotal: subtotal,
                    envio: envio,
                    total: total
                },
                pago: {
                    metodo: metodoPagoAleatorio,
                    estado: 'aprobado',
                    fecha: fechaVenta,
                    referencia: `REF-${Math.floor(Math.random() * 999999)}`
                },
                estado: 'completado',
                fechaCreacion: fechaVenta,
                canal: Math.random() > 0.7 ? 'mobile' : 'web',
                dispositivo: {
                    tipo: Math.random() > 0.5 ? 'desktop' : 'mobile',
                    userAgent: 'Sample Data Generator'
                }
            };

            ventasGeneradas.push(venta);
            numeroOrdenContador++;
        }

        console.log(`✅ Se agregaron ${ventasRecientes} ventas recientes`);

        // Insertar ventas en lotes
        const batchSize = 50;
        for (let i = 0; i < ventasGeneradas.length; i += batchSize) {
            const batch = ventasGeneradas.slice(i, i + batchSize);
            await Sale.insertMany(batch);
            console.log(`✅ Insertadas ${Math.min(i + batchSize, ventasGeneradas.length)} de ${ventasGeneradas.length} ventas`);
        }

        console.log(`\n🎉 ¡Ventas insertadas exitosamente! Total: ${ventasGeneradas.length}`);
        console.log(`📊 Período: Enero - Octubre ${anioActual}`);
        
        // Mostrar estadísticas
        const estadisticas = await Sale.aggregate([
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m', date: '$fechaCreacion' } },
                    ventas: { $sum: 1 },
                    ingresos: { $sum: '$totales.total' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        console.log('\n📈 Resumen por mes:');
        estadisticas.forEach(stat => {
            console.log(`   ${stat._id}: ${stat.ventas} ventas - $${stat.ingresos.toLocaleString('es-AR')}`);
        });

    } catch (error) {
        console.error('❌ Error insertando ventas:', error);
    }
}

// Ejecutar
async function main() {
    await connectDB();
    await insertSampleSales();
    await mongoose.connection.close();
    console.log('\n✅ Proceso completado');
    process.exit(0);
}

main();


