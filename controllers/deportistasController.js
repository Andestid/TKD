const { connection } = require("../db.js");

const getDeportistas = (request, response) => {
    const query = `
        SELECT 
            d.*,
            IF(cc.id_categoriac IS NOT NULL, 'combate', 'poomsae') AS modalidad,
            GROUP_CONCAT(DISTINCT CONCAT('"', IFNULL(cc.nombre, cp.nombre), '"') SEPARATOR ',') AS categorias
        FROM 
            deportista d
        LEFT JOIN 
            inscritos_combate ic ON d.id_deportista = ic.id_deportista
        LEFT JOIN 
            categorias_combate cc ON ic.id_categoriac = cc.id_categoriac
        LEFT JOIN 
            inscritos_poomsae ip ON d.id_deportista = ip.id_deportista
        LEFT JOIN 
            categorias_poomsae cp ON ip.id_categoriap = cp.id_categoriap
        GROUP BY 
            d.id_deportista, modalidad
    `;

    connection.query(query, (error, results) => {
        if (error) {
            response.sendResponse({
                statusCode: 500,
                message: "Error al obtener los deportistas",
                error: error.message
            });
        } else {
            try {
                // Transformar la cadena en un array JSON
                const data = results.map(row => ({
                    ...row,
                    categorias: JSON.parse(`[${row.categorias}]`)
                }));

                response.sendResponse({
                    statusCode: 200,
                    message: "Deportistas obtenidos con éxito",
                    data
                });
            } catch (jsonError) {
                response.sendResponse({
                    statusCode: 500,
                    message: "Error al procesar los datos de categorías",
                    error: jsonError.message
                });
            }
        }
    });
};

const deleteDeportistas = async (request, response) => {
    const { id_deportista } = request.body;

    try {
        // Primero, elimina de rondas_poomsae (dependencias)
        await new Promise((resolve, reject) => {
            connection.query("DELETE FROM rondas_poomsae WHERE id_deportista = ?", [id_deportista], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });

        // Luego, elimina de inscritos_combate
        await new Promise((resolve, reject) => {
            connection.query("DELETE FROM inscritos_combate WHERE id_deportista = ?", [id_deportista], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });

        // Luego, elimina de inscritos_poomsae
        await new Promise((resolve, reject) => {
            connection.query("DELETE FROM inscritos_poomsae WHERE id_deportista = ?", [id_deportista], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });

        // Finalmente, elimina el deportista
        const resultsDeportista = await new Promise((resolve, reject) => {
            connection.query("DELETE FROM deportista WHERE id_deportista = ?", [id_deportista], (error, results) => {
                if (error) return reject(error);
                resolve(results);
            });
        });

        // Respuesta exitosa
        response.send({
            statusCode: 200,
            message: "Deportista eliminado con éxito",
            data: resultsDeportista
        });
    } catch (error) {
        response.send({
            statusCode: 500,
            message: "Error al eliminar el deportista",
            error: error.message
        });
    }
};

const updateDeportista = (request, response) => {
    const { id_deportista, ...fieldsToUpdate } = request.body;

    if (!id_deportista) {
        return response.status(400).send({
            statusCode: 400,
            message: "El ID del deportista es obligatorio",
        });
    }

    const columns = Object.keys(fieldsToUpdate);
    const values = Object.values(fieldsToUpdate);

    if (columns.length === 0) {
        return response.status(400).send({
            statusCode: 400,
            message: "No hay campos para actualizar",
        });
    }

    const setClause = columns.map(column => `${column} = ?`).join(', ');

    const query = `UPDATE deportista SET ${setClause} WHERE id_deportista = ?`;

    connection.query(query, [...values, id_deportista], (error, results) => {
        if (error) {
            response.status(500).send({
                statusCode: 500,
                message: "Error al actualizar deportista",
                error: error.message,
            });
        } else {
            response.status(200).send({
                statusCode: 200,
                message: "Deportista actualizado con éxito",
                data: results,
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

            // Eliminar combates existentes para la categoría
            connection.query("DELETE FROM combate WHERE id_categoria = ?", [id_categoriac], (error) => {
                if (error) {
                    console.error("Error al eliminar combates para categoría:", id_categoriac, error.message);
                    categoriasProcesadas++;
                    if (categoriasProcesadas === totalCategorias) {
                        response.sendResponse({
                            statusCode: 500,
                            message: "Error al eliminar combates para algunas categorías"
                        });
                    }
                    return;
                }

                // Obtener deportistas de la categoría
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
    const { id_combate, id_ganador, score1, score2 } = request.body;

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
        connection.query("UPDATE combate SET ganador = ?, score1 = ?, score2 = ? WHERE id_combate = ?", [id_ganador, score1, score2, id_combate], (error) => {
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
                                data: id_deportista
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
                                data: id_deportista
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

const generarRondasPoomsaeParaTodasLasCategorias = (request, response) => {
    connection.beginTransaction((err) => {
        if (err) {
            return response.status(500).json({
                message: "Error al iniciar la transacción",
                error: err.message
            });
        }

        // Elimina las rondas anteriores para evitar duplicados
        connection.query(
            "DELETE FROM rondas_poomsae",
            (error, results) => {
                if (error) {
                    return connection.rollback(() => {
                        response.status(500).json({
                            message: "Error al eliminar rondas anteriores",
                            error: error.message
                        });
                    });
                }

                // Obtiene todas las categorías con inscritos
                connection.query(
                    "SELECT DISTINCT id_categoriap FROM inscritos_poomsae",
                    (error, results) => {
                        if (error) {
                            return connection.rollback(() => {
                                response.status(500).json({
                                    message: "Error al obtener las categorías",
                                    error: error.message
                                });
                            });
                        }

                        const categorias = results.map(row => row.id_categoriap);

                        const categoriaQueries = categorias.map((id_categoriap) => {
                            return new Promise((resolve, reject) => {
                                connection.query(
                                    "SELECT id_deportista FROM inscritos_poomsae WHERE id_categoriap = ?",
                                    [id_categoriap],
                                    (error, results) => {
                                        if (error) {
                                            return reject(error);
                                        }

                                        const deportistas = results.map(row => row.id_deportista);

                                        const insertQueries = deportistas.map((id_deportista) => {
                                            return new Promise((resolve, reject) => {
                                                connection.query(
                                                    "INSERT INTO rondas_poomsae (id_deportista, id_categoriap, puntaje, puntaje2) VALUES (?, ?, NULL, NULL)",
                                                    [id_deportista, id_categoriap],
                                                    (error, results) => {
                                                        if (error) {
                                                            return reject(error);
                                                        }
                                                        resolve(results);
                                                    }
                                                );
                                            });
                                        });

                                        Promise.all(insertQueries)
                                            .then(resolve)
                                            .catch(reject);
                                    }
                                );
                            });
                        });

                        Promise.all(categoriaQueries)
                            .then(() => {
                                connection.commit((err) => {
                                    if (err) {
                                        return connection.rollback(() => {
                                            response.status(500).json({
                                                message: "Error al finalizar la transacción",
                                                error: err.message
                                            });
                                        });
                                    }

                                    response.status(200).json({
                                        message: "Rondas generadas con éxito para todas las categorías"
                                    });
                                });
                            })
                            .catch((error) => {
                                connection.rollback(() => {
                                    response.status(500).json({
                                        message: "Error al generar las rondas",
                                        error: error.message
                                    });
                                });
                            });
                    }
                );
            }
        );
    });
};

const verRondasPoomsaeParaTodasLasCategorias = (request, response) => {
    let sql = `
        SELECT 
            rp.id_deportista,
            d.nombre,
            d.apellido,
            rp.id_categoriap,
            c.nombre,
            rp.puntaje,
            rp.puntaje2,
            (rp.puntaje + COALESCE(rp.puntaje2, 0)) AS suma_puntajes,
            CASE
                WHEN rp.puntaje2 IS NOT NULL THEN
                    (rp.puntaje + rp.puntaje2) / 2
                ELSE
                    rp.puntaje
            END AS promedio_puntajes
        FROM 
            rondas_poomsae rp
        INNER JOIN 
            deportista d ON rp.id_deportista = d.id_deportista
        INNER JOIN 
            categorias_poomsae c ON rp.id_categoriap = c.id_categoriap
    `;

    sql += " ORDER BY rp.id_categoriap, d.apellido, d.nombre"; // Ordena por categoría, apellido y nombre

    connection.query(sql, (error, results) => {
        if (error) {
            return response.status(500).json({
                message: "Error al obtener las rondas de poomsae",
                error: error.message
            });
        }

        if (results.length === 0) {
            return response.status(404).json({
                message: "No se encontraron rondas de poomsae"
            });
        }

        // Agrupar los resultados por categoría
        const groupedResults = results.reduce((acc, row) => {
            if (!acc[row.id_categoriap]) {
                acc[row.id_categoriap] = {
                    nombre_categoria: row.nombre_categoria,
                    deportistas: []
                };
            }
            acc[row.id_categoriap].deportistas.push({
                id_deportista: row.id_deportista,
                nombre: row.nombre,
                apellido: row.apellido,
                puntaje: row.puntaje,
                puntaje2: row.puntaje2,
                suma_puntajes: row.suma_puntajes,
                promedio_puntajes: row.promedio_puntajes
            });
            return acc;
        }, {});

        // Construir el JSON final
        const formattedResults = Object.keys(groupedResults).map(categoria => ({
            id_categoriap: categoria,
            nombre_categoria: groupedResults[categoria].nombre_categoria,
            deportistas: groupedResults[categoria].deportistas
        }));

        response.status(200).json({
            message: "Rondas de poomsae obtenidas con éxito",
            data: formattedResults
        });
    });
};

const asignarPuntajePoomsae = (request, response) => {
    const { id_deportista, id_categoriap, puntaje, puntaje2 } = request.body;

    // Construye la consulta SQL dinámicamente según los puntajes proporcionados
    let sql = "UPDATE rondas_poomsae SET ";
    const params = [];
    
    if (puntaje !== undefined) {
        sql += "puntaje = ?";
        params.push(puntaje);
    }

    if (puntaje2 !== undefined) {
        if (puntaje !== undefined) {
            sql += ", ";
        }
        sql += "puntaje2 = ?";
        params.push(puntaje2);
    }

    sql += " WHERE id_deportista = ? AND id_categoriap = ?";
    params.push(id_deportista, id_categoriap);

    connection.query(sql, params, (error, results) => {
        if (error) {
            return response.status(500).json({
                message: "Error al asignar puntaje",
                error: error.message
            });
        }

        if (results.affectedRows === 0) {
            return response.status(404).json({
                message: "No se encontró el registro del deportista en la categoría especificada"
            });
        }

        response.status(200).json({
            message: "Puntaje(s) asignado(s) con éxito"
        });
    });
};

const getTopFourPositionsForAllCategories = (request, response) => {
    // Obtener todas las categorías con su nombre
    connection.query('SELECT DISTINCT c.id_categoria, cat.nombre FROM combate c JOIN categorias_combate cat ON c.id_categoria = cat.id_categoriac', (error, categories) => {
        if (error) {
            return response.status(500).json({
                statusCode: 500,
                message: "Error al obtener las categorías",
                error: error.message
            });
        }

        // Si no hay categorías, responder con un mensaje adecuado
        if (categories.length === 0) {
            return response.status(404).json({
                statusCode: 404,
                message: "No se encontraron categorías"
            });
        }

        // Función para obtener el nombre de un deportista por su ID
        const getDeportistaName = (id_deportista) => {
            return new Promise((resolve, reject) => {
                connection.query('SELECT nombre FROM deportista WHERE id_deportista = ?', [id_deportista], (error, results) => {
                    if (error) {
                        return reject(error);
                    }
                    resolve((results.length > 0) ? results[0].nombre : null);
                });
            });
        };

        // Función para procesar los combates de una categoría
        const getPositionsForCategory = (id_categoriac, categoryName) => {
            return new Promise((resolve, reject) => {
                connection.query("SELECT * FROM combate WHERE id_categoria = ? ORDER BY round DESC", [id_categoriac], async (error, combates) => {
                    if (error) {
                        return reject(error);
                    }

                    if (combates.length === 0) {
                        return resolve({ id_categoria: id_categoriac, nombre_categoria: categoryName, topFour: [null, null, null, null] });
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

                    try {
                        // Obtener los nombres de los deportistas en paralelo
                        const [winnerName, secondPlaceName, thirdName, fourthName] = await Promise.all([
                            getDeportistaName(winner),
                            getDeportistaName(secondPlace),
                            third ? getDeportistaName(third) : Promise.resolve(null),
                            fourth ? getDeportistaName(fourth) : Promise.resolve(null)
                        ]);

                        const topFour = [
                            { id: winner, nombre: winnerName },     // Primero
                            { id: secondPlace, nombre: secondPlaceName }, // Segundo
                            { id: third, nombre: thirdName },      // Tercero
                            { id: fourth, nombre: fourthName }      // Cuarto
                        ];

                        resolve({ id_categoria: id_categoriac, nombre_categoria: categoryName, topFour });
                    } catch (err) {
                        reject(err);
                    }
                });
            });
        };

        // Procesar todas las categorías
        const processCategoryPositions = async () => {
            try {
                const positions = await Promise.all(categories.map(category => {
                    return getPositionsForCategory(category.id_categoria, category.nombre);
                }));

                response.status(200).json({
                    statusCode: 200,
                    message: "Top 4 posiciones obtenidas con éxito para todas las categorías",
                    data: positions
                });
            } catch (err) {
                response.status(500).json({
                    statusCode: 500,
                    message: "Error al procesar las categorías",
                    error: err.message
                });
            }
        };

        // Ejecutar el procesamiento
        processCategoryPositions();
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
    getTopFourPositionsForAllCategories,
    deleteDeportistas,
    updateDeportista,
    generarRondasPoomsaeParaTodasLasCategorias,
    verRondasPoomsaeParaTodasLasCategorias,
    asignarPuntajePoomsae
};