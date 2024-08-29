const { connection } = require("../db.js");

const getCategoriasPoomsae = (request, response) => {
    connection.query("SELECT * FROM categorias_poomsae",
        (error, results) => {
            if (error) {
                response.sendResponse({
                    statusCode: 500,
                    message: "Error al obtener las categorías combate",
                    error: error.message
                });
            } else {
                response.sendResponse({
                    statusCode: 200,
                    message: "Categorías combate obtenidas con éxito",
                    data: results
                });
            }
        });
};

const getCategoriasCombate = (request, response) => {
    connection.query("SELECT * FROM categorias_combate",
        (error, results) => {
            if (error) {
                response.sendResponse({
                    statusCode: 500,
                    message: "Error al obtener las categorías combate",
                    error: error.message
                });
            } else {
                response.sendResponse({
                    statusCode: 200,
                    message: "Categorías combate obtenidas con éxito",
                    data: results
                });
            }
        });
};

const getBracketsCategoria = (request, response) => {
    const { id_categoria } = request.params;

    connection.query("SELECT nombre FROM categorias_combate WHERE id_categoriac = ?", [id_categoria], (error, categoria) => {
        if (error || categoria.length === 0) {
            return response.status(500).json({
                statusCode: 500,
                message: "Error al obtener la categoría",
                error: error ? error.message : "Categoría no encontrada"
            });
        }

        connection.query(`
            SELECT deportista.id_deportista, deportista.nombre 
            FROM inscritos_combate 
            JOIN deportista ON inscritos_combate.id_deportista = deportista.id_deportista 
            WHERE inscritos_combate.id_categoriac = ?
        `, [id_categoria], (error, deportistas) => {
            if (error) {
                return response.status(500).json({
                    statusCode: 500,
                    message: "Error al obtener los deportistas",
                    error: error.message
                });
            }

            connection.query("SELECT * FROM combate WHERE id_categoria = ?", [id_categoria], (error, combates) => {
                if (error) {
                    return response.status(500).json({
                        statusCode: 500,
                        message: "Error al obtener los combates",
                        error: error.message
                    });
                }

                // Estructura del JSON ajustada al formato requerido
                const jsonResponse = {
                    participant: deportistas.map((deportista, index) => ({
                        id: index,
                        tournament_id: 0,
                        name: `Team ${index + 1}`
                    })),
                    stage: [
                        {
                            id: 0,
                            tournament_id: 0,
                            name: "copa sunbae",
                            type: "single_elimination",
                            number: 1,
                            settings: {
                                seedOrdering: ["natural"],
                                consolationFinal: true,
                                size: deportistas.length,
                                matchesChildCount: 0
                            }
                        }
                    ],
                    group: [
                        { id: 0, stage_id: 0, number: 1 },
                        { id: 1, stage_id: 0, number: 2 }
                    ],
                    round: combates.reduce((rounds, combate, index) => {
                        const roundNumber = combate.round - 1;
                        if (!rounds.some(round => round.number === roundNumber)) {
                            rounds.push({
                                id: rounds.length,
                                number: roundNumber + 1,
                                stage_id: 0,
                                group_id: 0
                            });
                        }
                        return rounds;
                    }, []).concat({
                        id: combates.length, // Ajustar el ID para el último grupo adicional
                        number: 1,
                        stage_id: 0,
                        group_id: 1
                    }),
                    match: combates.map((combate, index) => ({
                        id: index,
                        number: combate.round,
                        stage_id: 0,
                        group_id: 0,
                        round_id: combate.round - 1,
                        child_count: 0,
                        status: combate.id_jugador_1 && combate.id_jugador_2 ? 2 : 0,
                        opponent1: {
                            id: combate.id_jugador_1 ? combate.id_jugador_1 - 43 : null, // Ajuste según IDs de deportistas
                            position: 1
                        },
                        opponent2: {
                            id: combate.id_jugador_2 ? combate.id_jugador_2 - 43 : null, // Ajuste según IDs de deportistas
                            position: 2
                        }
                    })).concat([{
                        id: combates.length,
                        number: 1,
                        stage_id: 0,
                        group_id: 1,
                        round_id: combates.length,
                        child_count: 0,
                        status: 0,
                        opponent1: { id: null, position: 1 },
                        opponent2: { id: null, position: 2 }
                    }]),
                    match_game: []
                };

                response.status(200).json({
                    statusCode: 200,
                    message: "Brackets obtenidos con éxito",
                    data: jsonResponse
                });
            });
        });
    });
};

module.exports = {
    getCategoriasPoomsae,
    getCategoriasCombate,
    getBracketsCategoria
};