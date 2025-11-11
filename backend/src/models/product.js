const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true, 
    trim: true 
  },
  description: { 
    type: String, 
    required: true 
  },
  price: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  originalPrice: { 
    type: Number, 
    min: 0 
  },
  category: { 
    type: String, 
    required: true,
    enum: ['asientos', 'volantes', 'electronica', 'suspension', 'accesorios', 'otros']
  },
  stock: { 
    type: Number, 
    required: true, 
    min: 0, 
    default: 0 
  },
  image: { 
    type: String, 
    required: true 
  },
  isActive: { 
    type: Boolean, 
    default: true 
  },
  rating: { 
    type: Number, 
    min: 0, 
    max: 5, 
    default: 5 
  },
  ratingCount: { 
    type: Number, 
    min: 0, 
    default: 0 
  },
  discount: { 
    type: Number, 
    min: 0, 
    max: 100, 
    default: 0 
  },
  tags: [{ 
    type: String 
  }],
  featured: { 
    type: Boolean, 
    default: false 
  }
}, { 
  timestamps: true 
});

// Índices para mejorar las consultas
productSchema.index({ name: 'text', description: 'text' });
productSchema.index({ category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ isActive: 1 });

module.exports = mongoose.model('Product', productSchema);
