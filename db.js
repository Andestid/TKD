const dotenv = require("dotenv");
dotenv.config();

const mysql = require('mysql2'); // Cambia esto de 'mysql' a 'mysql2'


let connection;

try {
    connection = mysql.createConnection({
        host: process.env.MYSQLHOST,
        user: process.env.MYSQLUSER,
        password: process.env.MYSQLPASSWORD,
        database: process.env.MYSQLDATABASE,
        port: process.env.MYSQLPORT
    });

    connection.connect((err) => {
        if (err) {
            console.error("Error al conectar con la base de datos:", err.message);
            return;
        }
        console.log("Conectado a la base de datos.");
    });
} catch (error) {
    console.error("Error al configurar la conexión a la base de datos:", error.message);
}

module.exports = { connection };