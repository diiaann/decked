/*=============================================
     self loading login manager

=============================================*/

$(document).ready(function(){
    (function(){

        var g = {
            onLoginSuccess: function(){
            },
            onRegisterSuccess: function(){
                var username = usernameInput.value.replace(/\s+/g, ' ');
                var password = passwordInput.value;

                login(username, password);
            },
            onRegisterFail: function(msg){
                alert(msg);
            },
            onLoginFail: function(msg){
                alert(msg);
            }
        }

        //==================
        //  API
        //==================

        window.LoginManager = {
            setLoginSuccess: function(callback){
                g.onLoginSuccess = callback;
            },
            setRegisterSuccess: function(callback){
                g.onRegisterSuccess = callback;
            },
            setRegisterFail: function(callback){
                g.onRegisterFail = callback;
            },
            setLoginFail: function(callback){
                g.onLoginFail = callback;
            }
        }

        //==================
        //  DOM
        //==================

        var loginButton = document.getElementById('loginButton');
        var registerButton = document.getElementById('registerButton');

        var usernameInput = document.getElementById('usernameInput');
        var passwordInput = document.getElementById('passwordInput');

        loginButton.onclick = function(){
            var username = usernameInput.value.replace(/\s+/g, ' ');
            var password = passwordInput.value;

            login(username, password);
            
        }
        registerButton.onclick = function(){
            var username = usernameInput.value.replace(/\s+/g, ' ');
            var password = passwordInput.value;

                register(username, password);
        }

        //==================
        //  server API
        //==================

        function login(username, password, done){
            if (username !== "" && password !== "") {
                window.username = username;
                window.password = password;
                post(
                    '/login', 
                    {   
                        username: username, 
                        password: password 
                    }, 
                    handleLoginResult
                );
            } else {
                g.onLoginFail("");
            }
        }

        function register(username, password, done){
            if (username !== "" && password !== "") {
                post(
                    '/register', 
                    {   
                        username: username, 
                        password: password 
                    }, 
                    handleRegisterResult
                );
            } else {
                g.onRegisterFail("");
            }
        }

        function handleRegisterResult(err, result){
            if (err)
                throw err;
            if (result === 'ok'){
                g.onRegisterSuccess();
            }
            else
                g.onRegisterFail(result);
        }

        function handleLoginResult(err, result){
            if (err)
                throw err;
            if (result === 'ok')
                g.onLoginSuccess();
            else
                g.onLoginFail(result);
        }

        function post(url, data, done){
            var request = new XMLHttpRequest();
            var async = true;
            request.open('post', url, async);
            request.onload = function(){
                if (done !== undefined){
                    var res = request.responseText
                    done(null, res);
                }
            }
            request.onerror = function(err){
                done(err, null);
            }
            if (data !== undefined){
                var body = new FormData();
                for (var key in data){
                    body.append(key, data[key]);
                }
                request.send(body);
            }
            else {
                request.send();
            }
        }

        /* Addition to Evan Shapiro's code:
         *
         * Logs in using cookies when the page loads, automatically 
         * logging in an already logged in user.
         */

        window.checkLogin = function() {
            var cookies = document.cookie.split('; ')
            var found = false;

            for (var i = cookies.length - 1; i >= 0; i--) {
                if (cookies[i].indexOf("username=") === 0) {
                    var cookie = cookies[i];
                    window.username = cookie.substring("username=".length, 
                        cookie.length);
                    found = true;
                }
                if (cookies[i].indexOf("password=") === 0) {
                    var cookie = cookies[i];
                    window.password = cookie.substring("password=".length, 
                        cookie.length);
                    found = true;
                }
            };
            if (found === true){
                if (username !== undefined && password !== undefined) {
                    login(username, password, handleLoginResult);
                }
            }


        }

        checkLogin();

    })();
});