POPULATE = (function() {
  var exports = {};

  // Populate your hand
  exports.hand = function(cards) {
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
      // New list element
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
          if (window.dragging !== undefined) {
            window.dragging.offset({
              top : e.pageY - $(that).width()/2,
              left: e.pageX - $(that).height()/2
            });
          }
        });

        // When we release, have we dragged it to a part of the board?
        $(this).on("mouseup", function(e){
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

          // Perform the correct action
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

  // Clear the table
  exports.clearPlayed = function() {
    $("#southPlayedUL").html("");
    $("#eastPlayedUL").html("");
    $("#westPlayedUL").html("");
    $("#northPlayedUL").html("");
  }

  // Sorts the hand according to the user specification.
  exports.sortHand = function() {
    // Controls how we sort.
    var type = parseInt($("input[type='radio'][name='view']:checked").val());

    // by rank
    var rankSort = function(a, b) { 
      var aVal = parseInt(mapToNum(encodeURI($(a).text()).split("%")[0]));
      var bVal = parseInt(mapToNum(encodeURI($(b).text()).split("%")[0]));
      //console.log(aVal, bVal);
      return  aVal - bVal;
    }

    // by suit
    var suitSort = function(a, b) { 
      var aVal = mapToNum(encodeURI($(a).text()).split("%"));
      var bVal = mapToNum(encodeURI($(b).text()).split("%"));
      aVal.splice(0,1);
      bVal.splice(0,1);
      aVal = decodeURI(aVal.join(""));
      bVal = decodeURI(bVal.join(""));
      return aVal.localeCompare(bVal);
    }

    // helper
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


      // Do suitSort, then find indices of change. break into 
      // subarrays sort them, concatenate them
      newHand = $("#playerHand").children().sort(suitSort);
      for (var i = 0; i < newHand.length - 1; i++) {
        if ($(newHand[i]).text().substr($(newHand[i]).text().length -1)!== 
          $(newHand[i+1]).text().substr($(newHand[i+1]).text().length -1)) {
          pivots.push(i+1);
        }
      };

      pivots.push(newHand.length);

      for (var i = 0; i < pivots.length - 1; i++) {
        tempArray = newHand.slice(pivots[i], pivots[i+1]);
        tempArray = tempArray.sort(rankSort);
        finalHand = finalHand.concat(tempArray);
        tempArray = [];
      }

      newHand = finalHand;
    } else {

      // Sort by rank, then suit.
      newHand = $("#playerHand").children().sort(rankSort);
      for (var i = 0; i < newHand.length - 1; i++) {
        if ($(newHand[i]).text().substr(0, $(newHand[i]).text().length - 1)!== 
          $(newHand[i+1]).text().substr(0, $(newHand[i+1]).text().length - 1)) {
          pivots.push(i+1);
        }
      };

      pivots.push(newHand.length);

      for (var i = 0; i < pivots.length - 1; i++) {
        tempArray = newHand.slice(pivots[i], pivots[i+1]);
        tempArray = tempArray.sort(suitSort);
        finalHand = finalHand.concat(tempArray);
        tempArray = [];
      }

      newHand = finalHand;
    }


    // Populate hand and assign event listeners
    cardList.html("");
    for (var i = 0; i < newHand.length; i++) {
      var newLI = $(newHand[i]);

      cardList.append(newLI);
    
      // For touch devices
      newLI.bind('touchstart',function(event) {
          if (event.originalEvent.targetTouches.length > 1) {
            return;
          }
          
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
          if (e.targetTouches.length > 1) {
            return;
          }
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
          
          if (e.changedTouches.length > 1) {
            $(this).unbind("touchend");
            $(document.body).unbind("touchmove");
            return;
          }

          // Need coordinates
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

          if (centerX >= playedXL && centerX <= playedXR && 
              centerY >= playedYT && centerY <= playedYB) {
            playCard(rank, getSuit(suit));
          } else if (centerX >= discardXL && centerX <= discardXR && 
              centerY >= discardYT && centerY <= discardYB) {
            discard(rank, getSuit(suit));
          }
          
          window.dragging.offset(origOffset);
          window.dragging = null;
          
        });
    });


      // For non-touch devices 
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

          $("#played").css("background-color", "");

          // Need coordinates
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
          $(document.body).unbind("mousemove");
          $('#deckarea #discard').unbind("mouseup");

          if (centerX >= playedXL && centerX <= playedXR && 
              centerY >= playedYT && centerY <= playedYB) {
            playCard(rank, getSuit(suit));
          } else if (centerX >= discardXL && centerX <= discardXR && 
              centerY >= discardYT && centerY <= discardYB) {
            discard(rank, getSuit(suit));
          }
          
          window.dragging.offset(origOffset);
          window.dragging = null;

        });

      });

    };
  }

  // Populate the play area in teh given list of cards
  exports.played = function(cards, cardList) {
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
      newButton.addClass("microCard");
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

        $(that).css("z-index", 99);
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

        // Check the player's hand div.
        $("#player1").on("mouseup", function(e){
          var centerX = e.pageX;
          var centerY = e.pageY;
          var player1XL = $("#player1").offset().left;
          var player1YT = $("#player1").offset().top;
          var player1XR = $("#player1").offset().left + $("#player1").width();
          var player1YB = $("#player1").offset().top + $("#player1").height();

          $(this).unbind("mouseup");
          $('#deckarea').unbind("mouseup");
          $('#discard').unbind("mouseup");
          $('#player1').unbind("mouseup");
          console.log(cardList);
          window.cl = cardList;
          
          if (centerX >= player1XL && centerX <= player1XR && 
              centerY >= player1YT && centerY <= player1YB) {
            takeFromPlayed(
              $(cardList.parent().children()[0]).html(),
              rank, getSuit(suit));
          }
          
          window.dragging.offset(origOffset);
          window.dragging = null;
          $(that).removeAttr("z-index");

          $(document.body).unbind("mousemove");
        });

      // Check discard/play area
      $(this).on("mouseup", function(e){

          // Coordinates
          var centerX = e.pageX;
          var centerY = e.pageY;
          var player1XL = $("#player1").offset().left;
          var player1YT = $("#player1").offset().top;
          var player1XR = $("#player1").offset().left + $("#player1").width();
          var player1YB = $("#player1").offset().top + $("#player1").height();
          var discardXL = $("#discard").offset().left;
          var discardYT = $("#discard").offset().top;
          var discardXR = $("#discard").offset().left + $("#discard").width();
          var discardYB = $("#discard").offset().top + $("#discard").height();
          var northPlayedXL = $("#northPlayedUL").offset().left;
          var northPlayedYT = $("#northPlayedUL").offset().top;
          var northPlayedXR = $("#northPlayedUL").offset().left + $("#northPlayedUL").width();
          var northPlayedYB = $("#northPlayedUL").offset().top + $("#northPlayedUL").height();
          var eastPlayedXL = $("#eastPlayedUL").offset().left;
          var eastPlayedYT = $("#eastPlayedUL").offset().top;
          var eastPlayedXR = $("#eastPlayedUL").offset().left + $("#eastPlayedUL").width();
          var eastPlayedYB = $("#eastPlayedUL").offset().top + $("#northPlayedUL").height();
          var westPlayedXL = $("#westPlayedUL").offset().left;
          var westPlayedYT = $("#westPlayedUL").offset().top;
          var westPlayedXR = $("#westPlayedUL").offset().left + $("#westPlayedUL").width();
          var westPlayedYB = $("#westPlayedUL").offset().top + $("#westPlayedUL").height();
          var southPlayedXL = $("#southPlayedUL").offset().left;
          var southPlayedYT = $("#southPlayedUL").offset().top;
          var southPlayedXR = $("#southPlayedUL").offset().left + $("#southPlayedUL").width();
          var southPlayedYB = $("#southPlayedUL").offset().top + $("#southPlayedUL").height();
          var discardXL = $("#discard").offset().left;
          var discardYT = $("#discard").offset().top;
          var discardXR = $("#discard").offset().left + $("#discard").width();
          var discardYB = $("#discard").offset().top + $("#discard").height();

          // Clean up listeners
          $(this).unbind("mouseup");
          $('#deckarea').unbind("mouseup");
          $('#discard').unbind("mouseup");
          $('#player1').unbind("mouseup");
          $(that).removeAttr("z-index");

          // Have we done something?
          if (cardList.attr("id").indexOf("south") !== -1) {
            if (centerX >= player1XL && centerX <= player1XR && 
                centerY >= player1YT && centerY <= player1YB) {
              takeFromPlayed(
                $(cardList.parent().children()[0]).html(),
                rank, getSuit(suit));
            } else if (centerX >= northPlayedXL && centerX <= northPlayedXR && 
                centerY >= northPlayedYT && centerY <= northPlayedYB){
                takeInPlayed(username,
                $($("#northPlayedUL").parent().children()[0]).html(),
                rank, getSuit(suit));
            } else if (centerX >= westPlayedXL && centerX <= westPlayedXR && 
                centerY >= westPlayedYT && centerY <= westPlayedYB){
                takeInPlayed( username,
                $($("#westPlayedUL").parent().children()[0]).html(),
                rank, getSuit(suit));
            } else if (centerX >= eastPlayedXL && centerX <= eastPlayedXR && 
                centerY >= eastPlayedYT && centerY <= eastPlayedYB){
                takeInPlayed( username,
                $($("#eastPlayedUL").parent().children()[0]).html(),
                rank, getSuit(suit));
            } else if (centerX >= discardXL && centerX <= discardXR && 
                centerY >= discardYT && centerY <= discardYB) {
                console.log('discard!');
                discardFromPlayed(rank, getSuit(suit));
            }
          } else {
            if (centerX >= southPlayedXL && centerX <= southPlayedXR && 
                centerY >= southPlayedYT && centerY <= southPlayedYB){
              takeInPlayed(
              $(cardList.parent().children()[0]).html(), username,
              rank, getSuit(suit));
            } else if (centerX >= player1XL && centerX <= player1XR && 
                centerY >= player1YT && centerY <= player1YB) {
              console.log('into hand');
              takeFromPlayed(
              $(cardList.parent().children()[0]).html(),
              rank, getSuit(suit));
            } 
          }

          window.dragging.offset(origOffset);
          window.dragging = null;
          $(document.body).unbind("mousemove");
        });

      });


      // Mobile devices
      newLI.bind('touchstart',function(event) {
      
        if (event.originalEvent.targetTouches.length > 1) {
            return;
          }

        var that = $(this).children()[0];
        var origOffset = $(that).offset();
        var cardData = that.value.split("&");
        var rank = cardData[0];
        var suit = "&" + cardData[1];

        $(that).css("z-index", 99);
        window.dragging = $(event.target);

        // Drag it around
        $(document.body).on("touchmove", function(event) {

          event.preventDefault();
          var e = event.originalEvent;
          var touch = e.targetTouches[0];
          if (e.targetTouches.length > 1) {
            return;
          }
          if (window.dragging !== undefined) {
            window.dragging.offset({
              top : touch.pageY - $(that).width()/2,
              left: touch.pageX - $(that).height()/2
            });
          }
        });

        // Player hand div
         $("#player1").on("touchend", function(e){

          var e = event.originalEvent;
          var touch = e.targetTouches[0];

          if (e.targetTouches.length > 1) {
            $(this).unbind("touchend");
            $('#deckarea').unbind("touchend");
            $('#discard').unbind("touchend");
            $('#player1').unbind("touchend");
            return;
          }

          var centerX = touch.pageX;
          var centerY = touch.pageY;
          var player1XL = $("#player1").offset().left;
          var player1YT = $("#player1").offset().top;
          var player1XR = $("#player1").offset().left + $("#player1").width();
          var player1YB = $("#player1").offset().top + $("#player1").height();
          
          if (centerX >= player1XL && centerX <= player1XR && 
              centerY >= player1YT && centerY <= player1YB) {
            takeFromPlayed(
              $(cardList.parent().children()[0]).html(),
              rank, getSuit(suit));
          }
          
          window.dragging.offset(origOffset);
          window.dragging = null;
          $(that).removeAttr("z-index");

          $(document.body).unbind("mousemove");
        });


        // Play area and discard
        $(this).on("touchend", function(event){

          var e = event.originalEvent;
          var touch = e.changedTouches[0];

          if (e.changedTouches.length > 1) {
            return;
          }

          var centerX = touch.pageX;
          var centerY = touch.pageY;
          var player1XL = $("#player1").offset().left;
          var player1YT = $("#player1").offset().top;
          var player1XR = $("#player1").offset().left + $("#player1").width();
          var player1YB = $("#player1").offset().top + $("#player1").height();
          var discardXL = $("#discard").offset().left;
          var discardYT = $("#discard").offset().top;
          var discardXR = $("#discard").offset().left + $("#discard").width();
          var discardYB = $("#discard").offset().top + $("#discard").height();
          var northPlayedXL = $("#northPlayedUL").offset().left;
          var northPlayedYT = $("#northPlayedUL").offset().top;
          var northPlayedXR = $("#northPlayedUL").offset().left + $("#northPlayedUL").width();
          var northPlayedYB = $("#northPlayedUL").offset().top + $("#northPlayedUL").height();
          var eastPlayedXL = $("#eastPlayedUL").offset().left;
          var eastPlayedYT = $("#eastPlayedUL").offset().top;
          var eastPlayedXR = $("#eastPlayedUL").offset().left + $("#eastPlayedUL").width();
          var eastPlayedYB = $("#eastPlayedUL").offset().top + $("#northPlayedUL").height();
          var westPlayedXL = $("#westPlayedUL").offset().left;
          var westPlayedYT = $("#westPlayedUL").offset().top;
          var westPlayedXR = $("#westPlayedUL").offset().left + $("#westPlayedUL").width();
          var westPlayedYB = $("#westPlayedUL").offset().top + $("#westPlayedUL").height();
          var southPlayedXL = $("#southPlayedUL").offset().left;
          var southPlayedYT = $("#southPlayedUL").offset().top;
          var southPlayedXR = $("#southPlayedUL").offset().left + $("#southPlayedUL").width();
          var southPlayedYB = $("#southPlayedUL").offset().top + $("#southPlayedUL").height();
          var discardXL = $("#discard").offset().left;
          var discardYT = $("#discard").offset().top;
          var discardXR = $("#discard").offset().left + $("#discard").width();
          var discardYB = $("#discard").offset().top + $("#discard").height();

          $(this).unbind("touchend");
          $('#player1').unbind("touchend");

          if (cardList.attr("id").indexOf("south") !== -1) {
            if (centerX >= player1XL && centerX <= player1XR && 
                centerY >= player1YT && centerY <= player1YB) {
              takeFromPlayed(
                $(cardList.parent().children()[0]).html(),
                rank, getSuit(suit));
            } else if (centerX >= northPlayedXL && centerX <= northPlayedXR && 
                centerY >= northPlayedYT && centerY <= northPlayedYB){
                takeInPlayed( username,
                $($("#northPlayedUL").parent().children()[0]).html(),
                rank, getSuit(suit));
            } else if (centerX >= westPlayedXL && centerX <= westPlayedXR && 
                centerY >= westPlayedYT && centerY <= westPlayedYB){
                takeInPlayed( username,
                $($("#westPlayedUL").parent().children()[0]).html(),
                rank, getSuit(suit));
            } else if (centerX >= eastPlayedXL && centerX <= eastPlayedXR && 
                centerY >= eastPlayedYT && centerY <= eastPlayedYB){
                takeInPlayed( username,
                $($("#eastPlayedUL").parent().children()[0]).html(),
                rank, getSuit(suit));
            } else if (centerX >= discardXL && centerX <= discardXR && 
                centerY >= discardYT && centerY <= discardYB) {
                console.log('discard!');
                discardFromPlayed(rank, getSuit(suit));
            }
          } else {
            if (centerX >= southPlayedXL && centerX <= southPlayedXR && 
                centerY >= southPlayedYT && centerY <= southPlayedYB){
              takeInPlayed(
              $(cardList.parent().children()[0]).html(), username,
              rank, getSuit(suit));
            } else if (centerX >= player1XL && centerX <= player1XR && 
                centerY >= player1YT && centerY <= player1YB) {
              console.log('into hand');
              takeFromPlayed(
              $(cardList.parent().children()[0]).html(),
              rank, getSuit(suit));
            } 
          }
	
          $(that).removeAttr("z-index");
          window.dragging.offset(origOffset);
          window.dragging = null;
          $(document.body).unbind("mousemove");

        });

      });

    };
  }  

 
  // Populate the discard pile DOM element
  exports.discard = function (cards) {
  var index, suit;
  var discard = $("#discard");
  discard.unbind("click");
  if (cards === undefined || 
    cards.length === 0 ) {
    discard.html("");
    discard.addClass("disClass");
    discard.css("font-size", "20px");
    discard.removeClass("diamond");
    return;
  }
  
  index = cards.length - 1;

  suit = getUnicodeSymbol(cards[index].suit);

  window.discardPile = cards;
  discard.html("");
  discard.html(cards[index].rank + suit);
  discard.removeClass("disClass");
  discard.addClass("whiteText");
  discard.css("font-size", "45px");
  discard.removeClass("diamond");
  discard.unbind("onClick");
  if (suit === heartUnicode || suit === diamondUnicode) {
    discard.addClass("diamond");
  } else {
    discard.removeClass("diamond");
  }
  discard.click(pickupDiscard);
  }


  return exports;

}());

