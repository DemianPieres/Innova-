const express = require('express');
const router = express.Router();
const {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats
} = require('../controllers/productController');

// Rutas públicas (sin autenticación)
router.get('/', getAllProducts);
router.get('/stats', getProductStats);
router.get('/:id', getProductById);

// Rutas para administración (sin autenticación por ahora, según requerimientos)
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;
