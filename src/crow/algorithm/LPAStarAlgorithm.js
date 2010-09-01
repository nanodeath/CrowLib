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
		// TODO 
		this.rhs.set(node, null /* precedessor of node with the smallest g + cost value */);
	}
	/*if(this.U.contains(node))*/ this.U.remove(node); // okay to comment out first part since remove fails silently
	if(this.g.get(node) != this.rhs.get(node)) this.U.insert({key: this._CalculateKey(node), value: node});
};

crow.algorithm.LPAStarAlgorithm.prototype._arrayComparator = function(a1, a2){
	if(a1.length == a2.length){
		for(var i = 0; i < a1.length; i++){
			var v1 = a1[i], v2 = a2[i];
			if(v1 < v2) return -1;
			if(v1 > v2) return 1;
		}
		return 0;
	} else {
		throw new Error;
	}
};

crow.algorithm.LPAStarAlgorithm.prototype.h = function(node){
	// TODO implement heuristic
	
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
	
	this.U = new goog.structs.AvlTree(this._arrayComparator);
	this.rhs = new crow.Algorithm.NodeMap(Infinity);
	this.g = new crow.algorithm.NodeMap(Infinity);
	this.rhs.set(start, 0);
	this.U.enqueue(this.calculateKey(start), start);
	
	while(this.U.peekKey() < this._CalculateKey(goal) || this.rhs.get(goal) != this.g.get(goal)){
		var u = this.U.dequeue();
		if(this.g.get(u) > this.rhs.get(u)){
			this.g.set(u, this.rhs.get(u));
			// TODO for all successors of u, call UpdateVertex(successor)
		} else {
			this.g.set(u, Infinity);
			// TODO for all successors of u, plus u, call UpdateVertex(successor_or_u)
		}
	}

	var nodes = [];	
	var pathOpts = {
		nodes: nodes,
		start: start,
		goal: goal,
		length: null,
		recalculate: this.recalculate,
		algorithm: this,
		graph: opts.graph
	};


};
crow.algorithm.LPAStarAlgorithm.prototype.estimateDistance = function(start, goal, graph){
	return crow.GraphUtil.distance.manhattan(start.getX() - goal.getX(), start.getY() - goal.getY());
};
crow.algorithm.LPAStarAlgorithm.prototype.recalculate = function(){
	var a = this.algorithm;
	return a.findPath(a.start, a.goal, a.opts);
};

crow.Graph.registerAlgorithm(crow.algorithm.LPAStarAlgorithm, 'lpa*');
