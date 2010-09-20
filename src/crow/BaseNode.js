goog.provide('crow.BaseNode');

/**
 * Basic node object.
 * @param {Array} [coordinateArray] Two-element array containing the x- and y-coordinates (in that order) of this element.
 * @property {Number} x x-coordinate of this node.
 * @property {Number} y y-coordinate of this node.
 * @property {Number} hash hash value of this node (a semi-unique identifier for this node).
 * @property {Boolean} isBlank whether this is a "blank" node or not.  Blank nodes are created on the fly when {@link crow.Graph#getNode} is called at an invalid location (and true is passed for the required arg).
 * @constructor
 */
crow.BaseNode = function(arr){
	if(arr){
		this.x = arr[0];
		this.y = arr[1];
	}
	this.isBlank = false;
	this._initialized = false;
};

/**
 * Initializes the node and prepares it for general use.
 */
crow.BaseNode.prototype._initialize = function(){
	if(!this._initialized){
		this._initialized = true;
		
		var x = this.getX(), y = this.getY();
		if(typeof x !== "number") throw new Error("Node must have a valid x coord");
		if(typeof y !== "number") throw new Error("Node must have a valid y coord");
		x = Math.floor(x);
		y = Math.floor(y);
		
		this.x = x;
		this.y = y;
		this.hash = this.hash();
		
		delete this.getX;
		delete this.getY;
	}
};

// Override these position methods in your base class to provide location
// information.  By default, getX and getY return the 'x' and 'y' properties of this node.

/**
 * Get the x-coordinate of this node.
 * NOTE: once this node is added to a graph, this method is removed.  You should
 * instead rely on the 'x' property.
 * @returns {Number}
 */
crow.BaseNode.prototype.getX = function(){ return this.x; };
/**
 * Get the y-coordinate of this node.
 * NOTE: once this node is added to a graph, this method is removed.  You should
 * instead rely on the 'y' property.
 * @returns {Number}
 */
crow.BaseNode.prototype.getY = function(){ return this.y; };

// Calculating distance between nodes.	You have several options:
// 1) Simply override the distanceAlgorithm method in your derived class with
//	 a) one of the crow.GraphUtil.distance.* methods, or
//	 b) your own method that takes a dx and a dy
//   c) leave it at the default (which is manhattan distance)
// 2) Override the distanceTo method in your derived class to provide completely
//	 custom behavior 
/**
 * A distance algorithm that takes a dx and a dy to calculate distance.
 * Defaults to Manhattan distance.  Only called from base {@link #distanceTo},
 * so this method can be ignored if that method is overridden.
 * @function
 * @see crow.GraphUtil.distance
 * @param {Number} dx difference of x-coordinates
 * @param {Number} dy difference of y-coordinates
 * @returns {Number} distance
 */
crow.BaseNode.prototype.distanceAlgorithm = crow.GraphUtil.distance.manhattan;
/**
 * Calculates the distance to another nearby node.  Normally this leverages
 * {@link #distanceAlgorithm}, but it doesn't have to.
 * This should always be a positive number.  There is one special value, Infinity,
 * which the algorithms will consider to be unreachable.
 * @param {crow.BaseNode} otherNode the other node that we're measuring to.
 * @returns {Number} distance
 */
crow.BaseNode.prototype.distanceTo = function(other){
	var dx = this.x - other.x,
		dy = this.y - other.y;
	
	return this.distanceAlgorithm(dx, dy);
};

/*
 * Calculate a unique string representing this node in the graph.
 * NOTE: once this node is added to a graph, this method is replaced
 * with a property of the same name containing the result of calling this method.
 * @returns {String}
 */
crow.BaseNode.prototype.hash = function(){
	return this.x + "_" + this.y;
}

/** 
 * Find neighbors of this node in the provided graph.  Neighbors are nodes to the left/right/above/below, and potentially
 * diagonally from this node, too, given that option.  Nodes are returned clockwise from the due-right position.
 * @param {crow.Graph} graph Graph in which to check this node
 * @param {Boolean} [includeDiagonals=false] Whether to include diagonals in check.
 * @param {Boolean} [includeNulls=false] If true, a null will be pushed onto the neighbor list if the neighbor doesn't exist
 * @returns {crow.BaseNode[]} neighboring nodes
 */
crow.BaseNode.prototype.getNeighbors = function(graph, includeDiagonals, includeNulls){
	var ox = this.x, oy = this.y;
	var rawNeighbors = [];
	rawNeighbors.push(                    graph.getNode(ox + 1, oy    ));
	rawNeighbors.push(includeDiagonals && graph.getNode(ox + 1, oy + 1));
	rawNeighbors.push(                    graph.getNode(ox    , oy + 1));
	rawNeighbors.push(includeDiagonals && graph.getNode(ox - 1, oy + 1));
	rawNeighbors.push(                    graph.getNode(ox - 1, oy    ));
	rawNeighbors.push(includeDiagonals && graph.getNode(ox - 1, oy - 1));
	rawNeighbors.push(                    graph.getNode(ox    , oy - 1));
	rawNeighbors.push(includeDiagonals && graph.getNode(ox + 1, oy - 1));
	var neighbors = [];
	for(var i in rawNeighbors){
		var neighbor = rawNeighbors[i];
		if(neighbor) {
			neighbors.push(neighbor);
		} else if(includeNulls) {
			neighbors.push(null);
		}
	}
	return neighbors;
};
