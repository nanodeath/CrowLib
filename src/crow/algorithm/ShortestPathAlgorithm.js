goog.provide('crow.algorithm.ShortestPathAlgorithm');
goog.require('crow.Algorithm');

/**
 * @constructor
 * @private
 */
crow.algorithm.ShortestPathAlgorithm = function(){}
crow.algorithm.ShortestPathAlgorithm.prototype = new crow.Algorithm();
/**
 * Finds the shortest path from point A to either point B or a node meeting condition B.
 */
crow.algorithm.ShortestPathAlgorithm.prototype.findPath = function(start, end, opts){
	this.wrapperNode = new crow.Algorithm.NodeMap()
};
