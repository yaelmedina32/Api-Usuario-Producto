const express = require('express');
const rutas = express.Router();
const verificarToken = require('../controladores/verificarToken.router');
const verificarEmail = require('../middlewares/validarEmail.controller');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();

const dotenv = require('dotenv');

//Se indica la llave para el token
dotenv.config({path: 'src/.env'});
app.set('key', process.env.llave);

//Se conecta a la base de datos por medio del archivo auxiliar database.db
const db = new sqlite3.Database('src/configuracion/database.db', sqlite3.OPEN_READWRITE, (err) => {
    if(err){
        console.error(err.message);
    }
    else{
        console.log('Router disponible para usuarios');
    }
});

//Endpoint para obtener todos los usuarios
rutas.get('/users', verificarToken, async(req, res) => {
    let sql = `select * from usuarios`;
    db.all(sql, [], (err, rows) => {
        if(err){
            console.error(err.message);
            res.send('Error al obtener los usuarios');
        }
        else{
            res.send(rows);
        }
    });
});

//Endpoint para obtener todos los usuarios
rutas.get('/users/:userid', verificarToken, async(req, res) => {
    const userid = req.params.userid;
    if(isNaN(userid)){
        return res.status(400).send({message: 'El id debe ser un número'});
    }
    let sql = `select * from usuarios where id = ?`;
    db.all(sql, [userid], (err, rows) => {
        if(err){
            console.error(err.message);
            res.send('Error al obtener los usuarios');
        }
        else{
            if(rows.length == 0){
                return res.status(200).send({message: 'No se encontraron usuarios con ese id'});
            }
            return res.send(rows);
        }
    });
});

//Endpoint para obtener el token de sesion del loggeo
rutas.post('/login', async(req, res) => {
    const datos = req.body;
    const username = datos.username;
    const password = datos.password;
    /**
     * Aquí tenia planeado insertar el token en la base de datos, pero siento que puede ser
     * un poco inseguro, porque cualquiera que vea ese token va a poder acceder al usuarioid,
     * y por consiguiente puede afectar a los datos de producto asociados a ese usuario.
     */
    if(!username || !password){
        return res.status(400).send({message: 'El usuario y/o la contraseña no pueden estar vacíos'});
    }

    let sql = `select * from usuarios where username = ?`;
    //Se busca el usuario en la base de datos, para luego comparar la contraseña
    db.get(sql, [username], async(err, row) => {
        if(err){
            return res.status(500).send({message: 'Error al obtener el usuario'});
        }

        if(!row){
            return res.status(400).send({message: 'El usuario no existe'});
        }
        //La compraación de la contraseña se hace con bcrypt.compare
        const valido = await bcrypt.compare(password, row.password);

        if(!valido){
            return res.status(400).send({message: 'Contraseña incorrecta'});
        }
        //Creación de token
        const payload = {
            check: true
        };
        const token = jwt.sign(payload, app.get('key'),{
            expiresIn: '1h'
        });
        sql = `update usuarios set lastToken = ? where id = ?`
        db.run(sql, [token, row.id], (err) => {
            if(err){
                return res.status(500).send({error: err});
            }
            return res.status(200).send({token: token});
        })
    });
});

//Registro de usuarios
rutas.post('/register', verificarEmail, async(req, res) => {
    const datos = req.body;
    const username = datos.username;
    const password = datos.password;
    const email = datos.email;

    let sql = `select * from usuarios where username = ?`;

    db.get(sql, [username], async(err, row) => {
        if(err){
            return res.status(500).send({message: 'Error al registrar el usuario'});
        }
        if(row){
            return res.status(400).send({message: 'El usuario ya existe'});
        }

        if(!username || !password){
            return res.status(400).send({message: 'El usuario y/o la contraseña no pueden estar vacíos'});
        }
        
        if(password.length < 8){
            return res.status(400).send({message: 'La contraseña debe tener al menos 8 caracteres'});
        }

        email ? consulta = `select count(*) total from usuarios where email = ?` : "";
        db.get(consulta, [email ? email : ''], async(err, row) => {
            if(row.total > 0){
                return res.status(400).send({message: 'El email ya existe'});
            }
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash(password, salt);
            sql = `insert into usuarios (username, password, email, createdat) values (?, ?, ?, datetime('now'))`;
            db.run(sql, [username, hash, email], (err) => {
                if(err){
                    console.error(err.message);
                    return res.status(500).send({message: 'Error al registrar el usuario'});
                }
                else{
                    return res.status(200).send({message: 'Usuario registrado'});
                }
            });   
        });
    });
});

//Actualizar usuario
rutas.put('/users', verificarToken, verificarEmail, (req,res) => {
    const datos = req.body;
    const username = datos.username;
    const email = datos.email;
    if(!username || !email){
        return res.status(400).send({message: 'El usuario y/o el email no pueden estar vacíos'});
    };

    let sql = `select * from usuarios where username = ?`;	
    db.get(sql, [username], (err, row) => {
        if(err){
            return res.status(500).send({message: 'Error al actualizar el usuario'});
        }
        if(!row){
            return res.status(400).send({message: 'El usuario no existe'});
        }else{
            sql = `update usuarios set email = ?, updatedAt = dateTime('now') where username = ?`;
            db.run(sql, [email, username], (err) => {
                if(err){
                    console.error(err.message);
                    return res.status(500).send({message: 'Error al actualizar el usuario'});
                }
                else{
                    return res.status(200).send({message: 'Usuario actualizado con éxito'});
                }
            });
        }
    });
})

//Eliminar usuario
rutas.delete('/users/:id', verificarToken, async(req, res) => {
    const id = req.params.id;
    if(isNaN(id)){
        return res.status(400).send({message: 'El id debe ser un número'});
    }
    let sql = `delete from usuarios where id = ?`;
    db.run(sql, [id], (err, msg) => {
        if(err){
            console.error(err.message);
            return res.status(500).send({message: 'Error al eliminar el usuario'});
        }
        else{
            return res.status(200).send({message: 'Usuario eliminado con éxito'});
        }
    });
});

module.exports = rutas;
