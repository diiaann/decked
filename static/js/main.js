var socket;

$(document).ready(function(){
  socket = io.connect("http://localhost:8888");
   
  socket.on('connect', function() {
    console.log("Connected.");
  });

  socket.on('news', function(data) {
      console.log(data);
  });

  socket.on('update', function(data) {
    $("#chat").append($("<li>").html(data.msg));
  });

  $("#post").click(doSend);
  $("#private").change(handleGamePW);

});

function handleGamePW() {  
  console.log("hey");
  if ($("#gamePW").hasClass("hidden")) {
    $("#gamePW").removeClass("hidden");
  } else {
    $("#gamePW").addClass("hidden");
  }
}

function doLogin() {
  var userName = $('#name').val();
  socket.emit('login', {"userName": userName});
}

function doSend() {
  var text = $('#text').val();
  socket.emit('send', { msg : text});
}

function getForm() {
  var groupName = $("#groupName").val()
  var numPlayers = $("#numPlayers").val()
  var privy = $("#private").is(":checked");
  var password;

  console.log(groupName, numPlayers, privy);
  if (privy) {
    password = $("#gamePW").val();
    console.log(password);
  }

}