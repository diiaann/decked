<<<<<<< HEAD
window.socket;
window.username;
window.password;
window.iAmHost;

$(document).ready(function(){
  window.LoginManager.setLoginSuccess(
    function() {
      var gamename = window.location.href.split("/game/")[1];

      socket.emit("loadGame", {
        username: window.username,
        gamename: gamename
      });

      var headerBar = $(".loginFields").children();
      for (var i = headerBar.length - 1; i >= 0; i--) {
        $(headerBar[i]).toggleClass("hidden");
      };
  });

  socket = io.connect("http://localhost:8888");

  socket.on('update', function(data) {
    console.log("received");
    $("#chat").append($("<li>").html(data.msg));
  });

  socket.on("newPlayer", function(data) {
    var playerList = $("#playerList");
    console.log(data);
    playerList.html("");
    for (var i = data.players.length - 1; i >= 0; i--) {
      var name = data.players[i].userName;
      var ready = data.players[i].ready;
      var res = name + " " + ready;
      playerList.append($("<li>").html(res));
    };
    if (data.allReady === true) { //&& iAmHost !== undefined) {
      $("#startButton").removeClass("none");
      $("#startButton").click(doStart);
    }
  });

  socket.on("joinFailed", function(data) {
    window.location.assign("/");
  });

  socket.on("joinSuccess", function(data) {
    var playerList = $("#playerList");
    playerList.html("");
    for (var i = data.players.length - 1; i >= 0; i--) {
        console.log(data.players[i]);
        var name = data.players[i].userName;
        var ready = data.players[i].ready;
        var res = name + " " + ready;
        console.log(res);
        playerList.append($("<li>").html(res));
       };   
    if (data.host === username) {
      iAmHost = true;
    }
  });

  socket.on("gameStart", function(data) {
    populateHand(data.cards);
    $("#drawButton").removeClass("none");
    $("#drawButton").click(drawCard);
  })


  window.LoginManager.setLoginFail(
    function(){ window.location.assign("/"); }
  );

  socket.on("drewCard", function(data) {
    populateHand(data.cards);
  });

  socket.on("discard", function(data) {
    populateHand(data.cards);
    populateDiscard(data.discardPile);
  });

  socket.on('update', function(data) {
    $("#chat").append($("<li>").html(data.msg));
  });

});

function toggleReady() {
  $("#readyButton").toggleClass("before");
  $("#readyButton").toggleClass("after");
  socket.emit("toggleReady", {name : username});
}

function doSend() {
  var text = $('#text').val();
  socket.emit('sendFromGame', { msg : text});
}

function doStart() {
  if (iAmHost === true) {
    socket.emit("startGame", {
      name: username,
    });
    $("#startButton").addClass("none");
  }
}

function drawCard() {
  socket.emit("drawCard", {username : username});
}

function populateHand(cards) {
  var cardList = $("#cardList");
  cardList.html("");
  for (var i = cards.length - 1; i >= 0; i--) {
    var rank = cards[i].rank;
    var suit = cards[i].suit;
    var res = rank + " of " + suit;
    var newLI = $("<li>").html("<button class=\"cardInHand\" value=\""+res +"\">" + 
                                res + "</button");
    cardList.append(newLI);
  }
  $(".cardInHand").click(function() {
    var cardData = this.value.split(" of ");
    var rank = cardData[0];
    discard(rank, cardData[1]);
  });
}

function populateDiscard(cards) {
  var cardList = $("#discardPile");
  cardList.html("");
  for (var i = cards.length - 1; i >= 0; i--) {
    var rank = cards[i].rank;
    var suit = cards[i].suit;
    var res = rank + " of " + suit;
    var newLI = $("<li>").html(res);
    cardList.append(newLI);
  }
}

function discard(rank, suit) {
  socket.emit("discard", {
    username: username,
    rank : rank,
    suit: suit
  });

=======
window.socket;
window.username;
window.password;
window.iAmHost;

var heartUnicode = "&#9829";
var spadeUnicode = "&#9824;";
var diamondUnicode = "&#9830;";
var clubUnicode = "&#9827;";

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
  socket.on("newPlayer", function() {
    var playerList = $("#playerList");
    console.log(data);
    playerList.html("");
    for (var i = data.players.length - 1; i >= 0; i--) {
      var name = data.players[i].userName;
      var ready = data.players[i].ready;
      var res = name + " " + ready;
      playerList.append($("<li>").html(res));
    };
    if (data.allReady === true) { //&& iAmHost !== undefined) {
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

// Draw a card
function drawCard() {
  socket.emit("drawCard", {username : username});
}

// Populate the hand DOM element
function populateHand(cards) {
  var cardList = $("#cardList");
  cardList.html("");
  for (var i = cards.length - 1; i >= 0; i--) {
    var rank = cards[i].rank;
    var suit = cards[i].suit;
    var res = rank + suit;
    var newLI = $("<li>").html("<button class=\"miniCard\" value=\""+ res +"\">" + 
                               res + "</button");
    cardList.append(newLI);
  }
  $(".cardInHand").click(function() {
    var cardData = this.value.split(" of ");
    var rank = cardData[0];
    discard(rank, cardData[1]);
  });
}

// Populate the discard pile DOM element
function populateDiscard(cards) {
  var cardList = $("#discardPile");
  cardList.html("");
  for (var i = cards.length - 1; i >= 0; i--) {
    var rank = cards[i].rank;
    var suit = cards[i].suit;
    var res = rank + " of " + suit;
    var newLI = $("<li>").html(res);
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

>>>>>>> 67f957691399f87f15d35c4519e6f8024e5ad3de
}