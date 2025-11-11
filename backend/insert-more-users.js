require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
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

// Generar usuarios con fechas distribuidas en las últimas 8 semanas
async function insertMoreUsers() {
    try {
        console.log('🚀 Insertando usuarios adicionales...');

        // Verificar usuarios existentes
        const usuariosExistentes = await User.countDocuments();
        console.log(`📊 Usuarios existentes: ${usuariosExistentes}`);

        // Nombres y apellidos para generar nombres aleatorios
        const nombres = ['Juan', 'María', 'Carlos', 'Ana', 'Luis', 'Carmen', 'Pedro', 'Laura', 'José', 'Sofía', 'Miguel', 'Elena', 'Francisco', 'Isabel', 'Diego', 'Patricia', 'Ricardo', 'Mónica', 'Roberto', 'Gabriela', 'Fernando', 'Alejandra', 'Sergio', 'Lucía', 'Antonio', 'Daniela', 'Javier', 'Andrea', 'Manuel', 'Marina', 'David', 'Cristina', 'Pablo', 'Natalia', 'Rafael', 'Valentina'];
        const apellidos = ['García', 'Rodríguez', 'González', 'Fernández', 'López', 'Martínez', 'Sánchez', 'Pérez', 'Gómez', 'Martín', 'Jiménez', 'Ruiz', 'Hernández', 'Díaz', 'Moreno', 'Muñoz', 'Álvarez', 'Romero', 'Alonso', 'Navarro', 'Torres', 'Domínguez', 'Ramos', 'Gil', 'Vázquez', 'Ramírez', 'Serrano', 'Blanco', 'Suárez', 'Molina', 'Morales', 'Delgado', 'Castro', 'Ortiz', 'Rubio', 'Marín'];

        const nuevosUsuarios = [];
        const ahora = new Date();
        
        // Generar 50-80 usuarios con fechas distribuidas en las últimas 8 semanas
        const cantidadUsuarios = Math.floor(Math.random() * 31) + 50; // Entre 50 y 80 usuarios
        
        console.log(`📝 Generando ${cantidadUsuarios} usuarios nuevos...`);

        for (let i = 0; i < cantidadUsuarios; i++) {
            // Nombre aleatorio
            const nombreAleatorio = nombres[Math.floor(Math.random() * nombres.length)];
            const apellidoAleatorio = apellidos[Math.floor(Math.random() * apellidos.length)];
            
            // Email único
            const email = `${nombreAleatorio.toLowerCase()}.${apellidoAleatorio.toLowerCase()}${i}${Math.floor(Math.random() * 1000)}@gmail.com`;
            
            // Fecha aleatoria en las últimas 8 semanas
            const semanasAtras = Math.floor(Math.random() * 8);
            const diasAdicionales = Math.floor(Math.random() * 7);
            const horasAdicionales = Math.floor(Math.random() * 24);
            
            const fechaCreacion = new Date(ahora);
            fechaCreacion.setDate(fechaCreacion.getDate() - (semanasAtras * 7 + diasAdicionales));
            fechaCreacion.setHours(horasAdicionales, Math.floor(Math.random() * 60), Math.floor(Math.random() * 60));

            const passwordHash = await bcrypt.hash('password123', 12);

            const usuario = {
                name: `${nombreAleatorio} ${apellidoAleatorio}`,
                email: email,
                passwordHash: passwordHash,
                isActive: true,
                failedLogins: 0,
                createdAt: fechaCreacion,
                updatedAt: fechaCreacion
            };

            nuevosUsuarios.push(usuario);
        }

        // Insertar usuarios en la base de datos
        await User.insertMany(nuevosUsuarios);
        
        console.log(`✅ ${nuevosUsuarios.length} usuarios insertados exitosamente`);

        // Mostrar estadísticas por semana
        const usuariosTotales = await User.countDocuments();
        console.log(`\n📊 Total de usuarios en la base de datos: ${usuariosTotales}`);

        console.log('\n📈 Usuarios por semana (últimas 8 semanas):');
        for (let semana = 7; semana >= 0; semana--) {
            const fechaInicioSemana = new Date(ahora);
            fechaInicioSemana.setDate(fechaInicioSemana.getDate() - ((semana + 1) * 7));
            const fechaFinSemana = new Date(ahora);
            fechaFinSemana.setDate(fechaFinSemana.getDate() - (semana * 7));

            const count = await User.countDocuments({
                createdAt: {
                    $gte: fechaInicioSemana,
                    $lt: fechaFinSemana
                }
            });

            console.log(`   Semana ${8 - semana}: ${count} usuarios`);
        }

        console.log('\n🔑 Credenciales de ejemplo para login:');
        console.log('   Email: (cualquier email generado)');
        console.log('   Password: password123');
        console.log('\n🎉 ¡Proceso completado exitosamente!');

    } catch (error) {
        console.error('❌ Error insertando usuarios:', error);
    }
}

// Ejecutar
async function main() {
    await connectDB();
    await insertMoreUsers();
    await mongoose.connection.close();
    console.log('\n✅ Conexión cerrada');
    process.exit(0);
}

main();


