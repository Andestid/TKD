const express = require('express');
const router = express.Router();
const {
    getDeportistas,
    postDeportistas,
    inscribirCombate,
    inscribirPoomsae,
    verDeportistasPorCategoria
} = require('../controllers/deportistasController');

router.get('/torneo', getDeportistas);
router.post('/torneo', postDeportistas);
router.post('/inscribircombate', inscribirCombate);
router.post('/inscribirpoomsae', inscribirPoomsae);
router.get('/categorias/:id_categoriac/deportistas', verDeportistasPorCategoria);

module.exports = router;