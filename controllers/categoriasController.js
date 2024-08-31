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

                let num_deportistas = deportistas.length;
                if (num_deportistas === 0) {
                    return response.status(400).json({
                        statusCode: 400,
                        message: "No hay deportistas inscritos"
                    });
                }

                const sizes = [2, 4, 8, 16, 32];
                const size = sizes.find(s => s >= num_deportistas) || sizes[sizes.length - 1];
                const totalRounds = Math.ceil(Math.log2(size));

                // Crear un mapa para buscar deportistas rápidamente
                const deportistasMap = deportistas.reduce((map, deportista, index) => {
                    map[deportista.id_deportista] = index;
                    return map;
                }, {});

                // Ajustar combates
                const jsonResponse = {
                    participant: deportistas.map((deportista, index) => ({
                        id: index,
                        tournament_id: 0,
                        name: deportista.nombre
                    })),
                    stage: [
                        {
                            id: 0,
                            tournament_id: 0,
                            name: id_categoria,
                            type: "single_elimination",
                            number: 1,
                            settings: {
                                seedOrdering: ["natural"],
                                consolationFinal: false,
                                size: size,
                                matchesChildCount: 0
                            }
                        }
                    ],
                    group: [{
                        id: 0,
                        stage_id: 0,
                        number: 1
                    }],
                    round: Array.from({ length: totalRounds }).map((_, roundIndex) => ({
                        id: roundIndex,
                        stage_id: 0,
                        group_id: 0,
                        number: roundIndex + 1
                    })),
                    match: combates.map((combate, index) => {
                        const roundId = combate.round - 1; // Asegúrate de que `combate.round` esté en base 1
                        const score1 = combate.score1;
                        const score2 = combate.score2;

                        const getResult = (score1, score2) => {
                            if (score1 === null || score2 === null) return null;
                            if (score1 > score2) return 'win';
                            if (score1 < score2) return 'loss';
                            return 'draw';
                        };

                        const result1 = getResult(score1, score2);
                        const result2 = result1 === 'win' ? 'loss' : (result1 === 'loss' ? 'win' : null);

                        const matchEntry = {
                            id: index,
                            stage_id: 0,
                            group_id: 0,
                            round_id: roundId,
                            iddelcombate: combate.id_combate,
                            number: (index % 2) + 1, // Ajusta el número de match por round
                            child_count: 0,
                            status: 5,
                            opponent1: {
                                id: deportistasMap[combate.id_jugador_1] !== undefined ? deportistasMap[combate.id_jugador_1] : null,
                                ...(roundId === 0 ? { position: combate.id_jugador_1 } : {}),
                                ...(score1 !== null ? { score: score1 } : {}),
                                ...(result1 !== null ? { result: result1 } : {})
                            },
                            opponent2: {
                                id: deportistasMap[combate.id_jugador_2] !== undefined ? deportistasMap[combate.id_jugador_2] : null,
                                ...(roundId === 0 ? { position: combate.id_jugador_2 } : {}),
                                ...(score2 !== null ? { score: score2 } : {}),
                                ...(result2 !== null ? { result: result2 } : {})
                            }
                        };
                        return matchEntry;
                    }),
                    match_game: [] // Si tienes sub-partidos, puedes manejarlos aquí
                };

                // Filtrar rounds y matches innecesarios
                jsonResponse.match = jsonResponse.match.filter(match => match.round_id < totalRounds);

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