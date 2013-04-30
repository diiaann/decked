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

// Makes a new deck.
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


// Draw a card
Deck.prototype.draw = function(numCards) {
  var result = [];

  for (var i = 0; i < numCards; i++){
    result.push(this.cards.pop());
  }

  return result;

}

// Add to the deck
Deck.prototype.addToDeck = function(cardList) {

  for (var i = 0; i < cardList.length; i++) {
    this.cards.push(cardList[i]);
  };

}

// Print the deck. Debugging.
Deck.prototype.printDeck = function(){

  for (var i = 0; i < this.cards.length; i++) {
    console.log(this.cards[i].toString());
  };

}

// Stores all information about a player.
var PlayerData = function(hostname, socket) {
  this.name = hostname;
  this.socket = socket;
  this.hand = [];
  this.played = [];
  this.ready = false;
  this.inGame = false;
}

// Is the player in a game?
PlayerData.prototype.getInGame = function() {
  return this.inGame;
}

// Set if he/she is in a game.
PlayerData.prototype.setInGame = function(bool) {
  this.inGame = bool;
}

// Get a player's name
PlayerData.prototype.getName = function() {
  return this.name;
}

// Get the player's socket
PlayerData.prototype.getSocket = function() {
  return this.socket;
}

// Set the player's socket.
PlayerData.prototype.setSocket = function(socket) {
  this.socket = socket;
}


// Get the hand
PlayerData.prototype.getHand = function() {
  return this.hand;
}


// Empty the hand
PlayerData.prototype.emptyHand = function() {
  this.hand = [];
}


// Add to the hand.
PlayerData.prototype.addToHand = function(cards) {
  for (var i = 0; i < cards.length; i++) {;
    this.hand.push(cards[i]);
  };
}


// Discard a specific card
PlayerData.prototype.discard = function(card) {
  for (var i = 0; i < this.hand.length; i++) {;
    if (this.hand[i].equals(card)) {
      this.hand.splice(i, 1);  
    }
  };
}

// Discard from the played pile
PlayerData.prototype.discardFromPlayed = function(card) {
  for (var i = 0; i < this.played.length; i++) {;
    if (this.played[i].equals(card)) {
      this.played.splice(i, 1);  
    }
  };
}

// Stores state for a Game.
var Game = function(hostName, socket, privateGame, password, 
                    numPlayers, gameName, numDecks, startingSize) {

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

// Restart the game
Game.prototype.restartGame = function() {
  this.discardPile = [];
  this.playedPile = [];
  this.deck = new Deck(this.numDecks);
  for (var i = 0; i < this.players.length; i++) {
    this.players[i].emptyHand();
  };
  this.start();
}

// Have we started?
Game.prototype.hasBegun = function() {
  return this.start;
}


// What's my name?
Game.prototype.getGameName = function() {
  return this.name;
}

// Get the name of the host.
Game.prototype.getHostName = function() {
  return this.host.getName();
}

// Discard a card from the given player
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

// Discard a card from the given player's played pile.
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

  return this.discardPile;
}


// Put a card into play
Game.prototype.playCard = function(player, rank, suit) {
  var oldCard = new Card(rank, suit);
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].name === player) {
      this.players[i].discard(oldCard);
      this.players[i].played.push(oldCard);
    }
  };

  return this.playedPile;
}

// Get the size of the discard pile
Game.prototype.getDiscardSize = function() {
  return this.discardPile.length;
}


//Gives numCards cards from the discard pile to the player.
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

// Take all the cards.
Game.prototype.takeAll = function(playerName) {
  var player = undefined;
  var cardsToAdd = [];
  
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      player = this.players[i];
    }
  };

  if (player === undefined){
    return;
  }

  for (var i = this.players.length - 1; i >= 0; i--) {
    while (this.players[i].played.length !== 0) {
      cardsToAdd.push(this.players[i].played.pop());
    }
  };

  player.addToHand(cardsToAdd);
}

// Take from the discard pile
Game.prototype.takeFromDiscard = function(playerName) {
  var result;
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      result = this.discardPile.pop()
      this.players[i].hand.push(result);
    }
  };  

  return result;
}

// Start the game
Game.prototype.startGame = function() {
  this.start = true;
  this.deck.shuffle(5);
  for (var i = this.players.length - 1; i >= 0; i--) {
    this.drawCards(this.players[i].getName(), this.startingSize);
  };
}

// Restart the game
Game.prototype.restartGame = function() {

  this.deck = new Deck(this.numDecks);
  this.discardPile = [];
  this.playedPile = [];
  if (this.privateGame) {
    this.password = password;
  }

  this.start = true;
  this.deck.shuffle(5);
  for (var i = this.players.length - 1; i >= 0; i--) {
    this.players[i].hand = [];
    this.players[i].played = [];
    this.drawCards(this.players[i].getName(), this.startingSize);
  };
}

// Get a player's hand.
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

// Get the deck
Game.prototype.getDeck = function() {
  return this.deck;
};

// Get the host
Game.prototype.getHost = function() {
  return this.host;
};

// Draw X cards for a player
Game.prototype.drawCards = function(playerName, numCards) {
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      this.players[i].addToHand(this.deck.draw(numCards));
      return this.getHand(playerName);
    }
  };
};

// Get the number of cards left in the deck
Game.prototype.getNumCards = function(){
  return this.deck.length;
}

// Add a player to the game
Game.prototype.addPlayer = function(playerName, socket) {
  this.players.push(new PlayerData(playerName, socket));
  this.numPlayers++;
};

// Has he/she joined the game?
Game.prototype.hasJoinedGame = function(playerName) {
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      return true;
    }
  };
  return false;
}

// A player asks to rejoin the game
Game.prototype.enterGame = function(playerName, socket) {
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      this.players[i].setInGame(true);
      this.players[i].setSocket(socket);
    }
  };
}

// Join the game
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

// Update all players with the given message
Game.prototype.updateAll = function(socketMsg, data) {
  for (var i = this.players.length - 1; i >= 0; i--) {
    this.players[i].getSocket().emit(socketMsg, data);
  };
}

// Update each player with a specific callback
Game.prototype.updateEach = function(socketMsg, callback) {
  for (var i = this.players.length - 1; i >= 0; i--) {
    this.players[i].getSocket().emit(socketMsg, 
      callback(this.players[i]));
  };
}

// Removes a player from the game
Game.prototype.removePlayer = function(playerName) {

  if (this.isHost(playerName)) {
    if (this.numPlayers === 1) {
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
  return false;
}

// Is this guy the host?
Game.prototype.isHost = function(playerName) {
  return this.host.getName() === playerName;  
}

// Can we start the game?
Game.prototype.isReady = function() {
  return (this.numReady === this.playerLimit);
}


// Switch a player's readiness
Game.prototype.toggleReady = function(playerName) {
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      if (this.players[i].ready === true) {
        this.players[i].ready = false;
        this.numReady--;

      } else {
        this.players[i].ready = true;
        this.numReady++;

        if (this.numReady === this.players.length){
          return true;
        } else {
          return false;
        }
      }
    }
  }; 
}

// Move from play pile to hand
Game.prototype.takeFromPlayed = function(to, from, rank, suit) {
  var movedCard = new Card(rank, suit);
  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].getName() === from) {
      this.players[i].discardFromPlayed(movedCard);
    }
    if (this.players[i].getName() === to) {
      this.players[i].hand.push(movedCard);
    }
  };
}

// Move from one player's pile to another

Game.prototype.takeInPlayed = function(to, from, rank, suit) {
  var movedCard = new Card(rank, suit);
  var inTheGame = 0;

  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].getName() === from) {
      inTheGame++;
    }
    if (this.players[i].getName() === to) {
      inTheGame++;
    }
  };

  if (inTheGame !== 2) {
    return false;
  }

  for (var i = 0; i < this.players.length; i++) {
    if (this.players[i].getName() === from) {
      this.players[i].discardFromPlayed(movedCard);
    }
    if (this.players[i].getName() === to) {
      this.players[i].played.push(movedCard);
    }
  };

  return true;
}

// Get player struct for the client
Game.prototype.getPlayers = function() {
  var result = [];
  for (var i = this.players.length - 1; i >= 0; i--) {
    result.push(
    {
        userName : this.players[i].getName(), 
        ready : this.players[i].ready,
        playedPile : this.players[i].played,
        numInHand : this.players[i].hand.length
    });
  };

  return result;
};

exports.Game = Game;
exports.Card = Card;
exports.Deck = Deck;