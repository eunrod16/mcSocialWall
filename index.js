/*Librerías Importadas*/
const express = require('express')
const bodyParser = require('body-parser')
const PORT = process.env.PORT || 5000
const path = require('path')
const util = require('util')
const request = require('request')
const multer = require('multer');
const MongoClient = require('mongodb').MongoClient;
const urlencodedParser = bodyParser.urlencoded({extended:false});

/*Variables*/
var message="Hola desde el server"
var url = 'mongodb://eunice:mc2018@ds259210.mlab.com:59210/heroku_r7qx1635';

server= express()
  .use(express.static(__dirname + '/public'))
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.json())
  .get('/', function(req, res){  res.render(__dirname + "admin.html", {name:"name"});})
  .get('/login', function(req, res){  res.sendFile(__dirname + '/login.html')})
  .get('/register', function(req, res){  res.sendFile(__dirname + '/register.html')})
  .post('/enviar',function(req,res){
    message = JSON.stringify(req.body, null, 2);
    console.log(message)
    bandera=0;
    wss.clients.forEach((client) => {
      client.send(message);
      bandera=1;
    });
    if(bandera)res.json(message)
    else res.send("No hay clientes conectados")
  })
  .post('/getClientesConectados',function(req,res){
    clientes_online=0;
    wss.clients.forEach((client) => {
    clientes_online++;
  });
     res.json(clientes_online)

  })
  .post('/consultAPI',function(req,res){
      if(intervalAPIWorldCup) {
        apagarIntervalo()
        res.json("Apagado")
      }
      else{
        encenderIntervalo()
        res.json("Encendido")
      }

  })
  .post('/login',urlencodedParser,function(req,res){
   MongoClient.connect(url, function(err, client) {
     const db = client.db('heroku_r7qx1635');
   db.collection('usuarios').findOne({ name: req.body.name}, function(err, user) {
             if(user ===null){
               res.end("Login invalid");
            }else if (user.name === req.body.name && user.pass === req.body.pass){
            res.sendFile(__dirname + '/index.html')
          } else {
            console.log("Credentials wrong");
            res.end("Login invalid");
          }
   });
 });
})
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))



  var SocketServer = require('ws').Server;
  wss = new SocketServer({
      server
  });
  wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('close', () => console.log('Client disconnected'));
    ws.on('message', function(message) {
      console.log(message)
  });
  });

  setInterval(() => {
	    wss.clients.forEach((client) => {
      client.send("test conection");
    });
  }, 2000);



/*Intervalo consumiendo API de FIFA WORLD CUP */
function apagarIntervalo(){
  console.log("apagado");
  clearInterval(intervalAPIWorldCup);
  intervalAPIWorldCup=null;
}

function encenderIntervalo(){
  intervalAPIWorldCup= setInterval(() => {
   request('https://www.instagram.com/explore/tags/mcguate/?__a=1', function (error, response, body) {
     if(body){
       if(!error){
         var publicaciones = JSON.parse(body);
         publicaciones = publicaciones["graphql"]["hashtag"]["edge_hashtag_to_media"]["edges"]
         for(i = 0; i < publicaciones.length; i++){

         }

        sendToChannel();



     }
   }else{
     console.log("error:",error)
   }


   });
 }, 3000);
}



function sendToChannel(){

  wss.clients.forEach((client) => {
    client.send(jsOnMessage);
  });
}
