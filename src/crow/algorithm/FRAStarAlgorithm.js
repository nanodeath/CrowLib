goog.provide('crow.algorithm.FRAStarAlgorithm');
goog.require('crow.algorithm.ShortestPathAlgorithm');
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
	this.graph = graph;
}
crow.algorithm.FRAStarAlgorithm.prototype = new crow.algorithm.ShortestPathAlgorithm();

crow.algorithm.FRAStarAlgorithm.prototype.InitializeCell = function(node){
	if(node.generatedIteration != this.iteration){
		node.g = Infinity;
		node.generatedIteration = this.iteration;
		node.expanded = false;
	}
};

crow.algorithm.FRAStarAlgorithm.prototype.ComputePriority = function(node){
	return node.g + node.innerNode.distanceTo(this.goal.innerNode);
};

crow.algorithm.FRAStarAlgorithm.prototype.TestClosedList = function(node){
	return node == this.start || (node.expanded && node.parent);
}

crow.algorithm.FRAStarAlgorithm.prototype.ComputeShortestPath = function(){
	while(node = this.openSet.dequeue()){
		if(node.expanded) continue; // if we enqueue the same element twice we may have already expanded it
		node.expanded = true;
		var neighbors = node.innerNode.getNeighbors(this.graph, this.neighbors);
		for(var n in neighbors){
			var neighbor = this._getWrapperNode(neighbors[n]);
			if(!this.TestClosedList(neighbor)){
				this.InitializeCell(neighbor);
				var newG = node.g + node.innerNode.distanceTo(neighbor.innerNode);
				if(neighbor.g > newG){
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

crow.algorithm.FRAStarAlgorithm.prototype.UpdateParent = function(clockwise){
	var node = this.cell;
	var neighbors = node.getNeighbors(this.graph, this.diagonals);
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
			if(neighbor.g == node.g + node.innerNode.distanceTo(neighbor.innerNode) && this.TestClosedList(neighbor)){
				neighbor.parent = node;
				this.cell = neighbor;
				return true;
			}
		}
	}
	return false;
}

crow.algorithm.FRAStarAlgorithm.prototype.Step2 = function(){
	// TODO this isn't very Javascript-y: it was just copied from the paper
	this.cell = this.start;
	while(this.UpdateParent(false));
	this.cell = this.start;
	while(this.UpdateParent(true));
};

crow.algorithm.FRAStarAlgorithm.prototype.Step3 = function(){
	this.start.parent = null;
	var newStart = this.start, oldStart = this.previousStart;
	// find all elements rooted at the previous start that
	// don't contain the new start in their shortest path
	var bfs = new crow.algorithm.BFSAlgorithm(this.graph);
	var nodes = bfs.search(this.previousStart.innerNode, {
		filter: function(node){
			var a = this._getWrapperNode(node).ancestors();
			return a.indexOf(oldStart) >= 0 && a.indexOf(newStart) < 0;
		}
	});
	for(var i in nodes){
		var node = this._getWrapperNode(nodes[i]);
		node.parent = null;
		this.openSet.remove(node);
	}
};

crow.algorithm.FRAStarAlgorithm.prototype.FindPerimeter = function(startNode, includingNode){
	var perimeter = [includingNode];
	var neighbors = startNode.innerNode.getNeighbors(this.graph, this.diagonals);
	var i;
	for(i = 0; i < neighbors.length; i++){
		var neighbor = neighbors[i];
		if(neighbor == includingNode.innerNode){
			break;
		}
	}
	var node = startNode;
	i++;
	for(var j = 0; j < neighbors.length; j++){
		var k = (i + j) % neighbors.length;
		var neighbor = neighbors[k];
		if(neighbor){
			if(!this.TestClosedList(neighbor)){
				if(perimeter[perimeter.length-1] != neighbor){
					perimeter.push(neighbor);
				}
			} else if(neighbor != startNode) {
				neighbors = neighbor.getNeighbors(this.graph, this.diagonals);
				i = k + 3;
			}
		}
	}
	
	return perimeter;
};

crow.algorithm.FRAStarAlgorithm.prototype.Step5 = function(){
	var perimeter = this.FindPerimeter(this.start, this.anchor);
	for(var i in perimeter){
		var pNode = perimeter[i];
		this.openSet.enqueue(this.ComputePriority(pNode), pNode);
	}
	var initCell = this.InitializeCell;
	var algo = this;
	this.openSet.each(function(node){
		initCell.call(algo, node);
	});
	var newNodes = [];
	this.openSet.each(function(node){
		var neighbors = node.innerNode.getNeighbors(this.graph, this.diagonals);
		for(var i = 0; i < neighbors.length; i++){
			var neighbor = neighbors[i];
			var newG = neighbor.g + neighbor.distanceTo(node);
			if(this.TestClosedList(neighbor) && node.g > newG){
				node.g = newG;
				node.parent = neighbor;
				newNodes.push(node);
			}
		}
	});
	for(var i in newNodes){
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
	if(typeof goal === "function"){
		throw new Error("A* doesn't support using a callback to determine the goal");
	}
	this._wrapperNode = new crow.Algorithm.NodeMap();
	if(!opts) opts = {};

	var actor = opts.actor;	
	start = this._getWrapperNode(start);
	goal = this._getWrapperNode(goal);
	this.start = start;
	this.goal = goal;
	this.opts = opts;
	
	this.iteration = 1;
	this.InitializeCell(start);
	start.g = 0;

	this.evaluatedList = [];
	this.openSet = new crow.structs.BucketPriorityQueue();
	this.openSet.enqueue(0, start);
	
	var found = this.ComputeShortestPath();
	var pathOpts;
	if(found){
		this.openListIncomplete = false;
		var nodes = this.goal.ancestors(true).concat(this.goal.innerNode);
		pathOpts = {
			nodes: nodes,
			start: start.innerNode,
			goal: goal.innerNode,
			found: true,
			length: goal.g,
			algorithm: this,
			graph: opts.graph,
			baked: opts.baked || (typeof opts.baked === "undefined"),
			actor: actor
		};
	} else {
		pathOpts = {
			nodes: [],
			start: start.innerNode,
			goal: goal.innerNode,
			found: false,
			length: Infinity,
			algorithm: this,
			graph: opts.graph,
			baked: opts.baked || (typeof opts.baked === "undefined"),
			actor: actor
		};
	}
	return new crow.algorithm.Path(pathOpts);
};

crow.algorithm.FRAStarAlgorithm.prototype.continueCalculating = function(path){
	if(path.start == path.goal) return;
	if(this.TestClosedList(this.goal)){
		if(path.goal != this.goal){	// Target has changed
			var newGoalOnPath = false;
			for(var i in path.nodes){ // but is it still on the path?
				var node = path.nodes[i];
				if(node == path.goal){
					newGoalOnPath = true;
					break;
				}
			}
			if(this.start == this.goal){
				return;
			}
			this.previousStart = this.start;
			this.start = path.start;
			this.goal = path.goal;
			if(this.start != this.previousStart){
				this.Step2();
				this.anchor = this.start.parent;
				this.Step3();
				this.openListIncomplete = true;
			}
		}
	}
	if(!this.TestCLosedList(this.goal)){
		if(this.openListIncomplete){
			this.iteration++;
			this.Step5();
		}
	}
	return;
};

crow.algorithm.FRAStarAlgorithm.prototype._getWrapperNode = function(node){
	var w = this._wrapperNode.get(node);
	if(w) return w;
	w = new crow.algorithm.FRAStarAlgorithm.WrapperNode(node);
	this._wrapperNode.set(node, w);
	return w;
};
/**
 * @constructor
 * @private
 */
crow.algorithm.FRAStarAlgorithm.WrapperNode = function(node){
	this.innerNode = node;
	this.generatedIteration = 0;
	this.expanded = false;
	this.g;
	this.parent = null;
};

crow.algorithm.FRAStarAlgorithm.WrapperNode.prototype.ancestors = function(innerNode){
	var ancestors = [];
	var p = this.parent;
	while(p){
		ancestors.unshift(innerNode ? p.innerNode : p);
		p = p.parent;
	}
	return ancestors;
};

// Attributes for AlgorithmResolver //
crow.algorithm.FRAStarAlgorithm.attributes = {
	min_speed: 2,
	// Works with:
	moving_start: false,
	moving_goal: false,
	unstable_graph: false,
	heuristics_allowed: true,
	goal_is_node: true,
	goal_is_callback: false
};
// end //

crow.algorithm.FRAStarAlgorithm.alias = "fra*";
crow.Graph.registerAlgorithm(crow.algorithm.FRAStarAlgorithm);
