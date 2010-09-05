goog.require('crow.Graph');
goog.require('crow.BaseNode');
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
		var path = graph.findGoal({goal: graph.getNode(1, 1)});
		equals(path.nodes.length, 3, "Path contains expected number of nodes");
		same(path.start, new MyNode([0, 0]), "Path has expected start node");
		same(path.end, new MyNode([1, 1]), "Path has expected end node");
		equals(path.length, 2, "Path is of expected length");
		ok(path.found, "Path indicates end was found");
	});
	
	module("large graph");
	test("findGoal with a start and an end node, and removing nodes", function(){

		var graph = largeGraph();
		
		var path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(1, 5)});

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
		equals(path.algorithm.graph.nodes.length, graph.getNodes().length);
		//path = path.recalculate();
		//ok(containsNode(path, 4, 4), "Path contains original expected midpoint");
		//equals(path.length, 12, "Path is of expected length");
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
