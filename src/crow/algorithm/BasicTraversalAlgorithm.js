goog.provide('crow.algorithm.BasicTraversalAlgorithm');
goog.require('crow.Graph');
goog.require('crow.algorithm.ShortestPathAlgorithm');

(function(){
/**
 * @class Traversal algorithm used by BFS and DFS searches.
 * @constructor
 * @private
 */
crow.algorithm.BasicTraversalAlgorithm = function(graph){
	this.klass = crow.algorithm.BasicTraversalAlgorithm;
	this.graph = graph;
}
var logger = new crow.Logger(crow.algorithm.BasicTraversalAlgorithm);

crow.algorithm.BasicTraversalAlgorithm.prototype = new crow.algorithm.ShortestPathAlgorithm();

crow.algorithm.BasicTraversalAlgorithm.prototype.findPath = function(start, goal, opts){
	crow.algorithm.ShortestPathAlgorithm.prototype.findPath.apply(this, arguments);
	if(typeof opts == "undefined") opts = {};
	start = this._getWrapperNode(start);
	start.distance = 0;
	this.actor = opts.actor;
	var filter = opts.filter;
	
	if(!goal) logger.info("No goal was provided, so the entire graph will be traversed");
	
	var found = false;
	var queue = [start], list = [], el;
	while(el = this.getNext(queue)){
		el.pending = false;
		el.expanded = true;
		list.push(el.innerNode);
		
		if(el.innerNode == goal){
			found = true;
			break;
		}
		
		var neighbors = el.innerNode.getNeighbors(this.graph);
		if(opts.random){
			neighbors = neighbors.shuffle();
		}
		for(var i = 0; i < neighbors.length; i++){
			var neighbor = this._getWrapperNode(neighbors[i]);
			if(neighbor.expanded || neighbor.pending) continue;
			if(el.innerNode.distanceToNeighbor(neighbor.innerNode, this.actor) < Infinity && (!filter || filter(neighbor))){
				this.addNext(queue, neighbor);
				neighbor.pending = true;
				neighbor.parent = el;
				neighbor.distance = el.distance + 1;
			}
		}
	}
	this.start = start;
	this.goal = goal;
	this.list = list;
	
	return this.resolveResults(found);
};

crow.algorithm.BasicTraversalAlgorithm.prototype.getNext = function(col){
	throw new Error("must implement");
};

crow.algorithm.BasicTraversalAlgorithm.prototype.addNext = function(col, val){
	col.push(val);
};

crow.algorithm.BasicTraversalAlgorithm.prototype.resolveResults = function(found){
	var nodes = [];	
	var pathOpts = {
		nodes: nodes,
		start: this.start.innerNode,
		goal: this.goal,
		algorithm: this,
		graph: this.graph,
		baked: true,
		actor: this.actor,
		found: found
	};
	
	if(found){
		var endNode = this._getWrapperNode(this.goal);
		nodes.unshift(endNode.innerNode);
		var node = endNode.parent;
		while(node){
			nodes.unshift(node.innerNode);
			node = node.parent;
		}
		pathOpts.end = endNode.innerNode;
		pathOpts.length = endNode.distance;
	} else {
		pathOpts.end = null;
		pathOpts.length = Infinity;
	}
	var path = new crow.algorithm.Path(pathOpts);
	path.allNodes = this.list;
	return path
};

/**
 * @constructor
 * @private
 */
crow.algorithm.BasicTraversalAlgorithm.WrapperNode = function(node){
	this.innerNode = node;
	this.expanded = false;
	this.pending = false;
	this.parent = null;
	this.distance = Infinity;
};

/**
 * @private
 */
crow.algorithm.BasicTraversalAlgorithm.prototype._getWrapperNode = crow.Algorithm.wrapperNodeGetterTemplate(crow.algorithm.BasicTraversalAlgorithm.WrapperNode);
})();
