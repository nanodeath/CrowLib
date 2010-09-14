goog.provide('crow.AlgorithmResolver');


/**
 * @class 
 *  Algorithms have certain properties associated with them:
 *  <ul>
 *    <li>speed (slider)</li>
 *    <li>moving start (boolean)</li>
 *    <li>moving goal (boolean)</li>
 *    <li>shifting graph (boolean)</li>
 *    <li>heuristics allowed (boolean)</li>
 *    <li>goal is callback (boolean)</li>
 *  </ul>
 *  Slider-type attributes can have the following values associated with them for an algorithm:
 *  <ul>
 *    <li>-Infinity: Algorithm cannot complete this task</li>
 *    <li>-2: Algorithm is strongly unsuited for this task</li>
 *    <li>-1: Algorithm is unsuited for this task</li>
 *    <li> 0: Algorithm can perform this task</li>
 *    <li> 1: Algorithm is suited to performing this task</li>
 *    <li> 2: Algorithm is well-suited to performing this task</li>
 *  </ul>
 *  Boolean-type attributes can be either true or false for an algorithm.
 */
 
crow.AlgorithmResolver = function(graph){
	this.graph = graph;
};

crow.AlgorithmResolver.prototype.getAlgorithm = function(opts){
	return this.getAlgorithms(opts).dequeue();
};
crow.AlgorithmResolver.prototype.getAlgorithms = function(opts){
	if(!opts) opts = {};
	
	// set default opts
	if(typeof opts.heuristics_allowed === "undefined") opts.heuristics_allowed = true;
	
	var algos = crow.Graph.algorithm;
	var queue = new crow.structs.BucketPriorityQueue(crow.structs.BucketPriorityQueue.REVERSE_KEY_COMPARATOR);
	for(var i in algos){
		var algo = algos[i];
		var attributes = algo.attributes;
		if(attributes){
			var score = 0;
			
			if(typeof opts.min_speed !== "undefined" && opts.min_speed > attributes.min_speed){
				score -= Infinity;
			} else {
				score += attributes.min_speed;
			}
		
			if(
					(opts.moving_start && !attributes.moving_start) ||
					(opts.moving_goal && !attributes.moving_goal) ||
					(opts.unstable_graph && !attributes.unstable_graph) ||
					(!opts.heuristics_allowed && attributes.heuristics_allowed) || // if heuristics are not allowed but algorithm uses heuristics
					(opts.goal_is_node && !attributes.goal_is_node) ||
					(opts.goal_is_callback && !attributes.goal_is_callback)
				){
				score -= Infinity;
			}
			
			if(score > -Infinity){
				queue.enqueue(score, algo);
			}
		}
	}
	return queue;
};
