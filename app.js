
/**
 * Module dependencies.
 */
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

var session = require("express-session");
var store = new session.MemoryStore();

var httpServer = require('http').Server(app);

var WebSocketServer = require("websocket").server;
var webSocketServer = new WebSocketServer({
  httpServer:httpServer,
  autoAcceptConnections:false
});

// Dies sollte ein zufaellig generierter Schluessel sein.
var signKey = "RHDwSKMa&vcxnkj";

app.use(bodyParser.json());
app.use(bodyParser.urlencoded( { extended : false } ));
app.use(cookieParser(signKey));
app.use(express.static(path.join(__dirname, 'public')));

app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(session({store:store}));

webSocketServer.on('request', function(request) {
  var sid = "";
  for (var i = 0; i < request.cookies.length; i++) {
    if(request.cookies[i].name === "connect.sid") {
      sid = request.cookies[i].value;
    }
  };

  var sessionID = cookieParser.signedCookie(sid,signKey);

  store.get(sessionID,function(err,session) {
    if(!session || !session.username) {
      request.reject();
      return;
    }
    else{
      request.accept();
    }
  });
});

webSocketServer.on("connect",function(socket){
  socket.on("message",function(message){
    if(message.type === 'utf8'){
      socket.send(message.utf8Data); 
    }
  });
  
});

function requiresLogin(req,res,next){
  if(!req.session.username){
    req.session.path = req.url;
    res.redirect('/login');
  }
  else{
    next();
  }
}

app.get('/login', function (req,res){
  res.render('login',{title:'Login'});
});

app.post('/login',function(req,res){
  if(req.body.username=="admin"&&req.body.password=="123"){
    var path = req.session.path;
    req.session.regenerate(function(err){
        var hour = 60*60*1000;
        req.session.username = req.body.username;
        req.session.cookie.expires = new Date(Date.now()+hour);
        if(path){
        res.redirect(path);
        
        }
        else{
          res.redirect("/");
        }
     });
  }
  else{
   res.redirect('back');
  }
});

app.get('/',requiresLogin ,function (req,res){
  res.render('index',{title:'Home'});
});

app.get("/logout",function(req,res){
  req.session.destroy();
  res.redirect("/login");
});

httpServer.listen(3000, function(){
  console.log("Express-Server laeuft auf dem Port 3000");
});
