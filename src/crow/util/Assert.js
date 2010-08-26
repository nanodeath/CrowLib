goog.provide('crow.util.Assert');

function assert(bool, msg){
	if(!bool) throw new Error(msg);
}

assert.InvalidArgumentType = function(expectedType){ return "Invalid argument type, expected " + expectedType; };
assert.IndexOutBounds = function(number){ return "Index out of bounds (<0 or >length), was " + number; };
assert.AbstractMethod = function(methodName){ return "Method " + methodName + " is abstract; must be overridden"; };
