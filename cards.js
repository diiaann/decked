var c = {};
c.ranks =  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 'J', 'Q', "K"];
c.suits =  ["Clubs", "Diamonds", "Hearts", "Spades"];

/*
  Constructor for a Listing object, which stores information
  about a given event.
 */
var Card = function(rank, suit) {
  this.rank = rank;
  this.suit = suit;
}

Card.prototype.equals = function(card) {
  console.log("Comparing" + this + card);
  return this.rank.toString() === card.rank.toString() && 
    this.suit === card.suit;
}

Card.prototype.getSuit = function() {
  return this.suit;
};

Card.prototype.getRank = function() {
  return this.rank;
};

Card.prototype.toString = function() {
  var rank = this.rank;

  return rank + " of " + this.suit;
}

/*
 * 
 */
var Deck = function(numDecks) {

  this.cards = [];

  for (var i = 0; i < c.ranks.length; i++) {
    for (var j = 0; j < c.suits.length; j++) {
      this.cards.push(new Card(c.ranks[i], c.suits[j]));
    };
  };


}

/*
 * Fisher-Yates shuffle for a deck. 
 * See http://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle
 */
Deck.prototype.shuffle = function(nTimes) {
  
  var j, tmp;
  var listofCards = this.cards;

  for (var i = 0; i < nTimes; i++) {
    for (var i = 0; i < listofCards.length; i++) {
      j = Math.floor(Math.random() * i);
      tmp = listofCards[i];
      listofCards[i] = listofCards[j];
      listofCards[j] = tmp;
    }
  }

}

Deck.prototype.draw = function(numCards) {
  var result = [];

  for (var i = 0; i < numCards; i++){
    result.push(this.cards.pop());
  }

  return result;

}

Deck.prototype.addToDeck = function(cardList) {

  for (var i = 0; i < cardList.length; i++) {
    this.cards.push(cardList[i]);
  };

}

Deck.prototype.printDeck = function(){

  for (var i = 0; i < this.cards.length; i++) {
    console.log(this.cards[i].toString());
  };

}

var PlayerData = function(hostname, socket) {
  this.name = hostname;
  this.socket = socket;
  this.hand = [];
  this.played = [];
  this.ready = false;
  this.inGame = false;
}

PlayerData.prototype.getInGame = function() {
  return this.inGame;
}

PlayerData.prototype.setInGame = function(bool) {
  this.inGame = bool;
}

PlayerData.prototype.getName = function() {
  return this.name;
}

PlayerData.prototype.getSocket = function() {
  return this.socket;
}

PlayerData.prototype.setSocket = function(socket) {
  this.socket = socket;
}

PlayerData.prototype.getHand = function() {
  return this.hand;
}

PlayerData.prototype.emptyHand = function() {
  this.hand = [];
}

PlayerData.prototype.addToHand = function(cards) {
  for (var i = 0; i < cards.length; i++) {;
    this.hand.push(cards[i]);
  };
}

PlayerData.prototype.discard = function(card) {
  for (var i = 0; i < this.hand.length; i++) {;
    if (this.hand[i].equals(card)) {
      this.hand.splice(i, 1);  
    }
  };
}

PlayerData.prototype.discardFromPlayed = function(card) {
  for (var i = 0; i < this.played.length; i++) {;
    if (this.played[i].equals(card)) {
      this.played.splice(i, 1);  
    }
  };
  console.log(this.played);
}


var Game = function(hostName, socket, privateGame, password, 
                    numPlayers, gameName, numDecks, startingSize) {

  console.log("Host for " + gameName + ": " + hostName);
  this.players = [];
  this.numPlayers = 0;
  this.numReady = 0;
  this.host = new PlayerData(hostName, socket);
  this.addPlayer(hostName, socket);
  this.deck = new Deck(numDecks);
  this.playerLimit = parseInt(numPlayers);
  this.name = gameName;
  this.start = false;
  this.discardPile = [];
  this.playedPile = [];
  this.privateGame = privateGame;
  if (this.privateGame) {
    this.password = password;
  }
  this.startingSize = startingSize;
  this.numDecks = numDecks;

}

Game.prototype.restartGame = function() {
  this.discardPile = [];
  this.playedPile = [];
  this.deck = new Deck(this.numDecks);
  for (var i = 0; i < this.players.length; i++) {
    this.players[i].emptyHand();
  };
  this.start();
}

Game.prototype.hasBegun = function() {
  return this.start;
}

Game.prototype.getGameName = function() {
  return this.name;
}



Game.prototype.getHostName = function() {
  return this.host.getName();
}

Game.prototype.discard = function(player, rank, suit) {
  var oldCard = new Card(rank, suit);
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].name === player) {
      this.discardPile.push(oldCard);
      this.players[i].discard(oldCard);
    }
  };
  return this.discardPile;
}

Game.prototype.discardFromPlayed = function(player, rank, suit) {
  var oldCard = new Card(rank, suit);
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].name === player) {
      this.discardPile.push(oldCard);
      this.players[i].discardFromPlayed(oldCard);
    }
  };
  for (var i = 0; i < this.playedPile.length; i++) {
    if (this.playedPile[i].equals(oldCard)) {
      this.playedPile.splice(i,1);
    }
  };

  console.log("PLAYED " + this.playedPile);

  return this.discardPile;
}



Game.prototype.trashCards = function() {
  console.log("trashing");
  for (var i = 0; i < this.playedPile.length; i++) {
    this.discardPile.push(this.playedPile.pop());
  };

  return this.discardPile;
}


Game.prototype.playCard = function(player, rank, suit) {
  var oldCard = new Card(rank, suit);
  console.log(player);
  for (var i = this.players.length - 1; i >= 0; i--) {
    console.log("is it" + this.players[i].name);
    if (this.players[i].name === player) {
      console.log("playing");
      this.playedPile.push(oldCard);
      this.players[i].discard(oldCard);
      this.players[i].played.push(oldCard);
    }
  };

  return this.playedPile;
}

Game.prototype.getPlayedPileSize = function() {
  return this.playedPile.length;
}

Game.prototype.getDiscardSize = function() {
  return this.discardPile.length;
}

Game.prototype.giveDiscardToPlayer = function(playerName, numCards) {
  var player = undefined;
  var cardsToAdd = [];
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      player = this,players[i];
    }
  };

  if (player === undefined){
    return;
  }

  for (var i = numCards - 1; i >= 0; i--) {
    if (this.discardPile.length !== 0) {
      cardsToAdd.push(this.discardPile.pop());
    }
  };

  player.addToHand(cardsToAdd);
}

Game.prototype.getPlayedPile = function() {
  return this.playedPile;
}

Game.prototype.givePlayedToPlayer = function(playerName, numCards) {
  var player = undefined;
  var cardsToAdd = [];
  for (var i = this.players.length - 1; i >= 0; i--) {
    console.log(this.players[i].getName());
    if (this.players[i].getName() === playerName) {
      console.log("YUP");
      player = this.players[i];
    }
  };

  console.log("NOPE");

  if (player === undefined){
    return;
  }

  console.log("PLAYER");
  for (var j = 0; j < numCards; j++) {
    if (this.playedPile.length !== 0){
    cardsToAdd.push(this.playedPile.pop());
    }
      
  };
    player.addToHand(cardsToAdd);
    console.log("hand:", player.getHand());
}


Game.prototype.takeFromDiscard = function(player) {
  return this.playedPile.pop();
}


Game.prototype.startGame = function() {
  this.start = true;
  this.deck.shuffle(5);
  for (var i = this.players.length - 1; i >= 0; i--) {
    this.drawCards(this.players[i].getName(), this.startingSize);
  };
}

Game.prototype.getHand = function(playerName) {
  var hand;
  var result = [];
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
        hand = this.players[i].getHand();
        for (var j = hand.length - 1; j >= 0; j--) {
          result.push(hand[j]);
        };
        return result;
    }
  };
}

Game.prototype.getDeck = function() {
  return this.deck;
};

Game.prototype.getHost = function() {
  return this.host;
};


Game.prototype.drawCards = function(playerName, numCards) {
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      this.players[i].addToHand(this.deck.draw(numCards));
      return this.getHand(playerName);
    }
  };
};

Game.prototype.getNumCards = function(){
  return this.deck.length;
}

Game.prototype.addPlayer = function(playerName, socket) {
  this.players.push(new PlayerData(playerName, socket));
  this.numPlayers++;
};

Game.prototype.hasJoinedGame = function(playerName) {
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      return true;
    }
  };
  return false;
}

Game.prototype.enterGame = function(playerName, socket) {
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      this.players[i].setInGame(true);
      this.players[i].setSocket(socket);
    }
  };
}

Game.prototype.join = function(password, playerName, socket) {
  if (this.start === true) {
    return false;
  }


  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName){ 
      this.players[i].setSocket(socket);
      return true;
    }
  };

  if (this.numPlayers === this.playerLimit) {
    return false;
  }

  if (this.privateGame) {
    if (this.password === password) {
      this.addPlayer(playerName, socket);
      return true;
    } else {
      return false;
    }
  } else {
    this.addPlayer(playerName, socket);
    return true;
  }
}

Game.prototype.updateAll = function(socketMsg, data) {
  for (var i = this.players.length - 1; i >= 0; i--) {
    console.log(this.players[i].getName());
    this.players[i].getSocket().emit(socketMsg, data);
  };
}

Game.prototype.updateEach = function(socketMsg, callback) {
  for (var i = this.players.length - 1; i >= 0; i--) {
    this.players[i].getSocket().emit(socketMsg, 
      callback(this.players[i]));
  };
}

Game.prototype.removePlayer = function(playerName) {
  console.log("PLAYERS: " + this.players);

  if (this.isHost(playerName)) {
    console.log("MIGRATING HOST");
    if (this.numPlayers === 1) {
      console.log("Game is over.");
      return true;
    } else {
      // Migrating the host.
      for (var i = this.players.length - 1; i >= 0; i--) {
        if (this.players[i].getName() === playerName) {
          if (this.players[i].ready === true) {
            this.numReady--;
          }
          this.players.splice(i, 1);
          this.numPlayers--;
        }            
      }
      this.host = this.players[0];
      console.log("new host is... " + this.host.getName());
      this.host.getSocket().emit("youAreHost", {
          allReady : this.numPlayers === this.numReady
        });
    }

    return;
  }

  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      if (this.players[i].ready === true) {
        this.numReady--;
      }
      this.players.splice(i, 1);
      this.numPlayers--;
    }
  };
  console.log("PLAYERS: " + this.players);
  return false;
}

Game.prototype.isHost = function(playerName) {
  console.log("Game " + this.name + "has host " + this.host.getName() );
  return this.host.getName() === playerName;  
}

Game.prototype.isReady = function() {
  return (this.numReady === this.playerLimit);
}


Game.prototype.toggleReady = function(playerName) {
for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      if (this.players[i].ready === true) {
        this.players[i].ready = false;
        this.numReady--;

      } else {
        this.players[i].ready = true;
        this.numReady++;
        console.log("cards" + this.numReady, this.playerLimit);

        if (this.numReady === this.playerLimit){
          return true;
        } else {
          return false;
        }
      }
    }
  }; 
}


Game.prototype.getPlayers = function() {
  var result = [];
  for (var i = this.players.length - 1; i >= 0; i--) {
    result.push(
    {
        userName : this.players[i].getName(), 
        ready : this.players[i].ready
    });
  };

  return result;
};

exports.Game = Game;
exports.Card = Card;
exports.Deck = Deck;