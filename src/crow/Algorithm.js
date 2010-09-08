goog.provide('crow.Algorithm');
goog.require('goog.structs.PriorityQueue');

/**
 * Base class for all algorithms.
 * @constructor
 * @private
 */
crow.Algorithm = function(){};
/**
 * A map from nodes (using their hash) to arbitrary values
 * @constructor
 * @param {*} [defaultValue] The default value for a node when retrieving it if there's no value associated with it
 */
crow.Algorithm.NodeMap = function(defaultValue){
	var map = {};
	/**
	 * Returns the value set for this node.  If there is no value,
	 * then return the default value defined when creating the NodeMap. 
	 * @param node The node to retrieve the value for
	 * @returns value or the default value
	 */
	this.get = function(node){
		var val = map[node.hash];
		return typeof val !== "undefined" ? val : defaultValue;
	};
	/**
	 * Set a value for this node in the map.
	 * @param node The node to set the value for
	 * @param value The value to set for the node
	 */
	this.set = function(node, val){
		map[node.hash] = val;
	};
};
/**
 * A priority queue with an API that matches that of Google Closure's priority queue.
 * @see http://closure-library.googlecode.com/svn/docs/class_goog_structs_PriorityQueue.html
 * @constructor
 */
crow.Algorithm.PriorityQueue = function(){
	throw new Error("A PriorityQueue class is required, but none found!");
};
/**
 * One-time initialization of data structure classes used by Crow.
 * @private
 */
crow.Algorithm.initializeDataStructures = function(){
	crow.Algorithm.PriorityQueue = goog.structs.PriorityQueue;
	
	crow.Algorithm.initializeDataStructures = function(){};
};
