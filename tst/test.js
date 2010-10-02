goog.require('crow.Graph');
goog.require('crow.BaseNode');
goog.require('crow.ConnectedNode');
goog.require('crow.algorithm.LPAStarAlgorithm');
goog.require('crow.util.Test');

window["test"] = window["test"] || {};
window["test"]["mainTest"] = function(){
	module("Tiny map");
	/*
		Map looks like:
		[S -]
		[+ E]
		S: Start
		E: End
		+: walkable
		-: not walkable
	*/
	/**
	  * @constructor
	  */
	function MyNode(arr){ this.arr = arr; };
	MyNode.prototype = new crow.BaseNode();
	MyNode.prototype.getX = function(){ return this.arr[0]; };
	MyNode.prototype.getY = function(){ return this.arr[1]; };
	MyNode.prototype.distanceAlgorithm = crow.GraphUtil.distance.manhattan;
	
	function containsNode(path, x, y){
		for(var i in path.nodes){
			var n = path.nodes[i];
			if(n.getX() === x && n.getY() === y){
				return true;
			}
		}
		return false;
	}
	
	function MyCity(name, latLong){
		crow.ConnectedNode.apply(this, arguments);
		this.latLong = latLong;
	};
	MyCity.prototype = new crow.ConnectedNode();
	MyCity.prototype.distanceAlgorithm = crow.GraphUtil.distance.euclidean; 
	MyCity.prototype.distanceToGoal = function(other){
		var dx = this.latLong[1] - other.latLong[1], dy = this.latLong[0] - other.latLong[0];
		return this.distanceAlgorithm(dx, dy)
	}
	
	function smallGraph(){
		return crow.Graph.fromArray([
			"10",
			"11"
		], function(x, y, val){
			if(val === "1"){
				return new MyNode([x, y]);
			}
		});
	}
	function mediumGraph(){
		return crow.Graph.fromArray([
			"1111",
			"1001",
			"1111",
			"0100"
		], function(x, y, val){
			if(val === "1"){
				return new MyNode([x, y]);
			}
		});
	}
	function largeGraph(){
		return crow.Graph.fromArray([
			"11110010",
			"10011110",
			"11010010",
			"01011111",
			"10101010",
			"01111111"
		], function(x, y, val){
			if(val === "1"){
				return new MyNode([x, y]);
			}
		});
	}
	
	test("getNode with coordinates", function() {
		var graph = smallGraph();
		function nodeTest(x, y){
			var n = graph.getNode(x, y);
			ok(n, "Node at " + x + "," + y + " is ok");
			equals(n.getX(), x, "Node's x value is as expected");
			equals(n.getY(), y, "Node's y value is as expected");
		}
		
		nodeTest(0, 0);
		nodeTest(0, 1);
		nodeTest(1, 1);
		ok(!graph.getNode(1, 0));
	});
	
	test("getNode with callback", function(){
		var graph = smallGraph();
		var firstNode = graph.getNode(function(){
			return true;
		});
		same(firstNode, new MyNode([0, 0]), "Got first element correctly");
		var lastNode = graph.getNode(function(){
			return this.getX() == 1 && this.getY() == 1;
		});
		same(lastNode, new MyNode([1, 1]), "Got last element correctly");
	});
	
	test("getNodes with no args", function(){
		var graph = smallGraph();
		var nodes = graph.getNodes();
		equals(nodes.length, 3, "Three elements returned");
		// TODO more?
	});
	
	test("getNodes with function filter", function(){
		var graph = smallGraph();
		var nodes = graph.getNodes(function(){
		  return this.getX() == this.getY();
		});
		equals(nodes.length, 2, "Two elements");
		same(nodes[0], new MyNode([0, 0]), "First element is first");
		same(nodes[1], new MyNode([1, 1]), "Third element is second");
	});
	
	test("getNodes with options hash and filter", function(){
		var graph = smallGraph();
		var nodes = graph.getNodes({
			filter: function(){
				return this.getX() == this.getY();
			}
		});
		equals(nodes.length, 2, "Two elements");
		same(nodes[0], new MyNode([0, 0]), "First element is upper left node");
		same(nodes[1], new MyNode([1, 1]), "Second element is lower right node");
	});
	
	test("getNodes with options hash, bfs, and lower right starting point", function(){
		var graph = smallGraph();
		var nodes = graph.getNodes({
			start: graph.getNode(1, 1),
			algorithm: 'bfs'
		});
		equals(nodes.length, 3, "Three elements");
		same(nodes[0], new MyNode([1, 1]), "First element is lower right node");
		same(nodes[1], new MyNode([0, 1]), "Second element is lower left node");
		same(nodes[2], new MyNode([0, 0]), "Third element is upper left node");
	});
	
	test("findGoal with only a goal", function(){
		
		var graph = smallGraph();
		
		var path = graph.findGoal({goal: graph.getNode(1, 1), algorithm: "dijkstra"});
		
		equals(path.nodes.length, 3, "Path contains expected number of nodes");
		
		same(path.start, new MyNode([0, 0]), "Path has expected start node");
		same(path.end, new MyNode([1, 1]), "Path has expected end node");
		equals(path.length, 2, "Path is of expected length");
		ok(path.found, "Path indicates end was found");
	});
	
	module("large graph");
	test("findGoal with a start and an end node, and removing nodes", function(){

		var graph = largeGraph();
		
		var path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(1, 5), algorithm: "dijkstra"});

		equals(path.nodes.length, 13, "Path contains expected number of nodes");
		same(path.start, new MyNode([0, 0]), "Path has expected start node");
		same(path.end, new MyNode([1, 5]), "Path has expected end node");
		equals(path.length, 12, "Path is of expected length");
		ok(containsNode(path, 4, 4), "Path contains expected midpoint");
		ok(path.found, "Path indicated end was found");

		var nodeCount = graph.getNodes().length;
		
		graph.removeNode(4, 4);
		
		var newNodeCount = graph.getNodes().length;
		equals(nodeCount - newNodeCount, 1, "Graph has correct number of nodes after removing one (on previous path)");
		
		path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(1, 5)});
		equals(path.nodes.length, 17, "Path contains expected number of nodes");
		same(path.start, new MyNode([0, 0]), "Path has expected start node");
		same(path.end, new MyNode([1, 5]), "Path has expected end node");
		equals(path.length, 16, "Path is of expected length");
		ok(!containsNode(path, 4, 4), "Path doesn't contain node that was previously removed");
		ok(containsNode(path, 6, 4), "Path contains new node instead");
		ok(path.found, "Path indicated end was found");
		
		ok(!graph.getNode(4, 4), "Graph doesn't contain 4,4");
		graph.addNode(new MyNode([4, 4]));
		ok(graph.getNode(4, 4), "Graph now contains 4,4");
		var newNewNodeCount = graph.getNodes().length;
		equals(newNewNodeCount - newNodeCount, 1, "Graph has correct number of nodes after readding deleted node");
		//path = recalculate();
		//ok(containsNode(path, 4, 4), "Path contains original expected midpoint");
		//equals(path.length, 12, "Path is of expected length");
	});
	
	module("ConnectedNode");
	test("works with all algorithms", function(){
		// the coordinates are only used to estimate distances from a point to the end
		var Seattle = new MyCity("Seattle", [47, -122]);
		var SaltLakeCity = new MyCity("Salt Lake City", [40, -111]);
		var Boston = new MyCity("Boston", [42, -71]);
		var Houston = new MyCity("Houston", [29, -95]);
		var Tampa = new MyCity("Tampa", [27, -82]);
		
		Seattle.connectTo(SaltLakeCity, 701);
		SaltLakeCity.connectTo(Boston, 2095);
		SaltLakeCity.connectTo(Houston, 1197);
		Houston.connectTo(Tampa, 792);
		
		var path;
		var algorithms = ["dijkstra", "a*", "lpa*", "fra*"];
		for(var i in algorithms){
			var algo = algorithms[i];
			path = crow.Graph.findGoal({start: Seattle, goal: Tampa, algorithm: algo});
			ok(path.found, "Path was found (" + algo + ")");
			equals(path.length, 3500, "Path was expected length (" + algo + ")");
			equals(path.nodes[0].id, Seattle.id, "First stop was as expected (" + algo + ")");
			equals(path.nodes[1].id, SaltLakeCity.id, "Second stop was as expected (" + algo + ")");
			equals(path.nodes[2].id, Houston.id, "Third stop was as expected (" + algo + ")");
			equals(path.nodes[3].id, Tampa.id, "Fourth stop was as expected (" + algo + ")");
			equals(path.nodes.length, 4, "Correct number of stops (" + algo + ")");
		}
	});
	
	module("Dijkstra's");
	test("basic test", function(){
		var graph = smallGraph();
		var path = graph.findGoal({goal: graph.getNode(1, 1), algorithm: "dijkstra"});
		equals(path.nodes.length, 3, "Path contains expected number of nodes");
		same(path.start, new MyNode([0, 0]), "Path has expected start node");
		same(path.end, new MyNode([1, 1]), "Path has expected end node");
		equals(path.length, 2, "Path is of expected length");
		ok(path.found, "Path indicates end was found");	
	});

	module("A*");
	test("basic test", function(){
		var graph = smallGraph();
		var path = graph.findGoal({goal: graph.getNode(1, 1), algorithm: "a*"});
		equals(path.nodes.length, 3, "Path contains expected number of nodes");
		same(path.start, new MyNode([0, 0]), "Path has expected start node");
		same(path.end, new MyNode([1, 1]), "Path has expected end node");
		equals(path.length, 2, "Path is of expected length");
		ok(path.found, "Path indicates end was found");
	});
	/*
	test("basic test using custom distance", function(){
		var graph = smallGraph();
		var distanceEstimator = GraphUtil.distance.pythagoras;
		var path = graph.findGoal({goal: graph.getNode(1, 1), algorithm: "a*"});
		equals(path.nodes.length, 3, "Path contains expected number of nodes");
		same(path.start, new MyNode([0, 0]), "Path has expected start node");
		same(path.end, new MyNode([1, 1]), "Path has expected end node");
		equals(path.length, 2, "Path is of expected length");
		ok(path.found, "Path indicates end was found");
	});
	*/
	test("doesn't accept goal-callback", function(){
		raises(function(){
			var graph = smallGraph();
			graph.findGoal({goal: function(){}, algorithm: "a*"});
		}, "Callback for goal raised exception");
	});
	module("LPA*");
	test("basic test", function(){
		var graph = smallGraph();
		var path = graph.findGoal({goal: graph.getNode(1, 1), algorithm: "lpa*"});
		equals(path.nodes.length, 3, "Path contains expected number of nodes");
		same(path.start, new MyNode([0, 0]), "Path has expected start node");
		same(path.end, new MyNode([1, 1]), "Path has expected end node");
		equals(path.length, 2, "Path is of expected length");
		ok(path.found, "Path indicates end was found");
	});
	test("bigger test", function(){
		var graph = largeGraph();
		var path = graph.findGoal({goal: graph.getNode(7, 5), algorithm: "lpa*"});
		equals(path.nodes.length, 13, "Path contains expected number of nodes");
		same(path.start, new MyNode([0, 0]), "Path has expected start node");
		same(path.end, new MyNode([7, 5]), "Path has expected end node");
		equals(path.length, 12, "Path is of expected length");
		ok(path.found, "Path indicates end was found");
	});
	
	/*
	 * Putting this section on the back burner until we have some real-time algorithms
	module("procedural path generation: A*");
	test("stationary", function(){
		var limit = 8;
		var graph = largeGraph();
		var path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(7, 5), algorithm: "a*", limit: limit});
		ok(!path.found, "path not found after first attempt");
		path.continueCalculating(10);
		ok(!path.found, "path not found after one continue");
		path.continueCalculating(10);
		ok(path.found, "path found after two continues");
		
		var unlimitedPath = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(7, 5), algorithm: "a*"});
		ok(path.nodes.length <= unlimitedPath.nodes.length * 1.5, "path is pretty efficient (" + path.nodes.length + " vs " + unlimitedPath.nodes.length + " ideal)");
	});
	test("moving along path", function(){
		var limit = 8;
		var graph = largeGraph();
		var path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(7, 5), algorithm: "a*", limit: limit});
		ok(!path.found, "path not found after first go");
		
		path.advanceTo(1);
		path.continueCalculating(10);
		ok(!path.found, "path not found after one continue");
		
		path.advanceTo(1);
		path.continueCalculating(10);
		ok(path.found, "path found after two continues");
		
		var unlimitedPath = graph.findGoal({start: graph.getNode(2, 0), goal: graph.getNode(7, 5), algorithm: "a*"});
		ok(path.nodes.length <= unlimitedPath.nodes.length * 1.5, "path is pretty efficient (" + path.nodes.length + " vs " + unlimitedPath.nodes.length + " ideal)");
	});
	
	test("moving, but not along path", function(){
		var limit = 8;
		var graph = largeGraph();
		var path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(7, 5), algorithm: "a*", limit: limit});
		ok(!path.found, "path not found after first go");
		
		path.advanceTo(graph.getNode(0, 1));
		path.continueCalculating(10);
		ok(!path.found, "path not found after one continue");
		
		path.advanceTo(graph.getNode(0, 2));
		path.continueCalculating(10);
		ok(!path.found, "path not found after two continues since actor keeps moving off best path");
	});
	
	test("small limits don't perform well", function(){
		var limit = 5;
		var graph = largeGraph();
		var path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(7, 5), algorithm: "a*", limit: limit});
		
		var i = 100;
		while(i--){
			path.continueCalculating(limit);
		}
		ok(!path.found, "can't find goal even after many (100) iterations");
	});
	test("small numbers can work with linear limit increase", function(){
		var limit = 5;
		var graph = largeGraph();
		var path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(7, 5), algorithm: "a*", limit: limit});

		while(!path.continueCalculating(++limit)){}
		var unlimitedPath = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(7, 5), algorithm: "a*"});
		ok(path.nodes.length <= unlimitedPath.nodes.length * 2, "resulting path is reasonably efficient (" + path.nodes.length + " vs " + unlimitedPath.nodes.length + " ideal)");
	});
	*/
	(function(){
		module("passing actors into findGoal");

		function AnotherNode(arr){ this.x = arr[0]; this.y = arr[1]; };
		AnotherNode.prototype = new crow.BaseNode();
		AnotherNode.prototype.distanceAlgorithm = crow.GraphUtil.distance.pythagoras;
		AnotherNode.prototype.distanceToGoal = function(other, actor){
			if(actor instanceof Plane || other.walkable) return crow.BaseNode.prototype.distanceToGoal.apply(this, arguments);
			return Infinity;
		};
		function Plane(){};
		function Car(){};

		var graph = crow.Graph.fromArray([
			"1111",
			"1001",
			"1111",
			"0100"
		], function(x, y, val){
			var node = new AnotherNode([x, y]);
			node.walkable = val == "1";
			return node;
		});
		graph.removeNode(1, 2); // removing node between goal and start

		test("works with A*", function(){		
			var start = graph.getNode(0, 0);
			var end = graph.getNode(1, 3);

			var p = new Plane();
			var c = new Car();
		
			var carPath = graph.findGoal({start: start, goal: end, algorithm: "a*", actor: c});
			ok(!carPath.found, "no route exists to goal for car");		

			var planePath = graph.findGoal({start: start, goal: end, algorithm: "a*", actor: p});
			ok(planePath.found, "route exists to goal for plane");
		});

		test("works with Dijkstra", function(){		
			var start = graph.getNode(0, 0);
			var end = graph.getNode(1, 3);

			var p = new Plane();
			var c = new Car();
		
			var carPath = graph.findGoal({start: start, goal: end, algorithm: "dijkstra", actor: c});
			ok(!carPath.found, "no route exists to goal for car");
		
			var planePath = graph.findGoal({start: start, goal: end, algorithm: "dijkstra", actor: p});
			ok(planePath.found, "route exists to goal for plane");
		});
		
		test("works with invalidations", function(){
			var start = graph.getNode(0, 0);
			var end = graph.getNode(1, 3);

			var p = new Plane();
			var c = new Car();

			var algos = ["dijkstra", "a*"];
			for(var a in algos){
				var algo = algos[a];
				
				var carPath = graph.findGoal({start: start, goal: end, algorithm: algo, baked: false, actor: c});
				ok(!carPath.found, "no route exists to goal for car in " + algo);
				var planePath = graph.findGoal({start: start, goal: end, algorithm: algo, baked: false, actor: p});
				ok(planePath.found, "route exists to goal for plane in " + algo);
			
				graph.invalidate(0, 3, 3, 1);
			
				carPath.continueCalculating();
				planePath.continueCalculating();
			
				ok(!carPath.found, "after invalidating, no route exists to goal for car in " + algo);
				ok(planePath.found, "after invalidating, route exists to goal for plane in " + algo);
				
				carPath.bake();
				planePath.bake();
			}
		});
	})();
	
	module("FRA*", {
		setup: function(){
			this.graph1 = crow.Graph.fromArray([
				"11111",
				"11101",
				"11101",
				"11101",
				"11101"
			], function(x, y, val){
				if(val == "1"){
					return new MyNode([x, y]);
				}
			});
		}
	});
	
	test("basic test", function(){
		var start = this.graph1.getNode(0, 1);
		var goal = this.graph1.getNode(4, 3);
		var path = this.graph1.findGoal({start: start, goal: goal, algorithm: "fra*", baked: false});
		var expected = [[0,1],[1,1],[2,1],[2,0],[3,0],[4,0],[4,1],[4,2],[4,3]];
		for(var i = 0; i < path.nodes.length; i++){
			same(path.nodes[i], new MyNode([expected[i][0], expected[i][1]]), "Node " + i + " in original path");
		}
		same(path.length, 8, "Original path of expected length");
		
		start = this.graph1.getNode(1, 1);
		goal = this.graph1.getNode(4, 4)
		path.advanceTo(start);
		path.moveTarget(goal);
		path.continueCalculating();
		expected = [[1,1],[2,1],[2,0],[3,0],[4,0],[4,1],[4,2],[4,3],[4,4]];
		for(var i = 0; i < path.nodes.length; i++){
			same(path.nodes[i], new MyNode([expected[i][0], expected[i][1]]), "Node " + i + " in revised path");
		}
		same(path.length, 8, "New path of expected length");
		
		start = path.nodes[1];
		path.advanceTo(start);
		path.continueCalculating();
		expected = [[2,1],[2,0],[3,0],[4,0],[4,1],[4,2],[4,3],[4,4]];
		for(var i = 0; i < path.nodes.length; i++){
			same(path.nodes[i], new MyNode([expected[i][0], expected[i][1]]), "Node " + i + " in revised path");
		}
		same(path.length, 7, "New path #2 of expected length");
		
		start = path.nodes[path.nodes.length-2];
		path.advanceTo(start);
		path.continueCalculating();
		expected = [[4,3],[4,4]];
		for(var i = 0; i < path.nodes.length; i++){
			same(path.nodes[i], new MyNode([expected[i][0], expected[i][1]]), "Node " + i + " in revised path");
		}
		same(path.length, 1, "Almost-there path of expected length");
		
		start = path.nodes[1];
		path.advanceTo(start);
		path.continueCalculating();
		expected = [[4,4]];
		for(var i = 0; i < path.nodes.length; i++){
			same(path.nodes[i], new MyNode([expected[i][0], expected[i][1]]), "Node " + i + " in revised path");
		}
		same(path.length, 0, "Completed path of expected length");
	});
	test("trivial: found is true when start == goal", function(){
		var start = this.graph1.getNode(4, 4);
		var goal = this.graph1.getNode(4, 3);
		var path = this.graph1.findGoal({start: start, goal: goal, algorithm: "fra*"});
		ok(path.found, "Path is found");
		same(path.length, 1, "Path of length 1");	
	});
	
	module("internal api : memory leaks");
	test("paths respond as expected when baked/unbaked", function(){
		var graph = smallGraph();
		var start = graph.getNode(0, 0);
		var end = graph.getNode(1, 1);

		var pointInvalidated = false;
		
		var oldInvalidatePoint = crow.algorithm.Path.prototype._invalidatePoint;
		crow.algorithm.Path.prototype._invalidatePoint = function(){
			pointInvalidated = true;
		};
		
		// First test
		(function(){
			var path = graph.findGoal({start: start, goal: end, algorithm: "a*"}); 
		})();
		graph.invalidate(0, 0);
		ok(!pointInvalidated, "out of scope baked-by-default path doesn't receive invalidation event");
		
		pointInvalidated = false;
		var path = graph.findGoal({start: start, goal: end, algorithm: "a*"});
		
		graph.invalidate(0, 0);
		ok(!pointInvalidated, "in scope baked-by-default path doesn't receive invalidation event");
		
		// Second test
		(function(){
			var path = graph.findGoal({start: start, goal: end, baked: false, algorithm: "a*"}); 
		})();
		graph.invalidate(0, 0);
		ok(pointInvalidated, "out of scope unbaked path receives invalidation event");
		
		pointInvalidated = false;
		var path = graph.findGoal({start: start, goal: end, baked: false, algorithm: "a*"});
		
		graph.invalidate(0, 0);
		ok(pointInvalidated, "in scope unbaked path receives invalidation event");
		
		// Third test
		(function(){
			var path = graph.findGoal({start: start, goal: end, limit: 1, algorithm: "a*"}); 
		})();
		graph.invalidate(0, 0);
		ok(pointInvalidated, "out of scope path with limit receives invalidation event");
		
		pointInvalidated = false;
		var path = graph.findGoal({start: start, goal: end, limit: 1, algorithm: "a*"});
		
		graph.invalidate(0, 0);
		ok(pointInvalidated, "in scope unbaked path with limit receives invalidation event");
		
		crow.algorithm.Path.prototype._invalidatePoint = oldInvalidatePoint;
	});
	
	module("EffectGames");
	test("EffectGames extensions not testable", function(){
		raises(function(){ Graph.fromTilePlane(); }, "Graph.fromTilePlane raises exception");
	});
	
	module("etc");
	test("addNode has valid arguments", function(){
		var graph = smallGraph();
		raises(function(){
			graph.addNode(new MyNode([1]));
		}, "Fails as expected with no y");
		raises(function(){
			graph.addNode(new MyNode([null, 1]));
		}, "Fails as expected with no x");
	});
};
