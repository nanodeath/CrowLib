goog.provide('crow.algorithm.BFSAlgorithm');
goog.require('crow.Graph');
goog.require('crow.algorithm.SearchAlgorithm');

/**
 * @class Yer basic breadth-first search.  It oozes out equally in all directions,
 * doesn't keep track of distances, and simply returns a list of all discovered nodes
 * at the end.
 * @constructor
 * @private
 */
crow.algorithm.BFSAlgorithm = function(graph){
	this.graph = graph;
}
crow.algorithm.BFSAlgorithm.prototype = new crow.algorithm.SearchAlgorithm();
crow.algorithm.BFSAlgorithm.prototype.search = function(start, opts){
	if(typeof opts == "undefined") opts = {};
	var visited = new crow.Algorithm.NodeMap(false);
	var pendingVisit = new crow.Algorithm.NodeMap(false);

	var queue = [start], list = [], el;
	while(el = queue.shift()){
		visited.set(el, true);
		list.push(el);
		
		var neighbors = el.getNeighbors(this.graph);
		for(var i = 0; i < neighbors.length; i++){
			var neighbor = neighbors[i];
			if(!visited.get(neighbor) && !pendingVisit.get(neighbor) && el.distanceToNeighbor(neighbor) < Infinity && (!opts.filter || opts.filter(neighbor))){
				queue.push(neighbor);
				pendingVisit.set(neighbor, true);
			}
		}
	}
	// TODO return a proper path
	return list;
};

crow.algorithm.BFSAlgorithm.alias = "bfs";
crow.Graph.registerAlgorithm(crow.algorithm.BFSAlgorithm);
