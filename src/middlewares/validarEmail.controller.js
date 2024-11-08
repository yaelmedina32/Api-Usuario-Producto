const express = require('express');

const router = express.Router();
const verificar = router.use((req, res,  next) =>{
    const email = req.body.email;
    if(!email){
        //Lo salto porque lo voy a usar para registrar el usuario y actualizarlo, para registrarlo no lo voy a tomar necesario, por lo que 
        //ese parametro no es obligatorio en el register, pero en el update sí lo es, esa parte la validaré en el endpoint
        next();
        return;
    }
    const validador = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    if(!validador.test(email)){
        return res.status(400).send({message: 'El email no es válido'});
    }
    next();
})

module.exports = verificar;