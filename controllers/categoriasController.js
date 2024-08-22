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
    connection.query("SELECT * FROM combate where id_categoria = ?",
        [id_categoria],
        (error, results) => {
            if (error) {
                response.sendResponse({
                    statusCode: 500,
                    message: "Error al ver bracket",
                    error: error.message
                });
            } else {
                response.sendResponse({
                    statusCode: 200,
                    message: "Resultados del bracket",
                    data: results
                });
            }
        });
};

module.exports = {
    getCategoriasPoomsae,
    getCategoriasCombate,
    getBracketsCategoria
};