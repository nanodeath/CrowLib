goog.provide('crow.Graph');
goog.require('crow.util.Assert');
goog.require('crow.Algorithm');
goog.require('goog.events.EventTarget');

/**
 * @constructor
 */
crow.Graph = function(){
	// initialize
	this.nodes = [];
	this.map = {};
	this.version = "0";
	this.validator = new goog.events.EventTarget();
	this.width = 0;
	this.height = 0;
	
	// methods
	/**
	 * Add a node to this crow.Graph
	 * @param {crow.BaseNode} node Node to add to graph.
	 */
	this.addNode = function(node){
		node._initialize();
		
		if(node.getX && node.getY){
			var x = node.getX(), y = node.getY();
			if(x + 1 > this.width){
				this.width = x + 1;
			}
			if(y + 1 > this.height){
				this.height = y + 1;
			}
		}
		this.nodes.push(node);
		this.map[node.id] = node;
	};
	
	// Remove a node at given coordinates from crow.Graph
	// O(n) where n is number of total nodes
	/**
	 * Removes a node from the graph.
	 * @param {number} x x-coordinate (0-indexed)
	 * @param {number} y y-coordinate (0-indexed)
	 * @param {boolean} [alsoInvalidate=false] Whether to also invalidate the position of the removed node.
	 */
	this.removeNode = function(x, y, alsoInvalidate){
		if(typeof x === "number"){
			delete this.map["" + x + "_" + y];
			for(var i in this.nodes){
				var node = this.nodes[i];
				if(node.x == x && node.y == y){
					this.nodes.splice(i, 1);
					break;
				}
			}
			if(alsoInvalidate){
				this.invalidate(x, y);
			}
		} else {
			delete this.map[x.id];
		}
	};
	/**
	 * <p>Gets a node at a particular coordinate, or the first node that meets a condition
	 * <p>O(1) if a coordinate is given
	 * <p>O(n) if a filter is given (n being number of total nodes)
	 * @param {(number|function(this:crow.BaseNode): boolean)} x_or_filter x-coordinate
	 *  of element to retrieve, or a callback that eventually returns true for a node.
	 * @param {number=} y-coordinate y-coordinate of element to retrieve (if callback omitted)
	 * @returns {crow.BaseNode}
	 */
	this.getNode = function(x_or_filter, y, orBlankNode){
		var node;
		if(typeof x_or_filter === "function"){
			for(var i in this.nodes){
				var n = this.nodes[i];
				if(x_or_filter.call(n)){
					node = n;
					break;
				}
			}
		} else if(typeof x_or_filter === "string"){
			return this.map[x_or_filter];
		} else {
			if(typeof(x_or_filter) !== "number") throw new Error("x coordinate not provided");
			if(typeof(y) !== "number") throw new Error("y coordinate not provided");

			node = this.map["" + x_or_filter + "_" + y];
		}
		if(node){
			return node;
		} else if(orBlankNode && typeof x_or_filter === "number"){
			var node = new crow.BaseNode([x_or_filter, y]);
			node.isBlank = true;
			return node;
		} else {
			return undefined;
		}
	};
	/**
	 * Return a collection of nodes.  Has 3 modes:
	 * <ol><li>pass a filter function: O(n)</li>
	 * <li>pass an options object with a `start` node (optional), an `algorithm` (optional; search-type), and a `filter` (optional): running time varies by algorithm</li>
	 * <li>pass nothing, in which case all nodes will be returns: O(1)</li></ol>
	 * @param {(function(this:crow.BaseNode): boolean|{start:crow.BaseNode,algorithm_name:string,filter:function(this.crow.BaseNode)})=} filter or options
	 * @returns {crow.BaseNode[]}
	 */
	this.getNodes = function(filter_or_options){
		switch(typeof filter_or_options){
			case "function":
				return this.getNodes({
					filter: filter_or_options
				});
			case "object":
				var start = filter_or_options.start || this.nodes[0];
				var algo = crow.Graph._lookupAlgorithm(filter_or_options.algorithm || "linear");
				if(!(algo.prototype instanceof crow.algorithm.SearchAlgorithm)) throw new Error("only compatible with SearchAlgorithms")
				return (new algo(this)).search(start, {
					filter: filter_or_options.filter
				});
			case "undefined":
				return this.nodes;
			default:
				throw new Error("unsupported object " + filter_or_options.toString());
		}
	};
	
	/**
	 * Find the shortest path to a goal.
	 * @param opts Options hash describing what's wanted.
	 * @param {crow.BaseNode} [opts.start="firstNodeAdded"] Node from which to begin searching.
	 * @param {crow.BaseNode|function(this:crow.BaseNode): boolean} opts.goal Target node or condition at which to stop.  If a callback is passed, it will be passed each node that is discovered.  Return true from this callback to signify that the desired node was found.
	 * @param [opts.actor] The actor that will be traversing the path.  Will be passed to the nodes' distanceTo algorithm.
	 * @param [opts.baked=true] Whether the path will be returned pre-baked.  If baked, the path won't receive invalidations from the graph.  If not baked, the path will receive invalidations, but must have {@link crow.algorithm.Path#bake} called when the path can be discarded.
	 * @param {String} [opts.algorithm="automatic"] Alias of algorithm to use for the search.
	 * @returns {crow.algorithm.Path} Path representing this search
	 */
	this.findGoal = function(opts){
		return crow.Graph.findGoal(opts, this);
	};
	
	this.invalidate = function(x, y, dx, dy){
		if(dx == 0 || dy == 0) throw new Error("dx and dy can't be 0");
		if(dx && dy){
			this.validator.dispatchEvent({type: "invalidateRegion", x: x, y: y, dx: dx, dy: dy});
		} else {
			this.validator.dispatchEvent({type: "invalidatePoint", x: x, y: y});
		}
	};
};

/**
 * @see {@link crow.Graph#findGoal}.  This is the same method, but the static version that takes an optional graph param.
 * @param opts Options hash, see above.
 * @param {crow.Graph} [graph] Graph that this findGoal should be executed against.  Some implementations of {@link crow.Node} rely on a Graph being present here in order to calculate neighbors (in {@link crow.Node#getNeighbors}).
 */
crow.Graph.findGoal = function(opts, graph){
		crow.Algorithm.initializeDataStructures();
		var start = opts.start || (graph && graph.nodes[0]);
		if(!start) throw new Error("To go somewhere you must know where you start...perhaps you meant to provide a start node?");
		var goal = opts.goal;
		if(!goal) throw new Error("To find a something, one must know what they're looking for...perhaps you meant to provide a goal node?");
		var algo = crow.Graph._lookupAlgorithm(opts.algorithm) || crow.AlgorithmResolver.getAlgorithm();
		if(!(algo.prototype instanceof crow.algorithm.ShortestPathAlgorithm)) throw new Error("only compatible with ShortestPathAlgorithms");
		opts.graph = graph;
		return (new algo(graph)).findPath(start, goal, opts);
};
crow.Graph.algorithm = {};
crow.Graph.defaultAlgorithm = {};

// Extension for EffectGames to facilitate creation of crow.Graphs
crow.Graph.fromTilePlane = function(tplane, callback){
	if(!window.Effect || !window.Effect.Port) throw new Error("EffectGames-specific extensions don't work anywhere else");
	if(!tplane) throw new Error("tplane is required");
	if(typeof callback !== "function") throw new Error("callback not provided or not a function");

	var g = new crow.Graph();
	for(var i = 0, ilen = tplane.getMaxTileX(); i < ilen; i++){
		for(var j = 0, jlen = tplane.getMaxTileY(); j < jlen; j++){
			var tile = tplane.lookupTile(i, j),
				tileData = tplane.lookupTile(i, j, true);
			var node = callback(tile, tileData);
			if(node) g.addNode(node);
		}
	}
	return g;
};

/**
	* Generate a graph from an array and a callback.
	* Callback will be called once for each character in
	* each element of the array.  If the callback returns anything,
	* that object will be added to the graph.
	* 
  * See test.js for sample usage.
  * @param {String[]} array Array of strings encoding your nodes.
  * @param {function(number, number, string): ?Object} callback The callback that optionally returns a node.  The first parameter is an x-coordinate, the second parameter is a y-coordinate, and the last parameter is a one-character string from a value in the array.
  *
  * @return {crow.Graph} The primed Graph
  */
crow.Graph.fromArray = function(array, callback){
	crow.assert(array instanceof Array, crow.assert.InvalidArgumentType("Array"));
	var graph = new crow.Graph();
	var x, y = 0;
	for(var i = 0; i < array.length; i++){
	  x = 0;
		var row = array[i];
		for(var ch_idx = 0; ch_idx < row.length; ch_idx++){
			var ch = row.charAt(ch_idx);
			var node = callback(x, y, ch);
			if(node) graph.addNode(node);
			x++;
		}
		y++;
	}
	return graph;
};

crow.Graph.registerAlgorithm = function(algo){
	var alias = algo["alias"];
	if(!alias){
		throw new Error("No alias found for algorithm");
	}
	crow.Graph.algorithm[alias] = algo;
};
crow.Graph._lookupAlgorithm = function(alias_or_opts){
	// TODO switch back to switch statement
	var type = typeof alias_or_opts;
	if(type === "string"){
		var algo = crow.Graph.algorithm[alias_or_opts];
		if(algo) return algo;
		throw new Error("Algorithm `" + alias_or_opts + "` not found");
	} else if(type === "object" || type === "undefined"){
		var algo = crow.AlgorithmResolver.getAlgorithm(alias_or_opts);
		if(algo) return algo;
	}
	return null;
};

/**
 * @namespace Collection of utility functions that clients can use
 */
crow.GraphUtil = {
	/**
	 * @namespace Collection of distance utility functions
	 * in the form of function(dx, dy){ ... }
	 */
	distance: {
		/**
		 * The distance given by pythagorean theorem between two points.
		 * Useful on 4- and 8-connected graphs.
		 */
 		euclidean: function(dx, dy){
			return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
		},
		/**
		 * Calculates the manhattan distance, which is the sum of the absolute differences
		 * of their coordinates.  That is, if the two points were on cross-streets
		 * in a city, how many blocks would you have to walk to get from one to another.
		 * Useful for 4-connected graphs.
		 */
		manhattan: function(dx, dy){
			return Math.abs(dx) + Math.abs(dy);
		},
		/**
		 * The maximum of the absolute differences of their coordinates.  Similar in use to
		 * Manhattan distance, but appropriate for 8-connected graphs.
		 */
		chebyshev: function(dx, dy){
			return Math.max(Math.abs(dx), Math.abs(dy));
		},
		/**
		 * Sometimes, we want to assume the distance to another node is always 1.
		 */
		one: function(){ return 1; }
	}
};
/**
 * Alias for {@link crow.GraphUtil.distance.euclidean}
 */
crow.GraphUtil.distance.pythagoras = crow.GraphUtil.distance.euclidean;
/**
 * Short for Maximum metric, another name for the Chebyshev distance.
 * More readable alias for {@link crow.GraphUtil.distance.chebyshev}.
 */
crow.GraphUtil.distance.maximum = crow.GraphUtil.distance.chebyshev;
/**
 * @deprecated use {@link crow.GraphUtil.distance.chebyshev} or {@link crow.GraphUtil.distance.maximum}.
 */
crow.GraphUtil.distance.manhattan8 = crow.GraphUtil.distance.chebyshev;
