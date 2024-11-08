const express = require('express');
const app = express();
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
dotenv.config({path: 'src/.env'});

const sqlite3 = require('sqlite3').verbose();

const db = new sqlite3.Database('src/configuracion/database.db', sqlite3.OPEN_READWRITE, (err) => {
    if(err){
        console.error(err.message);
    }
    else{
        console.log('Conectado a la base de datos');
    }
});

let sql = `create table if not exists usuarios (id INTEGER PRIMARY KEY AUTOINCREMENT
    , username text unique not null 
    , password text not null
    , createdAt datetime default current_timestamp
    , updatedAt datetime default current_timestamp
    , email text
    , lastToken text)`;

db.run(sql, (err) => {
    if(err){
        console.error(err.message);
    }
    else{
        console.log('Tabla usuarios creada');
    }
});

sql = `create table if not exists producto (id INTEGER PRIMARY KEY AUTOINCREMENT
    , name varchar(100) not null 
    , description text not null
    , price decimal(10,2) default 0.00
    , userId int 
    , createdAt datetime default current_timestamp
    , updatedAt datetime
    , foreign key (userId) references usuarios(id))`;

    db.run(sql, (err) => {
        if(err){
            console.error(err.message);
        }
        else{
            console.log('Tabla productos creada');
        }
    });

// Importar rutas
const rutasUsuarios = require('./rutas/usuarios.router');
const rutasProductos = require('./rutas/productos.router');

// Middleware
app.use(express.json());
app.use(bodyParser.urlencoded({extended: false}, {limit: '200mb'}));
app.use(bodyParser.json());
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Headers', 'Authorization, X-API-KEY, Origin'
    + ', X-Requested-With, Content-Type, Accept, Access-Control-Allow-Request-Method, token');
	res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
	res.setHeader('Allow', 'GET, POST, OPTIONS, PUT, DELETE');
	next();
});

// Uso de rutas

app.use('/api', rutasUsuarios);
app.use('/api', rutasProductos);

app.listen(process.env.puerto, () => {
    console.log(`Server is running on port ${process.env.puerto}`);
});