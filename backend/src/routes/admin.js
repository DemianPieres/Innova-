const express = require('express');
const router = express.Router();
// const { requireAuth } = require('../middleware/auth'); // Temporalmente deshabilitado
const adminController = require('../controllers/adminController');

// Temporalmente deshabilitado para pruebas
// router.use(requireAuth);

// Rutas de administración de usuarios
router.get('/users', adminController.getAllUsers);
router.get('/users/:id', adminController.getUserById);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;