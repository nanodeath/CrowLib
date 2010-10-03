goog.provide('crow.algorithm.BFSAlgorithm');
goog.require('crow.Graph');
goog.require('crow.algorithm.BasicTraversalAlgorithm');

/**
 * @class Yer basic breadth-first search.  It oozes out equally in all directions,
 * doesn't keep track of distances, and simply returns a list of all discovered nodes
 * at the end.
 * @constructor
 * @private
 */
crow.algorithm.BFSAlgorithm = function(graph){
	this.klass = crow.algorithm.BFSAlgorithm;
	this.graph = graph;
}
crow.algorithm.BFSAlgorithm.prototype = new crow.algorithm.BasicTraversalAlgorithm();

crow.algorithm.BFSAlgorithm.prototype.getNext = function(col){
	return col.shift();
};

crow.algorithm.BFSAlgorithm["alias"] = "bfs";
crow.Graph.registerAlgorithm(crow.algorithm.BFSAlgorithm);
