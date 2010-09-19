goog.provide('crow.algorithm.LPAStarAlgorithm');
goog.require('crow.algorithm.ShortestPathAlgorithm');
goog.require('crow.algorithm.Path');
goog.require('crow.structs.BucketPriorityQueue');
goog.require('crow.structs.NDArray');
goog.require('crow.Graph');

/**
 * @constructor
 * @class LPA*, good when the graph between two stationary targets changes a lot, fair bit of overhead otherwise.
 */
crow.algorithm.LPAStarAlgorithm = function(graph){
	this.graph = graph;
}
crow.algorithm.LPAStarAlgorithm.prototype = new crow.algorithm.ShortestPathAlgorithm();

crow.algorithm.LPAStarAlgorithm.prototype._CalculateKey = function(node){
	var startDist = Math.min(node.g, node.rhs);
	return [startDist + node.innerNode.distanceTo(this.goal.innerNode), startDist];
};

crow.algorithm.LPAStarAlgorithm.prototype._UpdateVertex = function(node){
	if(node != this.start){
		var neighbors = node.innerNode.getNeighbors(this.graph, this.diagonals);
		var bestScore = Infinity;
		for(var i = 0; i < neighbors.length; i++){
			var neighbor = this._getWrapperNode(neighbors[i]);
			// g + cost value
			var score = neighbor.g + node.innerNode.distanceTo(neighbor.innerNode);
			if(score < bestScore){
				bestScore = score;
			}
		}
		node.rhs = bestScore;
	}

	this.U.remove(node);

	if(node.g != node.rhs) this.U.enqueue(this._CalculateKey(node), node);
};

/**
 * @private
 */
crow.algorithm.LPAStarAlgorithm.prototype.keyComp = function(k1, k2){
	if(k1[0] < k2[0] || (k1[0] == k2[0] && k1[1] < k2[1])) return -1;
	if(k1[0] == k2[0] && k1[1] == k2[1]) return 0;
	return 1;
};

/**
 * @private
 */
crow.algorithm.LPAStarAlgorithm.prototype.h = function(node){
	return node.distanceTo(this.goal);
};

/**
 * @private
 */
crow.algorithm.LPAStarAlgorithm.prototype.updateNeighbors = function(node){
	var neighbors = node.innerNode.getNeighbors(this.graph, this.diagonals);
	for(var i = 0; i < neighbors.length; i++){
		this._UpdateVertex(this._getWrapperNode(neighbors[i]));
	}
};

/**
 * @private
 * @deprecated
 */
crow.algorithm.LPAStarAlgorithm.prototype.debugGraph = function(){
	/*
	function myRound(num){
		return Math.round(num * 10000) / 10000;
	}
	var table = jQuery("<table class='lpa'>");
	for(var y = 0; y < this.graph.height; y++){
		var row = jQuery("<tr>");
		for(var x = 0; x < this.graph.width; x++){
			var node = this.graph.getNode(x, y);
			if(node){
				var key = this._CalculateKey(this.graph.getNode(x, y));
				key[0] = myRound(key[0]);
				key[1] = myRound(key[1]);
				var rhs = this.rhs.get(node), g = this.g.get(node);
				var keyString = "[" + key[0] + ',' + key[1] + "]";
				if(rhs == g){
					var tip = keyString;
					row.append("<td class='consistent' title='" + tip + "'>" + myRound(g) + "</td>");
				} else {
					var tip = "rhs: " + rhs + ", g: " + g;
					row.append("<td class='inconsistent' title='" + tip + "'>Infinity<br><span class='key'>" + keyString + "</span></td>");
				}
			} else {
				row.append("<td class='noNode'/>");
			}
		}
		table.append(row);
	}
	return table;
	*/
};
/**
 * Finds the best path from start node to goal node.
 * @param {crow.BaseNode} start The node from which to begin the search.
 * @param {crow.BaseNode} goal The node that we're looking for.
 * @param {Object} [opts] Additional options
 * @param {Number} [opts.limit] Maximum number of nodes to check in this pass.
 *   Note that there won't necessarily be this many nodes returned in the (partial) path.
 *   To continue checking from where the path left off, see {@link crow.algorithm.Path#continueCalculating}.
 * @returns {crow.algorithm.Path}
 */
crow.algorithm.LPAStarAlgorithm.prototype.findPath = function(start, goal, opts){
	if(typeof goal === "function"){
		throw new Error("A* doesn't support using a callback to determine the goal");
	}
	if(!opts) opts = {};
	this._wrapperNode = new crow.Algorithm.NodeMap();
	
	this.start = this._getWrapperNode(start);
	this.goal = this._getWrapperNode(goal);
	this.opts = opts;
	this.diagonals = opts.diagonals;
	
	this.U = new crow.structs.BucketPriorityQueue(this.keyComp);
	this.start.rhs = 0;
	this.U.enqueue(this._CalculateKey(this.start), this.start);
	
	this.mainLoop();
	
	var results = this.resolveResults();
		
	var pathOpts = {
		nodes: results.nodes,
		start: this.start.innerNode,
		goal: this.goal.innerNode,
		found: results.found,
		length: results.length,
		recalculate: this.recalculate,
		algorithm: this,
		baked: opts.baked || (typeof opts.baked === "undefined" && !opts.limit),
		graph: opts.graph
	};

	return new crow.algorithm.Path(pathOpts);
};

/**
 * @private
 */
crow.algorithm.LPAStarAlgorithm.prototype.mainLoop = function(){
	while(this.U.length && 
		(
			this.keyComp(this.U.peekKey(), this._CalculateKey(this.goal)) < 0 || 
			this.goal.rhs != this.goal.g
		)){
		var u = this.U.dequeue();
		if(u.g > u.rhs){
			u.g = u.rhs;
			// for all successors of u, call UpdateVertex(successor)
			this.updateNeighbors(u);
		} else {
			u.g = Infinity;
			// for all (successors of u) union u, call _UpdateVertex(node)
			this.updateNeighbors(u);
			this._UpdateVertex(u);
		}
	}
};

/**
 * @private
 */
crow.algorithm.LPAStarAlgorithm.prototype.resolveResults = function(){
	var nodes = [];
	var current = this.goal;
	var length = 0;
	var failsafeMaximum = this.graph.width * this.graph.height, count = 0;
	while(current != this.start && current){
		nodes.unshift(current.innerNode);
		
		var neighbors = current.innerNode.getNeighbors(this.graph, this.diagonals);
		var bestScore = Infinity, bestNeighbor = null, distance = 0, bestDistance = 0;
		for(var i = 0; i < neighbors.length; i++){
			var neighbor = this._getWrapperNode(neighbors[i]);
			// g + cost value
			distance = current.innerNode.distanceTo(neighbor.innerNode);
			var score = neighbor.g + distance;
			if(score < bestScore){
				bestScore = score;
				bestNeighbor = neighbor;
				bestDistance = distance;
			}
		}
		current = bestNeighbor;
		if(bestNeighbor){
			length += bestDistance;
		}
		count++;
		if(count >= failsafeMaximum){
			throw new Error("resolveResults won't terminate");
			break;
		}
	}
	var found = current == this.start;
	if(!found){
		nodes = [];
	}
	nodes.unshift(this.start.innerNode);
	
	return {
		nodes: nodes,
		length: length,
		found: found
	};
};

/**
 * @private
 */
crow.algorithm.LPAStarAlgorithm.prototype.recalculate = function(){
	var a = this.algorithm;
	return a.findPath(a.start, a.goal, a.opts);
};

crow.algorithm.LPAStarAlgorithm.prototype._invalidatePoint = function(path, invalidationEvent){
	var x = invalidationEvent.x, y = invalidationEvent.y;
	
	if(!path.invalidatedPoints){
		path.invalidatedPoints = new crow.structs.NDArray(2);
	}
	path.invalidatedPoints.add(true, x, y);
	var node = path.graph.getNode(x, y, true);
	var neighbors = node.getNeighbors(path.graph, path.algorithm.diagonals);
	for(var i = 0; i < neighbors.length; i++){
		var neighbor = neighbors[i];
		path.invalidatedPoints.add(true, neighbor.x, neighbor.y);
	}
	path.found = false;
};

/**
 * @private
 */
crow.algorithm.LPAStarAlgorithm.prototype.continueCalculating = function(path){
	if(path.invalidatedPoints){
		var algo = this;
		var getWrapperNode = this._getWrapperNode;
		path.invalidatedPoints.each(function(val, x, y){
			var n = algo.graph.getNode(x, y);
			if(n){
				algo._UpdateVertex(getWrapperNode.call(algo, n));
			}
		});
		this.mainLoop();
		path.invalidatedPoints = new crow.structs.NDArray(2);
		
		var results = this.resolveResults();
		path.nodes = results.nodes;
		path.length = results.length;
		path.found = results.found;
	}
	return path.found;
};

crow.algorithm.LPAStarAlgorithm.prototype._getWrapperNode = function(node){
	var w = this._wrapperNode.get(node);
	if(w) return w;
	w = new crow.algorithm.LPAStarAlgorithm.WrapperNode(node);
	this._wrapperNode.set(node, w);
	return w;
};
/**
 * @constructor
 * @private
 */
crow.algorithm.LPAStarAlgorithm.WrapperNode = function(node){
	this.innerNode = node;
	this.rhs = Infinity;
	this.g = Infinity;
};

// Attributes for AlgorithmResolver //
crow.algorithm.LPAStarAlgorithm.attributes = {
	min_speed: 0,
	// Works with:
	moving_start: false,
	moving_goal: false,
	unstable_graph: true,
	heuristics_allowed: true,
	goal_is_node: true,
	goal_is_callback: false
};
// end //

crow.algorithm.LPAStarAlgorithm.alias = "lpa*";
crow.Graph.registerAlgorithm(crow.algorithm.LPAStarAlgorithm);
