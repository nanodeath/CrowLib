goog.provide('crow.algorithm.Path');
goog.require('crow.BaseNode');
goog.require('crow.util.Assert');

/**
 * This is the class that's returned 
 * @constructor
 */
crow.algorithm.Path = function(opts){
	/** The nodes in this path */
	this.nodes = opts.nodes;
	/** The start value that was used to create this path */
	this.start = opts.start;
	/** The goal node/function that was used to create this path */
	this.goal = opts.goal;
	/** If the path is complete (has found its goal), this is the node that meets that goal */
	this.end = opts.goal;
	/** The total distance gone by traversing all nodes in this path */
	this.length = opts.length;
	/** Whether the goal node/function was reached in this path */
	this.found = opts.found;
	
	/**
	 * The algorithm instance used to generate this path.
	 * Null if the path is baked.
	 * Kept around because we may need to regenerate the path later.
	 * @private
	 */
	this.algorithm = null;
	/**
	 * The graph that this path was cut from.
	 * Null if the path is baked.
	 * Kept around because we need to detach from the graph when we bake the path.
	 * @private
	 */
	this.graph = null;
	/**
	 * The actor from the original query.
	 * Null if the path is baked.
	 * Kept around because we may need to regenerate the path later.
	 * @private
	 */
	this.actor = null;
	/**
	 * Whether this path is baked or not.
	 * Baked paths are detached from their graphs.
	 * @private
	 */
	this._baked = true;
	
	if(opts.baked === false){
		this._baked = false;
		
		this.algorithm = opts.algorithm;
		this.graph = opts.graph;
		this.actor = opts.actor;
		
		if(this.graph){
			this.graph.validator.addEventListener("invalidatePoint", this._invalidatePoint, null, this);
			this.graph.validator.addEventListener("invalidateRegion", this._invalidateRegion, null, this);
		}
	}
};

crow.algorithm.Path.prototype._invalidatePoint = function(e){
	if(this._baked) return;
	this.algorithm._invalidatePoint(this, e);
};

crow.algorithm.Path.prototype._invalidateRegion = function(e){
	if(this._baked) return;
	this.algorithm._invalidateRegion(this, e);
};

/**
 * Advance the path forward by a given amount.  This will chop off some nodes off the beginning of the nodes list.  You'd want to do this to more accurately represent what part of the path is needed, in case part of it gets invalidated later.
 * @param {Number|crow.BaseNode} index_or_node The number of nodes by which to advance, or the node to advance to in the path.  If the node given actually isn't in the path, then this path will only have one node in it -- the node given.
 */
crow.algorithm.Path.prototype.advanceTo = function(index_or_node){
	crow.assert(typeof(index_or_node) === "number" || index_or_node instanceof crow.BaseNode, crow.assert.InvalidArgumentType("number or crow.BaseNode"));
	if(typeof(index_or_node) === "number"){
		crow.assert(index_or_node >= 0 && index_or_node < this.nodes.length, crow.assert.IndexOutBounds(index_or_node));
		this.nodes = this.nodes.slice(index_or_node);
	} else {
		var x = index_or_node.x, y = index_or_node.y, i;
		var found = false;
		for(i = 0; i < this.nodes.length; i++){
			var n = this.nodes[i];
			if(n.x == x && n.y == y){
				found = true;
				break;
			}
		}
		if(found){
			this.advanceTo(i);
		} else {
			this.nodes = [index_or_node];
			this.found = false;
			this.end = null;
		}
	}
};

crow.algorithm.Path.prototype.moveGoal = function(newGoal){
	this.goal = newGoal;
	this.algorithm.previousGoal = this.algorithm.goal;
	this.algorithm.goal = newGoal;
	this.found = false;
};

crow.algorithm.Path.prototype.moveStart = function(newStart){
	this.start = newStart;
	this.algorithm.previousStart = this.algorithm.start;
	this.algorithm.start = newStart;
	this.found = false;
};

/**
 * Gets the next node in the path.
 * @returns {crow.BaseNode} the next node in the path
 */
crow.algorithm.Path.prototype.getNextNode = function(){
	return this.nodes[1];
};

/**
 * Continue calculating this path, either to the goal, or to a limited number of nodes.  The original algorithm will be reinvoked, using the end of the current path as a starting point, before appending the results of that search to this path.  If the goal is already found, does nothing and returns true.
 * @param {Number} [count] If count is omitted, calculate the rest of the path until the goal is reached.  If count is passed, pass it as a limit to the underlying algorithm.
 * @throws {Error} If the path is already baked.
 * @see http://github.com/nanodeath/CrowLib/wiki/Making-the-Most-of-Crow
 * @returns true if the goal was reached, false otherwise
 */
crow.algorithm.Path.prototype.continueCalculating = function(count){
	if(this._baked) throw new Error("Can't continue calculating a baked path.  Either pass {baked: false} to findGoal, or don't call .bake() on this path yet.");
	if(this.found) return true;
	return this.algorithm.continueCalculating(this, count);
}


/**
 * Bakes a path, which separates it from the graph that created it.  Unbaked paths still receive invalidations
 * from the graph, so when you're "done" with a path, you should always make sure it's baked!  Your path will be
 * pre-baked for you unless you call findGoal with baked:false or a limit (which requires that the path be unbaked).
 * If the path is already baked, nothing happens.
 * @see http://github.com/nanodeath/CrowLib/wiki/Making-the-Most-of-Crow
 */
crow.algorithm.Path.prototype.bake = function(){
	this._baked = true;
	if(this.graph){
		this.graph.validator.removeEventListener("invalidatePoint", this._invalidatePoint);
		this.graph.validator.removeEventListener("invalidateRegion", this._invalidateRegion);
		this.graph = null;
	}
	this.algorithm = null;
	this.actor = null;
};
