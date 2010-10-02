goog.provide('crow.Node');

crow.Node = function(id){
	if(!id) id = "" + Math.random();
	/** Unique identifier for this node */
	this.id = id;
	
	// Other initialization //
	
};

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
crow.Node.prototype.distanceAlgorithm = crow.GraphUtil.distance.manhattan;

crow.Node.prototype.distanceToGoal = function(){
	throw new Error("This method (either distanceToGoal or distanceToNeighbor) was called, but is not implemented.  You must override this method in your own class to determine the distance between nodes.");
};

crow.Node.prototype.distanceToNeighbor = function(){
	throw new Error("distanceToNeighbor must be overridden");
};

crow.Node.prototype.getNeighbors = function(graph){
	throw new Error("This method (getNeighbors) was called, but is not implemented.  You need to implement it so that the algorithm knows how to find the nodes reachable from the current node.");
};
