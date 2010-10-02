goog.provide('crow.Algorithm');
goog.require('crow.structs.BucketPriorityQueue');

/**
 * Base class for all algorithms.
 * @constructor
 * @private
 */
crow.Algorithm = function(){};

crow.Algorithm.wrapperNodeGetterTemplate = function(klass){
	return function(node){
		if(node instanceof klass) return node;
		var w = this.wrapperNode.get(node);
		if(w) return w;
		w = new klass(node);
		w.algorithm = this;
		this.wrapperNode.set(node, w);
		return w;
	};
};

crow.Algorithm.prototype._invalidatePoint = function(path, invalidationEvent){
	var x = invalidationEvent.x, y = invalidationEvent.y;
	for(var i = 0; i < path.nodes.length; i++){
		var n = path.nodes[i];
		if(n.x == x && n.y == y){
			// Invalidating a point in the middle means we need to start over
			path.nodes = path.nodes.slice(0, 1);
			path.end = null;
			path.found = false;
			break;
		}
	}
};

crow.Algorithm.prototype._invalidateRegion = function(path, invalidationEvent){
	var x = invalidationEvent.x, y = invalidationEvent.y;
	var x2 = x + invalidationEvent.dx, y2 = y + invalidationEvent.dy;
	for(var i = 0; i < path.nodes.length; i++){
		var n = path.nodes[i];
		var nx = n.x, ny = n.y;
		if(nx >= x && ny >= y && nx < x2 && ny < y2){
			path.nodes = path.nodes.slice(0, 1);
			path.end = null;
			path.found = false;
			break;
		}
	}
};

crow.Algorithm.prototype.continueCalculating = function(path, count){
	var lastNode = path.nodes[path.nodes.length-1];
	// if the path was never complete, there may not be any nodes
	if(!lastNode) lastNode = path.start;
	
	var opts = {};
	if(count) opts.limit = count;
	if(path.actor) opts.actor = path.actor;
	var continuedPath = this.findPath(lastNode, path.goal, opts);
	// TODO this node list needs to be pruned, in case continuedPath contains a node in this;
	// in other words, if the continuedPath backtracks along the current path
	path.nodes = path.nodes.concat(continuedPath.nodes.slice(1)),
	path.found = continuedPath.found;
	return path.found;
}
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
		var val = map[node.id];
		return typeof val !== "undefined" ? val : defaultValue;
	};
	/**
	 * Set a value for this node in the map.
	 * @param node The node to set the value for
	 * @param value The value to set for the node
	 */
	this.set = function(node, val){
		map[node.id] = val;
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
	crow.Algorithm.PriorityQueue = crow.structs.BucketPriorityQueue;
	
	crow.Algorithm.initializeDataStructures = function(){};
};
