goog.provide('crow.BaseNode');

/**
 * @constructor
 */
crow.BaseNode = function(arr){
	if(arr){
		this.x = arr[0];
		this.y = arr[1];
	}
};

// Override these position methods in your base class to provide location
// information.  By default, getX and getY return the 'x' and 'y' properties of this node.
crow.BaseNode.prototype.getX = function(){ return this.x; };
crow.BaseNode.prototype.getY = function(){ return this.y; };

// Calculating distance between nodes.	You have several options:
// 1) Simply override the distanceAlgorithm method in your derived class with
//	 a) one of the crow.GraphUtil.distance.* methods, or
//	 b) your own method that takes a dx and a dy
//   c) leave it at the default (which is manhattan distance)
// 2) Override the distanceTo method in your derived class to provide completely
//	 custom behavior 
crow.BaseNode.prototype.distanceAlgorithm = crow.GraphUtil.distance.manhattan;
crow.BaseNode.prototype.distanceTo = function(other){
	var dx = this.x - other.x,
		dy = this.y - other.y;
	
	return this.distanceAlgorithm(dx, dy);
};

crow.BaseNode.prototype.hash = function(){
	return this.x + "_" + this.y;
}

// Find neighbors of this node in the provided graph
// (checks horizontally and vertically, not diagonally)
crow.BaseNode.prototype.getNeighbors = function(graph){
	var neighbors = [];
	var ox = this.x, oy = this.y;
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
