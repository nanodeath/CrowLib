goog.provide('crow.util.Test');

if(typeof same !== "undefined"){
	// Wrap the regular same function, because otherwise _cachedHash trips up some of the tests.
	var oldSame = same;
	var newSame = function(){
		for(var i = 0; i < arguments.length; i++){
			delete arguments[i]._cachedHash;
		}
		return oldSame.apply(this, arguments);
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
