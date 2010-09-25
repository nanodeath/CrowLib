goog.provide('crow.algorithm.DijkstraAlgorithm');
goog.require('crow.algorithm.ShortestPathAlgorithm');
goog.require('crow.algorithm.Path');
goog.require('crow.Graph');

/**
 * Calculates shortest paths from a start point to every other point
 * in the graph -- because of this (it's an uninformed search algorithm)
 * it is very slow, providing much more information that most people need.
 * However, if you don't know ahead of time which node you're looking for,
 * you don't have much choice.
 * @constructor
 * @private
 */
crow.algorithm.DijkstraAlgorithm = function(graph){
	this.graph = graph;
}
crow.algorithm.DijkstraAlgorithm.prototype = new crow.algorithm.ShortestPathAlgorithm();
crow.algorithm.DijkstraAlgorithm.prototype.findPath = function(start, goal, opts){
	crow.algorithm.ShortestPathAlgorithm.prototype.findPath.apply(this, arguments);
	this.visitedList = [];
	
	this.start = start;
	this.goal = goal;
	this.opts = opts || {};
	if(opts.limit){
		throw new Error("Dijkstra's doesn't support the `limit` option.");
	}
	this.actor = opts.actor;

	this._getWrapperNode(start).distance = 0;
	var endNode, found;

	// Algorithm commenceth	
	if(typeof goal === "function"){
		this.mainLoop(start);
		endNode = this.determineClosestEndNode(goal);
		found = !!endNode;
	} else {
		found = this.mainLoop(start, goal);
		endNode = this._getWrapperNode(goal);
	}

	var path = [];
	if(endNode.distance < Infinity){
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
		algorithm: this,
		graph: opts.graph,
		baked: opts.baked || (typeof opts.baked === "undefined" && !opts.limit),
		actor: this.actor
	});
};
/**
 * If we have a filter function that determines the end node, 
 * there could be multiple end nodes...
 * this function finds the closest.
 * @private
 * @param {function(crow.BaseNode): boolean} goal function that returns true if the provided node constitutes a goal state
 * @returns {crow.algorithm.DijkstraAlgorithm.WrapperNode} goal node closest to start
 */
crow.algorithm.DijkstraAlgorithm.prototype.determineClosestEndNode = function(goal){
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

/**
 * Main loop of Dijkstra's algorithm.  Iteratively executes.
 * @param {crow.BaseNode} node start point from which to begin searching
 * @param {crow.BaseNode} [endNode] point at which to stop searching.  if ommitted, entire graph will be explored.
 * @returns true if an endNode was provided and it was found, false otherwise.
 */
crow.algorithm.DijkstraAlgorithm.prototype.mainLoop = function(node, endNode){
	var nextNodes = new crow.Algorithm.PriorityQueue();
	node = this._getWrapperNode(node);
	while(node != null){
		var neighbors = node.innerNode.getNeighbors(this.graph);
		for(var n in neighbors){
			var neighbor = this._getWrapperNode(neighbors[n]);
			if(neighbor.visited) continue;
		
			var neighborDistanceThroughMe = node.distance + node.innerNode.distanceToNeighbor(neighbor.innerNode, this.actor);
			var currentNeighborDistance = neighbor.distance;
			if(neighborDistanceThroughMe < currentNeighborDistance){
				neighbor.distance = neighborDistanceThroughMe;
				neighbor.previous = node;
				currentNeighborDistance = neighborDistanceThroughMe;
			}
			if(currentNeighborDistance < Infinity){
				nextNodes.enqueue(currentNeighborDistance, neighbor);
			}
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

/**
 * @constructor
 * @private
 */
crow.algorithm.DijkstraAlgorithm.WrapperNode = function(node){
	this.innerNode = node;
	this.visited = false;
	this.previous = null;
	this.distance = Infinity;
};

/**
 * @private
 */
crow.algorithm.DijkstraAlgorithm.prototype._getWrapperNode = crow.Algorithm.wrapperNodeGetterTemplate(crow.algorithm.DijkstraAlgorithm.WrapperNode);

// Attributes for AlgorithmResolver //
crow.algorithm.DijkstraAlgorithm.attributes = {
	min_speed: -2,
	// Works with:
	moving_start: false,
	moving_goal: false,
	unstable_graph: false,
	heuristics_allowed: false,
	goal_is_node: true,
	goal_is_callback: true
};
// end //

crow.algorithm.DijkstraAlgorithm.alias = "dijkstra";
crow.Graph.registerAlgorithm(crow.algorithm.DijkstraAlgorithm);
