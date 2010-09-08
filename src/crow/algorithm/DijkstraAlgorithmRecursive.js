goog.provide('crow.algorithm.DijkstraAlgorithmRecursive');
goog.require('crow.algorithm.ShortestPathAlgorithm');

/**
 * Kept around as a reminder that recursion can be slow if not wielded carefully
 * @deprecated
 * @constructor
 * @private
 */
crow.algorithm.DijkstraAlgorithmRecursive = function(graph){
	this.graph = graph;
}
crow.algorithm.DijkstraAlgorithmRecursive.prototype = new crow.algorithm.ShortestPathAlgorithm();
crow.algorithm.DijkstraAlgorithmRecursive.prototype.findPath = function(start, goal, opts){
	this.distance = new crow.Algorithm.NodeMap(Infinity);
	this.previous = new crow.Algorithm.NodeMap();
	this.visited = new crow.Algorithm.NodeMap(false);
	this.visitedList = [];
	
	this.start = start;
	this.goal = goal;
	this.opts = typeof opts === "undefined" ? {} : opts;

	// Algorithm commenceth
	this.distance.set(start, 0);
	var endNode = typeof goal !== "function" ? goal : null;
	this._visitNode(start, endNode);
	
	if(typeof goal === "function"){
		endNode = this._determineClosestEndNode(goal);
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
	var found = !!endNode;
	return {
		nodes: path,
		start: start,
		goal: goal,
		end: found ? endNode : null,
		length: found ? this.distance.get(endNode) : Infinity,
		found: found,
		recalculate: this.recalculate,
		algorithm: this
	};
};
crow.algorithm.DijkstraAlgorithmRecursive.prototype.recalculate = function(){
	var a = this.algorithm;
	return a.findPath(a.start, a.goal, a.opts);
};
// If we have a filter function that determines the end node, there could be multiple end nodes...
// this function finds the closest end node.
crow.algorithm.DijkstraAlgorithmRecursive.prototype._determineClosestEndNode = function(goal){
	var closest, closestDistance = Infinity;
	for(var i = 0; i < this.visitedList.length; i++){
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
crow.algorithm.DijkstraAlgorithmRecursive.prototype._visitNode = function(node, endNode, nextNodes){
	if(!nextNodes) nextNodes = [];
	var neighbors = node.getNeighbors(this.graph);
	for(var n in neighbors){
		var neighbor = neighbors[n];
		if(this.visited.get(neighbor) || (this.opts.filter && !this.opts.filter.call(neighbor))) continue;
		
		var distFromStart = this.distance.get(node) + node.distanceTo(neighbor);
		if(distFromStart < this.distance.get(neighbor)){
			this.distance.set(neighbor, distFromStart);
			this.previous.set(neighbor, node);
		}
		nextNodes.push(neighbor);
	}
	this.visited.set(node, true);
	this.visitedList.push(node);
	if(node === endNode) return;

	// We have to visit the next unvisited node with the smallest distance from the source
	var next = null, nextDistance = Infinity, nextIndex = -1;
	for(var i in nextNodes){
		var n = nextNodes[i];
		if(this.distance.get(n) < nextDistance){
			next = n;
			nextDistance = this.distance.get(n);
			nextIndex = i;
		}
	}
	if(next != null){
		// remove the node we're about to visit from the to-visit list
		// and then visit it
		nextNodes.splice(nextIndex, 1);
		this._visitNode(next, endNode, nextNodes);
	}
};
