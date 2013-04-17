window.socket;
window.username;
window.password;
window.iAmHost = false;

window.heartUnicode = "&#9829";
window.spadeUnicode = "&#9824;";
window.diamondUnicode = "&#9830;";
window.clubUnicode = "&#9827;";

window.discardPile = [];
window.playedPile = [];

$(document).ready(function(){


  $(window).resize(function() {
    var width = document.width;
    $(".horz").css("width", width - $("#chat").width() - 160);
  });

  $(".horz").css("width", document.width - $("#chat").width() - 160);

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
    var numPlayers = data.players.length;
    var players = data.players;
    console.log(players.length);
    var playerDivs = getPlayerDivs(numPlayers);
    var myIndex = getIndexFromPlayers(username, players);
    console.log(myIndex);
    console.log(players);
    console.log(playerDivs);
    for (var i = 0; i < myIndex; i++) {
      players.push(players.shift());
    };
    console.log(players);
    if (playerDivs.length !== players.length) {
      alert("LISTS NOT THE SAME");
    }

    for (var i = 0; i < playerDivs.length; i++) {
      var currentDiv = playerDivs[i];
      $(currentDiv).addClass("hidden");
    }

    for (var i = 0; i < playerDivs.length; i++) {
      var currentDiv = playerDivs[i]
      $(currentDiv).removeClass("hidden");
      $(currentDiv+"name").html(players[i].userName);
    };

    if (data.allReady === true && (iAmHost === true)) {
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
    var numPlayers = data.players.length;
    var players = data.players;
    console.log(players.length);
    var playerDivs = getPlayerDivs(numPlayers);
    var myIndex = getIndexFromPlayers(username, players);
    console.log(players);
    for (var i = 0; i < myIndex; i++) {
      players.push(players.shift());
    };
    console.log(players);
    if (playerDivs.length !== players.length) {
      alert("LISTS NOT THE SAME");
    }

    for (var i = 0; i < playerDivs.length; i++) {
      var currentDiv = playerDivs[i]
      $(currentDiv).addClass("hidden");
    }
    for (var i = 0; i < playerDivs.length; i++) {
      var currentDiv = playerDivs[i]
      $(currentDiv).removeClass("hidden");
    };

    if (data.host === username) {
      iAmHost = true;
    } 
  });

  socket.on("tookCard", function(data) {
    if (data.hand !== undefined) {
      populateHand(data.hand);
    }
    populatePlayed(data.cards);
  })

  socket.on("trashed", function(data) {
    populateDiscard(data.cards);
    populatePlayed(data.played);
  })


  // Game starts. show my hand.
  socket.on("gameStart", function(data) {
    populateHand(data.cards);
    $("#deck").click(drawCard);

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

  socket.on("playedCard", function(data) {
    populateHand(data.cards);
    populatePlayed(data.playedPile);
  });

  // Chat message update
  socket.on('update', function(data) {
    console.log(data.msg);
    $("#chatText").append($("<li>").html(data.msg));
  });

  $("#gameName").html(window.location.href.split("/game/")[1]);
  $("#readyButton").click(toggleReady);
  $(".chats").css("height", 600);
  $("#player1name").html(username);
  $("#takeButton").click(takeCard);
  $("#trashButton").click(trashCard);
  $("#drawButton").click(drawCard);

});

function takeCard() {
  if (window.playedPile === undefined ||
      window.playedPile.length === 0) {
    return;
  }
  socket.emit("takeCard", {
    username: window.username
  });
}

function trashCard() {
  if (window.playedPile === undefined ||
      window.playedPile.length === 0) {
    return;
  console.log("trashing...");
  }
  socket.emit("trashCard", {
    username: window.username
  });
}


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
  var cardList = $("#playerHand");
  if (cards === null ||
    cards.length === 0 ) {
    return;
  }
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
    newLI.mousedown(function(e) {
      window.dragging = $(e.target);
      console.log(dragging);
      var that = $(this).children()[0];
      console.log(that);
      var origOffset = $(that).offset();
      var cardData = that.value.split("&");
      var rank = cardData[0];
      var suit = "&" + cardData[1];

      $(document.body).on("mousemove", function(e) {
        if (window.dragging !== undefined) {
          window.dragging.offset({
            top : e.pageY - $(that).width()/2,
            left: e.pageX - $(that).height()/2
          });
        }
      });

      $(this).on("mouseup", function(e){
        console.log("offset", $("#discard").width(), $("#discard").height());
        var centerX = e.pageX;
        var centerY = e.pageY;
        var discardXL = $("#discard").offset().left;
        var discardYT = $("#discard").offset().top;
        var discardXR = $("#discard").offset().left + $("#discard").width();
        var discardYB = $("#discard").offset().top + $("#discard").height();
        var playedXL = $("#played").offset().left;

        var playedYT = $("#played").offset().top;
        var playedXR = $("#played").offset().left + $("#played").width();
        var playedYB = $("#played").offset().top + $("#played").height();

        if (centerX >= playedXL && centerX <= playedXR && 
            centerY >= playedYT && centerY <= playedYB) {
          playCard(rank, getSuit(suit));
        } else if (centerX >= discardXL && centerX <= discardXR && 
            centerY >= discardYT && centerY <= discardYB) {
          discard(rank, getSuit(suit));
        }
        
        window.dragging.offset(origOffset);
        window.dragging = null;
        $(document.body).unbind("mousemove");
        $('#deckarea #discard').unbind("mouseup");
      });

    });
  }

    /*var cardData = this.value.split("&");
    var rank = cardData[0];
    var suit = "&" + cardData[1];
    discard(rank, getSuit(suit));*/


  //});
}

// Populate the discard pile DOM element
function populateDiscard(cards) {
  var discard = $("#discard");
  if (cards === undefined || 
    cards.length === 0 ) {
    discard.html("<p>discard</p>");
    return;
  }
  var index = cards.length - 1;
  window.discardPile = cards;
  discard.html("");
  discard.html(cards[index].rank + getUnicodeSymbol(cards[index].suit));
  discard.click(function() {
    alert(this.html());
  })
}

// Populate the discard pile DOM element
function populatePlayed(cards) {
  var played = $("#played");
  var index;
  if (cards === undefined || 
    cards.length === 0) {
    played.html("<p>played</p>");
    return;
  }
  index = cards.length - 1;
  console.log(cards);
  window.playedPile = cards;
  played.html("");
  played.html(cards[index].rank + getUnicodeSymbol(cards[index].suit));
}



// discard a card
function discard(rank, suit) {
  socket.emit("discard", {
    username: username,
    rank : rank,
    suit: suit
  });

}

function playCard(rank, suit) {
  socket.emit("playCard", {
    username: username,
    rank : rank,
    suit: suit
  });  
}


function getPlayerDivs(numPlayers) {
  switch(numPlayers) {
    case 1:
      return ["#player1"];
      break;
    case 2:
      return ["#player1", "#player3"];
      break;
    case 3:
      return ["#player1", "#player2", "#player4"];
      break;
    case 4: 
      return ["#player1", "#player2", "#player3", "#player4"]; 
      break;
    default:
      return [];
  }
}

function getIndexFromPlayers(name, players) {
  for (var i = players.length - 1; i >= 0; i--) {
    if (players[i].userName === name) {
      return i;
    }
  };
}