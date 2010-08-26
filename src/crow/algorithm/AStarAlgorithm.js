goog.provide('crow.algorithm.AStarAlgorithm');
goog.require('crow.algorithm.ShortestPathAlgorithm');
goog.require('crow.algorithm.Path');

/**
 * A* algorithm, which is basically an "informed" Dijkstra's algorithm.
 * It oozes in the direction of your goal node.
 * @constructor
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
	if(!opts) opts = {};
	
	this.start = start;
	this.goal = goal;
	this.opts = opts;

	this.evaluated = new crow.Algorithm.NodeMap(false);
	this.evaluatedList = [];
	this.toEvaluate = new crow.Algorithm.PriorityQueue();
	this.toEvaluate.enqueue(0, start);
	this.parent = new crow.Algorithm.NodeMap();
	
	// gScore is distance of a node n from the starting point
	this.gScore = new crow.Algorithm.NodeMap();
	// hScore is the estimated distance between a node n and the goal
	this.hScore = new crow.Algorithm.NodeMap();
	// fScore is the total estimated distance of route through a node
	this.fScore = new crow.Algorithm.NodeMap();
	
	var estimateDistance = this.estimateDistance;
	
	this.gScore.set(start, 0);
	this.hScore.set(start, estimateDistance(start, goal, this.graph));
	var found = false, currentNode;
	while(currentNode = this.toEvaluate.dequeue()){
		if(currentNode === goal){
			found = true;
			break;
		} else if(this.evaluated.get(currentNode)){
			// normally this wouldn't be necessary, but if we check the same neighbor twice,
			// it may get added to the toEvaluate list twice
			continue;
		}
		this.evaluated.set(currentNode, true);
		this.evaluatedList.push(currentNode);
		if(opts.limit && this.evaluatedList.length >= opts.limit){
			break;
		}
		
		var neighbors = currentNode.getNeighbors(this.graph);
		for(var n in neighbors){
			var neighbor = neighbors[n];
			if(this.evaluated.get(neighbor)) continue;
			var newGScore = this.gScore.get(currentNode) + currentNode.distanceTo(neighbor);
			if(newGScore == Infinity) continue;
			
			if(!this.toEvaluate.containsValue(neighbor) || newGScore < this.gScore.get(neighbor)){
				this.parent.set(neighbor, currentNode);
				this.gScore.set(neighbor, newGScore);
				var hScore = estimateDistance(neighbor, goal);
				this.hScore.set(neighbor, hScore);
				var fScore = newGScore + hScore;
				this.fScore.set(neighbor, fScore);
				this.toEvaluate.enqueue(fScore, neighbor);
			}
		}
	}

	var nodes = [];	
	var pathOpts = {
		nodes: nodes,
		start: start,
		goal: goal,
		length: null,
		recalculate: this.recalculate,
		algorithm: this
	};

	if(found){
		if(goal){
			nodes.unshift(goal);
			var node = this.parent.get(goal);
			while(node){
				nodes.unshift(node);
				node = this.parent.get(node);
			}
		}
		pathOpts.end = goal;
		pathOpts.length = this.gScore.get(goal);
		pathOpts.found = true;
		
		return new crow.algorithm.Path(pathOpts);
	} else if(opts.limit){
		// TODO think about this more?  It's not the best heuristic,
		// but I think it's good enough, since we do analyze nodes in
		// a particular order (favoring the more promising nodes)
		var bestNode = this.evaluatedList[this.evaluatedList.length-1];
		nodes.unshift(bestNode);
		var node = this.parent.get(bestNode);
		while(node){
			nodes.unshift(node);
			node = this.parent.get(node);
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
crow.algorithm.AStarAlgorithm.prototype.estimateDistance = function(start, goal, graph){
	return crow.GraphUtil.distance.manhattan(start.getX() - goal.getX(), start.getY() - goal.getY());
};
crow.algorithm.AStarAlgorithm.prototype.recalculate = function(){
	var a = this.algorithm;
	return a.findPath(a.start, a.goal, a.opts);
};

crow.Graph.registerAlgorithm(crow.algorithm.AStarAlgorithm, 'a*');
