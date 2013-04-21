var io = require('socket.io').listen(8888);
var cards = require("./cards.js");

module.exports = function(globals) {

  // Connection
  io.sockets.on('connection', function (socket) {

    /*
     * On disconnect, we need to remove the given player
     * from the game associated with that socket.
     *
     * Then we inform the players in that game that the player has dropped.
     * 
     */
    socket.on('disconnect', function (data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        console.log(globals.socketsToGames[socket.id].user + ' DISCONNESSO!!!');
        game.removePlayer(globals.socketsToGames[socket.id].user);
        game.updateAll("newPlayer", {players : game.getPlayers()});
        game.updateEach("update", function(player){
              return { 
                msg : wrapInSpan(data.username, player.getName() === data.username) + 
                " has left the game."};
          });
        globals.socketsToGames[socket.id] = undefined;
      }

    });


    /*
     * Login for auth
     */
    socket.on('login', function (data) {
      var userName = data.userName;
      console.log(userName);
      if (globals.users.indexOf(userName) === -1){
        globals.users.push(userName);
        io.sockets.emit('update', {msg : wrapInSpan(userName) + " has joined the chat!"});
      }
    });

    /*
     * For chat.
     */
    socket.on('send', function(data) {
      console.log("SENDING");
      io.sockets.emit('update', data);
    });


    /*
     * Request a new game. If we already started a game with that name,
     * send a failure message.
     */
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


    /*
     * Join an existing game.
     */
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
          globals.socketsToGames[socket.id] = {
            game : myGame,
            user : data.username
          }
          myGame.updateAll("newPlayer", {players : myGame.getPlayers()});
          game.updateEach("update", function(player){
              return { 
                msg : wrapInSpan(data.username, player.getName() === data.username) + 
                " has joined the game."};
          });

        } else {
          socket.emit("joinFailed", {msg : "Unable to join game."});
        }
      }
    });

    /*
     * Switch a player's "Ready" state.
     */
    socket.on("toggleReady", function(data){
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        var ready = game.toggleReady(data.username);
        console.log(game.numReady, game.numPlayers);
        game.updateAll("newPlayer", {
          players : game.getPlayers(),
          allReady : ready
        });
        game.updateEach("update", function(player){
              return { 
                msg : wrapInSpan(data.username, player.getName() === data.username) + 
                " is " + ((ready) ? "" : "not ") + "ready."};
          });
      }
    });

    /*
     * Start the game.
     */
    socket.on("startGame", function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        if (game.isReady()) {
          game.startGame();
          game.updateEach("gameStart", function(player) {
            return { cards : player.getHand() };
          });
          game.updateEach("update", function(player){
              return { 
                msg : wrapInSpan(data.username, player.getName() === data.username) + 
                " has started the game."};
          });
        } else {
          console.log("HOW DID WE GET HERE?");
        }
      }
    });

    /*
     * Draw a card.
     */
    socket.on("drawCard", function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        socket.emit("drewCard", { cards : game.drawCards(data.username, 1)});
        game.updateEach("update", function(player){
        return { 
              msg : wrapInSpan(data.username, player.getName() === data.username) + 
              " draws a card."};
        });
      }
    });

    /*
     * Discard a card.
     */
    socket.on("discard", function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        var discardPile = game.discard(data.username, data.rank, data.suit);
        game.updateEach("discard", function(player) {
          return { cards : player.getHand(),
          discardPile : discardPile };
        });
        game.updateEach("update", function(player){
        return { 
              msg : wrapInSpan(data.username, player.getName() === data.username) + 
              " discards the " + data.rank + " of " + 
                  data.suit.toLowercase() + "."};
        });
      }
    });

    /*
     * Send chat in a game.
     */
    socket.on('sendInGame', function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        game.updateEach("update", function(player){
        return { 
              msg : wrapInSpan(data.username + ":", player.getName() === data.username) + 
              " " + data.msg};
        });
      }
    });

    socket.on("playCard", function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        var playedPile = game.playCard(data.username, data.rank, data.suit);
        game.updateEach("playedCard", function(player) {
          return { cards : player.getHand(),
          playedPile : playedPile };
        });
        game.updateEach("update", function(player){
        return { 
              msg : wrapInSpan(data.username, player.getName() === data.username) + 
              " plays the " + data.rank + " of " + data.suit + "."};
        });
      }
    });      

    socket.on("takeCard", function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        var playedPile = game.givePlayedToPlayer(data.username, 1);
        console.log(data.username);
        playedPile = game.getPlayedPile();
        game.updateEach("tookCard", function(player) {
          var hand = (player.getName() === data.username) ? player.getHand() : undefined;
          return { hand : hand, cards: playedPile};
        });
        game.updateEach("update", function(player){
        return { 
              msg : wrapInSpan(data.username, player.getName() === data.username) + 
              " takes a card from the pile."};
            });
      }
    });

    socket.on("trashCard", function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        var cards = game.trashCards();
        game.updateAll("trashed", {
          played : game.getPlayedPile(),
          cards: cards});
        game.updateEach("update", function(player){
        return { 
              msg : wrapInSpan(data.username, player.getName() === data.username) + 
              " trashes a card from the pile."};
      });
    };


  });

}

function wrapInSpan(text, bool) {
  var spanClass = bool ? "myName" : "chatName";
  return "<span class='"+ spanClass + "'>" + text + "</span>";
}