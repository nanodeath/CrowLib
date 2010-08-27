goog.provide('crow.algorithm.DijkstraAlgorithm');
goog.require('crow.algorithm.ShortestPathAlgorithm');

/**
 * @constructor
 */
crow.algorithm.DijkstraAlgorithm = function(graph){
	this.graph = graph;
}
crow.algorithm.DijkstraAlgorithm.prototype = new crow.algorithm.ShortestPathAlgorithm();
crow.algorithm.DijkstraAlgorithm.prototype.findPath = function(start, goal, opts){
	this._wrapperNode = new crow.Algorithm.NodeMap();
	this.visitedList = [];
	
	this.start = start;
	this.goal = goal;
	this.opts = typeof opts === "undefined" ? {} : opts;

	this._getWrapperNode(start).distance = 0;
	var endNode, found;

	// Algorithm commenceth	
	if(typeof goal === "function"){
		this._process(start);
		endNode = this._determineClosestEndNode(goal);
		found = !!endNode;
	} else {
		found = this._process(start, goal);
		endNode = this._getWrapperNode(goal);
	}

	var path = [];
	if(endNode){
		path.unshift(endNode.innerNode);
		var node = endNode.previous;
		while(node){
			path.unshift(node.innerNode);
			node = node.previous;
		}
	}
	return new crow.algorithm.Path({
		nodes: path,
		start: start,
		goal: goal,
		end: found ? endNode.innerNode : null,
		length: found ? endNode.distance : Infinity,
		found: found,
		algorithm: this
	});
};
crow.algorithm.DijkstraAlgorithm.prototype.recalculate = function(){
	var a = this.algorithm;
	return a.findPath(a.start, a.goal, a.opts);
};
// If we have a filter function that determines the end node, there could be multiple end nodes...
// this function finds the closest end node.
crow.algorithm.DijkstraAlgorithm.prototype._determineClosestEndNode = function(goal){
	var closest, closestDistance = Infinity;
	for(var i in this.visitedList){
		var node = this.visitedList[i];
		if(goal.call(node.innerNode)){
			var d = node.distance;
			if(d < closestDistance){
				closest = node;
				closestDistance = d;
			}
		}
	}
	return closest;
};
crow.algorithm.DijkstraAlgorithm.prototype._process = function(node, endNode){
	var nextNodes = new crow.Algorithm.PriorityQueue();
	node = this._getWrapperNode(node);
	while(node != null){
		var neighbors = node.innerNode.getNeighbors(this.graph);
		for(var n in neighbors){
			var neighbor = this._getWrapperNode(neighbors[n]);
			if(neighbor.visited || (this.opts.filter && !this.opts.filter.call(neighbor.innerNode))) continue;
		
			var neighborDistanceThroughMe = node.distance + node.innerNode.distanceTo(neighbor.innerNode);
			var currentNeighborDistance = neighbor.distance;
			if(neighborDistanceThroughMe < currentNeighborDistance){
				neighbor.distance = neighborDistanceThroughMe;
				neighbor.previous = node;
				currentNeighborDistance = neighborDistanceThroughMe;
			}
			nextNodes.enqueue(currentNeighborDistance, neighbor);
		}
		node.visited = true;
		this.visitedList.push(node);
		if(node.innerNode === endNode) return true; // base case: target found

		// We have to visit the next unvisited node with the smallest distance from the source
		node = nextNodes.dequeue();
	}
	// base case: target not found; alternatively, a target wasn't given
	return false;
};
crow.algorithm.DijkstraAlgorithm.prototype._getWrapperNode = function(node){
	var w = this._wrapperNode.get(node);
	if(w) return w;
	w = new crow.algorithm.DijkstraAlgorithm.WrapperNode(node);
	this._wrapperNode.set(node, w);
	return w;
};
crow.algorithm.DijkstraAlgorithm.WrapperNode = function(node){
	this.innerNode = node;
	this.visited = false;
	this.previous = null;
	this.distance = Infinity;
};
