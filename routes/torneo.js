const express = require("express");
const app = express();

const dotenv = require("dotenv");
dotenv.config();

app.use(require('../utils/res.js'));

//conexión con la base de datos
const {connection} = require("../db.js");

const getdeportistas = (request, response) => {
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

//ruta
app.route("/torneo")
.get(getdeportistas);

const getcategoriaspoomsae = (request, response) => {
    connection.query("SELECT * FROM categorias_poomsae", 
    (error, results) => {
        if (error) {
            response.sendResponse({
                statusCode: 500,
                message: "Error al obtener las categorias poomsae",
                error: error.message
            });
        } else {
            response.sendResponse({
                statusCode: 200,
                message: "Categorias poomsae obtenidas con éxito",
                data: results
            });
        }
    });
};

//ruta
app.route("/categoriaspoomsae")
.get(getcategoriaspoomsae);

const postdeportistas = (request, response) => {
    const {nombre, apellido, sexo, peso, club} = request.body;
    connection.query("INSERT INTO deportista (nombre, apellido, sexo, peso, club) VALUES (?,?,?,?,?)", 
    [nombre, apellido, sexo, peso, club],
    (error, results) => {
        if (error) {
            response.sendResponse({
                statusCode: 500,
                message: "Error al obtener al registrar deportista",
                error: error.message
            });
        } else {
            response.sendResponse({
                statusCode: 200,
                message: "Deportista registrado con exito"
            });
        }
    });
};

//ruta
app.route("/torneo")
.post(postdeportistas);

const validaciondeportista = (id) => {
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
                const sexo = results[0].sexo;
                resolve(sexo); // Resuelve la promesa con el sexo
            }
        });
    });
};

//ruta
app.route("/torneo/:id")
.get(validaciondeportista);

const inscribircombate = (request, response) => {
    const {id_deportista, id_categoriac} = request.body;
    connection.query("INSERT INTO inscritos_combate (id_deportista, id_categoriac) VALUES (?,?)", 
    [id_deportista, id_categoriac],
    (error, results) => {
        if (error) {
            response.sendResponse({
                statusCode: 500,
                message: "Error al obtener al registrar deportista en combate",
                error: error.message
            });
        } else {
            response.sendResponse({
                statusCode: 200,
                message: "Inscripcion combate registrada con exito"
            });
        }
    });
};

//ruta
app.route("/inscribircombate")
.post(inscribircombate);

const inscribirpoomsae = async (request, response) => {
    const {id_deportista, id_categoriap} = request.body;
    try {
    const deportista = await validaciondeportista(id_deportista);
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
                message: "Inscripcion poomsae registrada con exito"
            });
        }
    });
} catch (error) {
    response.sendResponse({
        statusCode: 500,
        message: "No se pudo validar al deportista",
        error: error.message
    });
}
};

//ruta
app.route("/inscribirpoomsae")
.post(inscribirpoomsae);

const verDeportistasPorCategoria = (request, response) => {
    const { id_categoriac } = request.params;

    // Validación del parámetro
    if (!id_categoriac) {
        return response.status(400).json({ error: "Falta el ID de la categoría." });
    }

    // Consulta a la base de datos
    const query = `
        SELECT d.id_deportista, d.nombre, d.apellido 
        FROM deportista AS d
        INNER JOIN inscritos_combate AS ic ON d.id_deportista = ic.id_deportista
        WHERE ic.id_categoriac = ?;
    `;
    
    connection.query(query, [id_categoriac], (error, results) => {
        if (error) {
            response.sendResponse({
                statusCode: 500,
                message: "Error al obtener los deportistas de esta categoria",
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

//ruta
app.route("/categorias/:id_categoriac/deportistas")
    .get(verDeportistasPorCategoria);

module.exports = app;