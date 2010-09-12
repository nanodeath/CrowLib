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

(function(){
	var magicNumber = 0;
	crow.algorithm.LPAStarAlgorithm.prototype._CalculateKey = function(node){
		var g = this.g.get(node), rhs = this.rhs.get(node);
		var grhs = Math.min(g, rhs);
		// TODO fix this hack
		return [grhs + this.h(node), grhs + (magicNumber++) * 1e-10];
	};
})();

crow.algorithm.LPAStarAlgorithm.prototype._UpdateVertex = function(node){
	if(node != this.start){
		var neighbors = node.getNeighbors(this.graph, this.diagonals);
		var bestScore = Infinity;
		for(var i = 0; i < neighbors.length; i++){
			var neighbor = neighbors[i];
			// g + cost value
			var score = this.g.get(neighbor) + node.distanceTo(neighbor);
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
	// TODO fix this hack
	if(k1[0] == k2[0] && Math.abs(k1[1] - k2[1] < 0.00001)) return 0;
	return 1;
};

crow.algorithm.LPAStarAlgorithm.prototype.h = function(node){
	return node.distanceTo(this.goal);
};

crow.algorithm.LPAStarAlgorithm.prototype.updateNeighbors = function(node){
	var neighbors = node.getNeighbors(this.graph, this.diagonals);
	for(var i = 0; i < neighbors.length; i++){
		this._UpdateVertex(neighbors[i]);
	}
};
crow.algorithm.LPAStarAlgorithm.prototype.debugGraph = function(){
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
	this.diagonals = opts.diagonals;
	
	//this.U = new crow.Algorithm.AvlTree(this.keyComp);
	this.U = new crow.Algorithm.AvlPriorityQueue(this.keyComp);
	this.rhs = new crow.Algorithm.NodeMap(Infinity);
	this.g = new crow.Algorithm.NodeMap(Infinity);
	this.rhs.set(start, 0);
	this.U.enqueue(this._CalculateKey(start), start);
	
	this.mainLoop();
	
	var results = this.resolveResults();
		
	var pathOpts = {
		nodes: results.nodes,
		start: start,
		goal: goal,
		found: results.found,
		length: results.length,
		recalculate: this.recalculate,
		algorithm: this,
		baked: opts.baked || (typeof opts.baked === "undefined" && !opts.limit),
		graph: opts.graph
	};

	return new crow.algorithm.Path(pathOpts);
};

crow.algorithm.LPAStarAlgorithm.prototype.mainLoop = function(){
	while(this.U.getCount() > 0 && 
		(
			this.keyComp(this.U.peekKey(), this._CalculateKey(this.goal)) < 0 || 
			this.rhs.get(this.goal) != this.g.get(this.goal)
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
};

crow.algorithm.LPAStarAlgorithm.prototype.resolveResults = function(){
	var nodes = [];
	var current = this.goal;
	var found = true;
	var length = 0;
	var failsafeMaximum = this.graph.width * this.graph.height, count = 0;
	while(current != this.start && current){
		nodes.unshift(current);
		
		var neighbors = current.getNeighbors(this.graph, this.diagonals);
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
		count++;
		if(count >= failsafeMaximum){
			console.log("resolveResults won't terminate");
			break;
		}
	}
	if(!found){
		nodes = [];
	}
	nodes.unshift(this.start);
	
	return {
		nodes: nodes,
		length: length,
		found: found
	};
};

crow.algorithm.LPAStarAlgorithm.prototype.estimateDistance = function(start, goal, graph){
	return crow.GraphUtil.distance.manhattan(start.getX() - goal.getX(), start.getY() - goal.getY());
};
crow.algorithm.LPAStarAlgorithm.prototype.recalculate = function(){
	var a = this.algorithm;
	return a.findPath(a.start, a.goal, a.opts);
};

crow.algorithm.LPAStarAlgorithm.prototype._invalidatePoint = function(path, invalidationEvent){
	var x = invalidationEvent.x, y = invalidationEvent.y;
	
	if(!path.invalidatedPoints){
		path.invalidatedPoints = [];
	}
	path.invalidatedPoints.push([x, y]);
	var node = path.graph.getNode(x, y, true);
	var neighbors = node.getNeighbors(path.graph, path.algorithm.diagonals);
	for(var i = 0; i < neighbors.length; i++){
		var neighbor = neighbors[i];
		path.invalidatedPoints.push([neighbor.x, neighbor.y]);
	}
	path.found = false;
};
crow.algorithm.LPAStarAlgorithm.prototype.continueCalculating = function(path){
	if(path.invalidatedPoints && path.invalidatedPoints.length > 0){
		for(var i = 0; i < path.invalidatedPoints.length; i++){
			var point = path.invalidatedPoints[i];
			var n = this.graph.getNode(point[0], point[1]);
			if(n){
				this._UpdateVertex(n);
			}
		}
		this.mainLoop();
		path.invalidatedPoints = [];
		
	//return;
		var results = this.resolveResults();
		this.nodes = results.nodes;
		this.length = results.length;
		this.found = results.found;
	}
	return this.found;
};

crow.Graph.registerAlgorithm(crow.algorithm.LPAStarAlgorithm, 'lpa*');
