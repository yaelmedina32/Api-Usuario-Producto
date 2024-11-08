const express = require('express');
const rutas = express.Router();
const verificarToken = require('../controladores/verificarToken.router');
const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('src/configuracion/database.db', sqlite3.OPEN_READWRITE, (err) => {
    if(err){
        console.error(err.message);
    }
    else{
        console.log('Router disponible para productos');
    }
});

rutas.get('/products', verificarToken, async(req, res) => {
    const lastToken = req.headers.token;
    const consulta = `select * from producto where userId = (select id from usuarios where lastToken = ?)`;
    db.all(consulta, [lastToken], (err, rows) => {
        if(err){
            console.error(err.message);
            return res.status(500).send({message: 'Error al obtener los productos', error: err});
        }
        return res.status(200).send(rows);
    });
});

rutas.post('/products', verificarToken, async(req, res) => {
    const datos = req.body;
    const name = datos.name;
    const description = datos.description;
    const price = datos.price;
    const lastToken = req.headers.token;
    //Primero valido que haya datos dentor del nombre, descripción y precio
    if(!name || !description || !price){
        return res.status(400).send({message: `Faltan los siguientes datos: `
        + `${!name ? 'Nombre ' : ''} ${!description ? 'Descripción' : ''} ${!price ? 'Precio ' : ''}`});
    }
    //Luego, valido que el tipo de dato del precio sea un número
    if(typeof price !== 'number'){
        return res.status(400).send({message: 'El precio debe ser un número'});
    };
    //Finalmente, checo que sea un número positivo
    if(price < 0){
        return res.status(400).send({message: 'El precio no puede ser negativo'});
    };
    //Como no se indica que se pase el id del usuario, lo que hice fue sacar el lastToken guardado dentro de la tabla de usuarios
    //para sacar el id del usuario que se autenticó con el token actual pasado desde el header
    let sql = `select * from usuarios where lastToken = ?`;
    db.get(sql, [lastToken], (err, row) => {
        if(err){
            console.error(err.message);
            return res.status(500).send({message: 'Error al obtener el usuario'});
        }
        //Luego checo que este usuario no tenga productos duplicados con el mismo nombre
        const userId = row.id
        sql = `select * from producto p
        inner join usuarios u on u.id = p.userId
        where p.name = ? and u.id = ?`;
        db.all(sql, [name, userId], (err, rows) => {
            if(err){
                console.error(err.message);
                return res.status(500).send({message: 'Error al obtener el producto', error: err});
            }
            if(rows.length > 0){
                return res.status(400).send({message: `Ya existe un producto con ese nombre asignado`});
            }
            sql = `insert into producto (name, description, price, userId, updatedAt) values (?, ?, ?, ?, datetime('now'))`;
                db.run(sql, [name, description, price, userId], (err) => {
                    if(err){
                        console.error(err.message);
                        return res.status(500).send({message: 'Error al insertar el producto'});
                    }
                    //Una vez insertado, lo selecciono con el nombre y el usuarioId loggeado
                    sql = `select * from producto where name = ? and userId = ?`;
                    db.get(sql, [name, userId], (err, row) => {
                        if(err){
                            return res.status(500).send({message: "Error al obtener el producto", error: err});
                        }
                        return res.status(200).send({message: 'Producto creado con éxito', productId: row.id});
                    })
                });
        });
    });
});

rutas.put('/products/:id', verificarToken, async(req, res) => {
    const datos = req.body;
    const name = datos.name;
    const description = datos.description;
    const price = datos.price;
    const id = req.params.id;
    const lastToken = req.headers.token;

    if(!name || !description || !price){
        return res.status(400).send({message: `Faltan los siguientes datos: `
        + `${!name ? 'Nombre ' : ''} ${!description ? 'Descripción' : ''} ${!price ? 'Precio ' : ''}`});
    }

    if(typeof price !== 'number'){
        return res.status(400).send({message: 'El precio debe ser un número'});
    };

    if(price < 0){
        return res.status(400).send({message: 'El precio no puede ser negativo'});
    };
    if(isNaN(id)){
        console.log(typeof id);
        return res.status(400).send({message: 'El id del producto debe ser entero'});
    }
    let sql = `select *, (select id from usuarios where lastToken = ?) usuarioActual
    from producto 
    where id = ?`;
    db.get(sql, [lastToken, id], (err, row) => {
        if(err){
            console.error(err.message);
            return res.status(500).send({message: 'Error al obtener el producto', error: err});
        }
        if(!row){
            return res.status(400).send({message: 'No se encontró el producto'});
        }
        if(row.userId != row.usuarioActual){
            return res.status(400).send({message: "El producto seleccionado no pertenece al usuario actual"})
        }
        sql = `update producto set name = ?, description = ?, price = ?, updatedAt = datetime('now') where id = ?`;
        db.run(sql, [name, description, price, id], (err) => {
            if(err){
                console.error(err.message);
                return res.status(500).send({message: 'Error al actualizar el producto'});
            }
            return res.status(200).send({message: 'Producto actualizado con éxito'});
        });
    });
});

rutas.delete('/products/:id', verificarToken, (req,res) => {
    const id = req.params.id;
    if(isNaN(id)){
        return res.status(400).send({message: "El id del producto debe ser un número"});
    }
    const lastToken = req.headers.token;
    //A parte de los datos que tiene el producto, estoy sacando el usuarioId loggeado dentro de la consulta
    //esto para poder validar, primero si es que el producto existe, y en caso de que sí,
    //validar que el usuario loggeado tenga el mismo usuarioId dentro de ese registro de producto
    let sql = `select *, (select id from usuarios where lastToken = ?) as usuarioActual 
    from producto where id = ?`;
    db.get(sql, [lastToken, id], (err, row) => {
        if(err){
            return res.status(500).send({message: "Error al validar la consulta", error: err});
        }
        if(!row){
            return res.status(400).send({message: "Producto no encontrado"});
        }
        if(row.usuarioActual != row.userId){
            return res.status(400).send({message: "El producto seleccionado no pertenece al usuario actual"});
        }
        sql = `delete from producto where id = ?`;
        db.run(sql, [id], (err) =>{
            if(err){
                return res.status(500).send({message: "Error al querer eliminar el producto", error: err});
            }
            return res.status(200).send({message: "Producto eliminado con éxito"});
        })
    })
})

module.exports = rutas;