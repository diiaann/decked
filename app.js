// ========================
// ==== Express server ====
// ========================

var globals = {
  users : [],
  games : [],
  publicGames : [],
  socketsToGames : {}
};
var express = require("express");
var app = express();
var mongoExpressAuth = require('mongo-express-auth');
var cards = require("./cards.js");
var socket = require("./socketCode.js")(globals);

// Use mongo-express-auth library
mongoExpressAuth.init({
    mongo: { 
        dbName: 'userAccounts',
        collectionName: 'accounts'
    }
}, function(){
    app.listen(3000);
});


app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.session({ secret: 'M3I9H7P5GQO2PO38W667AOL6R0M998AV' }));

// Static Content
app.get("/static/:staticFilename", function (request, response) {
  response.sendfile("static/" + request.params.staticFilename);
});

// Get a game 
app.get("/game/:gameName", function (request, response) {
    var mobile = checkMobile(request.headers["user-agent"]);
    if (mobile !== false) {
        response.sendfile("static/game.html");
    } else if (globals.games[request.params.gameName] === undefined) {
    response.sendfile("static/404.html");  
    } else {
        // Serves game
        if (request.params.gameName.indexOf(".") === -1){
          response.sendfile("static/game2.html");
        } 
        // Serves scripts and stylesheets
        else {
          response.sendfile("static/" + request.params.gameName);
        }
    }
});

app.get("/socket.io/socket.io.js",function (request, response) {
  response.sendfile("static/js/socket.io.js");
});

app.use("/static/css", express.static(__dirname + '/static/css'));
app.use("/static/js", express.static(__dirname + '/static/js'));
app.use("/static/imgs", express.static(__dirname + '/static/imgs'));

app.listen(8889);

// ======================
// = ROUTES FOR DB AUTH =
// ======================

app.get('/', function(req, res){
            res.sendfile('static/index.html');
});

app.get('/me', function(req, res){
    mongoExpressAuth.checkLogin(req, res, function(err){
        if (err)
            res.send(err);
        else {
            mongoExpressAuth.getAccount(req, function(err, result){
                if (err)
                    res.send(err);
                else 
                    res.send(result); // NOTE: direct access to the database is a bad idea in a real app
            });
        }
    });
});

app.post('/login', function(req, res){
    mongoExpressAuth.login(req, res, function(err){
        if (err) { 
            res.send(err);
        }

        else {
            res.send('ok');

        }
    });
});

app.post('/logout', function(req, res){
    mongoExpressAuth.logout(req, res);
    res.send('ok');
});

app.post('/register', function(req, res){
    mongoExpressAuth.register(req, function(err){
        if (err)
            res.send(err);
        else
            res.send('ok');
    });
});

app.use(express.static(__dirname + '/static/'));

function checkMobile(userAgent) {
    if ((userAgent.indexOf("Android") !== -1) || 
        (userAgent.indexOf("iPad") !== -1) || 
        (userAgent.indexOf("iPhone") !== -1) ||
        (userAgent.indexOf("iPod Touch") !== -1) ||
        (userAgent.indexOf("Windows Phone") !== -1)) {
        return true;
      } else {
        return false;
      }
}