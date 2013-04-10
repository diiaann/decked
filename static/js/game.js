window.socket;
window.username;
window.password;
window.iAmHost;

$(document).ready(function(){
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

}