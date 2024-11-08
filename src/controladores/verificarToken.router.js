const express = require('express');
const dotenv = require('dotenv');
dotenv.config({path: 'src/.env'});
const jwt = require('jsonwebtoken');

const app = express();
app.set('key', process.env.llave);

const router = express.Router();
const verificar = router.use((req, res, next) =>{
    const token = req.headers.token;
    jwt.verify(token, app.get('key'), (error, decoded)=>{
        if(!token){
            return res.status(506).send({errorToken: 'No se envió el token'});
        }
        if(error){
            return res.status(506).send({errorToken: 'Sesión caducada'});
        }
        req.decoded = decoded;
        next();
    })
})
module.exports = verificar;