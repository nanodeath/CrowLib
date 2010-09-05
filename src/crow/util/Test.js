goog.require('crow.BaseNode');
goog.provide('crow.util.Test');

if(typeof same !== "undefined"){
	// Wrap the regular same function, because otherwise _cachedHash trips up some of the tests.
	var newArgs = [];
	var oldSame = same;
	var newSame = function(){
		// TODO make graph use prototype
		var graph = new crow.Graph();
		for(var i = 0; i < arguments.length; i++){
			if(arguments[i] instanceof crow.BaseNode && !arguments[i]._initialized){
				graph._preprocessNode(arguments[i]);
			}
			newArgs.push(arguments[i]);
		}
		return oldSame.apply(this, newArgs);
	}
	same = newSame;
}

if(typeof console !== "undefined"){
	console.logNodes = function(nodes){
		var output = [];
		for(var i = 0; i < nodes.length; i++){
			output.push("[" + nodes[i].getX() + "," + nodes[i].getY() + "]");
		}
		console.log(output.join(","));	
	};
}
