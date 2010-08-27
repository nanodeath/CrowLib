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
	this.distance = new crow.Algorithm.NodeMap(Infinity);
	this.previous = new crow.Algorithm.NodeMap();
	this.visited = new crow.Algorithm.NodeMap(false);
	this.visitedList = [];
	
	this.start = start;
	this.goal = goal;
	this.opts = typeof opts === "undefined" ? {} : opts;

	this.distance.set(start, 0);
	var endNode, found;

	// Algorithm commenceth	
	if(typeof goal === "function"){
		this._process(start);
		endNode = this._determineClosestEndNode(goal);
		found = !!endNode;
	} else {
		found = this._process(start, goal);
		endNode = goal;
	}

	var path = [];
	if(endNode){
		path.unshift(endNode);
		var node = this.previous.get(endNode);
		while(node){
			path.unshift(node);
			node = this.previous.get(node);
		}
	}
	return new crow.algorithm.Path({
		nodes: path,
		start: start,
		goal: goal,
		end: found ? endNode : null,
		length: found ? this.distance.get(endNode) : Infinity,
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
		if(goal.call(node)){
			var d = this.distance.get(node);
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
	while(node != null){
		var neighbors = node.getNeighbors(this.graph);
		for(var n in neighbors){
			var neighbor = neighbors[n];
			if(this.visited.get(neighbor) || (this.opts.filter && !this.opts.filter.call(neighbor))) continue;
		
			var neighborDistanceThroughMe = this.distance.get(node) + node.distanceTo(neighbor);
			var currentNeighborDistance = this.distance.get(neighbor);
			if(neighborDistanceThroughMe < currentNeighborDistance){
				this.distance.set(neighbor, neighborDistanceThroughMe);
				this.previous.set(neighbor, node);
				currentNeighborDistance = neighborDistanceThroughMe;
			}
			nextNodes.enqueue(currentNeighborDistance, neighbor);
		}
		this.visited.set(node, true);
		this.visitedList.push(node);
		if(node === endNode) return true; // base case: target found

		// We have to visit the next unvisited node with the smallest distance from the source
		node = nextNodes.dequeue();
	}
	// base case: target not found; alternatively, a target wasn't given
	return false;
};
