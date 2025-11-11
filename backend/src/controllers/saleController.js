const Sale = require('../models/sale');
const Product = require('../models/product');

// ===== CONTROLADOR DE VENTAS =====

// Crear nueva venta
const crearVenta = async (req, res) => {
  try {
    console.log('💳 Creando nueva venta...');
    
    // Validar datos requeridos
    const { numeroOrden, cliente, productos, totales, pago } = req.body;
    
    if (!numeroOrden || !cliente || !productos || !totales || !pago) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos requeridos para crear la venta'
      });
    }

    // Verificar que los productos existan y tengan stock
    for (const productoVenta of productos) {
      const producto = await Product.findById(productoVenta.id);
      
      if (!producto) {
        return res.status(400).json({
          success: false,
          message: `Producto con ID ${productoVenta.id} no encontrado`
        });
      }
      
      if (producto.stock < productoVenta.cantidad) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${producto.name}. Disponible: ${producto.stock}`
        });
      }
    }

    // Crear la venta
    const nuevaVenta = new Sale({
      numeroOrden,
      cliente,
      productos,
      totales,
      pago,
      estado: 'completado', // En simulación siempre es exitosa
      canal: req.body.canal || 'web',
      dispositivo: req.body.dispositivo || {}
    });

    const ventaGuardada = await nuevaVenta.save();

    // Actualizar stock de productos
    for (const productoVenta of productos) {
      await Product.findByIdAndUpdate(
        productoVenta.id,
        { $inc: { stock: -productoVenta.cantidad } }
      );
    }

    console.log('✅ Venta creada exitosamente:', ventaGuardada.numeroOrden);

    res.status(201).json({
      success: true,
      message: 'Venta creada exitosamente',
      data: ventaGuardada
    });

  } catch (error) {
    console.error('❌ Error creando venta:', error);
    
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'El número de orden ya existe'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener todas las ventas
const obtenerVentas = async (req, res) => {
  try {
    const { 
      pagina = 1, 
      limite = 10, 
      estado, 
      fechaInicio, 
      fechaFin,
      ordenarPor = 'fechaCreacion',
      orden = 'desc'
    } = req.query;

    // Construir filtros
    const filtros = {};
    
    if (estado) {
      filtros.estado = estado;
    }
    
    if (fechaInicio || fechaFin) {
      filtros.fechaCreacion = {};
      if (fechaInicio) filtros.fechaCreacion.$gte = new Date(fechaInicio);
      if (fechaFin) filtros.fechaCreacion.$lte = new Date(fechaFin);
    }

    // Configurar ordenamiento
    const ordenamiento = {};
    ordenamiento[ordenarPor] = orden === 'desc' ? -1 : 1;

    // Ejecutar consulta con paginación
    const ventas = await Sale.find(filtros)
      .sort(ordenamiento)
      .limit(limite * 1)
      .skip((pagina - 1) * limite)
      .lean();

    const totalVentas = await Sale.countDocuments(filtros);

    res.json({
      success: true,
      data: ventas,
      paginacion: {
        pagina: parseInt(pagina),
        limite: parseInt(limite),
        total: totalVentas,
        paginas: Math.ceil(totalVentas / limite)
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo ventas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener venta por ID
const obtenerVentaPorId = async (req, res) => {
  try {
    const { id } = req.params;
    
    const venta = await Sale.findById(id);
    
    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      data: venta
    });

  } catch (error) {
    console.error('❌ Error obteniendo venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener venta por número de orden
const obtenerVentaPorNumeroOrden = async (req, res) => {
  try {
    const { numeroOrden } = req.params;
    
    const venta = await Sale.findOne({ numeroOrden });
    
    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      data: venta
    });

  } catch (error) {
    console.error('❌ Error obteniendo venta por número de orden:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Actualizar estado de venta
const actualizarEstadoVenta = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado, notas } = req.body;

    if (!estado) {
      return res.status(400).json({
        success: false,
        message: 'El estado es requerido'
      });
    }

    const venta = await Sale.findByIdAndUpdate(
      id,
      { 
        estado,
        notas: notas || undefined,
        fechaActualizacion: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!venta) {
      return res.status(404).json({
        success: false,
        message: 'Venta no encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Estado de venta actualizado',
      data: venta
    });

  } catch (error) {
    console.error('❌ Error actualizando estado de venta:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// ===== ANALYTICS Y ESTADÍSTICAS =====

// Obtener estadísticas generales
const obtenerEstadisticas = async (req, res) => {
  try {
    const { fechaInicio, fechaFin } = req.query;
    
    const filtros = {};
    if (fechaInicio || fechaFin) {
      filtros.fechaCreacion = {};
      if (fechaInicio) filtros.fechaCreacion.$gte = new Date(fechaInicio);
      if (fechaFin) filtros.fechaCreacion.$lte = new Date(fechaFin);
    }

    const estadisticas = await Sale.obtenerEstadisticas(filtros);
    
    // Obtener estadísticas adicionales
    const ventasPorEstado = await Sale.aggregate([
      { $match: filtros },
      { $group: { _id: '$estado', count: { $sum: 1 } } }
    ]);

    const ventasPorMetodoPago = await Sale.aggregate([
      { $match: filtros },
      { $group: { _id: '$pago.metodo', count: { $sum: 1 } } }
    ]);

    res.json({
      success: true,
      data: {
        ...estadisticas,
        ventasPorEstado,
        ventasPorMetodoPago
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener productos más vendidos
const obtenerProductosMasVendidos = async (req, res) => {
  try {
    const { limite = 10, fechaInicio, fechaFin } = req.query;
    
    const filtros = {};
    if (fechaInicio || fechaFin) {
      filtros.fechaCreacion = {};
      if (fechaInicio) filtros.fechaCreacion.$gte = new Date(fechaInicio);
      if (fechaFin) filtros.fechaCreacion.$lte = new Date(fechaFin);
    }

    const productosMasVendidos = await Sale.obtenerProductosMasVendidos(
      parseInt(limite), 
      filtros
    );

    res.json({
      success: true,
      data: productosMasVendidos
    });

  } catch (error) {
    console.error('❌ Error obteniendo productos más vendidos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener ventas por período
const obtenerVentasPorPeriodo = async (req, res) => {
  try {
    const { 
      fechaInicio, 
      fechaFin, 
      agrupacion = 'dia' 
    } = req.query;

    if (!fechaInicio || !fechaFin) {
      return res.status(400).json({
        success: false,
        message: 'fechaInicio y fechaFin son requeridos'
      });
    }

    const ventasPorPeriodo = await Sale.obtenerVentasPorPeriodo(
      fechaInicio, 
      fechaFin, 
      agrupacion
    );

    res.json({
      success: true,
      data: ventasPorPeriodo
    });

  } catch (error) {
    console.error('❌ Error obteniendo ventas por período:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Obtener estadísticas para dashboard
const obtenerEstadisticasDashboard = async (req, res) => {
  try {
    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const inicioSemana = new Date(ahora.setDate(ahora.getDate() - ahora.getDay()));
    const inicioDia = new Date(ahora.setHours(0, 0, 0, 0));

    // Estadísticas del día
    const estadisticasDia = await Sale.obtenerEstadisticas({
      fechaCreacion: { $gte: inicioDia }
    });

    // Estadísticas de la semana
    const estadisticasSemana = await Sale.obtenerEstadisticas({
      fechaCreacion: { $gte: inicioSemana }
    });

    // Estadísticas del mes
    const estadisticasMes = await Sale.obtenerEstadisticas({
      fechaCreacion: { $gte: inicioMes }
    });

    // Estadísticas totales
    const estadisticasTotales = await Sale.obtenerEstadisticas({});

    // Productos más vendidos del mes
    const productosMasVendidos = await Sale.obtenerProductosMasVendidos(5, {
      fechaCreacion: { $gte: inicioMes }
    });

    // Ventas por día de la semana actual
    const ventasPorDia = await Sale.obtenerVentasPorPeriodo(
      inicioSemana.toISOString(),
      ahora.toISOString(),
      'dia'
    );

    res.json({
      success: true,
      data: {
        dia: estadisticasDia,
        semana: estadisticasSemana,
        mes: estadisticasMes,
        totales: estadisticasTotales,
        productosMasVendidos,
        ventasPorDia
      }
    });

  } catch (error) {
    console.error('❌ Error obteniendo estadísticas del dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  crearVenta,
  obtenerVentas,
  obtenerVentaPorId,
  obtenerVentaPorNumeroOrden,
  actualizarEstadoVenta,
  obtenerEstadisticas,
  obtenerProductosMasVendidos,
  obtenerVentasPorPeriodo,
  obtenerEstadisticasDashboard
};
