goog.require('crow.Graph');
goog.require('crow.BaseNode');
goog.require('goog.events.EventTarget');
goog.require('crow.util.Test');

window["test"] = window["test"] || {};
window["test"]["gameOptimizations"] = function(){
	/**
	 * @constructor
	 */
	function MyNode(arr){ this.x = arr[0]; this.y = arr[1]; };
	MyNode.prototype = new crow.BaseNode();
	MyNode.prototype.getX = function(){ return this.x; };
	MyNode.prototype.getY = function(){ return this.y; };
	MyNode.prototype.distanceAlgorithm = crow.GraphUtil.distance.manhattan;
	
	var tinyGraph = function(){
		return crow.Graph.fromArray([
			"XX-",
			"-X-",
			"-XX"
		], function(x, y, val){
			if(val == "X") return new MyNode([x, y]);
		});
	};
	
	test("invalidate point", function(){
		var graph = tinyGraph();
		var path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(2, 2), algorithm: "a*"});
		
		var expected = [[0,0],[1,0],[1,1],[1,2],[2,2]];
		for(var i in expected){
			same([path.nodes[i].getX(), path.nodes[i].getY()], expected[i], "initial: path node " + i + " is as expected");
		}
		
		// Now we remove a point and signal to our graph that any paths containing that point
		// are no longer valid after that point
		graph.removeNode(1, 2);
		graph.invalidate(1, 2);
		
		// After we invalidate the point, we can regenerate the rest of the graph
		path.continueCalculating();
		
		ok(!path.found, "deleted only available path; can't find new path");
		
		var expected = [[0,0],[1,0],[1,1]];
		for(var i in expected){
			same([path.nodes[i].getX(), path.nodes[i].getY()], expected[i], "busted: path node " + i + " is as expected");
		}
		equals(3, path.nodes.length, "busted path is indeed shorter");
		
		// Now let's add another node making it possible to find the goal
		graph.addNode(new MyNode([2, 1]));
		// We don't need to invalidate the point because we know the path doesn't contain it
		path.continueCalculating();
		ok(path.found, "after adding new node, path is found again");

		var expected = [[0,0],[1,0],[1,1],[2,1],[2,2]];
		for(var i in expected){
			same([path.nodes[i].getX(), path.nodes[i].getY()], expected[i], "new path: node " + i + " is as expected");
		}
	});
	
	test("invalidate area", function(){
		var graph = tinyGraph();
		var path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(2, 2), algorithm: "a*"});
		
		var expected = [[0,0],[1,0],[1,1],[1,2],[2,2]];
		for(var i in expected){
			same([path.nodes[i].getX(), path.nodes[i].getY()], expected[i], "initial: path node " + i + " is as expected");
		}
		
		// Now we remove a point and signal to our graph that any paths containing that point
		// are no longer valid after that point
		graph.removeNode(1, 2);
		graph.invalidate(0, 1, 2, 2);

		var expected = [[0,0],[1,0]];
		for(var i in expected){
			same([path.nodes[i].getX(), path.nodes[i].getY()], expected[i], "incomplete: path node " + i + " is as expected");
		}
		equals(2, path.nodes.length, "incomplete path is indeed shorter");
				
		// After we invalidate the point, we can regenerate the rest of the graph		
		ok(!path.found, "deleted only available path; can't find new path");
				
		// Now let's add another node making it possible to find the goal
		graph.addNode(new MyNode([2, 1]));
		// We don't need to invalidate the point because we know the path doesn't contain it
		path.continueCalculating();
		ok(path.found, "after adding new node, path is found again");

		var expected = [[0,0],[1,0],[1,1],[2,1],[2,2]];
		for(var i in expected){
			same([path.nodes[i].getX(), path.nodes[i].getY()], expected[i], "new path: node " + i + " is as expected");
		}
	});
}
