window.socket;
window.username;
window.password;
window.iAmHost;

window.heartUnicode = "&#9829";
window.spadeUnicode = "&#9824;";
window.diamondUnicode = "&#9830;";
window.clubUnicode = "&#9827;";

$(document).ready(function(){

  // On login, try to join the game.
  window.LoginManager.setLoginSuccess(
    function() {
      var gamename = window.location.href.split("/game/")[1];

      socket.emit("joinGame", {
        username: window.username,
        password: window.password,
        gamename: gamename
      });

      var headerBar = $(".loginFields").children();
      for (var i = headerBar.length - 1; i >= 0; i--) {
        $(headerBar[i]).toggleClass("hidden");
      };
  });

  socket = io.connect("http://localhost:8888");

  // New player added to game
  socket.on("newPlayer", function(data) {
    var playerList = $("#playerList");
    playerList.html("");
    for (var i = data.players.length - 1; i >= 0; i--) {
      var name = data.players[i].userName;
      var ready = data.players[i].ready;
      var res = name + " " + ready;
      playerList.append($("<li>").html(res));
    };
    if (data.allReady === true && iAmHost !== undefined) {
      $("#startButton").removeClass("none");
      $("#startButton").click(doStart);
    }
  });

  // Join failed. go back to homepage.
  socket.on("joinFailed", function(data) {
    window.location.assign("/");
  });

  // Join successful. Show list of players
  socket.on("joinSuccess", function(data) {
    var playerList = $("#playerList");
    playerList.html("");
    for (var i = data.players.length - 1; i >= 0; i--) {
        var name = data.players[i].userName;
        var ready = data.players[i].ready;
        var res = name + " " + ready;
        playerList.append($("<li>").html(res));
       };   
    if (data.host === username) {
      iAmHost = true;
    }
  });

  // Game starts. show my hand.
  socket.on("gameStart", function(data) {
    populateHand(data.cards);
    $("#drawButton").removeClass("none");
    $("#drawButton").click(drawCard);
  })

  // If login is unsuccessful, go back to the homepage
  window.LoginManager.setLoginFail(
    function(){ window.location.assign("/"); }
  );

  // Add cards to hand
  socket.on("drewCard", function(data) {
    populateHand(data.cards);
  });

  // Grow discard pile
  socket.on("discard", function(data) {
    populateHand(data.cards);
    populateDiscard(data.discardPile);
  });

  // Chat message update
  socket.on('update', function(data) {
    $("#chatText").append($("<li>").html(data.msg));
  });

});

// Toggles state of ready button
function toggleReady() {
  $("#readyButton").toggleClass("before");
  $("#readyButton").toggleClass("after");
  socket.emit("toggleReady", {name : username});
}

// Sends chat
function doSend() {
  var text = $('#text').val();
  socket.emit('sendInGame', { msg : text});
}

// Starts the game
function doStart() {
  if (iAmHost === true) {
    socket.emit("startGame", {
      name: username,
    });
    $("#startButton").addClass("none");
  }
}


function getUnicodeSymbol(suit){

	if (suit==="Clubs"){
		return clubUnicode;
	}
	else if(suit==="Spades"){
		return spadeUnicode;
	}
	else if(suit==="Diamonds"){
		return diamondUnicode;
	}
	else {
		return heartUnicode;
	}

}

function getSuit(unicode){

  if (unicode === clubUnicode){
    return "Clubs";
  }
  else if(unicode === spadeUnicode){
    return "Spades";
  }
  else if(unicode === diamondUnicode){
    return "Diamonds";
  }
  else {
    return "Hearts";
  }

}

// Draw a card
function drawCard() {
  socket.emit("drawCard", {username : username});
}

// Populate the hand DOM element
function populateHand(cards) {
  var cardList = $("#player1");
  cardList.html("");
  for (var i = cards.length - 1; i >= 0; i--) {
    var rank = cards[i].rank;
    var suit = getUnicodeSymbol(cards[i].suit);
    var res = rank + suit;
    var newLI = $("<li>")
    var newButton = $("<button>");
    newButton.addClass("miniCard");
    if (suit === heartUnicode || suit === diamondUnicode) {
      newButton.addClass("diamond");
    }
    newButton.html(res);
    newButton.val(res);
    newLI.append(newButton);
    cardList.append(newLI);
  }
  $(".miniCard").click(function() {
    var cardData = this.value.split("&");

    var rank = cardData[0];
    var suit = "&" + cardData[1];
    discard(rank, getSuit(suit));
  });
}

// Populate the discard pile DOM element
function populateDiscard(cards) {
  var cardList = $("#discardPile");
  cardList.html("");
  for (var i = cards.length - 1; i >= 0; i--) {
    var rank = cards[i].rank;
    var newLI = $("<li>").html(rank + getUnicodeSymbol(cards[i].suit));
    cardList.append(newLI);
  }
}

// discard a card
function discard(rank, suit) {
  socket.emit("discard", {
    username: username,
    rank : rank,
    suit: suit
  });

}