window.socket;
window.username;
window.password;

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
    $("#chat").append($("<li>").html(data.msg));
  });

  socket.on("newPlayer", function(data) {
    var playerList = $("#playerList");
    playerList.html("");
    for (var i = data.players.length - 1; i >= 0; i--) {
      console.log(data.players[i]);
         playerList.append($("<li>").html(data.players[i]));
       };
  });

  socket.on("joinFailed", function(data) {
    window.location.assign("/");
  });

  socket.on("joinSuccess", function(data) {
    console.log("JOINED GAME");
    var playerList = $("#playerList");
    playerList.html("");
    for (var i = data.players.length - 1; i >= 0; i--) {
         playerList.append($("<li>").html(data.players[i]));
       };   
  });


  window.LoginManager.setLoginFail(
    function(){ window.location.assign("/"); }
  )


});