goog.provide('crow.algorithm.LinearAlgorithm');
goog.require('crow.algorithm.SearchAlgorithm');
goog.require('crow.Graph');

/**
 * @constructor
 * @private
 */
crow.algorithm.LinearAlgorithm = function(graph){
	this.graph = graph;
}
crow.algorithm.LinearAlgorithm.prototype = new crow.algorithm.SearchAlgorithm();
crow.algorithm.LinearAlgorithm.prototype.search = function(start, opts){
	if(!opts) opts = {};
	var list;
	var nodes = this.graph.getNodes();
	if(opts.filter){
		list = [];
		for(var i in nodes){
			var n = nodes[i];
			if(!opts.filter || opts.filter.call(n)){
				list.push(n);
			}
		}
	} else {
		list = nodes;
	}
	return list;
};

crow.algorithm.LinearAlgorithm.alias = "linear";
crow.Graph.registerAlgorithm(crow.algorithm.LinearAlgorithm);
