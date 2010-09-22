goog.provide('crow.util.Assert');

crow.assert = function(bool, msg){
	if(!bool) throw new Error(msg);
}

crow.assert.InvalidArgumentType = function(expectedType){ return "Invalid argument type, expected " + expectedType; };
crow.assert.IncorrectArgumentCount = function(actualCount, expectedCount){ return "Incorrect argument count, got " + actualCount + " but expected " + expectedCount; };
crow.assert.IndexOutBounds = function(number){ return "Index out of bounds (<0 or >length), was " + number; };
crow.assert.AbstractMethod = function(methodName){ return "Method " + methodName + " is abstract; must be overridden"; };
crow.assert.IllegalMethodCall = function(methodName, msg) { return "Method `" + methodName + "` cannot be called here: " + msg; };
