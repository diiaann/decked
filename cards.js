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


var Deck = function(numDecks) {
  var ranks = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
  var suits = ["Clubs", "Diamonds", "Hearts", "Spades"];

  this.cards = [];

  for (var i = 0; i < ranks.length; i++) {
    for (var j = 0; j < suits.length; j++) {
      this.cards.push(new Card(ranks[i], suits[j]));
    };
  };


}

Deck.prototype.shuffle = function(nTimes) {
  
  var j, temp;

  for (var i = 0; i < nTimes; i++) {
    for (var i = 0; i < listofCards.length; i++) {
      j = Math.floor(Math.random() * i);
      temp = listofCards[i];
      listofCards[i] = listofCards[j];
      listofCards[j] = temp;
    }
  }

}

Deck.prototype.draw = function(numCards) {
  var result;

  for (var i = 0; i < numCards; i++){
    result.push(this.cards.pop());
  }

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


exports.Card = Card;
exports.Deck = Deck;