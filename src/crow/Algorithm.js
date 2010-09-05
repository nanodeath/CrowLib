goog.provide('crow.Algorithm');
goog.require('goog.structs.PriorityQueue');

/**
 * Base class for all algorithms.
 * @constructor
 */
crow.Algorithm = function(){};
/**
 * A map from nodes (using their hash) to arbitrary values
 * @constructor
 * @param {*} [defaultValue] The default value for a node when retrieving it if there's no value associated with it
 */
crow.Algorithm.NodeMap = function(defaultValue){
	var map = {};
	this.get = function(node){
		var val = map[node.hash];
		return typeof val !== "undefined" ? val : defaultValue;
	};
	this.set = function(node, val){
		map[node.hash] = val;
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
