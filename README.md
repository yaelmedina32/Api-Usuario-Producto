# README
## CONTENIDO DEL ARCHIVO

* Introducción
* Instalaciones
* Explicación de endpoints Usuarios
* Explicación de endpoints Productos

## Introducción

Este es un proyecto de una prueba técnica desarrollada como parte de los primeros
procesos para el reclutamiento de la empresa farmacéutica "Prixz".

Dentro de los apartados y funcionalidades que se estarán viendo son CRUDS sencillos 
para el manejo de loggeos de usuarios y de productos.

Cabe resaltar que una vez que se haya iniciado el proyecto, se crearán por sí solas las tablas para
el funcionamiento de la API. Por lo que es necesario que haya un archivo "database.db" en src > configuracion

## Instrucciones para inciar el servidor

Para poder iniciar el servidor, tenemos que correr el archivo "index.js" con el comando node dentro
del símbolo de sistema:

(En carpeta raíz) -> node src/index.js
(En carpeta src) -> node index.js

## Instalaciones

Primero, debemos instalar las dependencias marcadas en el package.json, ejecutando "npm install".
En caso de que no se encuentre el archivo package.json, tenemos que instalar
de una a una las dependiencias que van a 
ser las que nos permitirán manejar los distintos procesos que necesitamos para
que funcione la API:

    1. npm install express (Para poder correr y escuchar las peticiones que van a entrar en nuestra api)
    2. npm install jsonwebtoken (Para poder validar las sesiones de los usuarios)
    3. npm install bcrypt (Para encriptar las contraseñas)
    4. npm install sqlite3 (Para la BD)
    5. npm install body-parser (Para poder recibir peticiones por medio del body)
    6. npm install dotenv (Para ocultar las contraseñas y todo lo importante en nuestro proyecto)

## Explicación de endpoints Usuarios

* (post) /api/register
    Este endpoint va a ser el primero que vamos a requerir, ya que vamos a necesitar usuarios para 
    poder seguir con cualquier otro proceso dentro de toda la api.
    Lo que tenemos que hacer es entrar a Postman o Thunder Client (En VSC), y colocar la URL, y dentro
    del body, colocar los siguientes datos (ejemplo):
    {
        "username": "yael",
        "password": "admin123",
        "email": "yaelmedina900@gmail.com"
    }
    response:
        (200): "Usuario registrado"
        (500): "Error al registrar el usuario"
        (400): "El usuario ya existe"

    Esto va a insertar un usuario nuevo

* (post) /api/login
    Este endpoint es el siguiente paso para poder seguir con cualquier otro endpoint. Ya que, una vez
    se haya loggeado el usuario, se va a generar un token de sesión que le va a permitir interactuar
    con lo demás. Por lo que, se va a devolver el token en caso de que la autenticación haya salido bien.
    ## NOTA: A partir de aquí, los demás endpoints tendrán que llevar en los headers "token": "token generado por este endpoint"
    {
        "username": "yael",
        "password": "admin123"
    } 
    response:
        (200): {token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjaGVjayI6dHJ1ZSwiaWF0IjoxNzMxMDM0MjEwLCJleHAiOjE3MzEwMzc4MTB9.N60GxHWE65HTHWXTmynxx7HmF8FHiEnzbrI9XmIdknc"}
        (500): {message: "Error al obtener el usuario", error: error}
        (400): "Contraseña incorrecta"

* (get) /api/users
    Este endpoint va a devolver todos los usuarios registrados, pero va a necesitar tener el token de autenticación
    dentro de los headers, con el atributo "token" y el token regresado por el login.
    response:
        (200): [{id: 1, username: "yael", password: "$124kla91294120asf01", createdAt: datetime, updatedAt: datetime, email: "email", lastToken: "token login"}]
        (500): {message: "Error al obtener los usuarios", error: error}

* (get) /api/users/:id
    Este endpoint de la misma forma, va a devolver el usuario con el id indicado, e igual, va a requerir del token
    de autenticación.
        response:
        (200): {id: 1, username: "yael", password: "$124kla91294120asf01", createdAt: datetime, updatedAt: datetime, email: "email", lastToken: "token login"}
        (200): {message: "No se encontraron usuarios con ese id"}
        (500): {message: "Error al obtener los usuarios", error: error}

* (put) /api/users/:id
    Este endpoint va a actualizar un usuario en específico, tomando en cuenta el token de autenticación para dejar
    avanzar en el proceso. E igual, se debe colocar un id entero dentro de los parámetros de la URL
    Ejemplo body:
    {
        "username": "yael",
        "email": "yaelmedina880@gmail.com"
    }
    (200): "Usuario actualizado con éxito"
    (500): "Error al actualizar el usuario"
    (400): "El nombre de usuario seleccionado ya existe"

* (delete) /api/users/:id
    Este endpoint va a eliminar un usuario en específico, tomando en cuenta el token de autenticación para dejar
    avanzar en el proceso. E igual, se debe colocar un id entero dentro de los parámetros de la URL

    (200): "Usuario eliminado con éxito"
    (500): {message: "Error al eliminar el usuario", error: error}
    (400): "El usuario que intenta eliminar no existe"

## Explicación de endpoints Productos


* (post) /api/products
    Este endpoint va a permitir insertar productos, pero esto va a ser posible en base a la autenticación del usuario,
    ya que cada producto tiene que tener un creador asociado (usuario). 
    Por lo que tiene que tener el token dentro de los headers.
    Ejemplo del body:
    {
        "name": "Pan de trigo",
        "description": "Con mermelada",
        "price": 100.00
    }
    response: 
        (200):{
                "mensaje": "Producto creado con éxito",
                "productId": 7
              }
        (400): {message: "Ya existe un producto con ese nombre asignado"}
        (500): {message: "Error al obtener el producto", error: error}

* (get) /api/products
    Este endpoint va a devolver todos los productos registrados, pero va a necesitar tener el token de autenticación
    dentro de los headers, con el atributo "token" y el token regresado por el login.
    response:
        (200): [{"id": 1,"name": "Arroz","description": "Con leche","price": 100,"userId": 1,"createdAt": "2024-11-08 02:40:49","updatedAt": "2024-11-08 02:40:49"}, { "id": 2, "name": "Pan", "description": "Con leche", "price": 100, "userId": 2, "createdAt": "2024-11-08 02:41:11", "updatedAt": "2024-11-08 02:41:11"}]
        (500): {message: "Error al obtener los productos", error: error}

* (put) /api/products/:id
    Este endpoint sirve para actualizar los datos del producto indicado, en base a los datos que se
    pasen por medio del body, pero esto siempre y cuando pertenezca al usuario loggeado. 
    Ejemplo del body:
    {
        "price": 200,
        "description": "Con manzana",
        "name": "Cereal"
    }
    response:
        (200): {message: 'Producto actualizado con éxito'}
        (500): {message: 'Error al obtener el producto', error: error}
        (400): {message: "El producto seleccionado no pertenece al usuario actual"}

* (delete) /api/products/:id
    Este endpoint nos va a servir para eliminar los datos de un producto indicado, pero siempre y 
    cuando este producto pertenezca al usuario loggeado (por medio del token de sesión).

    response:
    
        (200): {message: "Producto eliminado con éxito"}
        (500): {message: "Error al querer eliminar el producto", error: error}
        (400): {message: "El producto seleccionado no pertenece al usuario actual""}
        