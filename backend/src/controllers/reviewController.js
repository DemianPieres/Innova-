const Review = require('../models/review');
const Product = require('../models/product');

// Obtener reseñas de un producto
const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const reviews = await Review.find({ 
      product: productId, 
      isApproved: true 
    })
      .sort({ createdAt: -1 })
      .lean();

    const product = await Product.findById(productId).select('rating ratingCount');
    const avgRating = product ? product.rating : 0;
    const totalReviews = product ? product.ratingCount : 0;

    res.json({
      success: true,
      data: reviews,
      stats: { avgRating, totalReviews }
    });
  } catch (error) {
    console.error('Error obteniendo reseñas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Publicar reseña
const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { userName, userEmail, rating, comment } = req.body;

    if (!userName || !rating) {
      return res.status(400).json({
        success: false,
        message: 'Nombre y calificación son requeridos'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: 'La calificación debe ser entre 1 y 5'
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    const review = new Review({
      product: productId,
      userName: userName.trim(),
      userEmail: (userEmail || '').trim(),
      rating,
      comment: (comment || '').trim()
    });

    await review.save();

    // Actualizar rating promedio del producto
    await actualizarRatingProducto(productId);

    res.status(201).json({
      success: true,
      message: 'Reseña publicada correctamente',
      data: review
    });
  } catch (error) {
    console.error('Error creando reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Editar reseña
const updateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada'
      });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({
          success: false,
          message: 'La calificación debe ser entre 1 y 5'
        });
      }
      review.rating = rating;
    }
    if (comment !== undefined) review.comment = comment.trim();

    await review.save();
    await actualizarRatingProducto(review.product);

    res.json({
      success: true,
      message: 'Reseña actualizada',
      data: review
    });
  } catch (error) {
    console.error('Error actualizando reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar reseña
const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findByIdAndDelete(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada'
      });
    }

    await actualizarRatingProducto(review.product);

    res.json({
      success: true,
      message: 'Reseña eliminada'
    });
  } catch (error) {
    console.error('Error eliminando reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Moderar reseña (aprobar/rechazar)
const moderateReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isApproved } = req.body;

    const review = await Review.findByIdAndUpdate(
      reviewId,
      { isModerated: true, isApproved: isApproved !== false },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Reseña no encontrada'
      });
    }

    await actualizarRatingProducto(review.product);

    res.json({
      success: true,
      message: 'Reseña moderada',
      data: review
    });
  } catch (error) {
    console.error('Error moderando reseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

async function actualizarRatingProducto(productId) {
  const reviews = await Review.find({ product: productId, isApproved: true });
  const count = reviews.length;
  const avg = count > 0
    ? reviews.reduce((s, r) => s + r.rating, 0) / count
    : 5;

  await Product.findByIdAndUpdate(productId, {
    rating: Math.round(avg * 10) / 10,
    ratingCount: count
  });
}

module.exports = {
  getProductReviews,
  createReview,
  updateReview,
  deleteReview,
  moderateReview
};
