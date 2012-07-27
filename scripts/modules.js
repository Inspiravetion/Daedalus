
window.onload = function(){

//=============================================================================
//Controllers

	editorCtrl = function($scope, Editor, MiniMap, Find, GoogleDrive, GoogleSearch, Git) {
	        
	    $scope.find = function(){
	        Find.find($scope.someText);
	    };

	    $scope.findNext = function(){
	    	Find.findNext();
	    };

	    $scope.tryAPIs = function(){
	    	GoogleDrive.drive();
	    	GoogleSearch.search();
	    	Git.git();
	    };

	    MiniMap.config(Editor);
	    Find.config(Editor);
	    Editor.editor.focus();
	    Editor.editor.getSession().setValue('');
	    Editor.editor.getSession().setMode('ace/mode/javascript');
	    MiniMap.minimap.getSession().setMode('ace/mode/javascript');
	    
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

		var self     = this;
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

		function updateScrollOver(event){
			if(down && event.clientY >= scrollOver.offsetTop){
				//TODO: offsety and clienty get less and less acurate
				//the farther away from 0,0 you get
				//make click in the middle of the scrollbox
				//disable left-right scrolling on minimap
				//bind scrolling for both minimap and editor
				var line = (event.offsetY/(self.minimap.renderer.$textLayer
					.$characterSize.height));
				scrollBox.style.top = event.clientY+10;
				self.Editor.editor.scrollToLine(line, false, true);
				//self.Editor.editor.scrollToRow(((event.offsetY)/3)-10);
				//self.minimap.scrollToRow(((event.offsetY)/3)-10);

			}
		};

		this.config = function(editor){
			self.Editor  = editor;
			self.minimap.setFontSize(3);

			var theme    = self.Editor.editor.getTheme(),
			edCharSize   = self.Editor.editor.renderer.$textLayer.$characterSize.height, //in pixels
			miniCharSize = self.minimap.renderer.$textLayer.$characterSize.height, //in pixels
			editorWindow = document.getElementById('editor').offsetHeight,
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
			self.Editor.editor.on('scrollTopChange', function(){
				var editorLine = ((this.session.$scrollTop)/(edCharSize));
				var minimapTop = (editorLine * miniCharSize);
				self.minimap.session.setScrollTop(minimapTop);
			});
			console.log('finished minimap initialization');
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

function findTopLeft(domNode) {
	var curleft = curtop = 0;
	if (domNode.offsetParent){
	    curleft = domNode.offsetLeft
	    curtop = domNode.offsetTop
	    while (domNode = domNode.offsetParent) {
	        curleft += domNode.offsetLeft
	        curtop += domNode.offsetTop
	    }
	}
	return [curleft,curtop];
}

}