goog.provide('crow.algorithm.BFSAlgorithm');
goog.require('crow.algorithm.SearchAlgorithm');

/**
 * @constructor
 */
crow.algorithm.BFSAlgorithm = function(graph){
	this.graph = graph;
}
crow.algorithm.BFSAlgorithm.prototype = new crow.algorithm.SearchAlgorithm();
crow.algorithm.BFSAlgorithm.prototype.search = function(start, opts){
	if(!opts) opts = {};
	// opts can contain a `filter` callback to ignore nodes
	var visited = {}, pendingVisit = {};
	var queue = [start];
	
	function checkNeighbor(n){
		if(n){
			var h = crow.Algorithm.util.hash(n);
			if(!visited[h] && !pendingVisit[h] && (!opts.filter || opts.filter.call(n))){
				queue.push(n);
				pendingVisit[h] = 1;
			}
		}
	}
	
	var list = [];
	while(queue.length > 0){
		var el = queue.shift();
		visited[crow.Algorithm.util.hash(el)] = 1;
		list.push(el);
		
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
