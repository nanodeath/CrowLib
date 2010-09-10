goog.provide('crow.Algorithm');
goog.require('goog.structs.PriorityQueue');
goog.require('goog.structs.AvlTree');

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
crow.Algorithm.AvlTree = function(){
	throw new Error("An AvlTree class is required, but none found!");
};
crow.Algorithm.AvlPriorityQueue = function(comparator){
	var newComparator = function(a, b){
		return comparator(a.key, b.key);
	};
	crow.Algorithm.AvlTree.call(this, newComparator);
};
/**
 * One-time initialization of data structure classes used by Crow.
 * @private
 */
crow.Algorithm.initializeDataStructures = function(){
	crow.Algorithm.PriorityQueue = goog.structs.PriorityQueue;
	crow.Algorithm.AvlTree = goog.structs.AvlTree;
	
	/*
		** Initialize AvlPriorityQueue prototype
	*/
	crow.Algorithm.AvlPriorityQueue.prototype = new crow.Algorithm.AvlTree();
	crow.Algorithm.AvlPriorityQueue.prototype.enqueue = function(key, value){
		this.add({key: key, value: value});
	};
	crow.Algorithm.AvlPriorityQueue.prototype.dequeue = function(){
		var val = this.remove(this.getMinimum());
		if(val != null){
			return val.value;
		}
	};
	crow.Algorithm.AvlPriorityQueue.prototype.peekKey = function(){
		var val = this.getMinimum();
		if(val) return val.key;
	};
	
	crow.Algorithm.initializeDataStructures = function(){};
};
