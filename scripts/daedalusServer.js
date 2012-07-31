//DAEDALUS SERVERSIDE

//HTTP SERVER SETUP============================================================
var http         = require('http'),
	fs           = require('fs'),
	server       = http.createServer(reqHandler).listen(8000),
	url          = require('url'),
	io           = require('socket.io').listen(server),
	githubAPI    = require('github'),
	git          = new githubAPI({ version : '3.0.0'}),
	services;

function reqHandler(req, res) {
    var request = url.parse(req.url, true),
        action  = request.pathname,
        query   = request.query,
        output  = processAction(action, query);
    if (output) {
    	res.writeHead(200, 
    		{
    	    'Content-Type'                : output.mimeType,
    		'Access-Control-Allow-Origin' : '*',
    		'Access-Control-Allow-Methods': 'POST' 
    		}
    	);
    	res.end(output.data);
    }
    else{
    	res.writeHead(500);
    	res.end('Something went wrong...');
    }    
}

function processAction(action, query){
	console.log('Processing action...')
	for (var i = 0; i < services.length; i++) {	
		if (action == services[i].identifier) {
	        var data = services[i].service(query),
	        type     = services[i].mimeType;
	        return {'data': data, 'mimeType': type};
	    }
	}
	return false;
}

services = [
	{'identifier': '/daedalus'             ,'service': daedalus          ,'mimeType': 'text/html'       },
	{'identifier': '/daedalusClient.js'    ,'service': daedalusClientJS  ,'mimeType': 'text/javascript' },
	{'identifier': '/ace.js'               ,'service': aceJS             ,'mimeType': 'text/javascript' },
	{'identifier': '/angular.js'           ,'service': angularJS         ,'mimeType': 'text/javascript' },
	{'identifier': '/theme-github.js'      ,'service': githubTheme       ,'mimeType': 'text/javascript' },
	{'identifier': '/mode-javascript.js'   ,'service': modeJS            ,'mimeType': 'text/javascript' },
	{'identifier': '/worker-javascript.js' ,'service': jsWorkerJS        ,'mimeType': 'text/javascript' },
	{'identifier': '/DaedaGit.js'          ,'service': daedaGitJS        ,'mimeType': 'text/javascript' },
	{'identifier': '/git_autho_redirect'   ,'service': authoRedirect     ,'mimeType': 'text/javascript' }, //not sure about this mime type
	{'identifier': '/daedalus.css'         ,'service': daedalusCSS       ,'mimeType': 'text/css'        }
];

function daedalus () {
	var output = fs.readFileSync(__dirname + '/../daedalus.html');
	return output;
}

function daedalusClientJS () {
	var output = fs.readFileSync(__dirname + '/daedalusClient.js');
	return output;
}

function aceJS () {
	var output = fs.readFileSync(__dirname + '/ace/src/ace.js');
	return output;
}

function angularJS () {
	var output = fs.readFileSync(__dirname + '/angular/angular.js');
	return output;
}

function githubTheme () {
	var output = fs.readFileSync(__dirname + '/ace/src/theme-github.js');
	return output;
}

function modeJS () {
	var output = fs.readFileSync(__dirname + '/ace/src/mode-javascript.js');
	return output;
}

function daedalusCSS () {
	var output = fs.readFileSync(__dirname + '/../style/daedalus.css');
	return output;
}

function jsWorkerJS () {
	var output = fs.readFileSync(__dirname + '/ace/src/worker-javascript.js');
	return output;
}

function daedaGitJS () {
	var output = fs.readFileSync(__dirname + '/DaedaGit/DaedaGit.js');
	return output;
}

function authoRedirect (queryObj) {
	console.log(queryObj);
	var code = 'code=' + queryObj.code,
	cid      = '&client_id=157454992955c2d49a14',
	secret   = '&client_secret=dad6c5683a00de3cf17cf2a76786a2295baed94',
	state    = '&state=' + queryObj.state,
	path     = '/login/oauth/access_token?' + code + cid + secret + state,
	headers  = {
		Accept           : 'application/json',
		'Content-Length' : 0
	},
	options  = {
		host      : 'www.github.com',
		'path'    : path,
		port      : 80,
		method    : 'POST',
		'headers' : headers
	},
	request  = http.request(options, function(res){
		res.on('data', function(data){
			console.log(data);
		});
	});
	request.end();
}


//SOCKET SETUP=================================================================

io.sockets.on('connection', function(socket){

	socket.on('logIn', function(params){
		git.authenticate({
			type    : 'basic',
			username: params.username,
			password: params.password
		});
	});

	socket.on('myRepos', function(params){
		git.repos.getAll({}, function(err,res){
			var output = err? err : res;
			console.log(output);
			socket.emit('display', output);
		});
	});

});