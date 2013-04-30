var io = require('socket.io').listen(8888);
var cards = require("./cards.js");
var words = require("./wordList.js")();

module.exports = function(globals) {

  // Connection
  io.sockets.on('connection', function (socket) { 



    socket.emit("gameUpdate", {games : globals.publicGames});
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
        var playerName = globals.socketsToGames[socket.id].user;
        var over = game.removePlayer(globals.socketsToGames[socket.id].user);
        var pubGame = globals.publicGames[game.name];

        if (pubGame !== undefined) {
          pubGame.numPlayers--;
          if (pubGame.numPlayers === 0) {
            globals.publicGames[game.name] = undefined;            
          }
        }

        io.sockets.emit("gameUpdate", {games : globals.publicGames});
        globals.socketsToGames[socket.id] = undefined;
        if (over === true) {
          globals.games[game.getGameName()] = undefined;
        } else {
          game.updateAll("newPlayer", {players : game.getPlayers()});
          game.updateEach("update", function(player){
                return { 
                  msg : wrapInSpan(playerName, player.getName() === playerName) + 
                  " has left the game."};
          });
        }
      }
    });


    /*
     * Login for auth
     */
    socket.on('login', function (data) {
      var userName = data.userName;
      if (globals.users.indexOf(userName) === -1){
        globals.users.push(userName);
        io.sockets.emit('update', {msg : wrapInSpan(userName) + " has joined the chat!"});
      }
    });

    /*
     * For chat.
     */
    socket.on('send', function(data) {
      io.sockets.emit('update', data);
    });


    /*
     * Request a new game. If we already started a game with that name,
     * send a failure message.
     */
    socket.on('requestGame', function(data) {
      var game = globals.games[data.name];
      var name = words.randomWord();
      /*if (game !== undefined) {
        socket.emit("requestGameFailed", 
        {msg : "A game with that name already exists."});  
      } else { */

        game = new cards.Game(data.username, socket, 
                                data.private, data.password, 
                                data.numPlayers, name, 
                                data.numDecks, data.startingSize);
        globals.games[name] = game;
        if (data.private !== true) {
          globals.publicGames[name] = ({
            name: name,
            numPlayers: 0,
            maxPlayers: data.numPlayers,
            startingSize: data.startingSize,
            host: data.username
          });
          io.sockets.emit("gameUpdate", {
            games: globals.publicGames
          });
        }
        socket.emit("gotoGame", 
          {
            gameName : name,
            playerList : game.getPlayers()
          });
    });

    /*
     * Join an existing game.
     */
    socket.on("joinGame", function(data){
      var game = globals.games[data.gamename];
      if (game === undefined) {
        socket.emit("joinFailed", {msg : "No game with that name exists"});
      } 

      else if (game.join(data.password, data.username, socket) === true) {
        socket.emit("joinSuccess", {
          host: game.getHost().getName(),
          players : game.getPlayers(),
          gameName : data.gamename
        });
        globals.socketsToGames[socket.id] = {
          game : game,
          user : data.username
        };
        game.updateAll("newPlayer", {players : game.getPlayers()});
        if (globals.publicGames[data.gamename] !== undefined) {
          globals.publicGames[data.gamename].numPlayers++;
        }
        io.sockets.emit("gameUpdate", {
            games: globals.publicGames
          });
        game.updateEach("update", function(player) {
            return { 
              msg : wrapInSpan(data.username, player.getName() === data.username) + " has joined the game."};
        });
      } 
      else {
        socket.emit("joinFailed", {msg : "Unable to join game."});
      }
    });

    /*
     * Switch a player's "Ready" state.
     */
    socket.on("toggleReady", function(data){
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        var ready = game.toggleReady(data.username);
        game.updateAll("newPlayer", {
          players : game.getPlayers(),
          allReady : ready
        });
        game.updateEach("update", function(player){
              return { 
                msg : wrapInSpan(data.username, player.getName() === data.username) + 
                " is " + ((data.ready) ? "" : "not ") + "ready."};
          });
      }
    });

    /*
     * Start the game.
     */
    socket.on("startGame", function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        if (game.isReady() === true) {
          game.startGame();
          game.updateEach("gameStart", function(player) {
            return { cards : player.getHand() };
          });
          game.updateEach("update", function(player){
              return { 
                msg : wrapInSpan(data.username, player.getName() === data.username) + 
                " has started the game."};
          });
          globals.publicGames[game.name] = undefined;
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
        if (game.hasBegun() === false) {
          return;
        }
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
                  data.suit.toLowerCase() + "."};
        });
      }
    });

    /*
     * Discard a card.
     */
    socket.on("discardFromPlayed", function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        var discardPile = game.discardFromPlayed(data.username, data.rank, data.suit);
        game.updateEach("discardFromPlayed", function(player) {
          return { cards : player.getHand(),
          discardPile : discardPile,
          players : game.getPlayers(),
          playedPile : game.playedPile };
        });
        game.updateEach("update", function(player){
        return { 
              msg : wrapInSpan(data.username, player.getName() === data.username) + 
              " discards the " + data.rank + " of " + 
                  data.suit.toLowerCase() + "."};
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
            players : game.getPlayers()
          };
        });
        game.updateEach("update", function(player){
        return { 
              msg : wrapInSpan(data.username, player.getName() === data.username) + 
              " plays the " + data.rank + " of " + data.suit + "."};
        });
      }
    });      


    socket.on("takeFromPlayed", function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        game.takeFromPlayed(data.to, data.from, data.rank, data.suit);
        game.updateEach("playedCard", function(player) {
          return { cards : player.getHand(),
            players : game.getPlayers()
          };
        });
        game.updateEach("update", function(player){
        return { 
              msg : wrapInSpan(data.to, player.getName() === data.to) + 
              " takes the " + data.rank + " of " + data.suit +" from " + data.from
                };
        });
      }
    });

    socket.on("takeInPlayed", function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        if (game.takeInPlayed(data.to, data.from, data.rank, data.suit) === false) {
          return;
        };
        game.updateEach("playedCard", function(player) {
          return { 
            cards : player.getHand(),
            players : game.getPlayers()
          };
        });
        game.updateEach("update", function(player){
        return { 
              msg : wrapInSpan(data.from, player.getName() === data.to) + 
              " gives the " + data.rank + " of " + data.suit +" to " + data.from
                };
        });
      }
    });

    socket.on("takeAll", function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        game.takeAll(data.username);
        game.updateEach("playedCard", function(player) {
          return { 
            cards : player.getHand(),
            players : game.getPlayers()
          };
        });
        game.updateEach("update", function(player){
        return { 
              msg : wrapInSpan(data.username, player.getName() === data.username) + 
              " takes the whole pile!"
                };
        });
      }
    });

    socket.on("pickupDiscard", function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
        var result = game.takeFromDiscard(data.username);
        game.updateEach("discard", function(player) {
          return { cards : player.getHand(),
          discardPile : game.discardPile };
        });
        game.updateEach("update", function(player){
        return { 
              msg : wrapInSpan(data.username, player.getName() === data.username) + 
              " takes the " + result.rank + " of " + 
                  result.suit.toLowerCase() + " from the discard pile."};
        });

      }

    });

    socket.on("restart", function(data) {
      if (globals.socketsToGames[socket.id] !== undefined) {
        var game = globals.socketsToGames[socket.id].game;
          game.restartGame();
          game.updateEach("gameStart", function(player) {
            return { cards : player.getHand() };
          });
          game.updateEach("update", function(player){
              return { 
                msg : wrapInSpan(data.username, player.getName() === data.username) + 
                " has restarted the game."};
          });
          globals.publicGames[game.name] = undefined;
      }
    });

  });
  
}


function wrapInSpan(text, bool) {
  var spanClass = bool ? "myName" : "chatName";
  return "<span class='"+ spanClass + "'>" + text + "</span>";
}







