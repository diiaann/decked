window.socket;
window.username;

var gravatar = "http://www.gravatar.com/avatar/";

$(document).ready(function(){
  socket = io.connect("http://localhost:8888");
  // update chat message
  socket.on('update', function(data) {
    $("#chatText").append($("<li>").html(data.msg));
  });

  // Switch page to a game
  socket.on("gotoGame", function(data) {
    var splitLoc = location.href.split("/");
    var newLoc = splitLoc[0] + "//" + splitLoc[2] + 
                  "/game/" + data.gameName;
    window.location.assign(newLoc);
  });

  // Game request has failed
  socket.on("requestGameFailed", function(data) {
    alert(data.msg);
  });

  // Game join has failed
  socket.on("joinFailed", function(data) {
    alert(data.msg);
  });

  // Game join success
  socket.on("joinSuccess", function(data) {
    var splitLoc = location.href.split("/");
    var newLoc = splitLoc[0] + "//" + splitLoc[2] + 
                  "/game/" + data.gameName;
    window.location.assign(newLoc);
  });


  // Set buttons
  $("#post").click(doSend);
  $("#private").change(handleGamePW);

  window.LoginManager.setLoginSuccess(hideLogin);
});

// Hides login fields
function hideLogin(){
  var headerBar = $(".loginFields").children();
  for (var i = headerBar.length - 1; i >= 0; i--) {
    $(headerBar[i]).toggleClass("invisible");   
  };
  
  $("#profileArea").html("Welcome back.");
  $("#loggedIn").toggleClass("invisible");
  $("#formArea").toggleClass("hidden");
  $("#nameSpace").html(window.username);
  
  var hash = hashEmailString(username);
  var dMM = "?d=mm";
  $(".image-wrap").css("background", "url("+gravatar+hash+dMM+") no-repeat center center");

}

// Hides game password fields
function handleGamePW() {  
  if ($("#gamePWDiv").hasClass("none")) {
    $("#gamePWDiv").removeClass("none");
  } else {
    $("#gamePWDiv").addClass("none");
  }
}

// Sends chat message
function doSend() {
  var text = $('#text').val();
  socket.emit('send', { msg : text});
}

// Attempt to join a game
function joinGame() {
  var gameName = $("#joinGameName").val()
  var password = $("#joinPW").val()

  if (gameName === "") {
    alert("Please enter a game name.");
    return;
  }
  
  socket.emit("joinGame",
    {
      username : window.username,
      gamename : gameName,
      password : password
    });
}

// Request a new game
function requestGame() {
  var gameName = $("#groupName").val();
  var numPlayers = $("#numPlayers").val();
  var privy = $("#private").is(":checked");
  var numDecks = $("#numDecks").val;
  var startingSize = $("#startingSize").val();
  var password;

  if (gameName === "") {
    alert("Please enter a game name.");
    return;
  }

  if (privy) {
    password = $("#gamePW").val();
    if (password === "") {
      alert("Please enter a game password.");
      return;
    }    
  }

  console.log(socket);

  window.socket.emit("requestGame", 
    { 
      name: gameName,
      numPlayers: numPlayers,
      private: privy,
      password: password,
      username: window.username,
      numDecks: numDecks,
      startingSize: startingSize
    }
  );

}