goog.provide('crow.algorithm.AStarAlgorithm');
goog.require('crow.algorithm.ShortestPathAlgorithm');
goog.require('crow.algorithm.Path');
goog.require('crow.Graph');

/**
 * A* algorithm, which is basically an "informed" Dijkstra's algorithm.
 * It oozes in the direction of your goal node.
 * @constructor
 * @private
 */
crow.algorithm.AStarAlgorithm = function(graph){
	this.graph = graph;
}
crow.algorithm.AStarAlgorithm.prototype = new crow.algorithm.ShortestPathAlgorithm();

crow.algorithm.FRAStarAlgorithm.prototype.InitializeCell = function(node){
	if(node.generatedIteration != this.iteration){
		node.g = Infinity;
		node.generatedIteration = this.iteration;
		node.expanded = false;
	}
};

crow.algortihm.FRAStarAlgorithm.prototype.ComputePriority = function(node){
	return node.g + node.distanceTo(this.goal);
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
				var newG = node.g + node.distanceTo(neighbor);
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

crow.algorithm.FRAStarAlgorithm.prototype.Step2 = function(){
	// TODO Optional, not yet implemented
};

crow.algorithm.FRAStarAlgorithm.prototype.Step3 = function(){
	this.start.parent = null;
	
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
crow.algorithm.AStarAlgorithm.prototype.findPath = function(start, goal, opts){
	if(typeof goal === "function"){
		throw new Error("A* doesn't support using a callback to determine the goal");
	}
	this._wrapperNode = new crow.Algorithm.NodeMap();
	if(!opts) opts = {};

	var actor = opts.actor;	
	start = this._getWrapperNode(start);
	this.start = start;
	this.goal = goal;
	this.opts = opts;
	
	this.iteration = 1;
	this.InitializeCell(start);
	start.g = 0;

	this.evaluatedList = [];
	this.openSet = new crow.Algorithm.PriorityQueue();
	this.openSet.enqueue(0, start);
	
	// gScore is distance of a node n from the starting point
	// hScore is the estimated distance between a node n and the goal
	// fScore is the total estimated distance of route through a node
	
	//var estimateDistance = this.estimateDistance;
	

	//start.gScore = 0;
	//start.hScore = start.innerNode.distanceTo(goal, actor);
	

	var found = this.ComputeShortestPath();
	if(!found) return false; // FIXME
	this.openListIncomplete = false;
	return foo; // FIXME
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

crow.algorithm.AStarAlgorithm.prototype._getWrapperNode = function(node){
	var w = this._wrapperNode.get(node);
	if(w) return w;
	w = new crow.algorithm.AStarAlgorithm.WrapperNode(node);
	this._wrapperNode.set(node, w);
	return w;
};
/**
 * @constructor
 * @private
 */
crow.algorithm.AStarAlgorithm.WrapperNode = function(node){
	this.innerNode = node;
	this.generatedIteration = 0;
	this.expanded = false;
	this.g;
};

// Attributes for AlgorithmResolver //
crow.algorithm.AStarAlgorithm.attributes = {
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

crow.algorithm.AStarAlgorithm.alias = "a*";
crow.Graph.registerAlgorithm(crow.algorithm.AStarAlgorithm);
