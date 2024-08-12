const express = require("express");
const app = express();

const dotenv = require("dotenv");
dotenv.config();

app.use(express.json());
app.use(require('./utils/res.js')); // Middleware personalizado

// Importar rutas
const deportistasRoutes = require('./routes/deportistasRoutes');
const categoriasRoutes = require('./routes/categoriasRoutes');

// Usar rutas
app.use(deportistasRoutes);
app.use(categoriasRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en el puerto ${PORT}`);
});

module.exports = app;