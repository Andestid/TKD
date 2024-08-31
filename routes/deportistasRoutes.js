const express = require('express');
const router = express.Router();
const {
    getDeportistas,
    postDeportistas,
    verDeportistasPorCategoria,
    registrarGanador,
    inscribirDeportistaYCombate,
    inscribirDeportistaYPoomsae,
    generarBracketsParaTodasLasCategorias,
    getTopFourPositionsForAllCategories,
    deleteDeportistas,
    updateDeportista,
    generarRondasPoomsaeParaTodasLasCategorias,
    verRondasPoomsaeParaTodasLasCategorias,
    asignarPuntajePoomsae
    
} = require('../controllers/deportistasController');

router.get('/torneo', getDeportistas);
router.post('/torneo', postDeportistas);
router.get('/categorias/:id_categoriac/deportistas', verDeportistasPorCategoria);
router.post('/registrar_ganador', registrarGanador);
router.post('/inscribirdeportistacombate',inscribirDeportistaYCombate);
router.post('/inscribirdeportistapoomsae',inscribirDeportistaYPoomsae);
router.post('/brackets4all',generarBracketsParaTodasLasCategorias);
router.post('/winners',getTopFourPositionsForAllCategories);
router.post('/torneo/eliminar',deleteDeportistas);
router.put('/torneo/editar',updateDeportista);
router.post('/torneo/poomsae', generarRondasPoomsaeParaTodasLasCategorias);
router.post('/torneo/rondas',verRondasPoomsaeParaTodasLasCategorias);
router.post('/torneo/puntaje',asignarPuntajePoomsae);

module.exports = router;