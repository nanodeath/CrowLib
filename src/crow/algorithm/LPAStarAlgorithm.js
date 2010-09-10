goog.provide('crow.algorithm.LPAStarAlgorithm');
goog.require('crow.algorithm.ShortestPathAlgorithm');
goog.require('crow.algorithm.Path');

/**
 * @constructor
 */
crow.algorithm.LPAStarAlgorithm = function(graph){
	this.graph = graph;
}
crow.algorithm.LPAStarAlgorithm.prototype = new crow.algorithm.ShortestPathAlgorithm();

crow.algorithm.LPAStarAlgorithm.prototype._CalculateKey = function(node){
	var g = this.g.get(node), rhs = this.rhs.get(node);
	var grhs = Math.min(g, rhs);
	return [grhs + this.h(node), grhs];
};

crow.algorithm.LPAStarAlgorithm.prototype._UpdateVertex = function(node){
	if(node != this.start){
		var neighbors = node.getNeighbors(this.graph);
		var bestScore = Infinity;
		for(var i = 0; i < neighbors.length; i++){
			var neighbor = neighbors[i];
			// g + cost value
			// this works, but only for 4-connected gridworld.
			// TODO should be refactored in any case
			var score = this.g.get(neighbor) + 1;
			if(score < bestScore){
				bestScore = score;
			}
		}
		this.rhs.set(node, bestScore);
	}
	// TODO optimize what follows
	//if(this.U.contains(node)) {
		// okay to comment out conditional because remove fails silently
		//this.U.remove(node);
		var foundNode = null;
		this.U.inOrderTraverse(function(uNode){
			// TODO abstraction bleeding!  shouldn't know about .value
			if(uNode.value == node){
				foundNode = uNode;
				return true;
			} else {
				return false;
			}
		});
		if(foundNode){
			this.U.remove(foundNode);
		}
	//}
	if(this.g.get(node) != this.rhs.get(node)) this.U.enqueue(this._CalculateKey(node), node);
};

crow.algorithm.LPAStarAlgorithm.prototype.keyComp = function(k1, k2){
	if(k1[0] < k2[0] || (k1[0] == k2[0] && k1[1] < k2[1])) return -1;
	if(k1[0] == k2[0] && k1[1] == k2[1]) return 0;
	return 1;
};

crow.algorithm.LPAStarAlgorithm.prototype.h = function(node){
	return crow.GraphUtil.distance.pythagoras(node.x - this.goal.x, node.y - this.goal.y);
};
crow.algorithm.LPAStarAlgorithm.prototype.updateNeighbors = function(node){
	var neighbors = node.getNeighbors(this.graph);
	for(var i = 0; i < neighbors.length; i++){
		this._UpdateVertex(neighbors[i]);
	}
};
/**
 * Finds the best path from start node to goal node.
 * @param {crow.BaseNode} start The node from which to begin the search.
 * @param {crow.BaseNode} goal The node that we're looking for.
 * @param {Object} [opts] Additional options
 * @param {Number} [opts.limit] Maximum number of nodes to check in this pass.
 *   Note that there won't necessarily be this many nodes returned in the (partial) path.
 *   To continue checking from where the path left off, see {@link crow.algorithm.Path#continueCalculating}.
 */
crow.algorithm.LPAStarAlgorithm.prototype.findPath = function(start, goal, opts){
	if(typeof goal === "function"){
		throw new Error("A* doesn't support using a callback to determine the goal");
	}
	if(!opts) opts = {};
	
	this.start = start;
	this.goal = goal;
	this.opts = opts;
	this.graph = opts.graph;
	
	//this.U = new crow.Algorithm.AvlTree(this.keyComp);
	this.U = new crow.Algorithm.AvlPriorityQueue(this.keyComp);
	this.rhs = new crow.Algorithm.NodeMap(Infinity);
	this.g = new crow.Algorithm.NodeMap(Infinity);
	this.rhs.set(start, 0);
	this.U.enqueue(this._CalculateKey(start), start);
	
	while(this.U.getCount() > 0 && 
		(
			this.keyComp(this.U.peekKey(), this._CalculateKey(goal)) < 0 || 
			this.rhs.get(goal) != this.g.get(goal)
		)){
		var u = this.U.dequeue();
		if(this.g.get(u) > this.rhs.get(u)){
			this.g.set(u, this.rhs.get(u));
			// for all successors of u, call UpdateVertex(successor)
			this.updateNeighbors(u);
		} else {
			this.g.set(u, Infinity);
			// for all (successors of u) union u, call _UpdateVertex(node)
			this.updateNeighbors(u);
			this._UpdateVertex(u);
		}
	}

	var nodes = [];
	
	var current = goal;
	found = true;
	var length = 0;
	while(current != start && current){
		nodes.unshift(current);
		
		var neighbors = current.getNeighbors(this.graph);
		var bestScore = Infinity, bestNeighbor = null, distance = 0, bestDistance = 0;
		for(var i = 0; i < neighbors.length; i++){
			var neighbor = neighbors[i];
			// g + cost value
			distance = current.distanceTo(neighbor);
			var score = this.g.get(neighbor) + distance;
			if(score < bestScore){
				bestScore = score;
				bestNeighbor = neighbor;
				bestDistance = distance;
			}
		}
		current = bestNeighbor;
		if(!bestNeighbor){
			found = false;
		} else {
			length += bestDistance;
		}
	}
	if(!found){
		nodes = [];
	}
	nodes.unshift(start);
		
	var pathOpts = {
		nodes: nodes,
		start: start,
		goal: goal,
		found: found,
		length: length,
		recalculate: this.recalculate,
		algorithm: this,
		graph: opts.graph
	};

	return new crow.algorithm.Path(pathOpts);
};
crow.algorithm.LPAStarAlgorithm.prototype.estimateDistance = function(start, goal, graph){
	return crow.GraphUtil.distance.manhattan(start.getX() - goal.getX(), start.getY() - goal.getY());
};
crow.algorithm.LPAStarAlgorithm.prototype.recalculate = function(){
	var a = this.algorithm;
	return a.findPath(a.start, a.goal, a.opts);
};

crow.Graph.registerAlgorithm(crow.algorithm.LPAStarAlgorithm, 'lpa*');
