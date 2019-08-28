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
var posts= [];
var newPosts = [];
var oldPosts = [];
var ShowPosts = [];

server= express()
  .use(express.static(__dirname + '/public'))
  .use(bodyParser.urlencoded({ extended: true }))
  .use(bodyParser.json())
  .get('/', function(req, res){  res.sendFile(__dirname + '/login.html')})
  .get('/login', function(req, res){  res.sendFile(__dirname + '/login.html')})
  .get('/register', function(req, res){  res.sendFile(__dirname + '/register.html')})
  .get('/getNewPosts',function(req,res){
      getOldNewPosts();
      res.json(ConsultarPublicaciones(newPosts))
  })
  .get('/getAllPosts',function(req,res){
      res.json(ConsultarPublicaciones(posts))
  })
  .post('/customPost',function(req,res){
    var id = req.body.id;
    var op = req.body.op;
    customPost(id,op)
    if(ShowPosts.length>=10)sendToClients(ShowPosts)
    res.json(ShowPosts)
  })
  .post('/login',urlencodedParser,function(req,res){
    res.sendFile(__dirname + '/admin.html')
   /*MongoClient.connect(url, function(err, client) {
     const db = client.db('heroku_r7qx1635');
   db.collection('usuarios').findOne({ name: req.body.name}, function(err, user) {
             if(user ===null){
               res.end("Login invalid");
            }else if (user.name === req.body.name && user.pass === req.body.pass){
            res.sendFile(__dirname + '/admin.html')
          } else {
            console.log("Credentials wrong");
            res.end("Login invalid");
          }
   });
 });*/
})
  .listen(PORT, () => console.log(`Listening on ${ PORT }`))



  var SocketServer = require('ws').Server;
  wss = new SocketServer({
      server
  });
  wss.on('connection', (ws) => {
    console.log('Client connected');
    ws.on('close', () => console.log('Client disconnected'));
    /*ws.on('message', function(message) {
      console.log(message)
  });*/
  });

  setInterval(() => {
	    wss.clients.forEach((client) => {
      client.send("test conection");
    });
  }, 2000);


  setInterval(() => {
      console.log("hello")
	    ConsumeInstagramApi("dogs");
      setTimeout(function(){
        ConsumeInstagramApi("McD%C3%ADaFeliz");
      }, 65000);
      setTimeout(function(){
        ConsumeInstagramApi("McDiaFeliz");
      }, 140000);
  }, 220000);//220000



function customPost(id,op){
  if(op==1){
    if(ShowPosts.length==12){
      ShowPosts.shift();
    }
  }

  for(var i=0;i<posts.length;i++){
    if(id==posts[i].id){
      if(op==1)
        ShowPosts.push(posts[i]);
      else
         RemovePosts(id)
      posts[i].estado=op;
      break;
    }
  }
}

function getOldNewPosts(){
  newPosts = []
  if(oldPosts.length>0){
    for(var i=0;i<posts.length;i++){
      var bandera = 1
      for(var j=0;j<oldPosts.length;j++){
        if(posts[i]===oldPosts[j]){
          bandera = 0
        }
      }
      if(bandera){
        newPosts.push(posts[i]);
        oldPosts.push(posts[i]);
      }
    }
  }
  else{
    newPosts=newPosts.concat(posts);
    oldPosts=oldPosts.concat(posts);
  }
}

function RemovePosts(id){
  for(var i = ShowPosts.length - 1; i >= 0; i--) {
    if(ShowPosts[i].id == id) {
       ShowPosts.splice(i, 1);
    }
}
}

function ConsultarPublicaciones(Posts){
  Posts.sort(function(a, b){
    var keyA = new Date(a.timestamp),
        keyB = new Date(b.timestamp);
    if(keyA < keyB) return -1;
    if(keyA > keyB) return 1;
    return 0;
});
  return Posts;
}


function ConsolidateInfoUser(text,img,iduser,id,timestamp){
  request('https://i.instagram.com/api/v1/users/'+iduser+'/info/', function (error, response, body) {
    var usuario = JSON.parse(body)
    if(usuario["user"]){
      var post = {
        id : id,
        text : text,
        img : img,
        user : usuario["user"]["username"],
        timestamp : timestamp,
        estado : 0
      }
      pushPosts(post);
      console.log("Posts Size:",posts.length)
      console.log("Old Posts Size:",oldPosts.length)
    }
    else{console.log(usuario)}
  });
}

function existePostbyId(id){
  for(var i=0;i<posts.length;i++){
    if(id==posts[i].id){
      return 1;
    }
  }
  return 0;
}

function pushPosts(post){
//si no existe no volver a insertar
      if(!existePostbyId(post.id)){
        posts.push(post)
      }

}

function ConsumeInstagramApi(api){
   request('https://www.instagram.com/explore/tags/'+api+'/?__a=1', function (error, response, body) {
     console.log("Consultado...",api);
     if(body){
       if(!error){
         if(body.substring(0, 1)=="<") {
           console.log("Error en Body Api Response")
           return;
         }
         var publicaciones = JSON.parse(body);
         publicaciones = publicaciones["graphql"]["hashtag"]["edge_hashtag_to_media"]["edges"]
         for(i = 0; i < publicaciones.length; i++){
           (function(i){
             setTimeout(function(){
               if( publicaciones[i]["node"]["edge_media_to_caption"]["edges"].length)var text= publicaciones[i]["node"]["edge_media_to_caption"]["edges"][0]["node"]["text"].substring(0, 150);
               else var text="..."
               var img = publicaciones[i]["node"]["display_url"]
               var iduser = publicaciones[i]["node"]["owner"]["id"]
               var id = publicaciones[i]["node"]["id"]
               var timestamp = publicaciones[i]["node"]["taken_at_timestamp"]
               ConsolidateInfoUser(text,img,iduser,id,timestamp);
            }, 3000);
          })(i);
         }

     }
   }else{
     console.log("error:",error)
   }
   });

}
function sendToClients(message){
  var message = JSON.stringify(message);
  var bandera=0
  wss.clients.forEach((client) => {
    client.send(message);
    bandera=1;
  });
  if(!bandera)console.log("No hay clientes conectados")
}
