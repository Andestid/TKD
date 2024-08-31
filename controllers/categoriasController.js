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

                function calculateRoundId(numParticipantes) {
                    // Ajusta los tamaños según tus necesidades
                    const tamaños = [2, 4, 8, 16, 32];
                    const indice = tamaños.findIndex(t => numParticipantes <= t);
                    return indice;
                }

                // Estructura del JSON ajustada a las interfaces
                const jsonResponse = {
                    participant: deportistas.map((deportista, index) => ({
                        id: index,
                        tournament_id: id_categoria,
                        name: deportista.nombre
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
                    group: [{
                        id: 0,
                        stage_id: 0,
                        number: 1 // Puedes ajustar según la lógica que manejes
                    }],
                    round: combates.reduce((rounds, combate) => {
                        const roundId = calculateRoundId(deportistas.length);
                        rounds.push({
                            id: rounds.length,
                            stage_id: 0,
                            group_id: 0,
                            number: roundId
                        });
                        return rounds;
                    }, []),
                    match: combates.map((combate, index) => {
                        const participanteIndex1 = deportistas.findIndex(d => d.id_deportista === combate.id_jugador_1);
                        const participanteIndex2 = deportistas.findIndex(d => d.id_deportista === combate.id_jugador_2);
    
                        return {
                            id: index,
                            stage_id: 0,
                            group_id: 0,
                            round_id: calculateRoundId(deportistas.length),
                            number: index % deportistas.length, // Número de match dentro del round
                            child_count: 0,
                            status: 5,
                            opponent1: {
                                id: combate.id_jugador_1,
                                position: participanteIndex1
                            },
                            opponent2: {
                                id: combate.id_jugador_2,
                                position: participanteIndex2
                            }
                        };
                    }),
                    match_game: [] // Si tienes sub-partidos, puedes manejarlos aquí
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