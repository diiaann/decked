var io = require('socket.io').listen(8888);
var cards = require("./cards.js");

module.exports = function(globals) {

  io.sockets.on('connection', function (socket) {

    socket.on('disconnect', function (data) {
      if (globals.socketsToGames[socket] !== undefined) {
        var game = globals.socketsToGames[socket].game;
        console.log(globals.socketsToGames[socket].user + ' DISCONNESSO!!!');
        game.removePlayer(globals.socketsToGames[socket].user);
        game.updateAll("newPlayer", {players : game.getPlayers()});
        globals.socketsToGames[socket] = undefined;
      }

    });


    socket.on('login', function (data) {
      var userName = data.userName;
      console.log(userName);
      if (globals.users.indexOf(userName) === -1){
        globals.users.push(userName);
        io.sockets.emit('update', {msg : userName + " has joined the chat!"});
      }
    });

    socket.on('send', function(data) {
      io.sockets.emit('update', data);
    });

    socket.on('requestGame', function(data) {
      var myGame = globals.games[data.name];
      if (myGame !== undefined) {
        socket.emit("requestGameFailed", 
        {msg : "A game with that name already exists."});  
      } else {      
        myGame = new cards.Game(data.username, socket, 
                                data.privy, data.password, 
                                data.numPlayers, data.name);
        globals.games[data.name] = myGame;
        socket.emit("gotoGame", 
          {
            gameName : data.name,
            playerList : myGame.getPlayers()
          });
      }
    });


    socket.on("joinGame", function(data) {
      var myGame = globals.games[data.gamename];
      if (myGame === undefined){
        socket.emit("joinFailed", {msg : "No game with that name exists"});
      } else { 
        if (myGame.join(data.password, data.username, socket) === true) {
          socket.emit("joinSuccess", {
            host: myGame.getHost().getName(),
            players : myGame.getPlayers(),
            gameName : data.gamename
          });
          globals.socketsToGames[socket] = {
            game : myGame,
            user : data.username
          }
          myGame.updateAll("newPlayer", {players : myGame.getPlayers()});
        } else {
          socket.emit("joinFailed", {msg : "Unable to join game."});
        }
      }
    });


  });
}