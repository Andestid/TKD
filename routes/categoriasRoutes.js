const express = require('express');
const router = express.Router();
const { getCategoriasPoomsae,
        getCategoriasCombate,
        getBracketsCategoria
} = require('../controllers/categoriasController');

router.get('/categoriaspoomsae', getCategoriasPoomsae);
router.get('/categoriascombate',getCategoriasCombate);
router.get('/brackets/:id_categoria',getBracketsCategoria);

module.exports = router;