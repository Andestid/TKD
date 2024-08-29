const express = require('express');
const router = express.Router();
const {
    getDeportistas,
    postDeportistas,
    verDeportistasPorCategoria,
    generarBrackets,
    registrarGanador,
    inscribirDeportistaYCombate,
    inscribirDeportistaYPoomsae,
    generarBracketsParaTodasLasCategorias,
    getTopFourPositions,
    deleteDeportistas
    
} = require('../controllers/deportistasController');

router.get('/torneo', getDeportistas);
router.post('/torneo', postDeportistas);
router.get('/categorias/:id_categoriac/deportistas', verDeportistasPorCategoria);
router.post('/brackets/:id_categoriac', generarBrackets);
router.post('/registrar_ganador', registrarGanador);
router.post('/inscribirdeportistacombate',inscribirDeportistaYCombate);
router.post('/inscribirdeportistapoomsae',inscribirDeportistaYPoomsae);
router.post('/brackets4all',generarBracketsParaTodasLasCategorias);
router.post('/winners/:id_categoriac',getTopFourPositions);
router.post('/torneo/eliminar',deleteDeportistas);

module.exports = router;