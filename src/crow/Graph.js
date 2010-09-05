goog.provide('crow.Graph');
goog.require('crow.Algorithm');
goog.require('crow.algorithm.LinearAlgorithm');
goog.require('crow.algorithm.DijkstraAlgorithm');
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
	
	// methods
	/**
	 * Add a node to this crow.Graph
	 * @param {crow.BaseNode} node Node to add to graph.
	 */
	this.addNode = function(node){
		node._initialize();
		
		var x = node.getX(), y = node.getY();
		this.nodes.push(node);
		if(!this.map[x]) this.map[x] = {};
		this.map[x][y] = node;
	};
	
	// Remove a node at given coordinates from crow.Graph
	// O(n) where n is number of total nodes
	/**
	 * Removes a node from the graph.
	 * @param {number} x x-coordinate (0-indexed)
	 * @param {number} y y-coordinate (0-indexed)
	 */
	this.removeNode = function(x, y){
		if(this.map[x] && this.map[x][y]){
			delete this.map[x][y];
			if(this.map[x].length == 0) delete this.map[x];
		}
		for(var i in this.nodes){
			var node = this.nodes[i];
			if(node.x == x && node.y == y){
				this.nodes.splice(i, 1);
				break;
			}
		}
	};
	/**
	 * Gets a node at a particular coordinate, or the first node that meets a condition
	 * 
	 * O(1) if a coordinate is given
	 * 
	 * O(n) if a filter is given (n being number of total nodes)
	 * @param {(number|function(this:crow.BaseNode): boolean)} x_or_filter x-coordinate
	 *  of element to remove, or a callback that eventually returns true for a node.
	 * @param {number=} y-coordinate y-coordinate of element to remove (if callback omitted)
	 */
	this.getNode = function(x_or_filter, y){
		if(typeof x_or_filter === "function"){
			for(var i in this.nodes){
				var n = this.nodes[i];
				if(x_or_filter.call(n)) return n;
			}
		} else {
			if(typeof(x_or_filter) !== "number") throw new Error("x coordinate not provided");
			if(typeof(y) !== "number") throw new Error("y coordinate not provided");

			var x_map = this.map[x_or_filter];
			if(x_map){
				return x_map[y];
			}
		}
		return undefined;
	};
	/**
	 * Return a collection of nodes.  Has 3 modes:
	 * <ol><li>pass a filter function: O(n)</li>
	 * <li>pass an options object with a `start` node (optional), an `algorithm` (optional; search-type), and a `filter` (optional): running time varies by algorithm</li>
	 * <li>pass nothing, in which case all nodes will be returns: O(1)</li></ol>
	 * @param {(function(this:crow.BaseNode): boolean|{start:crow.BaseNode,algorithm_name:string,filter:function(this.crow.BaseNode)})=} filter or options
	 * @returns {Array.<crow.BaseNode>}
	 */
	this.getNodes = function(filter_or_options){
		switch(typeof filter_or_options){
			case "function":
				return this.getNodes({
					filter: filter_or_options
				});
			case "object":
				var start = filter_or_options.start || this.nodes[0];
				var algo = crow.Graph._lookupAlgorithm(filter_or_options.algorithm) || crow.Graph.defaultAlgorithm.search;
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
	
	// Find the shortest path to a goal.  Pass in an options object with:
	//  `start`: start node (optional)
	//  `goal`: end node or end condition (callback is passed each node discovered: return true if match, false otherwise) (required)
	//  `algo`: shortestPath-type algorithm to use (optional)
	//  Running time varies by algorithm
	this.findGoal = function(opts){
		crow.Algorithm.initializeDataStructures();
		var start = opts.start || this.nodes[0];
		var goal = opts.goal;
		if(!goal) throw new Error("To find a goal, one must provide a goal...");
		var algo = crow.Graph._lookupAlgorithm(opts.algorithm) || crow.Graph.defaultAlgorithm.shortestPath;
		if(!(algo.prototype instanceof crow.algorithm.ShortestPathAlgorithm)) throw new Error("only compatible with ShortestPathAlgorithms");
		opts.graph = this;
		return (new algo(this)).findPath(start, goal, opts);
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
  * @param {Array.<string>} array Array of strings encoding your nodes.
  * @param {function(number, number, string): ?Object} callback The callback that optionally returns a node.  The first parameter is an x-coordinate, the second parameter is a y-coordinate, and the last parameter is a one-character string from a value in the array.
  *
  * @return {crow.Graph} The primed Graph
  */
crow.Graph.fromArray = function(array, callback){
		var graph = new crow.Graph();
		var x, y = 0;
		for(var i in array){
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

crow.Graph.registerAlgorithm = function(algo, name, isDefaultForType){
	crow.Graph.algorithm[name] = algo;
	if(isDefaultForType){
		var instance = new algo();
		if(instance instanceof crow.algorithm.SearchAlgorithm){
			crow.Graph.defaultAlgorithm.search = algo;
		} else if(instance instanceof crow.algorithm.ShortestPathAlgorithm){
			crow.Graph.defaultAlgorithm.shortestPath = algo;
		}
	}
};
crow.Graph._lookupAlgorithm = function(name){
	if(name){
		var algo = crow.Graph.algorithm[name];
		if(algo) return algo;
		else throw new Error("Algorithm `" + name + "` not found");
	} else return null;
};

crow.Graph.registerAlgorithm(crow.algorithm.LinearAlgorithm, 'linear', true);
crow.Graph.registerAlgorithm(crow.algorithm.DijkstraAlgorithm, 'dijkstra', true);

crow.GraphUtil = {
	distance: {
		pythagoras: function(dx, dy){
			return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
		},
		manhattan: function(dx, dy){
			return Math.abs(dx) + Math.abs(dy);
		}
	}
};

