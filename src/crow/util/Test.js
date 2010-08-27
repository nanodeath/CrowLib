goog.provide('crow.util.Test');

// Wrap the regular same function, because otherwise _cachedHash trips up some of the tests.
var oldSame = same;
var newSame = function(){
	for(var i = 0; i < arguments.length; i++){
		delete arguments[i]._cachedHash;
	}
	return oldSame.apply(this, arguments);
}
same = newSame;
