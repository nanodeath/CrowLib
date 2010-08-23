goog.provide('crow.algorithm.AStarAlgorithm');
goog.require('crow.algorithm.ShortestPathAlgorithm');

/**
 * @constructor
 */
crow.algorithm.AStarAlgorithm = function(graph){
	this.graph = graph;
}
crow.algorithm.AStarAlgorithm.prototype = new crow.algorithm.ShortestPathAlgorithm();
crow.algorithm.AStarAlgorithm.prototype.findPath = function(start, goal, opts){
	if(typeof goal === "function"){
		throw new Error("A* doesn't support using a callback to determine the goal");
	}
	if(!opts) opts = {};
	
	this.start = start;
	this.goal = goal;
	this.opts = opts;

	this.evaluated = new crow.Algorithm.NodeMap(false);
	this.toEvaluate = new crow.Algorithm.PriorityQueue();
	this.toEvaluate.enqueue(0, start);
	this.parent = new crow.Algorithm.NodeMap();
	
	// gScore is distance of a node n from the starting point
	this.gScore = new crow.Algorithm.NodeMap();
	// hScore is the estimated distance between a node n and the goal
	this.hScore = new crow.Algorithm.NodeMap();
	
	var estimateDistance = this.estimateDistance;
	
	this.gScore.set(start, 0);
	this.hScore.set(start, estimateDistance(start, goal, this.graph));
	var found = false, currentNode;
	while(currentNode = this.toEvaluate.dequeue()){
		if(currentNode === goal){
			found = true;
			break;
		} else if(this.evaluated.get(currentNode)){
			// normally this wouldn't be necessary, but if we check the same neighbor twice,
			// it may get added to the toEvaluate list twice
			continue;
		}
		this.evaluated.set(currentNode, true);
		var neighbors = currentNode.getNeighbors(this.graph);
		for(var n in neighbors){
			var neighbor = neighbors[n];
			if(this.evaluated.get(neighbor)) continue;
			var newGScore = this.gScore.get(currentNode) + currentNode.distanceTo(neighbor);
			
			if(!this.toEvaluate.containsValue(neighbor) || newGScore < this.gScore.get(neighbor)){
				this.parent.set(neighbor, currentNode);
				this.gScore.set(neighbor, newGScore);
				var hScore = estimateDistance(neighbor, goal);
				this.hScore.set(neighbor, hScore);
				var fScore = newGScore + hScore;
				this.toEvaluate.enqueue(fScore, neighbor);
			}
		}
	}
	if(found){
		var path = [];
		if(goal){
			path.unshift(goal);
			var node = this.parent.get(goal);
			while(node){
				path.unshift(node);
				node = this.parent.get(node);
			}
		}

		return {
			nodes: path,
			start: start,
			goal: goal,
			end: goal,
			length: this.gScore.get(goal),
			found: true,
			recalculate: this.recalculate,
			algorithm: this
		};			
	} else {
		return {
			nodes: [],
			start: start,
			goal: goal,
			end: null,
			length: Infinity,
			found: false,
			recalculate: this.recalculate,
			algorithm: this
		};			
	}
};
crow.algorithm.AStarAlgorithm.prototype.estimateDistance = function(start, goal, graph){
	return crow.GraphUtil.distance.manhattan(start.getX() - goal.getX(), start.getY() - goal.getY());
};
crow.algorithm.AStarAlgorithm.prototype.recalculate = function(){
	var a = this.algorithm;
	return a.findPath(a.start, a.goal, a.opts);
};

crow.Graph.registerAlgorithm(crow.algorithm.AStarAlgorithm, 'a*');
