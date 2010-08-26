goog.provide('crow.algorithm.Path');
goog.require('crow.BaseNode');
goog.require('crow.util.Assert');

/**
 * @constructor
 */
crow.algorithm.Path = function(opts){
	this.nodes = opts.nodes;
	this.start = opts.start;
	this.goal = opts.goal;
	this.end = opts.goal;
	this.length = opts.length;
	this.found = opts.found;
	this.algorithm = opts.algorithm;
}

crow.algorithm.Path.prototype.advanceTo = function(index_or_node){
	assert(typeof(index_or_node) === "number" || index_or_node instanceof crow.BaseNode, assert.InvalidArgumentType("number or crow.BaseNode"));
	if(typeof(index_or_node) === "number"){
		assert(index_or_node >= 0 && index_or_node < this.nodes.length, assert.IndexOutBounds(index_or_node));
		this.nodes = this.nodes.slice(index_or_node);
	} else {
		var x = index_or_node.getX(), y = index_or_node.getY(), i;
		var found = false;
		for(i = 0; i < this.nodes.length; i++){
			var n = this.nodes[i];
			if(n.getX() == x && n.getY() == y){
				found = true;
				break;
			}
		}
		if(found){
			this.advanceTo(i);
		} else {
			this.nodes = [index_or_node];
		}
	}
};
crow.algorithm.Path.prototype.getNextNode = function(){
	return this.nodes[1];	
};
crow.algorithm.Path.prototype.continueCalculating = function(count){
	if(this.found) return false;
	var lastNode = this.nodes[this.nodes.length-1];
	var continuedPath = this.algorithm.findPath(lastNode, this.goal, {
		limit: count
	});
	// this node list needs to be pruned, in case continuedPath contains a node in this
	this.nodes = this.nodes.concat(continuedPath.nodes.slice(1)),
	this.found = continuedPath.found;
	return this.found;
}
