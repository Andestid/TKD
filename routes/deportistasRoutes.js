const express = require('express');
const router = express.Router();
const {
    getDeportistas,
    postDeportistas,
    inscribirCombate,
    inscribirPoomsae,
    verDeportistasPorCategoria,
    generarBrackets,
    registrarGanador
    
} = require('../controllers/deportistasController');

router.get('/torneo', getDeportistas);
router.post('/torneo', postDeportistas);
router.post('/inscribircombate', inscribirCombate);
router.post('/inscribirpoomsae', inscribirPoomsae);
router.get('/categorias/:id_categoriac/deportistas', verDeportistasPorCategoria);
router.post('/brackets/:id_categoriac', generarBrackets);
router.post('/registrar_ganador', registrarGanador);

module.exports = router;