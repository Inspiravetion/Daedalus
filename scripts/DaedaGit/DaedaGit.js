//DaedaGit:
window.DaedaGit = (function(){

 	var api = {};

//OAUTH========================================================================

	var client_id = '157454992955c2d49a14',
	client_secret = 'bdad6c5683a00de3cf17cf2a76786a2295baed94',
	base_url      = 'https://api.github.com/',
	username,
	password;

	/*
	 * Starts the first step of the OAuth process
	 */
	api.authenticate = function(scopeArr, state){
		var url  = 'https://github.com/login/oauth/authorize?client_id=' + client_id,
		scopeStr = scopeArr && scopeArr[0]? scopeArr[0] : null;
		if(scopeStr){
			for(var i = 1; i < scopeArr.length; i++){
				scopeStr += ',' + scopeArr[i];
			}
			url += '&scope=' + scopeStr;
		}
		url += state? '&state=' + state : '';
		//GET(url, null);
		console.log(url);
		window.location = url;
	};

//REPOS========================================================================

	/*
	 * Gets the currently authenticated user's repos and 
	 * calls the callback passing either the error it got or
	 * an array of repos in json format
	 */
	api.getRepos = function(callback){
		var autho = 'Basic ' + username + ':' + password;
		var headers ={};
		headers.Authorization = autho;
		headers.Accept        = '*/*';
		/*{
			Authorization: 'Basic ' + username + ':' + password
		};*/
		GET(base_url + 'user/repos', callback, headers);
	};

	/*
	 * Gets the indicated user's public repos and 
	 * calls the callback passing either the error it got or
	 * an array of repos in json format
	 */
	api.getPublicRepos = function(username, callback){
		GET(base_url + 'users/' + username + '/repos', callback);
	};

	/*
	 * ***If OAuth is used the repo scope is required for this to work***
     * Creates a repo with the given names and options and then 
     * calls the callback with the responce status and text
     * Options: 
     * {description: str, homepage: str, private: bool, 
     * has_issues: bool, has_wiki: bool, has_downloads: bool,
     * team_id: int}
     */
	api.createRepo = function(name, options, callback){
		var url = base_url + 'user/repos?name=' + name;
		for(prop in options){
			url += ('&' + prop + '=' + options[prop]);
		}
		POST(url, callback);
	};

	/*
	 * ***If OAuth is used the delete_repo scope is required for this to work***
	 * Deletes the specified users sepcified repo
	 */
	api.deleteRepo = function(user, repo, callback){
		var url = base_url + 'repos/' + user + '/' + repo;
		DELETE(url, callback);
	}

	/*
	 * Returns a list of branches in the given user's given repo.
	 */
	api.getBranches = function(user, repo, callback){
		var url = base_url + 'repos/' + user + '/' + repo + '/branches';
		GET(url, callback);
	}	

	/*
	 * Returns the specified branch from the specified repo of the specified user.
	 */
	api.getBranch = function(user, repo, branch, callback){
		var url = base_url + 'repos/' + user + '/' + repo + '/branches/' + branch;
		GET(url, callback);
	}

	//Return the DaedaGit API Object to be added to the window

	return api;

})();

/*
 * Adds an HTTP GET Request function to the global window object
 */
window.GET = function(url, callback){
	var req = new XMLHttpRequest();
	req.onreadystatechange = function(){
		if (req.readyState == 4 && callback) {
			callback(req.status, req.responseText);
		}
	}
	req.open('GET', url, true);
	req.send(null);
}

/*
 * Adds an HTTP POST Request function to the global window object
 */
window.POST = function(url, callback){
	var req = new XMLHttpRequest();
	req.onreadystatechange = function(){
		if (req.readyState == 4 && callback) {
			callback(req.status, req.responseText);
		}
	}
	req.open('POST', url, true);
	req.send(null);
}

/*
 * Adds an HTTP DELETE Request function to the global window object
 */
window.DELETE = function(url, callback){
	var req = new XMLHttpRequest();
	req.onreadystatechange = function(){
		if (req.readyState == 4 && callback) {
			callback(req.status, req.responseText);
		}
	}
	req.open('DELETE', url, true);
	req.send(null);
}

