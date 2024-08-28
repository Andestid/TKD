const { connection } = require("../db.js");

const getDeportistas = (request, response) => {
    connection.query("SELECT * FROM deportista", (error, results) => {
        if (error) {
            response.sendResponse({
                statusCode: 500,
                message: "Error al obtener los deportistas",
                error: error.message
            });
        } else {
            response.sendResponse({
                statusCode: 200,
                message: "Deportistas obtenidos con éxito",
                data: results
            });
        }
    });
};

const postDeportistas = (request, response) => {
    const { nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps } = request.body;
    connection.query("INSERT INTO deportista (nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps],
        (error, results) => {
            if (error) {
                response.sendResponse({
                    statusCode: 500,
                    message: "Error al registrar deportista",
                    error: error.message
                });
            } else {
                response.sendResponse({
                    statusCode: 200,
                    message: "Deportista registrado con éxito"
                });
            }
        });
};

const validacionDeportista = (id) => {
    return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM deportista WHERE id_deportista = ?", [id], (error, results) => {
            if (error) {
                reject({
                    statusCode: 500,
                    message: "Error al validar deportista",
                    error: error.message
                });
            } else if (results.length === 0) {
                reject({
                    statusCode: 404,
                    message: "Deportista no encontrado"
                });
            } else {
                const deportista = results;
                resolve(deportista);
            }
        });
    });
};

const validacionCategoriaP = (id) => {
    return new Promise((resolve, reject) => {
        connection.query("SELECT * FROM categorias_poomsae WHERE id_categoriap = ?", [id], (error, results) => {
            if (error) {
                reject({
                    statusCode: 500,
                    message: "Error al validar categoria",
                    error: error.message
                });
            } else if (results.length === 0) {
                reject({
                    statusCode: 404,
                    message: "Categoria no encontrado"
                });
            } else {
                const categoria = results;
                resolve(categoria);
            }
        });
    });
};

const inscribirCombate = (request, response) => {
    const { id_deportista, id_categoriac } = request.body;
    connection.query("INSERT INTO inscritos_combate (id_deportista, id_categoriac) VALUES (?,?)",
        [id_deportista, id_categoriac],
        (error, results) => {
            if (error) {
                response.sendResponse({
                    statusCode: 500,
                    message: "Error al registrar deportista en combate",
                    error: error.message
                });
            } else {
                response.sendResponse({
                    statusCode: 200,
                    message: "Inscripción combate registrada con éxito"
                });
            }
        });
};

const inscribirPoomsae = async (request, response) => {
    const { id_deportista, id_categoriap } = request.body;
    try {
        const deportista = await validacionDeportista(id_deportista);
        const categoria = await validacionCategoriaP(id_categoriap);
        if (deportista[0].sexo != categoria[0].sexo){
            response.sendResponse({
                statusCode: 500,
                message: "No puede estar en esta categoria"
            });
        } else {
        connection.query("INSERT INTO inscritos_poomsae (id_deportista, id_categoriap) VALUES (?,?)",
            [id_deportista, id_categoriap],
            (error, results) => {
                if (error) {
                    response.sendResponse({
                        statusCode: 500,
                        message: "Error al registrar deportista en poomsae",
                        error: error.message
                    });
                } else {
                    response.sendResponse({
                        statusCode: 200,
                        message: "Inscripción poomsae registrada con éxito"
                    });
                }
            });
        }
    } catch (error) {
        response.sendResponse({
            statusCode: 500,
            message: "No se pudo validar al deportista",
            error: error.message
        });
    }
};

const verDeportistasPorCategoria = (request, response) => {
    const { id_categoriac } = request.params;

    if (!id_categoriac) {
        return response.status(400).json({ error: "Falta el ID de la categoría." });
    }

    const query = `
        SELECT DISTINCT d.id_deportista, d.nombre, d.apellido
        FROM deportista AS d
        LEFT JOIN inscritos_combate AS ic ON d.id_deportista = ic.id_deportista AND ic.id_categoriac = ?
        LEFT JOIN inscritos_poomsae AS ip ON d.id_deportista = ip.id_deportista
        WHERE ic.id_deportista IS NOT NULL OR ip.id_deportista IS NOT NULL;
    `;

    connection.query(query, [id_categoriac], (error, results) => {
        if (error) {
            return response.status(500).json({
                message: "Error al obtener los deportistas de esta categoría",
                error: error.message
            });
        } else {
            return response.status(200).json({
                message: "Deportistas obtenidos con éxito",
                data: results
            });
        }
    });
};

const generarBracketsParaTodasLasCategorias = (request, response) => {
    connection.query("SELECT id_categoriac FROM categorias_combate", (error, categorias) => {
        if (error) {
            return response.sendResponse({
                statusCode: 500,
                message: "Error al obtener las categorías",
                error: error.message
            });
        }

        let categoriasProcesadas = 0;
        const totalCategorias = categorias.length;

        if (totalCategorias === 0) {
            return response.sendResponse({
                statusCode: 200,
                message: "No hay categorías para procesar"
            });
        }

        categorias.forEach(categoria => {
            const { id_categoriac } = categoria;

            connection.query("SELECT id_deportista FROM inscritos_combate WHERE id_categoriac = ?", [id_categoriac], (error, deportistas) => {
                if (error) {
                    console.error("Error al obtener los deportistas para categoría:", id_categoriac, error.message);
                    categoriasProcesadas++;
                    if (categoriasProcesadas === totalCategorias) {
                        response.sendResponse({
                            statusCode: 200,
                            message: "Brackets generados con éxito para todas las categorías (con errores en algunos casos)",
                        });
                    }
                    return;
                }

                let num_deportistas = deportistas.length;
                if (num_deportistas === 0) {
                    categoriasProcesadas++;
                    if (categoriasProcesadas === totalCategorias) {
                        response.sendResponse({
                            statusCode: 200,
                            message: "Brackets generados con éxito para todas las categorías",
                        });
                    }
                    return;
                }

                const totalRounds = Math.ceil(Math.log2(num_deportistas));
                let combates = [];
                let round = 1;

                // Generar combates para la primera ronda
                let ganadoresPrimeraRonda = [];

                for (let i = 0; i < num_deportistas - 1; i += 2) {
                    combates.push([round, id_categoriac, deportistas[i].id_deportista, (i + 1 < num_deportistas) ? deportistas[i + 1].id_deportista : null]);
                    ganadoresPrimeraRonda.push(null); // Lugar para los ganadores de la primera ronda
                }

                // Manejo de competidor que recibe un 'bye'
                if (num_deportistas % 2 !== 0) {
                    const byeParticipant = deportistas[num_deportistas - 1].id_deportista;
                    ganadoresPrimeraRonda.push(byeParticipant); // Este participante va directamente a la segunda ronda
                }

                // Generar combates para la segunda ronda (round + 1)
                round++;
                for (let i = 0; i < ganadoresPrimeraRonda.length; i += 2) {
                    combates.push([round, id_categoriac, ganadoresPrimeraRonda[i], (i + 1 < ganadoresPrimeraRonda.length) ? ganadoresPrimeraRonda[i + 1] : null]);
                }

                // Generar combates para rondas adicionales si son necesarias
                while (round < totalRounds) {
                    round++;
                    const numCombates = Math.pow(2, totalRounds - round);

                    for (let i = 0; i < numCombates; i++) {
                        combates.push([round, id_categoriac, null, null]);
                    }
                }

                if (combates.length === 0) {
                    categoriasProcesadas++;
                    if (categoriasProcesadas === totalCategorias) {
                        response.sendResponse({
                            statusCode: 200,
                            message: "Brackets generados con éxito para todas las categorías",
                        });
                    }
                    return;
                }

                console.log("Consulta SQL de inserción:", "INSERT INTO combate (round, id_categoria, id_jugador_1, id_jugador_2) VALUES ?", [combates]);

                connection.query("INSERT INTO combate (round, id_categoria, id_jugador_1, id_jugador_2) VALUES ?", [combates], (error) => {
                    if (error) {
                        console.error("Error al registrar los combates para categoría:", id_categoriac, error.message);
                    }

                    categoriasProcesadas++;

                    if (categoriasProcesadas === totalCategorias) {
                        response.sendResponse({
                            statusCode: 200,
                            message: "Brackets generados con éxito para todas las categorías",
                        });
                    }
                });
            });
        });
    });
};
const generarBrackets = (request, response) => {
    const { id_categoriac } = request.params;

    connection.query("SELECT id_deportista FROM inscritos_combate WHERE id_categoriac = ?", [id_categoriac], (error, deportistas) => {
        if (error) {
            return response.sendResponse({
                statusCode: 500,
                message: "Error al generar brackets",
                error: error.message
            });
        }

        let num_deportistas = deportistas.length;
        const totalRounds = Math.ceil(Math.log2(num_deportistas));
        const totalCombates = Math.pow(2, totalRounds) - 1;

        let combates = [];
        let round = 1;

        // Generar combates para la primera ronda
        for (let i = 0; i < num_deportistas; i += 2) {
            combates.push([round, id_categoriac, deportistas[i].id_deportista, (i + 1 < num_deportistas) ? deportistas[i + 1].id_deportista : null]);
        }

        // Generar combates para las rondas siguientes, sin asignar jugadores
        while (round < totalRounds) {
            round++;
            const numCombates = Math.pow(2, totalRounds - round); // Combates en la ronda actual

            for (let i = 0; i < numCombates; i++) {
                combates.push([round, id_categoriac, null, null]);
            }
        }

        // Insertar todos los combates en la base de datos
        connection.query("INSERT INTO combate (round, id_categoria, id_jugador_1, id_jugador_2) VALUES ?", [combates], (error) => {
            if (error) {
                return response.sendResponse({
                    statusCode: 500,
                    message: "Error al registrar los combates",
                    error: error.message
                });
            }

            response.sendResponse({
                statusCode: 200,
                message: "Brackets generados con éxito",
                data: deportistas
            });
        });
    });
};

const registrarGanador = (request, response) => {
    const { id_combate, id_ganador } = request.body;

    // Obtener detalles del combate actual
    connection.query("SELECT round, id_categoria, ganador FROM combate WHERE id_combate = ?", [id_combate], (error, combateActual) => {
        if (error || combateActual.length === 0) {
            return response.sendResponse({
                statusCode: 500,
                message: "Error al obtener el combate o combate no encontrado",
                error: error ? error.message : "Combate no encontrado"
            });
        }

        const { round, id_categoria, ganador } = combateActual[0];

        // Verificar si ya se ha asignado un ganador
        if (ganador !== null) {
            return response.sendResponse({
                statusCode: 400,
                message: "Este combate ya tiene un ganador asignado",
            });
        }

        // Actualizar el ganador en el combate actual
        connection.query("UPDATE combate SET ganador = ? WHERE id_combate = ?", [id_ganador, id_combate], (error) => {
            if (error) {
                return response.sendResponse({
                    statusCode: 500,
                    message: "Error al registrar el ganador",
                    error: error.message
                });
            }

            // Identificar el siguiente combate en la ronda superior
            connection.query(`
                SELECT id_combate, id_jugador_1, id_jugador_2
                FROM combate
                WHERE id_categoria = ?
                AND round = ?
                AND (id_jugador_1 IS NULL OR id_jugador_2 IS NULL)
                ORDER BY id_combate ASC
                LIMIT 1
            `, [id_categoria, round + 1], (error, combateSiguiente) => {
                if (error || combateSiguiente.length === 0) {
                    return response.sendResponse({
                        statusCode: 200,
                        message: "Ganador registrado con éxito, no hay más combates en esta categoría",
                    });
                }

                const siguienteCombate = combateSiguiente[0];
                const { id_combate: idCombateSiguiente, id_jugador_1, id_jugador_2 } = siguienteCombate;

                // Determinar en qué posición debe colocarse el ganador
                let campoAActualizar = 'id_jugador_1';
                if (id_jugador_1 !== null) {
                    campoAActualizar = 'id_jugador_2';
                }

                // Asignar el ganador al siguiente combate
                connection.query(`
                    UPDATE combate
                    SET ${campoAActualizar} = ?
                    WHERE id_combate = ?
                `, [id_ganador, idCombateSiguiente], (error) => {
                    if (error) {
                        return response.sendResponse({
                            statusCode: 500,
                            message: "Error al avanzar el ganador al siguiente combate",
                            error: error.message
                        });
                    }

                    response.sendResponse({
                        statusCode: 200,
                        message: "Ganador registrado y avanzado con éxito al siguiente combate",
                    });
                });
            });
        });
    });
};

const inscribirDeportistaYCombate = (request, response) => {
    const { nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps, hospedaje, id_categorias } = request.body;
    connection.beginTransaction((err) => {
        if (err) {
            return response.status(500).json({
                message: "Error al iniciar la transacción",
                error: err.message
            });
        }
        connection.query("INSERT INTO deportista (nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps, hospedaje) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        [nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps, hospedaje],
            (error, results) => {
                if (error) {
                    return connection.rollback(() => {
                        response.sendResponse({
                        statusCode: 500,
                        message: "Error al registrar deportista",
                        error: error.message
                        });
                    });
                }
                const id_deportista = results.insertId;

                const categoriaQueries = id_categorias.map((id_categoriac) => {
                    return new Promise((resolve, reject) => {
                        connection.query(
                            "INSERT INTO inscritos_combate (id_deportista, id_categoriac) VALUES (?, ?)",
                            [id_deportista, id_categoriac],
                            (error, results) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(results);
                                }
                            }
                        );
                    });
                });

                Promise.all(categoriaQueries)
                    .then(() => {
                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    response.sendResponse({
                                        statusCode: 500,
                                        message: "Error al registrar deportista",
                                        error: error.message
                                    });
                                });
                            }

                            response.sendResponse({
                                statusCode: 200,
                                message: "Deportista registrado con exito",
                            });
                        });
                    })
                    .catch((error) => {
                        connection.rollback(() => {
                            response.sendResponse({
                                statusCode: 500,
                                message: "Error al registrar deportista",
                                error: error.message
                            });
                        });
                    });
            }
        );
    });
};

const inscribirDeportistaYPoomsae = (request, response) => {
    const { nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps, hospedaje, id_categorias } = request.body;
    connection.beginTransaction((err) => {
        if (err) {
            return response.status(500).json({
                message: "Error al iniciar la transacción",
                error: err.message
            });
        }
        connection.query("INSERT INTO deportista (nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps, hospedaje) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
        [nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps, hospedaje],
            (error, results) => {
                if (error) {
                    return connection.rollback(() => {
                        response.sendResponse({
                        statusCode: 500,
                        message: "Error al registrar deportista",
                        error: error.message
                        });
                    });
                }
                const id_deportista = results.insertId;

                const categoriaQueries = id_categorias.map((id_categoriac) => {
                    return new Promise((resolve, reject) => {
                        connection.query(
                            "INSERT INTO inscritos_poomsae (id_deportista, id_categoriap) VALUES (?, ?)",
                            [id_deportista, id_categoriac],
                            (error, results) => {
                                if (error) {
                                    reject(error);
                                } else {
                                    resolve(results);
                                }
                            }
                        );
                    });
                });

                Promise.all(categoriaQueries)
                    .then(() => {
                        connection.commit((err) => {
                            if (err) {
                                return connection.rollback(() => {
                                    response.sendResponse({
                                        statusCode: 500,
                                        message: "Error al registrar deportista",
                                        error: error.message
                                    });
                                });
                            }

                            response.sendResponse({
                                statusCode: 200,
                                message: "Deportista registrado con exito",
                            });
                        });
                    })
                    .catch((error) => {
                        connection.rollback(() => {
                            response.sendResponse({
                                statusCode: 500,
                                message: "Error al registrar deportista",
                                error: error.message
                            });
                        });
                    });
            }
        );
    });
};

const getTopFourPositions = (request, response) => {
    const { id_categoriac } = request.params;

    // Obtener los combates de la categoría en orden descendente de rondas
    connection.query(`
        SELECT * FROM combate 
        WHERE id_categoria = ? 
        ORDER BY round DESC
    `, [id_categoriac], (error, combates) => {
        if (error) {
            return response.status(500).json({
                statusCode: 500,
                message: "Error al obtener los combates",
                error: error.message
            });
        }

        if (combates.length === 0) {
            return response.status(404).json({
                statusCode: 404,
                message: "No se encontraron combates para esta categoría"
            });
        }

        // Identificar el ganador del último combate (final)
        const finalMatch = combates[0];
        const winner = finalMatch.ganador;
        const secondPlace = (finalMatch.id_jugador_1 === winner) ? finalMatch.id_jugador_2 : finalMatch.id_jugador_1;

        // Identificar a los dos perdedores de las semifinales
        const semiFinalMatches = combates.filter(c => c.round === finalMatch.round - 1);
        const semiFinalLosers = semiFinalMatches.map(match => 
            (match.id_jugador_1 === match.ganador) ? match.id_jugador_2 : match.id_jugador_1
        );

        // Verificar si hay menos de dos semifinalistas
        const third = semiFinalLosers[0] || null;
        const fourth = semiFinalLosers[1] || null;

        // Crear la estructura del JSON para las posiciones
        const topFour = {
            first: winner,
            second: secondPlace,
            third: third,
            fourth: fourth
        };

        // Enviar la respuesta en formato JSON
        response.status(200).json({
            statusCode: 200,
            message: "Top 4 posiciones obtenidas con éxito",
            data: topFour
        });
    });
};

module.exports = {
    getDeportistas,
    postDeportistas,
    inscribirCombate,
    inscribirPoomsae,
    verDeportistasPorCategoria,
    generarBrackets,
    registrarGanador,
    inscribirDeportistaYCombate,
    inscribirDeportistaYPoomsae,
    generarBracketsParaTodasLasCategorias,
    getTopFourPositions
};