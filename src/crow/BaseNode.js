goog.provide('crow.BaseNode');

/**
 * @constructor
 */
crow.BaseNode = function(){};

// Override these position methods in your base class to provide location
// information
crow.BaseNode.prototype.getX = function(){ throw new Error("override me") };
crow.BaseNode.prototype.getY = function(){ throw new Error("override me") };

// Calculating distance between nodes.	You have several options:
// 1) Simply override the distanceAlgorithm method in your derived class with
//	 a) one of the GraphUtil.distance.* methods, or
//	 b) your own method that takes a dx and a dy
// 2) Override the distanceTo method in your derived class to provide completely
//	 custom behavior 
crow.BaseNode.prototype.distanceAlgorithm = function(){ throw new Error("override me with a GraphUtil.distance.* method"); };
crow.BaseNode.prototype.distanceTo = function(other){
	var dx = this.getX() - other.getX(),
		dy = this.getY() - other.getY();
	
	return this.distanceAlgorithm(dx, dy);
};

crow.BaseNode.prototype.hash = function(clear_cache){
		if(!this._cachedHash || clear_cache){
			this._cachedHash = this.getX() + "_" + this.getY();
		}
		return this._cachedHash;
	}

// Find neighbors of this node in the provided graph
// (checks horizontally and vertically, not diagonally)
crow.BaseNode.prototype.getNeighbors = function(graph){
	var neighbors = [];
	var ox = this.getX(), oy = this.getY();
	var n;
	n = graph.getNode(ox - 1, oy);
	if(n) neighbors.push(n);
	n = graph.getNode(ox + 1, oy);
	if(n) neighbors.push(n);
	n = graph.getNode(ox, oy - 1);
	if(n) neighbors.push(n);
	n = graph.getNode(ox, oy + 1);
	if(n) neighbors.push(n);
	return neighbors;
	/*
	var range = [-1, 1];

	for(var i in range){
		var x = ox + range[i];
		var n = graph.getNode(x, oy);
		if(n) neighbors.push(n);
	}
	for(var j in range){
		var y = oy + range[j];
		var n = graph.getNode(ox, y);
		if(n) neighbors.push(n);
	}
	return neighbors;
	*/
};
