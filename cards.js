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
  var result;

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
}

PlayerData.prototype.getName = function() {
  return this.name;
}

PlayerData.prototype.getSocket = function() {
  return this.socket;
}

PlayerData.prototype.getHand = function() {
  return this.hand;
}

PlayerData.prototype.addToHand = function(cards) {
  for (var i = 0; i < cards.length; i++) {;
    this.hand.push(cards[i]);
  };

}

var Game = function(hostname, socket, private, password, 
                    numPlayers, gameName) {
  this.players = [];
  this.host = new PlayerData(hostname, socket);
  this.players.push(this.host);
  this.deck = new Deck(numDecks);
  this.playerLimit = numPlayers;
  this.name = gameName;
  this.private = private || false;
  if (this.private) {
    console.log("PRIVATE GAME");
    this.password = password;
  }

}


Game.prototype.getDeck = function() {
  return this.deck;
};

Game.prototype.addPlayer = function(playerName, socket) {
  this.players.push(new PlayerData(playerName, socket));

};

Game.prototype.drawCards = function(playerName, numCards) {
  for (var i = this.players.length - 1; i >= 0; i--) {
    if (this.players[i].getName() === playerName) {
      this.players[i].addToHand(this.deck.draw(numCards));
    }
  };
};

Game.prototype.joinGame = function(password) {
  if (this.private) {
    return (this.password === password);
  } else {
    return true;
  }
}


exports.Card = Card;
exports.Deck = Deck;
exports.Game = Game;