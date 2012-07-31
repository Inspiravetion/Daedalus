
window.onload = function(){

//=============================================================================
//Controllers

	editorCtrl = function($scope, Editor, MiniMap, Find, GoogleDrive, GoogleSearch, Git) {
	    
	    $scope.find = function(){
	        Find.find($scope.someText);
	    };

	    $scope.myRepos = function(){
	    	//Find.findNext();
	    	socket.emit('myRepos');
	    };

	    $scope.gitLogin = function(){
			DaedaGit.authenticate(['repo'], '123');
	    };

	    MiniMap.config(Editor);
	    Find.config(Editor);
	    Editor.editor.focus();
	    Editor.editor.getSession().setValue('');
	    Editor.editor.getSession().setMode('ace/mode/javascript');
	    MiniMap.minimap.getSession().setMode('ace/mode/javascript');

	    var socket = io.connect('http://192.168.125.101:8000');

	    socket.on('display', function(msg){
	    	var str = '';
	    	for(prop in msg[0]){
	    		str += (prop + ': ' + msg[0][prop] + '\n');
	    	}
	    	var str2 = eval(msg[0]);
	    	console.log(eval(msg));
	    	Editor.editor.insert(str);
	    });

	    Editor.editor.insert('is this at least working?');
	    
	};

//=============================================================================
//EditManager Module

	var em = angular.module('EditManager', []);

	/*
	 *
	 */
	em.factory('Editor', function(){

		this.editor = ace.edit('editor');
		this.editor.setTheme('ace/theme/github');
		this.editor.setBehavioursEnabled(true);

		return this;
	});

	/*
	 * 
	 */
	em.factory('Find', function(){

		this.config = function(editor){
			this.Editor = editor;
		}

	    this.find = function(text) {
	        var output = this.Editor.editor.find(text);
	        return output;
		};

		this.findNext = function() {
   	     	var output = this.Editor.editor.findNext();
        	return output;
    	};

    	this.findAll = function(text){
    		var output = this.Editor.editor.findAll(text);
    	};

    	this.replace = function(orig, repl){
    		this.Editor.editor.find(orig);
    		this.Editor.editor.replace(repl);
    	};

    	this.replaceAll = function(orig, repl){
    		this.Editor.editor.find(orig);
    		this.Editor.editor.replaceAll(repl);
    	};

		return this;
	});

	em.factory('MiniMap', function(){

		var self     = this,
		editorWindow,
		scrBoxHeight;
		self.minimap = ace.edit('minimap');
		
		
		//Make Scroll Over Track
		var mapDiv   = document.getElementById('minimap'),
		scrollOver   = document.createElement('canvas');
		scrollOver.style.width    = mapDiv.offsetWidth + 'px';
		scrollOver.style.height   = mapDiv.offsetHeight + 'px'; 
		scrollOver.style.position = 'absolute';
		scrollOver.style.left     = mapDiv.offsetLeft;
		scrollOver.style.top      = mapDiv.offsetTop;
		document.body.appendChild(scrollOver);

		scrollOver.onmousedown = miniDown;
		scrollOver.onmousemove = updateScrollOver;
		scrollOver.onmouseup   = miniUp;

		//Make Scroll Box that moves over Scroll Over Track
		var scrollBox            = document.createElement('canvas'),
		context                  = scrollBox.getContext('2d');
		scrollBox.style.width    = mapDiv.offsetWidth + 'px';
		scrollBox.style.top      = scrollOver.style.top;
		scrollBox.style.left     = scrollOver.style.left;
		scrollBox.style.position = 'absolute';
		document.body.appendChild(scrollBox);
		context.fillStyle        = '#666666';
		context.globalAlpha      = .1;
		context.fillRect(0, 0, 1000, 152);

		scrollBox.onmousedown = miniDown;
		scrollBox.onmousemove = updateScrollOver;
		scrollBox.onmouseup   = miniUp;

		//Setup Scrolling
		var down = false;

		function miniDown (event) {
			down = true;
			updateScrollOver(event);
		}

		function miniUp (event) {
			down = false;
		}


		/*
		 * To deal with files longer than the minimap, slowely scroll the minimap as you go up and
		 * down and take into account the minimap.session.$scrollTop for your calculations scrolling the editor
		 */
		function updateScrollOver(event){
			var newScrBoxTop = (event.clientY+10) - (scrBoxHeight/2),
			isUnderTop       = ((newScrBoxTop + self.minimap.session.$scrollTop) >= scrollOver.offsetTop),
			newScrBoxBottom  = (event.clientY+10) + (scrBoxHeight/2),
			isOverBottom     = ((newScrBoxBottom + self.minimap.session.$scrollTop) <= (scrollOver.offsetTop+scrollOver.offsetHeight));
			if(down && isUnderTop && isOverBottom){
				//TODO: take into account minimap.session.$scrollTop for clicks on the minimap
				var line = (((event.clientY+10) - scrollOver.offsetTop + self.minimap.session.$scrollTop)/(self.minimap.renderer.$textLayer
					.$characterSize.height));
				//TODO: figure out why I have to add this 10...padding?...margin?
				scrollBox.style.top = (newScrBoxTop);
				self.Editor.editor.scrollToLine(line, true, false);
			}
			else if(down && isUnderTop){
				scrollBox.style.top = scrollOver.offsetTop + scrollOver.offsetHeight - scrollBox.offsetHeight;
				self.Editor.editor.scrollToLine(self.Editor.editor.session.getLength(), true, false);

			}
			else if(down && isOverBottom){
				scrollBox.style.top = scrollOver.offsetTop;
				self.Editor.editor.scrollToLine(1, true, false);
			}
		};

		this.config = function(editor){
			self.Editor  = editor;
			self.minimap.setFontSize(3);

			var theme    = self.Editor.editor.getTheme(),
			edCharSize   = self.Editor.editor.renderer.$textLayer.$characterSize.height, //in pixels
			miniCharSize = self.minimap.renderer.$textLayer.$characterSize.height; //in pixels
			editorWindow = document.getElementById('editor').offsetHeight;
			scrBoxHeight = ((editorWindow / edCharSize) * miniCharSize);

			scrollBox.style.height   = scrBoxHeight + 'px';
			self.minimap.setTheme(theme);
			self.minimap.setHighlightActiveLine(false);
			self.minimap.renderer.setShowGutter(false);
			updateMiniText();

			//update minimap when the content of the editor changes
			self.Editor.editor.getSession().on('change', function(e){
				updateMiniText();
			});

			//scrolls the minimap to the position of the editor as it scrolls
			self.Editor.editor.renderer.scrollBar.addEventListener('scroll', function(event){
				//scrolls the actual minimap down as the page scrolls
				var editorLine  = ((event.data)/(edCharSize));
				self.minimap.scrollToLine(editorLine, true, false);
				//scrolls the scrollbox over the right portion of the minimap 
				//****NOT QUITE RIGHT***...stops scrolling once the minimap stops scrolling
				var miniScrollPix   = self.minimap.session.$scrollTop,
				scrBoxTopPix        = (editorLine * miniCharSize) + scrollOver.offsetTop;
				scrollBox.style.top = scrBoxTopPix - (miniScrollPix);
			});

			console.log(self.Editor.editor.renderer.scrollBar._eventRegistry);
		};

		function updateMiniText(){
			var doc  = self.Editor.editor.getSession().getValue();
		    self.minimap.getSession().setValue(doc);
		};

		return this;
	});

//=============================================================================
//APIManager Module

	var api = angular.module('APIManager', []);

	/*
	 *
	 */
	api.factory('GoogleDrive', function(Editor){

		this.drive = function(){
			Editor.editor.insert('GoogleDrive\n');
		};

		return this;
	});

	/*
	 *
	 */
	api.factory('GoogleSearch', function(Editor){

		this.search = function(){
			Editor.editor.insert('GoogleSearch\n');
		};

		return this;
	});

	/*
	 *
	 */
	api.factory('Git', function(Editor){

		this.git = function(){
			Editor.editor.insert('Git\n');
		};

		return this;
	});

	//Manually loading modules
	angular.bootstrap(document, ['EditManager', 'APIManager']);

//==============================================================================
//Global Helpers


}