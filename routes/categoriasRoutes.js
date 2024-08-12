const express = require('express');
const router = express.Router();
const { getCategoriasPoomsae } = require('../controllers/categoriasController');

router.get('/categoriaspoomsae', getCategoriasPoomsae);

module.exports = router;