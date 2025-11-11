const express = require('express');
const router = express.Router();
const {
  crearVenta,
  obtenerVentas,
  obtenerVentaPorId,
  obtenerVentaPorNumeroOrden,
  actualizarEstadoVenta,
  obtenerEstadisticas,
  obtenerProductosMasVendidos,
  obtenerVentasPorPeriodo,
  obtenerEstadisticasDashboard
} = require('../controllers/saleController');

// ===== RUTAS DE VENTAS =====

// Crear nueva venta
router.post('/', crearVenta);

// Obtener todas las ventas (con filtros y paginación)
router.get('/', obtenerVentas);

// Obtener venta por ID
router.get('/:id', obtenerVentaPorId);

// Obtener venta por número de orden
router.get('/orden/:numeroOrden', obtenerVentaPorNumeroOrden);

// Actualizar estado de venta
router.put('/:id/estado', actualizarEstadoVenta);

// ===== RUTAS DE ANALYTICS =====

// Obtener estadísticas generales
router.get('/analytics/estadisticas', obtenerEstadisticas);

// Obtener productos más vendidos
router.get('/analytics/productos-mas-vendidos', obtenerProductosMasVendidos);

// Obtener ventas por período
router.get('/analytics/ventas-por-periodo', obtenerVentasPorPeriodo);

// Obtener estadísticas para dashboard
router.get('/analytics/dashboard', obtenerEstadisticasDashboard);

module.exports = router;
