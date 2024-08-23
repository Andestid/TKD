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
    const { nombre, apellido, sexo, peso, club } = request.body;
    connection.query("INSERT INTO deportista (nombre, apellido, sexo, peso, club) VALUES (?,?,?,?,?)",
        [nombre, apellido, sexo, peso, club],
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

const generarBrackets =  (request, response) => {
    const { id_categoriac } = request.params;
    connection.query("SELECT id_deportista FROM inscritos_combate WHERE id_categoriac = ?", [id_categoriac], (error, deportistas) => {
        if (error) {
            response.sendResponse({
                statusCode: 500,
                message: "Error al generar brackets",
                error: error.message
            });
        } else {
            const num_deportistas = deportistas.length;
            if (num_deportistas % 2 !== 0) {
                response.sendResponse({
                    statusCode: 400,
                    message: "El número de deportistas debe ser par para generar los brackets"
                });
                return;
            }
            
            let round = 1;
            let combates = [];
            
            // Emparejar deportistas de dos en dos para generar los combates
            for (let i = 0; i < num_deportistas; i += 2) {
                combates.push([round, id_categoriac, deportistas[i].id_deportista, deportistas[i + 1].id_deportista]);
            }
            
            // Insertar los combates en la base de datos
            connection.query(
                "INSERT INTO combate (round, id_categoria, id_jugador_1, id_jugador_2) VALUES ?",
                [combates.map(c => [c[0], c[1], c[2], c[3]])],
                (error, results) => {
                    if (error) {
                        response.sendResponse({
                            statusCode: 500,
                            message: "Error al registrar los combates",
                            error: error.message
                        });
                    } else {
                        response.sendResponse({
                            statusCode: 200,
                            message: "Brackets generados con éxito"
                        });
                    }
                }
            );
        }
    });
};

const registrarGanador = (request, response) => {
    // Actualizar el combate con el ganador
    const { id_combate, id_ganador } = request.body;
    
    connection.query("UPDATE combate SET ganador = ? WHERE id_combate = ?", [id_ganador, id_combate], (error, results) => {
        if (error) {
            response.sendResponse({
                statusCode: 500,
                message: "Error al registrar el ganador",
                error: error.message
            });
        } else {
            // Obtener los datos del combate actual
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
                    
                    // Buscar oponente disponible en la siguiente ronda
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
                                // Si hay un combate en la siguiente ronda con un espacio libre
                                const combate_siguiente = next_combate[0];
                                if (combate_siguiente.id_jugador_1 === null) {
                                    // Si el jugador 1 está libre
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
                                    // Si el jugador 2 está libre
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
                                // No hay combates disponibles en la siguiente ronda, crear un nuevo combate
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
            });
        }
    });
};

const inscribirDeportistaYCombate = (request, response) => {
    const { nombre, apellido, sexo, peso, club, id_categorias } = request.body;

    connection.beginTransaction((err) => {
        if (err) {
            return response.status(500).json({
                message: "Error al iniciar la transacción",
                error: err.message
            });
        }

        connection.query(
            "INSERT INTO deportista (nombre, apellido, sexo, peso, club) VALUES (?,?,?,?,?)",
            [nombre, apellido, sexo, peso, club],
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
    const { nombre, apellido, sexo, peso, club, id_categorias } = request.body;

    connection.beginTransaction((err) => {
        if (err) {
            return response.status(500).json({
                message: "Error al iniciar la transacción",
                error: err.message
            });
        }

        connection.query(
            "INSERT INTO deportista (nombre, apellido, sexo, peso, club) VALUES (?,?,?,?,?)",
            [nombre, apellido, sexo, peso, club],
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
                            "INSERT INTO inscritos_poomsae (id_deportista, id_categoriac) VALUES (?, ?)",
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
    inscribirDeportistaYPoomsae
};