goog.provide('crow.algorithm.BFSAlgorithm');
goog.require('crow.Graph');
goog.require('crow.algorithm.SearchAlgorithm');

/**
 * @constructor
 */
crow.algorithm.BFSAlgorithm = function(graph){
	this.graph = graph;
}
crow.algorithm.BFSAlgorithm.prototype = new crow.algorithm.SearchAlgorithm();
crow.algorithm.BFSAlgorithm.prototype.search = function(start, opts){
	var visited = new crow.Algorithm.NodeMap(false);
	var pendingVisit = new crow.Algorithm.NodeMap(false);

	var queue = [start], list = [], el;
	while(el = queue.shift()){
		visited.set(el, true);
		list.push(el);
		
		var neighbors = el.getNeighbors(this.graph);
		for(var i = 0; i < neighbors.length; i++){
			var neighbor = neighbors[i];
			if(!visited.get(neighbor) && !pendingVisit.get(neighbor) && el.distanceTo(neighbor) < Infinity){
				queue.push(neighbor);
				pendingVisit.set(neighbor, true);
			}
		}
	}
	return list;
};

crow.Graph.registerAlgorithm(crow.algorithm.BFSAlgorithm, 'bfs');
