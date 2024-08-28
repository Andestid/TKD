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
    // Obtener todas las categorías de la base de datos
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

        // Si no hay categorías, responder con éxito
        if (totalCategorias === 0) {
            return response.sendResponse({
                statusCode: 200,
                message: "No hay categorías para procesar"
            });
        }

        // Procesar cada categoría individualmente
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
                    // Si no hay deportistas para esta categoría, continúa con la siguiente
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

                // Validar y limpiar datos vacíos
                if (combates.length === 0) {
                    // Si no hay combates para esta categoría, continúa con la siguiente
                    categoriasProcesadas++;
                    if (categoriasProcesadas === totalCategorias) {
                        response.sendResponse({
                            statusCode: 200,
                            message: "Brackets generados con éxito para todas las categorías",
                        });
                    }
                    return;
                }

                // Imprimir para depuración
                console.log("Consulta SQL de inserción:", "INSERT INTO combate (round, id_categoria, id_jugador_1, id_jugador_2) VALUES ?", [combates]);

                // Insertar todos los combates en la base de datos
                connection.query("INSERT INTO combate (round, id_categoria, id_jugador_1, id_jugador_2) VALUES ?", [combates], (error) => {
                    if (error) {
                        console.error("Error al registrar los combates para categoría:", id_categoriac, error.message);
                    }

                    categoriasProcesadas++;

                    // Verificar si se han procesado todas las categorías
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
    
    connection.query("UPDATE combate SET ganador = ? WHERE id_combate = ?", [id_ganador, id_combate], (error, results) => {
        if (error) {
            response.sendResponse({
                statusCode: 500,
                message: "Error al registrar el ganador",
                error: error.message
            });
        } else {
            connection.query("SELECT * FROM combate WHERE id_combate = ?", [id_combate], (error, combate) => {
                if (error || !combate.length) {
                    response.sendResponse({
                        statusCode: 500,
                        message: "Error al obtener los datos del combate",
                        error: error ? error.message : "Combate no encontrado"
                    });
                } else {
                    const { id_categoria, round, id_jugador_1, id_jugador_2 } = combate[0];
                    const nuevo_round = round + 1;
                    
                    // Verificar si hay un combate en la siguiente ronda sin oponente
                    connection.query(
                        "SELECT id_combate, id_jugador_1, id_jugador_2 FROM combate WHERE id_categoria = ? AND round = ? AND (id_jugador_1 IS NULL OR id_jugador_2 IS NULL) LIMIT 1",
                        [id_categoria, nuevo_round],
                        (error, next_combate) => {
                            if (error) {
                                response.sendResponse({
                                    statusCode: 500,
                                    message: "Error al buscar oponente en la siguiente ronda",
                                    error: error.message
                                });
                            } else if (next_combate.length > 0) {
                                const combate_siguiente = next_combate[0];
                                if (combate_siguiente.id_jugador_1 === null) {
                                    // Asignar el ganador como jugador 1 si está vacío
                                    connection.query(
                                        "UPDATE combate SET id_jugador_1 = ? WHERE id_combate = ?",
                                        [id_ganador, combate_siguiente.id_combate],
                                        (error, results) => {
                                            if (error) {
                                                response.sendResponse({
                                                    statusCode: 500,
                                                    message: "Error al actualizar el combate en la siguiente ronda",
                                                    error: error.message
                                                });
                                            } else {
                                                response.sendResponse({
                                                    statusCode: 200,
                                                    message: "Ganador registrado y avanzó a la siguiente ronda"
                                                });
                                            }
                                        }
                                    );
                                } else if (combate_siguiente.id_jugador_2 === null) {
                                    // Asignar el ganador como jugador 2 si está vacío
                                    connection.query(
                                        "UPDATE combate SET id_jugador_2 = ? WHERE id_combate = ?",
                                        [id_ganador, combate_siguiente.id_combate],
                                        (error, results) => {
                                            if (error) {
                                                response.sendResponse({
                                                    statusCode: 500,
                                                    message: "Error al actualizar el combate en la siguiente ronda",
                                                    error: error.message
                                                });
                                            } else {
                                                response.sendResponse({
                                                    statusCode: 200,
                                                    message: "Ganador registrado y avanzó a la siguiente ronda"
                                                });
                                            }
                                        }
                                    );
                                }
                            } else {
                                // Si no hay combates disponibles, manejar el caso del 'bye'
                                connection.query(
                                    "SELECT * FROM combate WHERE id_categoria = ? AND round = ? AND (id_jugador_1 IS NULL OR id_jugador_2 IS NULL)",
                                    [id_categoria, nuevo_round - 1],
                                    (error, prev_combat) => {
                                        if (error) {
                                            response.sendResponse({
                                                statusCode: 500,
                                                message: "Error al verificar combates previos",
                                                error: error.message
                                            });
                                        } else if (prev_combat.length === 1) {
                                            // Si hay un combate en la ronda anterior con un solo jugador, asignar el jugador al nuevo combate
                                            const prev_winner = prev_combat[0].id_jugador_1 || prev_combat[0].id_jugador_2;
                                            if (prev_winner) {
                                                connection.query(
                                                    "INSERT INTO combate (round, id_categoria, id_jugador_1) VALUES (?, ?, ?)",
                                                    [nuevo_round, id_categoria, prev_winner],
                                                    (error, results) => {
                                                        if (error) {
                                                            response.sendResponse({
                                                                statusCode: 500,
                                                                message: "Error al crear el combate en la siguiente ronda",
                                                                error: error.message
                                                            });
                                                        } else {
                                                            response.sendResponse({
                                                                statusCode: 200,
                                                                message: "Ganador registrado y avanzó a la siguiente ronda"
                                                            });
                                                        }
                                                    }
                                                );
                                            } else {
                                                response.sendResponse({
                                                    statusCode: 200,
                                                    message: "Ganador registrado, esperando el oponente"
                                                });
                                            }
                                        } else {
                                            // Si no se cumple el caso anterior, crear un nuevo combate
                                            connection.query(
                                                "INSERT INTO combate (round, id_categoria, id_jugador_1) VALUES (?, ?, ?)",
                                                [nuevo_round, id_categoria, id_ganador],
                                                (error, results) => {
                                                    if (error) {
                                                        response.sendResponse({
                                                            statusCode: 500,
                                                            message: "Error al crear el combate en la siguiente ronda",
                                                            error: error.message
                                                        });
                                                    } else {
                                                        response.sendResponse({
                                                            statusCode: 200,
                                                            message: "Ganador registrado y avanzó a la siguiente ronda"
                                                        });
                                                    }
                                                }
                                            );
                                        }
                                    }
                                );
                            }
                        }
                    );
                }
            });
        }
    });
};

const inscribirDeportistaYCombate = (request, response) => {
    const { nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps,id_categorias } = request.body;
    connection.beginTransaction((err) => {
        if (err) {
            return response.status(500).json({
                message: "Error al iniciar la transacción",
                error: err.message
            });
        }
        connection.query("INSERT INTO deportista (nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps],
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
    const { nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps,id_categorias } = request.body;
    connection.beginTransaction((err) => {
        if (err) {
            return response.status(500).json({
                message: "Error al iniciar la transacción",
                error: err.message
            });
        }
        connection.query("INSERT INTO deportista (nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps) VALUES (?,?,?,?,?,?,?,?,?,?,?)",
        [nombre, apellido, sexo, peso, club, departamento, ciudad, entrenador, numeroasistencia, nacimiento, eps],
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
    generarBracketsParaTodasLasCategorias
};