// ========================
// ==== Express server ====
// ========================
var express = require("express");
var app = express();
app.get("/static/:staticFilename", function (request, response) {
  response.sendfile("static/" + request.params.staticFilename);
});
app.use("/static/css", express.static(__dirname + '/static/css'));
app.use("/static/js", express.static(__dirname + '/static/js'));
app.use("/static/imgs", express.static(__dirname + '/static/imgs'));



app.listen(8889);


// Nonsense

var users = [];

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

});