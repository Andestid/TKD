const respuesta = (req, res, next) => {
    res.sendResponse = (data = {}) => {
        const responseObject = {
            statusCode: data.statusCode || 200,
            body: JSON.stringify(data) || null,
            headers: { 'Content-Type': 'application/json' }
        };
        res.status(responseObject.statusCode).set(responseObject.headers).send(responseObject.body);
    };
    next(); // Pasa el control al siguiente middleware o ruta
};

module.exports = respuesta;