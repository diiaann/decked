window.socket;
window.username;
window.password;
window.iAmHost = false;

window.heartUnicode = "&#9829";
window.spadeUnicode = "&#9824;";
window.diamondUnicode = "&#9830;";
window.clubUnicode = "&#9827;";

var gravatar = "http://www.gravatar.com/avatar/"

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
    var allPlayerDivs = getPlayerDivs(4);
    var playerDivs = getPlayerDivs(numPlayers);
    var myIndex = getIndexFromPlayers(username, players);
    for (var i = 0; i < myIndex; i++) {
      players.push(players.shift());
    };

    for (var i = 0; i < allPlayerDivs.length; i++) {
      var currentDiv = allPlayerDivs[i];
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

  socket.on("youAreHost", function(data) {
    window.iAmHost = true;
    if (data.allReady === true) {
      $("#startButton").removeClass("none");
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
      sortHand();
    }
    populatePlayed(data.cards);
    sortHand();
  })

  socket.on("trashed", function(data) {
    populateDiscard(data.cards);
    populatePlayed(data.played);
  })


  // Game starts. show my hand.
  socket.on("gameStart", function(data) {
    populateHand(data.cards);
    sortHand();
    $("#deck").click(drawCard);
    $("#sortBy").change(sortHand);
  })

  // If login is unsuccessful, go back to the homepage
  window.LoginManager.setLoginFail(
    function(){ window.location.assign("/"); }
  );

  // Add cards to hand
  socket.on("drewCard", function(data) {
    populateHand(data.cards);
    sortHand();
  });

  // Grow discard pile
  socket.on("discard", function(data) {
    populateHand(data.cards);
    populateDiscard(data.discardPile);
    sortHand();
  });

  socket.on("playedCard", function(data) {
    populateHand(data.cards);
    populatePlayed(data.playedPile);
    sortHand();
  });

  // Chat message update
  socket.on('update', function(data) {
    $("#chatText").append($("<li>").html(data.msg));
  });

  $("#gameName").html(window.location.href.split("/game/")[1]);
  $("#readyButton").click(toggleReady);
  $(".chats").css("height", 600);
  $("#player1name").html(username);
  $("#takeButton").click(takeCard);
  $("#trashButton").click(trashCard);
  $("#drawButton").click(drawCard);
  
  var hash = hashEmailString(username);
  $(".image-wrap").css("background", "url("+gravatar+hash+") no-repeat center center");

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
  socket.emit("toggleReady", 
    {
      username : username,
      ready: $("#readyButton").hasClass("after")
  });
}

// Sends chat
function doSend() {
  var text = $('#text').val();
  socket.emit('sendInGame', { 
    username : window.username,
    msg : text});
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


function sortHand() {
  var type = parseInt($("#sortBy").val());

  var rankSort = function(a, b) { 
    var aVal = mapToNum(encodeURI($(a).text()).split("%")[0]);
    var bVal = mapToNum(encodeURI($(b).text()).split("%")[0]);
    return  aVal - bVal;
  }

  var suitSort = function(a, b) { 
    var aVal = mapToNum(encodeURI($(a).text()).split("%"));
    var bVal = mapToNum(encodeURI($(b).text()).split("%"));
    aVal.splice(0,1);
    bVal.splice(0,1);
    aVal = decodeURI(aVal.join(""));
    bVal = decodeURI(bVal.join(""));
    return aVal.localeCompare(bVal);
  }

  var hasSuit = function(suitChar) {
    return function(elem) {
      return ($(elem).text().indexOf(suitChar) !== -1);
    };
  }


  var cardList = $("#playerHand");

  var newHand;

  if (type === 2) {


// DO suitSort, then find indices of change. break into int subarray,s sort them, concat


    newHand = $("#playerHand").children().sort(suitSort);
    var pivots = [0];
    for (var i = 0; i < newHand.length - 1; i++) {
      if ($(newHand[i]).text().substr(1) !== $(newHand[i+1]).text().substr(1)) {
        pivots.push(i+1);
      }
    };

    console.log(pivots);
    pivots.push(newHand.length);

    var finalHand = [];
    var tempArray = [];

    for (var i = 0; i < pivots.length - 1; i++) {
      tempArray = newHand.slice(pivots[i], pivots[i+1]);
      console.log(tempArray);
      tempArray = tempArray.sort(rankSort);
      console.log(tempArray);
      finalHand = finalHand.concat(tempArray);
      console.log("FINAL HAND");
      console.log(finalHand);
      tempArray = [];
    }


    /*var clubs = newHand.filter(function(elem) { $(elem).text().indexOf("♣") !== -1 });
    var spades = newHand.filter(function(elem) { $(elem).text().indexOf("♥") !== -1 });
    var diamonds = newHand.filter(function(elem) { $(elem).text().indexOf("♦") !== -1 });
    var hearts = newHand.filter(function(elem) { $(elem).text().indexOf("♣") !== -1 });
    clubs = clubs.sort(rankSort);
    spades = spades.sort(rankSort);
    diamonds = diamonds.sort(rankSort);
    hearts = hearts.sort(rankSort);
    newHand = [].concat(clubs,spades, diamonds. hearts);*/
    
    console.log(finalHand);
    newHand = finalHand;
  } else {
    newHand = $("#playerHand").children().sort(rankSort);
  }


  cardList.html("");
  for (var i = 0; i < newHand.length; i++) {
    cardList.append($(newHand[i]));
  };
  //Sort by rank

  //Sort by suit
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
