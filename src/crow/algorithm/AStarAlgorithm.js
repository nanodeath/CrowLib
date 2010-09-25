goog.provide('crow.algorithm.AStarAlgorithm');
goog.require('crow.algorithm.ShortestPathAlgorithm');
goog.require('crow.algorithm.Path');
goog.require('crow.Graph');

/**
 * A* algorithm, which is basically an "informed" Dijkstra's algorithm.
 * It oozes in the direction of your goal node.
 * @constructor
 * @private
 */
crow.algorithm.AStarAlgorithm = function(graph){
	this.graph = graph;
}
crow.algorithm.AStarAlgorithm.prototype = new crow.algorithm.ShortestPathAlgorithm();

/**
 * Finds the best path from start node to goal node.
 * @param {crow.BaseNode} start The node from which to begin the search.
 * @param {crow.BaseNode} goal The node that we're looking for.
 * @param {Object} [opts] Additional options
 * @param {Number} [opts.limit] Maximum number of nodes to check in this pass.
 *   Note that there won't necessarily be this many nodes returned in the (partial) path.
 *   To continue checking from where the path left off, see {@link crow.algorithm.Path#continueCalculating}.
 */
crow.algorithm.AStarAlgorithm.prototype.findPath = function(start, goal, opts){
	if(typeof goal === "function"){
		throw new Error("A* doesn't support using a callback to determine the goal");
	}
	this._wrapperNode = new crow.Algorithm.NodeMap();
	if(!opts) opts = {};

	var actor = opts.actor;	
	this.start = start;
	this.goal = goal;
	this.opts = opts;
	
	start = this._getWrapperNode(start);

	this.evaluatedList = [];
	this.toEvaluate = new crow.Algorithm.PriorityQueue();
	this.toEvaluate.enqueue(0, start);
	
	// gScore is distance of a node n from the starting point
	// hScore is the estimated distance between a node n and the goal
	// fScore is the total estimated distance of route through a node
	
	var estimateDistance = this.estimateDistance;
	

	start.gScore = 0;
	start.hScore = start.innerNode.distanceToGoal(goal, actor);
	var found = false, currentNode;
	while(currentNode = this.toEvaluate.dequeue()){
		if(currentNode.innerNode === goal){
			found = true;
			break;
		} else if(currentNode.evaluated){
			// normally this wouldn't be necessary, but if we check the same neighbor twice,
			// it may get added to the toEvaluate list twice
			continue;
		}
		currentNode.evaluated = true;
		this.evaluatedList.push(currentNode);
		if(opts.limit && this.evaluatedList.length >= opts.limit){
			break;
		}
		
		var neighbors = currentNode.innerNode.getNeighbors(this.graph);
		for(var n in neighbors){
			var neighbor = this._getWrapperNode(neighbors[n]);
			if(neighbor.evaluated) continue;
			var newGScore = currentNode.gScore + currentNode.innerNode.distanceToNeighbor(neighbor.innerNode, actor);
			if(newGScore == Infinity) continue;
			
			if(!this.toEvaluate.containsValue(neighbor) || newGScore < neighbor.gScore){
				neighbor.parent = currentNode;
				neighbor.gScore = newGScore;
				neighbor.hScore = neighbor.innerNode.distanceToGoal(goal, actor);
				neighbor.fScore = newGScore + neighbor.hScore;
				this.toEvaluate.enqueue(neighbor.fScore, neighbor);
			}
		}
	}

	var nodes = [];	
	var pathOpts = {
		nodes: nodes,
		start: start.innerNode,
		goal: goal,
		length: null,
		recalculate: this.recalculate,
		algorithm: this,
		graph: opts.graph,
		baked: opts.baked || (typeof opts.baked === "undefined" && !opts.limit),
		actor: actor
	};

	if(found){
		var endNode = this._getWrapperNode(goal);
		nodes.unshift(endNode.innerNode);
		var node = endNode.parent;
		while(node){
			nodes.unshift(node.innerNode);
			node = node.parent;
		}
		pathOpts.end = endNode.innerNode;
		pathOpts.length = endNode.gScore;
		pathOpts.found = true;
		
		return new crow.algorithm.Path(pathOpts);
	} else if(opts.limit){
		// TODO think about this more?  It's not the best heuristic,
		// but I think it's good enough, since we do analyze nodes in
		// a particular order (favoring the more promising nodes)
		var bestNode = this.evaluatedList[this.evaluatedList.length-1];
		nodes.unshift(bestNode.innerNode);
		var node = bestNode.parent;
		while(node){
			nodes.unshift(node.innerNode);
			node = node.parent;
		}
	
		pathOpts.end = null;
		pathOpts.found = null;
		return new crow.algorithm.Path(pathOpts);
	} else {
		pathOpts.end = null;
		pathOpts.length = Infinity;
		pathOpts.found = false;
		
		return new crow.algorithm.Path(pathOpts);
	}
};

crow.algorithm.AStarAlgorithm.prototype._getWrapperNode = function(node){
	var w = this._wrapperNode.get(node);
	if(w) return w;
	w = new crow.algorithm.AStarAlgorithm.WrapperNode(node);
	this._wrapperNode.set(node, w);
	return w;
};
/**
 * @constructor
 * @private
 */
crow.algorithm.AStarAlgorithm.WrapperNode = function(node){
	this.innerNode = node;
	this.evaluated = false;
	this.parent;
	this.gScore;
	this.hScore;
	this.fScore;
};

// Attributes for AlgorithmResolver //
crow.algorithm.AStarAlgorithm.attributes = {
	min_speed: 2,
	// Works with:
	moving_start: false,
	moving_goal: false,
	unstable_graph: false,
	heuristics_allowed: true,
	goal_is_node: true,
	goal_is_callback: false
};
// end //

crow.algorithm.AStarAlgorithm.alias = "a*";
crow.Graph.registerAlgorithm(crow.algorithm.AStarAlgorithm);
