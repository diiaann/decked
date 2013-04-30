window.socket;
window.username;
window.password;
window.iAmHost = false;

window.heartUnicode = "&#9829";
window.spadeUnicode = "&#9824;";
window.diamondUnicode = "&#9830;";
window.clubUnicode = "&#9827;";

var gravatar = "http://www.gravatar.com/avatar/";

window.discardPile = [];
window.playedPile = [];


$(document).ready(function(){

  // Change width of main pane based on window size
  $(window).resize(function() {
    var width = document.width;
    $("#playarea").css("width", width - $("#chat").width() - 160);
     $("#player1").css("width", width - $("#chat").width() - 160);

  });
  
  // Make home div clickable
  $("#home").click(function(){
     window.location=$(this).find("a").attr("href"); 
     return false;
  });

  // Set initial width
  $("#playarea").css("width", document.width - $("#chat").width() - 160);
  $("#player1").css("width", document.width - $("#chat").width() - 160);

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

  // Players in the game have changed.
  socket.on("newPlayer", function(data) {
    var numPlayers = data.players.length;
    var players = data.players;
    var allPlayerDivs = getPlayerDivs(4);
    var playerDivs = getPlayerDivs(numPlayers);
    var myIndex = getIndexFromPlayers(username, players);
    var currentDiv;

    // Cycle player list
    for (var i = 0; i < myIndex; i++) {
      players.push(players.shift());
    };

    // Hide unused divs
    for (var i = 0; i < allPlayerDivs.length; i++) {
      currentDiv = allPlayerDivs[i] + "Div";
      $(currentDiv).addClass("hidden");
    }

    // Unhide used divs
    for (var i = 0; i < playerDivs.length; i++) {
      currentDiv = playerDivs[i];
      $(currentDiv + "Div").removeClass("hidden");
      $(currentDiv + "Name").html(players[i].userName);
      console.log(players[i].numInHand);
      if (players[i].ready === true) {
        console.log("DO WHATEVER!");
      }
    };

    // If you're the host, reveal the start button.
    if (data.allReady === true && (iAmHost === true)) {
      $("#startButton").removeClass("hidden");
      $("#startButton").click(doStart);
    } else if (data.allReady === false && (iAmHost === true)) {
      $("#waiting").html("Waiting...");
      $("startButton").toggleClass("hidden");
      $("#startButton").unbind("click");
    }
  });


  // For host migration.
  socket.on("youAreHost", function(data) {
    window.iAmHost = true;
    if (data.allReady === true) {
      $("#startButton").html("Start");
      $("#startButton").click(doStart); 
    }
  })

  // Join failed. go back to homepage.
  socket.on("joinFailed", function(data) {
    window.location.assign("/");
  });

  // Join successful. Show list of players
  socket.on("joinSuccess", function(data) {
    var numPlayers = data.players.length;
    var players = data.players;
    var playerDivs = getPlayerDivs(numPlayers);
    var myIndex = getIndexFromPlayers(username, players);

    // Cycle list
    for (var i = 0; i < myIndex; i++) {
      players.push(players.shift());
    };

    // Hide/unhide divs
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


  // I took a card from the public play pile
  socket.on("tookCard", function(data) {
    if (data.hand !== undefined) {
      POPULATE.hand(data.hand);
      POPULATE.sortHand();
    }

    POPULATE.played(data.cards);
  })


  // Someone discarded the played pile
  socket.on("trashed", function(data) {
    POPULATE.discard(data.cards);
    POPULATE.played(data.played);
  })


  // Game starts. Show my hand.
  socket.on("gameStart", function(data) {
    POPULATE.hand(data.cards);
    POPULATE.sortHand();
    POPULATE.clearPlayed();
    $("#waiting").addClass("none");
    $("#readyButton").addClass("none");
    $("#startButton").addClass("none");
    $("#deck").on("mousedown", drawCard);
    $("#sortBy").change(POPULATE.sortHand);
    $("#takeAll").removeClass("hidden");
    $("#takeAll").click(takeAll);
    $(".toggleBox").removeClass("hidden");
    $("#restart").click(restart);
  })

  // If login is unsuccessful, go back to the homepage
  window.LoginManager.setLoginFail(
    function(){ window.location.assign("/"); }
  );

  // Add cards to hand
  socket.on("drewCard", function(data) {
    POPULATE.hand(data.cards);
    POPULATE.sortHand();
  });

  // Grow discard pile
  socket.on("discard", function(data) {
    POPULATE.hand(data.cards);
    POPULATE.discard(data.discardPile);
    POPULATE.sortHand();
  });

  socket.on("discardFromPlayed", function(data) {
    var numPlayers = data.players.length;
    var players = data.players;
    var playerDivs = getPlayerDivs(numPlayers);
    var myIndex = getIndexFromPlayers(username, players);

    console.log(data.players);
    // Cycle player list
    for (var i = 0; i < myIndex; i++) {
      players.push(players.shift());
    };

    // Unhide used divs
    for (var i = 0; i < playerDivs.length; i++) {
      POPULATE.played(players[i].playedPile, 
                    $("#" + playerDivs[i].substr(1) + "PlayedUL"));
    };

    POPULATE.discard(data.discardPile);
    POPULATE.sortHand();
  });

  // Card was put into the played pile
  socket.on("playedCard", function(data) {
    var numPlayers = data.players.length;
    var players = data.players;
    var playerDivs = getPlayerDivs(numPlayers);
    var myIndex = getIndexFromPlayers(username, players);

    // Cycle player list
    for (var i = 0; i < myIndex; i++) {
      players.push(players.shift());
    };

    // Unhide used divs
    for (var i = 0; i < playerDivs.length; i++) {
      POPULATE.played(players[i].playedPile, 
                    $("#" + playerDivs[i].substr(1) + "PlayedUL"));
    };

    POPULATE.hand(data.cards);
    POPULATE.sortHand();
  });

  // Chat message update
  socket.on('update', function(data) {
    $("#chatText").append($("<li>").html(data.msg));
    $('.chats').scrollTop($('#chatText').height());
  });

  if (window.username === undefined) {
    var splitLoc = location.href.split("/");
    window.location.assign(splitLoc[0] + "//" + splitLoc[2]);
  }

  // Set DOM elements
  $("#gameName").html(window.location.href.split("/game/")[1]);
  $("#readyButton").click(toggleReady);
  $(".chats").css("height", document.height - 46 - 70);
  $("#player1name").html(username);
  $("#takeButton").click(takeCard);
  $("#trashButton").click(trashCard);
  $("#southName").html(username);
  if (iAmHost === true) {
    console.log("unhide");
    $("#startButton").removeClass("hidden");
  }
 
  // Gravatar
  var dMM = "?d=mm";
  var hash = hashEmailString(username);
  $(".image-wrap").css("background", "url("+gravatar+hash+dMM+") no-repeat center center");


});

// Take a card from the played pile
function takeCard() {
  if (window.playedPile === undefined ||
      window.playedPile.length === 0) {
    return;
  }
  socket.emit("takeCard", {
    username: window.username
  });
}

// Trash the played pile
function trashCard() {
  if (window.playedPile === undefined ||
      window.playedPile.length === 0) {
    return;
  }
  socket.emit("trashCard", {
    username: window.username
  });
}


// Toggles state of ready button
function toggleReady() {
  $("#readyButton").toggleClass("before");
  $("#readyButton").toggleClass("after");
  socket.emit("toggleReady", 
    {
      username : username,
      ready: $("#readyButton").hasClass("after")
  });
}

// Sends chat
function doSend() {
  var text = $('#text').val();
  $('#text').val("");
  socket.emit('sendInGame', { 
    username : window.username,
    msg : text});
}

// Starts the game
function doStart() {
  if (iAmHost === true) {
    socket.emit("startGame", {
      username: username,
    });
    $("#startButton").addClass("none");
  }
}


// Maps suits to unicode symbols
function getUnicodeSymbol(suit){
	if (suit === "Clubs"){
		return clubUnicode;
	}
	else if(suit === "Spades"){
		return spadeUnicode;
	}
	else if(suit === "Diamonds"){
		return diamondUnicode;
	}
	else {
		return heartUnicode;
	}

}

// Inverse mapping
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
function drawCard(e) {
  socket.emit("drawCard", {username : username});
}

// discard a card
function discard(rank, suit) {
  socket.emit("discard", {
    username: username,
    rank : rank,
    suit: suit
  });
}

function discardFromPlayed(rank, suit) {
  socket.emit("discardFromPlayed", {
    username: username,
    rank : rank,
    suit: suit
  });
}

// Plays the given card.
function playCard(rank, suit) {
  socket.emit("playCard", {
    username: username,
    rank : rank,
    suit: suit
  });  
}

// Gets the divs we're using given the number of player in our game.
function getPlayerDivs(numPlayers) {
  switch(numPlayers) {
    case 1:
      return [".south"];
      break;
    case 2:
      return [".south", ".north"];
      break;
    case 3:
      return [".south", ".west", ".east"];
      break;
    case 4: 
      return [".south", ".west", ".north", ".east"]; 
      break;
    default:
      return [];
  }
}

// Gets the index of a given users given a list of users.
function getIndexFromPlayers(name, players) {
  for (var i = players.length - 1; i >= 0; i--) {
    if (players[i].userName === name) {
      return i;
    }
  };
}



function mapToNum(chr) {
  switch(chr) {
    case "J":
      return "11";
    case "Q":
      return "12";
    case "K":
      return "13";
    default:
      return chr;
  }
}


function takeFromPlayed(playerName, rank, suit) {
  socket.emit("takeFromPlayed", {
    from: playerName,
    to: username,
    rank: rank,
    suit: suit
  });
}

function takeInPlayed(from, to, rank, suit) {
  socket.emit("takeInPlayed", {
    from: from,
    to: to,
    rank: rank,
    suit: suit
  });
}

function pickupDiscard() {
  socket.emit("pickupDiscard",{
    username: username
  });
}

function takeAll() {
  socket.emit("takeAll", {
    username: username
  });
}

function restart() {
  console.log("RESTART");
  socket.emit("restart", {});
}