// ========================
// ==== Express server ====
// ========================
var express = require("express");
var app = express();
var mongoExpressAuth = require('mongo-express-auth');
var cards = require("./cards.js")

mongoExpressAuth.init({
    mongo: { 
        dbName: 'userAccounts',
        collectionName: 'accounts'
    }
}, function(){
    console.log('mongo ready!');
    app.listen(3000);
});

app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'M3I9H7P5GQO2PO38W667AOL6R0M998AV' }));

app.get("/static/:staticFilename", function (request, response) {
  response.sendfile("static/" + request.params.staticFilename);
});

app.get("/game/:gameName", function (request, response) {
  if (games[request.params.gameName] === undefined) {
    response.sendfile("static/404.html");  
  } else {
  response.sendfile("static/game.html");
  }
});


app.use("/static/css", express.static(__dirname + '/static/css'));
app.use("/static/js", express.static(__dirname + '/static/js'));
app.use("/static/imgs", express.static(__dirname + '/static/imgs'));


app.listen(8889);


// Nonsense
var users = [];
var games = [];

// ========================
// === Socket.io server ===
// ========================
var io = require('socket.io').listen(8888);

io.sockets.on('connection', function (socket) {

  // socket.emit('news', { hello: 'world'});

  socket.on('login', function (data) {
    var userName = data.userName;
    console.log(userName);
    if (users.indexOf(userName) === -1){
      users.push(userName);
      io.sockets.emit('update', {msg : userName + " has joined the chat!"});
    }
  });

  socket.on('send', function(data) {
    io.sockets.emit('update', data);
  });

  socket.on('requestGame', function(data) {
    var myGame = games[data.name];
    if (myGame !== undefined) {
      if (myGame.joinGame(data.password)) {
        myGame.addPlayer(data.username, socket);
        socket.emit("joinGame", {gameName : data.name});  
      } else {
        socket.emit("requestGameFailed", 
        {msg : "The password you supplied does not match."});  
      }
    } else {      
      myGame = new cards.Game(data.username, socket, 
                            data.privy, data.password, 
                            data.numPlayers, data.name);
      console.log("requesting game");
      if (games[data.name] !== undefined) {
        socket.emit("requestGameFailed", 
          {msg : "A game with that name already exists."});
      } else {
        games[data.name] = myGame;
        socket.emit("joinGame", {gameName : data.name});
      }
    }
    // Have to create a Game here. Will work on it next
  })


});

// ======================
// = ROUTES FOR DB AUTH =
// ======================

app.get('/', function(req, res){
            res.sendfile('static/index.html');
});

app.get('/me', function(req, res){
    mongoExpressAuth.checkLogin(req, res, function(err){
        if (err)
            res.send(err);
        else {
            mongoExpressAuth.getAccount(req, function(err, result){
                if (err)
                    res.send(err);
                else 
                    res.send(result); // NOTE: direct access to the database is a bad idea in a real app
            });
        }
    });
});

app.post('/login', function(req, res){
    mongoExpressAuth.login(req, res, function(err){
        if (err)
            res.send(err);
        else
            res.send('ok');
    });
});

app.post('/logout', function(req, res){
    mongoExpressAuth.logout(req, res);
    res.send('ok');
});

app.post('/register', function(req, res){
    mongoExpressAuth.register(req, function(err){
        if (err)
            res.send(err);
        else
            res.send('ok');
    });
});

app.use(express.static(__dirname + '/static/'));
