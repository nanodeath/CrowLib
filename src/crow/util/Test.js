goog.require('crow.BaseNode');
goog.provide('crow.util.Test');

if(typeof same !== "undefined"){
	
	// Wrap the regular same function, because otherwise _cachedHash trips up some of the tests.
	var oldSame = same;
	var newSame = function(){
		var newArgs = [];
		for(var i = 0; i < arguments.length; i++){
			var arg = arguments[i];
			if(arg instanceof crow.BaseNode){
				arg._initialize();
			}
			newArgs.push(arg);
		}
		return oldSame.apply(this, newArgs);
	}
	same = newSame;
}

if(typeof console !== "undefined"){
	console.logNodes = function(nodes, msg){
		msg = msg ? msg + ": " : "";
		var output = [];
		for(var i = 0; i < nodes.length; i++){
			output.push("[" + nodes[i].getX() + "," + nodes[i].getY() + "]");
		}
		console.log(msg + output.join(",") + " (length " + nodes.length + ")");
	};
}
