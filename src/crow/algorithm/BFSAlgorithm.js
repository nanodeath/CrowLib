goog.provide('crow.algorithm.BFSAlgorithm');
goog.require('crow.algorithm.SearchAlgorithm');

/**
 * @constructor
 * Notes: BFS doesn't yet have a notion of distance between different nodes.
 * If two adjacent nodes are an infinite distance apart (i.e. there's a wall between
 * them) it doesn't check.
 */
crow.algorithm.BFSAlgorithm = function(graph){
	this.graph = graph;
}
crow.algorithm.BFSAlgorithm.prototype = new crow.algorithm.SearchAlgorithm();
crow.algorithm.BFSAlgorithm.prototype.search = function(start, opts){
	if(!opts) opts = {};
	// opts can contain a `filter` callback to ignore nodes
	var visited = new crow.Algorithm.NodeMap(false), pendingVisit = new crow.Algorithm.NodeMap(false);
	var queue = [start];
	
	// TODO private instance method
	function checkNeighbor(n){
		if(n){
			if(!visited.get(n) && !pendingVisit.get(n) && (!opts.filter || opts.filter.call(n))){
				queue.push(n);
				pendingVisit.set(n, true);
			}
		}
	}
	
	var list = [], el;
	while(el = queue.shift()){
		visited.set(el, true);
		list.push(el);
		
		// TODO this can be optimized.  we don't need to make and iterate over an array for 4 elements,
		// even if it does look nice
		var range = [-1, 1];
		var ox = el.getX(), oy = el.getY();
		for(var i in range){
			var x = ox + range[i];
			var n = this.graph.getNode(x, oy);
			checkNeighbor(n);
		}
		for(var i in range){
			var y = oy + range[i];
			var n = this.graph.getNode(ox, y);
			checkNeighbor(n);
		}
	}
	return list;
};

crow.Graph.registerAlgorithm(crow.algorithm.BFSAlgorithm, 'bfs');
