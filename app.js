var express = require('express');
var mysql = require('mysql');
var fileUpload = require('express-fileupload');

const bodyParser = require('body-parser');

var cors = require('cors');

var app = express();

app.use(cors());

app.use(fileUpload());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

const conn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'password',
    database: 'proyecto-angular-db'
});

conn.connect();

app.listen(3000, () => {
    console.log('Express Server - Puerto 3000 online');
});

app.get('/productos', (req, res) => {
    const sql = 'SELECT * FROM productos';
    conn.query(sql, (err, results) => {
        if (err) throw err;
        res.status(200).json({
            ok: true,
            productos: results
        });
    });
});

app.get('/', (req, res) => {
    res.status(200).json({
        ok: true,
        mensaje: 'Petición realizada correctamente'
    });
});

app.post('/productos', (req, res) => {
    const { name, code, date, price, description, rating, image } = req.body;
    const sql = `INSERT INTO productos
        (productName, productCode, releaseDate, price, description, starRating, imageURL)
        VALUES (?, ?, ?, ?, ?, ?, ?)`;
    conn.query(sql, [name, code, date, parseInt(price), description, parseInt(rating), image], (err, result) => {
        if (err) throw err;
        res.status(200).json({
            ok: true,
            mensaje: 'Producto añadido correctamente'
        });
    })
});

app.get('/producto/:id', (req, res) => {
    const { id } = req.params.id;
    const sql = 'Select * FROM productos WHERE productId = ?';

    conn.query(sql, [id], (err, results) => {
        if (results.length === 0) {
            return res.status(404).send('Error, el id seleccionado no existe');
        }

        if (err) throw err;
        res.status(200).json({
            ok: true,
            producto: results
        });
    });
});

app.delete('/productos/:id', (req, res) => {
    const sql = 'DELETE FROM productos WHERE productId = ?';
    conn.query(sql, [req.params.id], (err, result) => {
        if (err) throw err;
        res.status(200).json({
            ok: true,
            mensaje: 'Producto eliminado correctamente'
        });
    });
});

app.put('/productos/:id', (req, res) => {
    const { name, code, date, price, description, rate } = req.body;
    if (!name || !code || !date || !price || !description || !rate) {
        return res.status(400).send('No hay req body');
    }
    const sql = 'UPDATE productos SET productName = ?, productCode = ?, releaseDate = ?, price = ?, description = ?, starRating = ? WHERE productId = ?';
    conn.query(sql, [name, code, date, parseInt(price), description, parseInt(rate), req.params.id], (err, result) => {
        if (err) throw err;
        res.status(200).json({
            ok: true,
            mensaje: 'Producto actualizado correctamente'
        });
    });
});

app.put('/upload/productos/:id', (req, res) => {
    if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
            ok: false,
            mensaje: 'No se ha seleccionado ningún archivo'
        });
    }

    const file = req.files.image;
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = ['png', 'jpg', 'jpeg', 'gif'];

    if (!allowedExtensions.includes(fileExtension)) {
        return res.status(400).json({
            ok: false,
            mensaje: 'Tipo de extensión no permitido'
        });
    }

    const productId = req.params.id;
    const fileName = `${productId}-${new Date().getMilliseconds()}.${fileExtension}`;
    const uploadPath = __dirname + '/upload/productos/' + fileName;

    file.mv(uploadPath, (err) => {
        if (err) {
            return res.status(500).json({
                ok: false,
                mensaje: 'Error al subir el archivo',
                error: err
            });
        }

        const sql = 'UPDATE productos SET imageUrl = ? WHERE productId = ?';
        conn.query(sql, [uploadPath, productId], (err, result) => {
            if (err) throw err;
            res.status(200).json({
                ok: true,
                mensaje: 'Archivo subido y producto actualizado correctamente'
            });
        });
    });
});