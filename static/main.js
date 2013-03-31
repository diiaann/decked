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

});

function doLogin() {
  var userName = $('#name').val();
  socket.emit('login', {"userName": userName});
}


function doSend() {
  var text = $('#text').val();
  socket.emit('send', { msg : text});
}