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

                // Estructura del JSON ajustada a las interfaces
                const jsonResponse = {
                    participant: deportistas.map(deportista => ({
                        id: deportista.id_deportista,
                        tournament_id: id_categoria,
                        name: deportista.nombre
                    })),
                    stage: [
                        {
                            id: 0, // Asignar ID correcto
                            tournament_id: 0, // Asignar ID correcto
                            name: categoria[0].nombre,
                            type: "single_elimination",
                            number: 1, // Asignar número según el torneo
                            settings: {
                                seedOrdering: ["natural"],
                                consolationFinal: true,
                                size: deportistas.length,
                                matchesChildCount: combates.length // Cantidad de combates en esta etapa
                            }
                        }
                    ],
                    group: [{
                        id: 0, // Asignar ID correcto
                        stage_id: 0, // Asignar el `stage_id` relacionado
                        number: 1 // Asignar según la lógica del grupo
                    }],
                    round: combates.reduce((rounds, combate) => {
                        const roundNumber = combate.round;
                        if (!rounds.some(round => round.number === roundNumber)) {
                            rounds.push({
                                id: rounds.length, // Incremental para ser único
                                stage_id: 0, // Asignar el `stage_id` relacionado
                                group_id: 0, // Asignar el `group_id` relacionado
                                number: roundNumber
                            });
                        }
                        return rounds;
                    }, []),
                    match: combates.map((combate, index) => ({
                        id: combate.id_combate,
                        stage_id: 0, // Asignar el `stage_id` relacionado
                        group_id: 0, // Asignar el `group_id` relacionado
                        round_id: combate.round, // Asignar el `round_id` correspondiente
                        number: index + 1, // Número del combate dentro de la ronda
                        child_count: 0, // Puede ser ajustado si tienes sub-combates
                        status: combate.id_jugador_1 && combate.id_jugador_2 ? 2 : 0, // Estado del combate
                        opponent1: {
                            id: combate.id_jugador_1,
                            position: 1
                        },
                        opponent2: {
                            id: combate.id_jugador_2,
                            position: 2
                        }
                    })),
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