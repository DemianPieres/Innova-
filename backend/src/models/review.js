const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  product: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  userName: { 
    type: String, 
    required: true,
    trim: true 
  },
  userEmail: { 
    type: String,
    trim: true
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    trim: true,
    maxlength: [500, 'El comentario no puede exceder 500 caracteres']
  },
  isModerated: { 
    type: Boolean, 
    default: false 
  },
  isApproved: { 
    type: Boolean, 
    default: true 
  }
}, { 
  timestamps: true 
});

reviewSchema.index({ product: 1 });
reviewSchema.index({ user: 1 });

module.exports = mongoose.model('Review', reviewSchema);
