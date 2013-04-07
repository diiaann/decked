var email = " diiaann@gmail.com";
var gravatar = "http://www.gravatar.com/avatar/"

function hashEmailString(var string){
	var cleanEmail = $.trim(string).toLowerCase();
	return $.md5(cleanEmail);
	
}