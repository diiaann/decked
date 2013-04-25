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
  });

  // Set initial width
  $("#playarea").css("width", document.width - $("#chat").width() - 160);

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
      console.log(currentDiv);
    }

    // Unhide used divs
    for (var i = 0; i < playerDivs.length; i++) {
      currentDiv = playerDivs[i];
      $(currentDiv + "Div").removeClass("hidden");
      $(currentDiv + "Name").html(players[i].userName);
      console.log(currentDiv);
    };

    // If you're the host, reveal the start button.
    if (data.allReady === true && (iAmHost === true)) {
      $("#startButton").removeClass("none");
      $("#startButton").click(doStart);
    }
  });


  // For host migration.
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
    var playerDivs = getPlayerDivs(numPlayers);
    var myIndex = getIndexFromPlayers(username, players);

    // Cycle list
    for (var i = 0; i < myIndex; i++) {
      players.push(players.shift());
    };

    // Shouldn't happen...
    if (playerDivs.length !== players.length) {
      alert("LISTS NOT THE SAME");
    }

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
      populateHand(data.hand);
      sortHand();
    }

    populatePlayed(data.cards);
  })


  // Someone discarded the played pile
  socket.on("trashed", function(data) {
    populateDiscard(data.cards);
    populatePlayed(data.played);
  })


  // Game starts. Show my hand.
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
      populatePlayed(players[i].playedPile, 
                    $("#" + playerDivs[i].substr(1) + "PlayedUL"));
    };

    populateDiscard(data.discardPile);
    sortHand();
  });

  // Card was put into the played pile
  socket.on("playedCard", function(data) {
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
      populatePlayed(players[i].playedPile, 
                    $("#" + playerDivs[i].substr(1) + "PlayedUL"));
    };

    populateHand(data.cards);
    sortHand();
  });

  // Chat message update
  socket.on('update', function(data) {
    $("#chatText").append($("<li>").html(data.msg));
    $('.chats').scrollTop($('#chatText').height());
  });

  // Set DOM elements
  $("#gameName").html(window.location.href.split("/game/")[1]);
  $("#readyButton").click(toggleReady);
  $(".chats").css("height", document.height - 46 - 70);
  $("#player1name").html(username);
  $("#takeButton").click(takeCard);
  $("#trashButton").click(trashCard);
 
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
function drawCard() {
  socket.emit("drawCard", {username : username});
}

// Populate the hand DOM element
function populateHand(cards) {
  var cardList = $("#playerHand");
  // Clear the list
  cardList.html("");
  
  if (cards === null ||
    cards.length === 0 ) {
    return;
  }

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

    // Start dragging when clicked
    newLI.mousedown(function(e) {
      var that = $(this).children()[0];
      var origOffset = $(that).offset();
      var cardData = that.value.split("&");
      var rank = cardData[0];
      var suit = "&" + cardData[1];
      


      // Drag it around
      $(document.body).on("mousemove", function(e) {
      	$("#played").css("background-color","purple");
        if (window.dragging !== undefined) {
          window.dragging.offset({
            top : e.pageY - $(that).width()/2,
            left: e.pageX - $(that).height()/2
          });
        }
      });

      // When we release, have we dragged it to a part of the board?
      $(this).on("mouseup", function(e){
      	$("#played").css("background-color","gray");
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
}

// Populate the discard pile DOM element
function populateDiscard(cards) {
  var index;
  var discard = $("#discard");
  if (cards === undefined || 
    cards.length === 0 ) {
    discard.html("<p>discard</p>");
    return;
  }
  
  index = cards.length - 1;

  window.discardPile = cards;
  discard.html("");
  discard.html(cards[index].rank + getUnicodeSymbol(cards[index].suit));
}

// Populate the discard pile DOM element
function populatePlayed(cards, cardList) {
  cardList.html("");
  
  if (cards === undefined ||
    cards.length === 0 ) {
    return;
  }

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

    // Start dragging when clicked
    newLI.mousedown(function(e) {
      var that = $(this).children()[0];
      var origOffset = $(that).offset();
      var cardData = that.value.split("&");
      var rank = cardData[0];
      var suit = "&" + cardData[1];

      $(this).css("z-index", 999);
      window.dragging = $(e.target);

      // Drag it around
      $(document.body).on("mousemove", function(e) {
        if (window.dragging !== undefined) {
          window.dragging.offset({
            top : e.pageY - $(that).width()/2,
            left: e.pageX - $(that).height()/2
          });
        }
      });

      // When we release, have we dragged it to a part of the board?
      $("#discard").on("mouseup", function(e){
        $("#played").css("background-color","gray");

        var centerX = e.pageX;
        var centerY = e.pageY;
        var discardXL = $("#discard").offset().left;
        var discardYT = $("#discard").offset().top;
        var discardXR = $("#discard").offset().left + $("#discard").width();
        var discardYB = $("#discard").offset().top + $("#discard").height();
        

        $(this).unbind("mouseup");
        console.log("MOUSEUP");
        console.log("me", centerX, centerY);
        console.log("it", discardXL, discardXR, discardYT, discardYB);
        
        if (centerX >= discardXL && centerX <= discardXR && 
            centerY >= discardYT && centerY <= discardYB) {
            console.log('discard!');
            discardFromPlayed(rank, getSuit(suit));
        }
        
        window.dragging.offset(origOffset);
        window.dragging = null;
        $(document.body).unbind("mousemove");
        $('#deckarea #discard').unbind("mouseup");
      });

      $(this).on("mouseup", function(e){
        $("#played").css("background-color","gray");

        var centerX = e.pageX;
        var centerY = e.pageY;
        var discardXL = $("#discard").offset().left;
        var discardYT = $("#discard").offset().top;
        var discardXR = $("#discard").offset().left + $("#discard").width();
        var discardYB = $("#discard").offset().top + $("#discard").height();
        

        $(this).unbind("mouseup");
        console.log("MOUSEUP");
        console.log("me", centerX, centerY);
        console.log("it", discardXL, discardXR, discardYT, discardYB);
        
        if (centerX >= discardXL && centerX <= discardXR && 
            centerY >= discardYT && centerY <= discardYB) {
            console.log('discard!');
            discardFromPlayed(rank, getSuit(suit));
        }
        
        window.dragging.offset(origOffset);
        window.dragging = null;
        $(document.body).unbind("mousemove");
        $('#deckarea #discard').unbind("mouseup");
      });

    });
    
    newLI.bind('touchstart',function(event) {
    
      var that = $(this).children()[0];
      var origOffset = $(that).offset();
      var cardData = that.value.split("&");
      var rank = cardData[0];
      var suit = "&" + cardData[1];

      $(this).css("z-index", 999);
      window.dragging = $(event.target);

      // Drag it around
      $(document.body).on("touchmove", function(event) {
      	event.preventDefault();
      	var e = event.originalEvent;
      	var touch = e.targetTouches[0];
        if (window.dragging !== undefined) {
          window.dragging.offset({
            top : touch.pageY - $(that).width()/2,
            left: touch.pageX - $(that).height()/2
          });
        }
      });

      // When we release, have we dragged it to a part of the board?
      $("#discard").on("touchend", function(event){
        $("#played").css("background-color","gray");
        var e = event.originalEvent;
        var touch = e.changedTouches[0];
        
        var centerX = touch.pageX;
        var centerY = touch.pageY;
        var discardXL = $("#discard").offset().left;
        var discardYT = $("#discard").offset().top;
        var discardXR = $("#discard").offset().left + $("#discard").width();
        var discardYB = $("#discard").offset().top + $("#discard").height();
        

        $(this).unbind("touchend");
        console.log("MOUSEUP");
        console.log("me", centerX, centerY);
        console.log("it", discardXL, discardXR, discardYT, discardYB);
        
        if (centerX >= discardXL && centerX <= discardXR && 
            centerY >= discardYT && centerY <= discardYB) {
            console.log('discard!');
            discardFromPlayed(rank, getSuit(suit));
        }
        
        window.dragging.offset(origOffset);
        window.dragging = null;
        $(document.body).unbind("touchmove");
        $('#deckarea #discard').unbind("touchend");
      });

      $(this).on("touchend", function(event){
        $("#played").css("background-color","gray");
        var e = event.originalEvent;
        var touch = e.changedTouches[0];
        var centerX = touch.pageX;
        var centerY = touch.pageY;
        var discardXL = $("#discard").offset().left;
        var discardYT = $("#discard").offset().top;
        var discardXR = $("#discard").offset().left + $("#discard").width();
        var discardYB = $("#discard").offset().top + $("#discard").height();
        

        $(this).unbind("touchend");
        console.log("MOUSEUP");
        console.log("me", centerX, centerY);
        console.log("it", discardXL, discardXR, discardYT, discardYB);
        
        if (centerX >= discardXL && centerX <= discardXR && 
            centerY >= discardYT && centerY <= discardYB) {
            console.log('discard!');
            discardFromPlayed(rank, getSuit(suit));
        }
        
        window.dragging.offset(origOffset);
        window.dragging = null;
        $(document.body).unbind("touchmove");
        $('#deckarea #discard').unbind("touchend");
      });

    });

  };
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


// Sorts the hand according to the user specification.
function sortHand() {
  // Controls how we sort.
  var type = parseInt($("#sortBy").val());

  // 
  var rankSort = function(a, b) { 
    var aVal = parseInt(mapToNum(encodeURI($(a).text()).split("%")[0]));
    var bVal = parseInt(mapToNum(encodeURI($(b).text()).split("%")[0]));
    //console.log(aVal, bVal);
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

  var finalHand = [];
  var tempArray = [];
  var pivots = [0];   

  if (type === 2) {


// DO suitSort, then find indices of change. break into int subarray,s sort them, concat
    newHand = $("#playerHand").children().sort(suitSort);
    for (var i = 0; i < newHand.length - 1; i++) {
      if ($(newHand[i]).text().substr($(newHand[i]).text().length -1)!== 
        $(newHand[i+1]).text().substr($(newHand[i+1]).text().length -1)) {
        pivots.push(i+1);
      }
    };

    //console.log(pivots);
    pivots.push(newHand.length);

    for (var i = 0; i < pivots.length - 1; i++) {
      tempArray = newHand.slice(pivots[i], pivots[i+1]);
      tempArray = tempArray.sort(rankSort);
      finalHand = finalHand.concat(tempArray);
      tempArray = [];
    }

    newHand = finalHand;
  } else {
    newHand = $("#playerHand").children().sort(rankSort);
    for (var i = 0; i < newHand.length - 1; i++) {
      if ($(newHand[i]).text().substr(0, $(newHand[i]).text().length - 1)!== 
        $(newHand[i+1]).text().substr(0, $(newHand[i+1]).text().length - 1)) {
        pivots.push(i+1);
      }
    };

    //console.log(pivots);
    pivots.push(newHand.length);

    for (var i = 0; i < pivots.length - 1; i++) {
      tempArray = newHand.slice(pivots[i], pivots[i+1]);
      tempArray = tempArray.sort(suitSort);
      finalHand = finalHand.concat(tempArray);
      tempArray = [];
    }

    newHand = finalHand;
  }


  cardList.html("");
  for (var i = 0; i < newHand.length; i++) {
    var newLI = $(newHand[i]);

    cardList.append(newLI);
    
    newLI.bind('touchstart',function(event) {

        
        var that = $(this).children()[0];
        var origOffset = $(that).offset();
        var cardData = that.value.split("&");
        var rank = cardData[0];
        var suit = "&" + cardData[1];
        window.dragging = $(event.target);

      // Drag it around
      $(document.body).on("touchmove", function(event) {
         event.preventDefault();
      	 var e = event.originalEvent;
      	 var touch = e.targetTouches[0];
         if (window.dragging !== undefined) {
          window.dragging.offset({
            top : touch.pageY - $(that).width()/2,
            left: touch.pageX - $(that).height()/2
          });
        }
      });

      // When we release, have we dragged it to a part of the board?
      $(this).on("touchend", function(event){
        var e = event.originalEvent;
        var touch = e.changedTouches[0];
        
        var centerX = touch.pageX;
        var centerY = touch.pageY;
        var discardXL = $("#discard").offset().left;
        var discardYT = $("#discard").offset().top;
        var discardXR = $("#discard").offset().left + $("#discard").width();
        var discardYB = $("#discard").offset().top + $("#discard").height();
        var playedXL = $("#played").offset().left;
        var playedYT = $("#played").offset().top;
        var playedXR = $("#played").offset().left + $("#played").width();
        var playedYB = $("#played").offset().top + $("#played").height();

        $(this).unbind("touchend");

        if (centerX >= playedXL && centerX <= playedXR && 
            centerY >= playedYT && centerY <= playedYB) {
          playCard(rank, getSuit(suit));
        } else if (centerX >= discardXL && centerX <= discardXR && 
            centerY >= discardYT && centerY <= discardYB) {
          discard(rank, getSuit(suit));
        }
        
        window.dragging.offset(origOffset);
        window.dragging = null;
        $(document.body).unbind("touchmove");
        $('#deckarea #discard').unbind("touchend");
      });
  		
  		
  	/*	if (event.targetTouches.length === 1) {
	  		var touch = event.targetTouches[0];
	  		console.log("left" + touch.pageX + "px");
	}*/
  });


    newLI.mousedown(function(e) {
      var that = $(this).children()[0];
      var origOffset = $(that).offset();
      var cardData = that.value.split("&");
      var rank = cardData[0];
      var suit = "&" + cardData[1];
      window.dragging = $(e.target);
     $("#played").css("background-color","#afafaf");


      // Drag it around
      $(document.body).on("mousemove", function(e) {
        if (window.dragging !== undefined) {
          window.dragging.offset({
            top : e.pageY - $(that).width()/2,
            left: e.pageX - $(that).height()/2
          });
        }
      });

      // When we release, have we dragged it to a part of the board?
      $(this).on("mouseup", function(e){
        $("#played").css("background-color","gray");

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

        $(this).unbind("mouseup");

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
