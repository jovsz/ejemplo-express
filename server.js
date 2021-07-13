const express = require("express");
const path = require("path");
const { users } = require("./models");
//importarmos passport
const passport = require("passport");
//inicializar sequelize con almacenamiento en base de datos
let {sequelize} = require("./models");
const session = require("express-session"); 
const SequelizeStore = require("connect-session-sequelize")(session.Store); 



//exoress
const app = express();
//puerto
const PORT = 8000;


//Configuración EJS
//1. Definiendo en donde se ubicará el directorio views
app.set("views", path.join(__dirname, "views"));
//2. Definiendo el motor que usaremos
app.set("view engine", "ejs");

//middleware de terceros
app.use(session({
  secret: 'academlo secret',
  resave: false,  
  saveUninitialized: true,
  store: new SequelizeStore({
    expiration: 1 * 60 *60 *1000,
    db:sequelize //indicar como guardar la session
  })
}));//este middleware nos ayudara a salvar la sesion en memoria del servidor!

app.use(passport.initialize()); //inicializar passport para poder utilizarlo
app.use(passport.session()); ////para habilitar las sesiones con passport

//Middleware incorporado (built-in)
//express.static nos servirá para poder servir archivos de forma estatica
app.use(express.urlencoded({extended: true})); //Permite procesar los datos enviados por el cliente a través de x-www-form-urlencoded
app.use(express.json()); //Permite procesar los datos enviados por el cliente a través de application/json
app.use(express.static('public'));

//Middleware de aplicacion trabaja con los métodos HTTP (GET, POST, PUT, DELETE)
//Van manejar los objetos request, response y una función llamada next
app.get("/", (request, response) => {
    response.render("pages/home", {
        title: "Inicio",
        message: "Hola mundo con EJS",
    });
});

app.get('/categorias', (request, response) => {
  if(request.isAuthenticated()){
    let fullname = `${request.user.firstname} ${request.user.lastname}`;
    return response.render('pages/categories', {title: 'Categorias', usernamee: fullname});
  }else{return response.redirect('/login');}
  response.render('pages/categories', {title: 'Categorias'});
})


app.get("/logout", (request,response) => {
  request.logout();
  response.redirect("/login");
})

//login
app.get(("/login"),(request,response) =>{
  return response.render("pages/login", {title:'Iniciar Session'});
});


//se crea la peticion post para el inicio de sesion
app.post("/login", passport.authenticate("local", { 
  failureRedirect: '/login', 
  successRedirect: '/categorias' 
}), (err,request,response, next) => {
  //middleware
  if(err){
    return next(err)
  }
});
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/');
  });

app.get("/registro", (request, response) => {
  response.render("pages/register", {title: 'Resgistro'});
});

app.post("/registro", async (request, response, next) => {
  let {firstname, lastname, email, password} = request.body;
  try{
    await users.create({firstname, lastname, email, password});
    response.redirect("/registro");
  }catch(error){
    next(error);
  }
});

app.use((request, response) => {
  let pathNotFound = path.join(__dirname, "public", "404.html");
  response.status(404).sendFile(pathNotFound);
});

//Middleware para el manejo de errores
app.use((error, request, response, next) => {
  const errors = require("./utils/errorMessages");
  response.status(404).send(errors[error.name]);
  if(error){
    response.redirect("/login");
    alert(error.message);
  }
  
});

app.use((err,request,response,next) => {
  if(err.name === 'SequelizeUniqueConstraintError'){
    response.status(404).send('Ya existe un usuario con los mismos valores');
    response.redirect('/registro');
  }else{
    response.status(404).send('404');
  }
})

app.listen(PORT, () => {
  console.log(`Servidor escuchando sobre el puerto ${PORT}`);
});
