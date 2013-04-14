var c = {};
c.ranks =  [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
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

  if (rank === 11) {
    rank = "Jack";
  } else if (rank === 12) {
    rank = "Queen";
  } else if (rank === 13) {
    rank = "King";
  } else if (rank === 1) {
    rank = "Ace";
  } 

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


var Game = function(hostName, socket, privateGame, password, 
                    numPlayers, gameName) {

  console.log("Host" + hostName);
  this.players = [];
  this.numPlayers = 0;
  this.host = new PlayerData(hostName, socket);
  this.addPlayer(hostName, socket);
  this.deck = new Deck(1);
  this.playerLimit = numPlayers;
  this.name = gameName;
  this.start = false;
  this.discardPile = [];
  this.privateGame = privateGame;
  if (this.privateGame) {
    console.log("PRIVATE GAME");
    this.password = password;
  }
  console.log(hostName)

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

Game.prototype.startGame = function() {
  this.start = true;
  this.deck.shuffle(5);
  for (var i = this.players.length - 1; i >= 0; i--) {
    this.drawCards(this.players[i].getName(), 7);
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

  console.log(this.numPlayers, this.playerLimit);

  if (this.start === true) {
    return false;
  }

  if (this.numPlayers === this.playerLimit) {
    return false;
  }

  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName){ 
      this.players[i].setSocket(socket);
      return true;
    }
  };

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
}

Game.prototype.isHost = function(playerName) {
  console.log("Game " + this.name + "has host " + this.host.getName() );
  return this.host.getName() === playerName;  
}

Game.prototype.toggleReady = function(playerName) {
for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      if (this.players[i].ready === true) {
        this.players[i].ready = false;

      } else {
        this.players[i].ready = true;
        this.numReady++;

        if (this.numReady = this.playerLimit){
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

exports.Card = Card;
exports.Deck = Deck;
exports.Game = Game;