goog.provide('crow.algorithm.BFSBasicAlgorithm');
goog.require('crow.Graph');
goog.require('crow.algorithm.SearchAlgorithm');
goog.require('crow.algorithm.BFSAlgorithm');

/**
 * @class Yer basic breadth-first search.  It oozes out equally in all directions,
 * doesn't keep track of distances, and simply returns a list of all discovered nodes
 * at the end.
 * @constructor
 * @private
 */
crow.algorithm.BFSBasicAlgorithm = function(graph){
	this.klass = crow.algorithm.BFSBasicAlgorithm;
	this.graph = graph;
}
crow.algorithm.BFSBasicAlgorithm.prototype = new crow.algorithm.SearchAlgorithm();
crow.algorithm.BFSBasicAlgorithm.prototype.search = function(start, opts){
	var bfs = new crow.algorithm.BFSAlgorithm(this.graph);
	var path = bfs.findPath(start, null, opts);
	return path.allNodes;
};

crow.algorithm.BFSBasicAlgorithm["alias"] = "bfs_basic";
crow.Graph.registerAlgorithm(crow.algorithm.BFSBasicAlgorithm);
