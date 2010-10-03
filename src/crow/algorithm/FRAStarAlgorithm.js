goog.provide('crow.algorithm.FRAStarAlgorithm');
goog.require('crow.algorithm.ShortestPathAlgorithm');
goog.require('crow.algorithm.BFSBasicAlgorithm');
goog.require('crow.algorithm.Path');
goog.require('crow.structs.BucketPriorityQueue');
goog.require('crow.Graph');

/**
 * A* algorithm, which is basically an "informed" Dijkstra's algorithm.
 * It oozes in the direction of your goal node.
 * @constructor
 * @private
 */
crow.algorithm.FRAStarAlgorithm = function(graph){
	this.klass = crow.algorithm.FRAStarAlgorithm;
	this.graph = graph;
}
crow.algorithm.FRAStarAlgorithm.prototype = new crow.algorithm.ShortestPathAlgorithm();

crow.algorithm.FRAStarAlgorithm.prototype._invalidatePoint = function(path, invalidationEvent){
	crow.Algorithm.prototype._invalidatePoint.apply(this, arguments);
	this.reset();
};

crow.algorithm.FRAStarAlgorithm.prototype.reset = function(){
	this.wrapperNode = new crow.Algorithm.NodeMap();
	
	this.start = this._getWrapperNode(this.start.innerNode);
	this.goal = this._getWrapperNode(this.goal.innerNode);
	
	this.iteration = 1;
	this.start.initialize();
	this.start.g = 0;

	this.evaluatedList = [];
	this.openSet = new crow.structs.BucketPriorityQueue();
	this.openSet.enqueue(0, this.start);
	
	this.state = 1;
};

/**
 * Initializes a cell -- this must happen to each cell we come across,
 * and once per iteration (i.e. each time we invoke the A* part)
 * @param {crow.algorithm.FRAStarAlgorithm.WrapperNode} node the node to initialize
 * @deprecated
 */

/**
 * Get the priority (as for a priority queue) of the provided node.
 * @param {crow.algorithm.FRAStarAlgorithm.WrapperNode} node the node to check
 * @returns a number representing the priority
 */
crow.algorithm.FRAStarAlgorithm.prototype.ComputePriority = function(node){
	return node.g + node.innerNode.distanceToGoal(this.goal.innerNode);
};

/**
 * Whether this node is in the closed list.  We don't actually keep a list
 * data structure, but rather test each node when we come across it for the closed
 * conditions.
 * @param {crow.algorithm.FRAStarAlgorithm.WrapperNode} node the node to test
 * @returns a boolean, indicating true if in the closed list
 */
crow.algorithm.FRAStarAlgorithm.prototype.TestClosedList = function(node){
	return node == this.start || !!(node.expanded && node.parent);
}

/**
 * This is the "main loop" so to speak -- basically the same as A* here.
 * It discovers all the nodes that need to be expanded, expands them, and expands
 * their neighbors with the appropriate priority.
 */
crow.algorithm.FRAStarAlgorithm.prototype.ComputeShortestPath = function(){
	while(node = this.openSet.dequeue()){
		if(node.expanded) continue; // Nonstandard: if we enqueue the same element twice we may have already expanded it
		// this is so we don't have to remove duplicates (if present) when we add them below
		node.expanded = true;
		var neighbors = node.innerNode.getNeighbors(this.graph, this.neighbors);
		for(var n = 0; n < neighbors.length; n++){
			var neighbor = this._getWrapperNode(neighbors[n]);
			if(!this.TestClosedList(neighbor)){
				neighbor.initialize();
				var newG = node.g + node.innerNode.distanceToNeighbor(neighbor.innerNode);
				if(newG < neighbor.g){
					neighbor.g = newG;
					neighbor.parent = node;
					this.openSet.enqueue(this.ComputePriority(neighbor), neighbor);
				}
			}
		}
		if(node == this.goal) return true;
	}
	return false;
};

/**
 * Checks whether the this.cell should be the parent of any of its neighbors, then call again on the neighbor.
 * @private
 * @param {Boolean} clockwise whether to rotate clockwise from the current parent or not
 * @returns true if a neighbor's parent property was modified (and we should call this method again)
 */
crow.algorithm.FRAStarAlgorithm.prototype.UpdateParent = function(clockwise){
	var node = this.cell;
	var neighbors = node.innerNode.getNeighbors(this.graph, this.diagonals);
	// neighbors are by default clockwise -- if we want them counter-clockwise, we must reverse the array
	if(!clockwise) neighbors = neighbors.reverse();
	var parent = node.parent;
	var index = -1;
	// Find the index of the parent
	for(var i = 0; i < neighbors.length; i++){
		if(neighbors[i] == parent){
			index = i;
			break;
		}
	}
	if(index >= 0){
		// Traverse the neighbors starting at the parent
		for(var i = 0; i < neighbors.length; i++){
			var j = (i + index) % neighbors.length;
			var neighbor = this._getWrapperNode(neighbors[j]);
			if(neighbor.g == node.g + node.innerNode.distanceToNeighbor(neighbor.innerNode) && this.TestClosedList(neighbor)){
				neighbor.parent = node;
				this.cell = neighbor;
				return true; // returning true will cause this function to execute again in Step2
			}
		}
	}
	return false; // returning false means this is the last time this function should execute
}

/**
 * This is the (optional) Changing Parents step.  The new start cell needs to be
 * on the former shortest path between the old start cell and the goal in order
 * for the calculated distances to be relevant.  In the event that it's not, this
 * step will update it and any connected cells that need to be updated.
 * @private
 */
crow.algorithm.FRAStarAlgorithm.prototype.Step2 = function(){
	// TODO this isn't very Javascript-y: it was just copied from the paper
	this.cell = this.start;
	while(this.UpdateParent(false)){}
	this.cell = this.start;
	while(this.UpdateParent(true)){}
};

crow.algorithm.FRAStarAlgorithm.prototype.Step3 = function(){
	this.start.parent = null;
	var newStart = this.start, oldStart = this.previousStart;
	// find all elements rooted at the previous start that
	// don't contain the new start in their shortest path
	var bfs = new crow.algorithm.BFSBasicAlgorithm(this.graph);
	var getWrapper = this._getWrapperNode;
	var algo = this;
	var nodes = bfs.search(this.previousStart.innerNode, {
		filter: function(node){
			var a = getWrapper.call(algo, node).ancestors();
			return a.indexOf(oldStart) >= 0 && a.indexOf(newStart) < 0;
		}
	});
	for(var i = 0; i < nodes.length; i++){
		var node = this._getWrapperNode(nodes[i]);
		node.parent = null;
		this.openSet.remove(node);
	}
};

crow.algorithm.FRAStarAlgorithm.prototype.FindPerimeter = function(startNode, includingNode){
	var perimeter = [includingNode];
	var neighbors = startNode.innerNode.getNeighbors(this.graph, this.diagonals, true);
	var i;
	for(i = 0; i < neighbors.length; i++){
		var neighbor = neighbors[i];
		if(neighbor == includingNode.innerNode){
			break;
		}
	}
	var node = startNode;
	for(var j = 0; j < neighbors.length; j++){
		var k = (i + j) % neighbors.length;
		var neighbor = neighbors[k];
		if(neighbor){
			neighbor = this._getWrapperNode(neighbor);
			if(!this.TestClosedList(neighbor)){
				if(perimeter[perimeter.length-1] != neighbor){
					perimeter.push(neighbor);
				}
			} else if(neighbor == startNode){
				break;
			} else {
				node = neighbor;
				neighbors = node.innerNode.getNeighbors(this.graph, this.diagonals, true);
				i = k + 3;
				j = -1;
			}
		}
	}
	
	return perimeter;
};

crow.algorithm.FRAStarAlgorithm.prototype.Step5 = function(){
	var perimeter = this.FindPerimeter(this.start, this.anchor);
	for(var i = 0; i < perimeter.length; i++){
		var pNode = perimeter[i];
		this.openSet.enqueue(this.ComputePriority(pNode), pNode);
	}
	var initCell = this.InitializeCell;
	var algo = this;
	this.openSet.each(function(node){
		node.initialize();
	});
	var newNodes = [];
	this.openSet.each(function(node){
		var neighbors = node.innerNode.getNeighbors(algo.graph, algo.diagonals);
		for(var i = 0; i < neighbors.length; i++){
			var neighbor = algo._getWrapperNode(neighbors[i]);
			var newG = neighbor.g + neighbor.innerNode.distanceToNeighbor(node.innerNode);
			if(algo.TestClosedList(neighbor) && node.g > newG){
				node.g = newG;
				node.parent = neighbor;
				newNodes.push(node);
			}
		}
	});
	for(var i = 0; i < newNodes.length; i++){
		var node = newNodes[i];
		this.openSet.enqueue(this.ComputePriority(node), node);
	}
};

/**
 * Finds the best path from start node to goal node.
 * @param {crow.BaseNode} start The node from which to begin the search.
 * @param {crow.BaseNode} goal The node that we're looking for.
 * @param {Object} [opts] Additional options
 * @param {Number} [opts.limit] Maximum number of nodes to check in this pass.
 *   Note that there won't necessarily be this many nodes returned in the (partial) path.
 *   To continue checking from where the path left off, see {@link crow.algorithm.Path#continueCalculating}.
 */
crow.algorithm.FRAStarAlgorithm.prototype.findPath = function(start, goal, opts){
	if(!opts) opts = {};
	crow.algorithm.ShortestPathAlgorithm.prototype.findPath.apply(this, arguments);

	//this.initialize(start, goal, opts);
	start = this._getWrapperNode(start);
	goal = this._getWrapperNode(goal);
	this.start = start;
	this.goal = goal;
	this.opts = opts;
	
	this.reset();
	
	var path = this.resolveResults(this.opts, false);
	this.continueCalculating(path);
	return path;
};

crow.algorithm.FRAStarAlgorithm.prototype.resolveResults = function(opts, found){
	if(!opts) opts = {};
	var pathOpts;
	if(found){
		var nodes = this.goal.ancestors(true).concat(this.goal.innerNode);
		pathOpts = {
			nodes: nodes,
			start: this.start.innerNode,
			goal: this.goal.innerNode,
			found: true,
			length: this.goal.g,
			algorithm: this,
			graph: opts.graph,
			baked: opts.baked || (typeof opts.baked === "undefined"),
			actor: opts.actor
		};
	} else {
		pathOpts = {
			nodes: [],
			start: this.start.innerNode,
			goal: this.goal.innerNode,
			found: false,
			length: Infinity,
			algorithm: this,
			graph: opts.graph,
			baked: opts.baked || (typeof opts.baked === "undefined"),
			actor: opts.actor
		};
	}
	return new crow.algorithm.Path(pathOpts);
};

crow.algorithm.FRAStarAlgorithm.prototype.updateStart = function(path){
	var foundStart = false;
	for(var i = 0; i < path.nodes.length; i++){
		if(path.nodes[i] == this.start.innerNode){
			// if the index of start is 3, for example, this will remove the first 3
			// elements from the path.nodes
			path.nodes.splice(0, i);
			foundStart = true;
			break;
		}
	}
	if(foundStart){
		var length = 0;
		for(var i = 0; i < path.nodes.length - 1; i++){
			length += path.nodes[i].distanceToNeighbor(path.nodes[i+1]);
		}
		path.length = length;
	} else {
		throw new Error("Present (start) position not found on path!  FRA* only works if this agent follows the path towards the target.");
	}
};

crow.algorithm.FRAStarAlgorithm.prototype.continueCalculating = function(path){
	this.start = this._getWrapperNode(this.start);
	this.goal = this._getWrapperNode(this.goal);
	if(this.previousStart) this.previousStart = this._getWrapperNode(this.previousStart);
	if(this.previousGoal) this.previousGoal = this._getWrapperNode(this.previousGoal);
	
	while(true){
		switch(this.state){
			case 1:
				if(this.start == this.goal){
					this.state = true;
				} else {
					var found = this.ComputeShortestPath();
					var newPath = this.resolveResults(null, found);
					path.found = found;
					path.nodes = newPath.nodes;
					path.length = this.goal.g;
					if(found){
						this.openListIncomplete = false;
						this.state = 3;
					} else {
						this.state = false;
					}
				}
				break;
			case 3:
				if(this.TestClosedList(this.goal)){
					this.state = 4;
				} else {
					this.state = 5;
				}
				break;
			case 4: /* main loop */
				var onPath = false;
				if(/* target not caught */ this.start != this.goal){
					for(var i = 0; i < path.nodes.length; i++){
						// target on path?
						var node = path.nodes[i];
						if(node == this.goal.innerNode){
							this.updateStart(path);
							return true;
						}
					}
				}
				if(this.start == this.goal){
					this.state = true;
				} else {
					// update previous start, start, and goal
					/*if(this.newStart){
						this.previousStart = this.start;
						this.start = this._getWrapperNode(this.newStart);
						this.newStart = null;
					} else {
						this.previousStart = this.start;
					}*/
					if(this.newTarget){
						this.previousGoal = this.goal; /* is this used? */
						this.goal = this._getWrapperNode(this.newTarget);
						this.newTarget = null;
					}
					if(!this.previousStart) this.previousStart = this.start;
					if(this.start != this.previousStart){
						//this.previousStart = this.start;
						this.Step2();
						this.anchor = this.start.parent;
						this.Step3();
						this.openListIncomplete = true;
					}
					this.state = 3;
				}
				break;
			case 5:
				if(this.openListIncomplete){
					this.iteration++;
					this.Step5();
				}
				this.state = 1;
				break;
			case true:
				path.found = true;
				path.nodes = [path.goal];
				path.length = 0;
				return true;
			case false:
				path.found = false;
				path.nodes = [];
				path.length = Infinity;
				return false;
		}
	}
};

crow.algorithm.FRAStarAlgorithm.prototype.moveStart = function(path, newStart){
	// FIXME see moveTarget
	this.previousStart = this.start;
	this.start = newStart;
	//if(!this.previousStart){
	//	this.previousStart = this.start;
	//}
	//this.start = this._getWrapperNode(newStart);
}

crow.algorithm.FRAStarAlgorithm.prototype.moveTarget = function(path, newTarget){
	// FIXME previous goal should really only be set once per iteration
	// through the state labeled `main loop`.
	// As such, calling moveTarget twice before calling continueCalculating
	// is somewhat undefined at this point.
	this.previousGoal = this.goal;
	this.goal = newTarget;
	//this.newTarget = newTarget;
};

/**
 * @constructor
 * @private
 */
crow.algorithm.FRAStarAlgorithm.WrapperNode = function(node){
	this.innerNode = node;
	this.generatedIteration = 0;
	this.expanded = false;
	this.g = null;
	this.parent = null;
};

crow.algorithm.FRAStarAlgorithm.prototype._getWrapperNode = crow.Algorithm.wrapperNodeGetterTemplate(crow.algorithm.FRAStarAlgorithm.WrapperNode);

crow.algorithm.FRAStarAlgorithm.WrapperNode.prototype.initialize = function(){
	var algoIteration = this.algorithm.iteration;
	if(this.generatedIteration != algoIteration){
		this.g = Infinity;
		this.generatedIteration = algoIteration;
		this.expanded = false;
	}
};

crow.algorithm.FRAStarAlgorithm.WrapperNode.prototype.ancestors = function(useRawNodes){
	var ancestors = [];
	var p = this.parent;
	while(p){
		ancestors.unshift(useRawNodes ? p.innerNode : p);
		p = p.parent;
	}
	return ancestors;
};

// Attributes for AlgorithmResolver //
crow.algorithm.FRAStarAlgorithm.attributes = {
	min_speed: 2,
	// Works with:
	moving_start: true,
	moving_goal: true,
	unstable_graph: false,
	heuristics_allowed: true,
	goal_is_node: true,
	goal_is_callback: false
};
// end //

crow.algorithm.FRAStarAlgorithm["alias"] = "fra*";
crow.Graph.registerAlgorithm(crow.algorithm.FRAStarAlgorithm);
