const express = require('express');
const router = express.Router();
const {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  moderateReview
} = require('../controllers/reviewController');

// Rutas públicas
router.get('/product/:productId', getProductReviews);
router.post('/product/:productId', createReview);

// Editar y eliminar (por ID de reseña)
router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);

// Moderación (admin)
router.patch('/:reviewId/moderate', moderateReview);

module.exports = router;
