window.socket;
window.username;
window.password;

$(document).ready(function(){
  socket = io.connect("http://localhost:8888");

  socket.on('update', function(data) {
    $("#chat").append($("<li>").html(data.msg));
  });

  window.LoginManager.setLoginFailure(
    function(){ window.location.assign("/"); }
  )

});

