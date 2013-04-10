window.socket;
window.username;

$(document).ready(function(){
  socket = io.connect("http://localhost:8888");

  socket.on('update', function(data) {
    $("#chat").append($("<li>").html(data.msg));
  });

  socket.on("gotoGame", function(data) {
    var splitLoc = location.href.split("/");
    var newLoc = splitLoc[0] + "//" + splitLoc[2] + 
                  "/game/" + data.gameName;
    window.location.assign(newLoc);
  });

  socket.on("requestGameFailed", function(data) {
    alert(data.msg);
  });

  socket.on("joinFailed", function(data) {
    alert(data.msg);
  });

  socket.on("joinSuccess", function(data) {
    var splitLoc = location.href.split("/");
    var newLoc = splitLoc[0] + "//" + splitLoc[2] + 
                  "/game/" + data.gameName;
    window.location.assign(newLoc);
  });


  $("#post").click(doSend);
  $("#private").change(handleGamePW);
  //$("#requestGame").click(requestGame);

  window.LoginManager.setLoginSuccess(hideLogin);
      
});

function hideLogin(){
  var headerBar = $(".loginFields").children();
  for (var i = headerBar.length - 1; i >= 0; i--) {
    $(headerBar[i]).toggleClass("hidden");
  };

  $("#gameDiv").toggleClass("hidden");
}

function handleGamePW() {  
  if ($("#gamePWDiv").hasClass("none")) {
    $("#gamePWDiv").removeClass("none");
  } else {
    $("#gamePWDiv").addClass("none");
  }
}

function doSend() {
  var text = $('#text').val();
  socket.emit('send', { msg : text});
}

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


function requestGame() {
  var gameName = $("#groupName").val()
  var numPlayers = $("#numPlayers").val()
  var privy = $("#private").is(":checked");
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

  socket.emit("requestGame", 
    { 
      name: gameName,
      numPlayers: numPlayers,
      private: privy,
      password: password,
      username: username
    }
  );
}