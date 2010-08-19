goog.provide('crow.crow.Algorithm');
goog.require('goog.structs.PriorityQueue');

/**
 * @constructor
 */
function crow.Algorithm(){}
crow.Algorithm.util = {
	hash: function(node){
		return node.getX() + "_" + node.getY();
	}
};
/**
 * @constructor
 */
crow.Algorithm.NodeMap = function(defaultValue){
	var map = {};
	this.get = function(node){
		var val = map[crow.Algorithm.util.hash(node)];
		return typeof val !== "undefined" ? val : defaultValue;
	};
	this.set = function(node, val){
		map[crow.Algorithm.util.hash(node)] = val;
	};
};
/**
 * @constructor
 */
crow.Algorithm.PriorityQueue = function(){
	throw new Error("A PriorityQueue class is required, but none found!");
};
crow.Algorithm.initializeDataStructures = function(){
	crow.Algorithm.PriorityQueue = goog.structs.PriorityQueue;
	
	crow.Algorithm.initializeDataStructures = function(){};
};
