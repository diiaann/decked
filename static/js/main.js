window.socket;
window.username;

$(document).ready(function(){
  socket = io.connect("http://localhost:8888");

  socket.on('update', function(data) {
    $("#chat").append($("<li>").html(data.msg));
  });

  socket.on("joinGame", function(data) {
    var splitLoc = location.href.split("/");
    var newLoc = splitLoc[0] + "//" + splitLoc[2] + 
                  "/game/" + data.gameName;
    window.location.assign(newLoc);
  });

  socket.on("requestGameFailed", function(data) {
    alert(data.msg);
  });

  $("#post").click(doSend);
  $("#private").change(handleGamePW);

  window.LoginManager.setLoginSuccess(hideLogin);
      
});

function hideLogin(){
  username = $("#loginButton").val();
}

function handleGamePW() {  
  if ($("#gamePW").hasClass("hidden")) {
    $("#gamePW").removeClass("hidden");
  } else {
    $("#gamePW").addClass("hidden");
  }
}

function doSend() {
  var text = $('#text').val();
  socket.emit('send', { msg : text});
}

function requestGame() {
  var groupName = $("#groupName").val()
  var numPlayers = $("#numPlayers").val()
  var privy = $("#private").is(":checked");
  var password;

  if (privy) {
    password = $("#gamePW").val();
    console.log("Private with password" + password);
  }

  socket.emit("requestGame", 
    { 
      name: groupName,
      numPlayers: numPlayers,
      private: privy,
      password: password,
      username: username
    }
  );
}

function checkLogin() {
  var cookies = document.cookie.split('; ')
  for (var i = cookies.length - 1; i >= 0; i--) {
    if (cookies[i].indexOf("username=") === 0) {
      var cookie = cookies[i];
      username = cookie.substring("username=".length, cookie.length);
    }
    if (cookies[i].indexOf("password=") === 0) {
      var cookie = cookies[i];
      password = cookie.substring("password=".length, cookie.length);
    }

  };
}