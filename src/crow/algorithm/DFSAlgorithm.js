goog.provide('crow.algorithm.DFSAlgorithm');
goog.require('crow.Graph');
goog.require('crow.algorithm.BasicTraversalAlgorithm');

/**
 * @class Depth-first search!
 * @constructor
 * @private
 */
crow.algorithm.DFSAlgorithm = function(graph){
	this.klass = crow.algorithm.DFSAlgorithm;
	this.graph = graph;
}
crow.algorithm.DFSAlgorithm.prototype = new crow.algorithm.BasicTraversalAlgorithm();

crow.algorithm.DFSAlgorithm.prototype.getNext = function(col){
	return col.pop();
};

crow.algorithm.DFSAlgorithm["alias"] = "dfs";
crow.Graph.registerAlgorithm(crow.algorithm.DFSAlgorithm);
