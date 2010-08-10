	function Algorithm(){}
	Algorithm.util = {
		hash: function(node){
			return node.getX() + "_" + node.getY();
		}
	};
	Algorithm.NodeMap = function(defaultValue){
		var map = {};
		this.get = function(node){
			var val = map[Algorithm.util.hash(node)];
			return typeof val !== "undefined" ? val : defaultValue;
		};
		this.set = function(node, val){
			map[Algorithm.util.hash(node)] = val;
		};
	};
	function ShortestPathAlgorithm(){}
	ShortestPathAlgorithm.prototype = new Algorithm();
	ShortestPathAlgorithm.prototype.findPath = function(start, end, opts){};
	function SearchAlgorithm(){}
	SearchAlgorithm.prototype = new Algorithm();
	SearchAlgorithm.prototype.search = function(start, opts){};
	
	function LinearAlgorithm(graph){
		this.graph = graph;
	}
	LinearAlgorithm.prototype = new SearchAlgorithm();
	LinearAlgorithm.prototype.search = function(start, opts){
		if(!opts) opts = {};
		var list;
		var nodes = this.graph.getNodes();
		if(opts.filter){
			list = [];
			for(var i in nodes){
				var n = nodes[i];
				if(!opts.filter || opts.filter.call(n)){
					list.push(n);
				}
			}
		} else {
			list = nodes;
		}
		return list;
	};
	
	function BFSAlgorithm(graph){
		this.graph = graph;
	}
	BFSAlgorithm.prototype = new SearchAlgorithm();
	BFSAlgorithm.prototype.search = function(start, opts){
		if(!opts) opts = {};
		// opts can contain a `filter` callback to ignore nodes
		var visited = {}, pendingVisit = {};
		var queue = [start];
		
		function checkNeighbor(n){
			if(n){
				var h = Algorithm.util.hash(n);
				if(!visited[h] && !pendingVisit[h] && (!opts.filter || opts.filter.call(n))){
					queue.push(n);
					pendingVisit[h] = 1;
				}
			}
		}
		
		var list = [];
		while(queue.length > 0){
			var el = queue.shift();
			visited[Algorithm.util.hash(el)] = 1;
			list.push(el);
			
			var range = [-1, 1];
			var ox = el.getX(), oy = el.getY();
			for(var i in range){
				var x = ox + range[i];
				var n = this.graph.getNode(x, oy);
				checkNeighbor(n);
			}
			for(var i in range){
				var y = oy + range[i];
				var n = this.graph.getNode(ox, y);
				checkNeighbor(n);
			}
		}
		return list;
	};
	function DijkstraAlgorithm(graph){
		this.graph = graph;
	}
	DijkstraAlgorithm.prototype = new ShortestPathAlgorithm();
	DijkstraAlgorithm.prototype.findPath = function(start, goal, opts){
		this.distance = new Algorithm.NodeMap(Infinity);
		this.previous = new Algorithm.NodeMap();
		this.visited = new Algorithm.NodeMap(false);
		this.visitedList = [];
		
		this.start = start;
		this.goal = goal;
		this.opts = typeof opts === "undefined" ? {} : opts;

		// Algorithm commenceth
		this.distance.set(start, 0);
		var endNode = typeof goal !== "function" ? goal : null;
		this._visitNode(start, endNode);
		
		if(typeof goal === "function"){
			endNode = this._determineClosestEndNode(goal);
		}

		var path = [];
		if(endNode){
			path.unshift(endNode);
			var node = this.previous.get(endNode);
			while(node){
				path.unshift(node);
				node = this.previous.get(node);
			}
		}
		var found = !!endNode;
		return {
			nodes: path,
			start: start,
			goal: goal,
			end: found ? endNode : null,
			length: found ? this.distance.get(endNode) : Infinity,
			found: found,
			recalculate: this.recalculate,
			algorithm: this
		};
	};
	DijkstraAlgorithm.prototype.recalculate = function(){
		var a = this.algorithm;
		var ret = a.findPath(a.start, a.goal, a.opts);
		return ret;
	};
	// If we have a filter function that determines the end node, there could be multiple end nodes...
	// this function finds the closest end node.
	DijkstraAlgorithm.prototype._determineClosestEndNode = function(goal){
		var closest, closestDistance = Infinity;
		for(var i in this.visitedList){
			var node = this.visitedList[i];
			if(goal.call(node)){
				var d = this.distance.get(node);
				if(d < closestDistance){
					closest = node;
					closestDistance = d;
				}
			}
		}
		return closest;
	};
	DijkstraAlgorithm.prototype._visitNode = function(node, endNode, nextNodes){
		if(!nextNodes) nextNodes = [];
		var neighbors = node.getNeighbors(this.graph);
		for(var n in neighbors){
			var neighbor = neighbors[n];
			if(this.visited.get(neighbor) || (this.opts.filter && !this.opts.filter.call(neighbor))) continue;
			
			var distFromStart = this.distance.get(node) + node.distanceTo(neighbor);
			if(distFromStart < this.distance.get(neighbor)){
				this.distance.set(neighbor, distFromStart);
				this.previous.set(neighbor, node);
			}
			nextNodes.push(neighbor);
		}
		this.visited.set(node, true);
		this.visitedList.push(node);
		if(node === endNode) return;

		// We have to visit the next unvisited node with the smallest distance from the source
		var next = null, nextDistance = Infinity, nextIndex = -1;
		for(var i in nextNodes){
			var n = nextNodes[i];
			if(this.distance.get(n) < nextDistance){
				next = n;
				nextDistance = this.distance.get(n);
				nextIndex = i;
			}
		}
		if(next != null){
			// remove the node we're about to visit from the to-visit list
			// and then visit it
			nextNodes.splice(nextIndex, 1);
			this._visitNode(next, endNode, nextNodes);
		}
	}
	
	function Graph(){
		// initialize
		this.nodes = [];
		this.map = {};
		this.version = "0.5.1";
		
		// methods
		// Add a node to this graph
		// O(1)
		this.addNode = function(node){
			this.nodes.push(node);

			var x = node.getX(), y = node.getY();
			if(!this.map[x]) this.map[x] = {};
			this.map[x][y] = node;
		};
		// Remove a node at given coordinates from graph
		// O(n) where n is number of total nodes
		this.removeNode = function(x, y){
			if(this.map[x] && this.map[x][y]){
				delete this.map[x][y];
				if(this.map[x].length == 0) delete this.map[x];
			}
			for(var i in this.nodes){
				var node = this.nodes[i];
				if(node.getX() == x && node.getY() == y){
					this.nodes.splice(i, 1);
					break;
				}
			}
		};
		// Gets a node at a particular coordinate, or the first node that meets a condition
		// O(1) if a coordinate is given
		// O(n) if a filter is given (n being number of total nodes)
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
		// Get multiple nodes...has 3 options:
		//  1) pass a filter function: O(n)
		//  2) pass an options object with a `start` node (optional), an `algorithm` (optional; search-type), and a `filter` (optional): running time varies by algorithm
		//  3) pass nothing, in which case all nodes will be returns: O(1)
		this.getNodes = function(filter_or_options){
			switch(typeof filter_or_options){
				case "function":
					return this.getNodes({
						filter: filter_or_options
					});
				case "object":
					var start = filter_or_options.start || this.nodes[0];
					var algo = Graph._lookupAlgorithm(filter_or_options.algorithm) || Graph.defaultAlgorithm.search;
					if(!(algo.prototype instanceof SearchAlgorithm)) throw new Error("only compatible with SearchAlgorithms")
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
			var start = opts.start || this.nodes[0];
			var goal = opts.goal;
			if(!goal) throw new Error("To find a goal, one must provide a goal...");
			var algo = opts.algorithm || Graph.defaultAlgorithm.shortestPath;
			// TODO add type check to algo here
			return (new algo(this)).findPath(start, goal, opts);
		};
	};
	Graph.algorithm = {};
	Graph.defaultAlgorithm = {};
	
	// Extension for EffectGames to facilitate creation of graphs
	Graph.fromTilePlane = function(tplane, callback){
		if(!window.Effect || !window.Effect.Port) throw new Error("EffectGames-specific extensions don't work anywhere else");
		if(!tplane) throw new Error("tplane is required");
		if(typeof callback !== "function") throw new Error("callback not provided or not a function");
	
		var g = new Graph();
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
	Graph.registerAlgorithm = function(algo, name, isDefaultForType){
		Graph.algorithm[name] = algo;
		if(isDefaultForType){
			var instance = new algo();
			if(instance instanceof SearchAlgorithm){
				Graph.defaultAlgorithm.search = algo;
			} else if(instance instanceof ShortestPathAlgorithm){
				Graph.defaultAlgorithm.shortestPath = algo;
			}
		}
	};
	Graph._lookupAlgorithm = function(name){
		if(name){
			var algo = Graph.algorithm[name];
			if(algo) return algo;
			else throw new Error("Algorithm `" + name + "` not found");
		} else return undefined;
	};
	
	Graph.registerAlgorithm(LinearAlgorithm, 'linear', true);
	Graph.registerAlgorithm(BFSAlgorithm, 'bfs');
	Graph.registerAlgorithm(DijkstraAlgorithm, 'dijkstra', true);
	
	var GraphUtil = {
		distance: {
			pythagoras: function(dx, dy){
				return Math.sqrt(Math.pow(dx, 2) + Math.pow(dy, 2));
			},
			sum: function(dx, dy){
				return Math.abs(dx) + Math.abs(dy);
			}
		}
	};
	var BaseNode = function(){};

	// Override these position methods in your base class to provide location
	// information
	BaseNode.prototype.getX = function(){ throw new Error("override me") };
	BaseNode.prototype.getY = function(){ throw new Error("override me") };

	// Calculating distance between nodes.	You have several options:
	// 1) Simply override the distanceAlgorithm method in your derived class with
	//	 a) one of the GraphUtil.distance.* methods, or
	//	 b) your own method that takes a dx and a dy
	// 2) Override the distanceTo method in your derived class to provide completely
	//	 custom behavior 
	BaseNode.prototype.distanceAlgorithm = function(){ throw new Error("override me with a GraphUtil.distance.* method"); };
	BaseNode.prototype.distanceTo = function(other){
		var dx = this.getX() - other.getX(),
			dy = this.getY() - other.getY();
		
		return this.distanceAlgorithm(dx, dy);
	};

	// Find neighbors of this node in the provided graph
	// (checks horizontally and vertically, not diagonally)
	BaseNode.prototype.getNeighbors = function(graph){
		var neighbors = [];
		var range = [-1, 1];
		var ox = this.getX(), oy = this.getY();
		for(var i in range){
			var x = ox + range[i];
			var n = graph.getNode(x, oy);
			if(n) neighbors.push(n);
		}
		for(var j in range){
			var y = oy + range[j];
			var n = graph.getNode(ox, y);
			if(n) neighbors.push(n);
		}
		return neighbors;
	};
