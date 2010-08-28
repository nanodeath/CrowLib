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
	this.graph = opts.graph;
	this._baked = false;
	
	if(this.graph){
		this.graph.validator.addEventListener("invalidatePoint", this._invalidatePoint, null, this);
	}
};

crow.algorithm.Path.prototype._invalidatePoint = function(e){
	var x = e.x, y = e.y;
	for(var i = 0; i < this.nodes.length; i++){
		var n = this.nodes[i];
		if(n.getX() == x && n.getY() == y){
			this.nodes = this.nodes.slice(0, i);
			this.end = null;
			this.found = false;
			break;
		}
	}
};

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
	if(this.baked) throw new Error("Can't continue calculating a baked path");
	if(this.found) return true;
	var lastNode = this.nodes[this.nodes.length-1];
	var opts = !count ? {} : {limit: count};
	var continuedPath = this.algorithm.findPath(lastNode, this.goal, opts);
	// this node list needs to be pruned, in case continuedPath contains a node in this
	this.nodes = this.nodes.concat(continuedPath.nodes.slice(1)),
	this.found = continuedPath.found;
	return this.found;
}

crow.algorithm.Path.prototype.bake = function(){
	this._baked = true;
	if(this.graph){
		this.graph.validator.removeEventListener("invalidatePoint", this._invalidatePoint);
	}
};
