goog.require('crow.Graph');
goog.require('crow.BaseNode');

window["runMazeExample"] = function(){
	/**
   * @constructor
	 */
	function MyNode(arr){ this.arr = arr; };
	MyNode.prototype = new crow.BaseNode();
	MyNode.prototype.getX = function(){ return this.arr[0]; };
	MyNode.prototype.getY = function(){ return this.arr[1]; };
	MyNode.prototype.distanceAlgorithm = crow.GraphUtil.distance.manhattan;
	MyNode.prototype.distanceTo = function(other){
		var baseDistance = crow.BaseNode.prototype.distanceTo.apply(this, arguments);
		var realDistance = baseDistance * (this.resistance + other.resistance) / 2;
		return realDistance;
	};
	MyNode.prototype.resistance = 1.0;
	
	/**
   * @constructor
	 */
	function Road(){ MyNode.apply(this, arguments); }
	Road.prototype = new MyNode();
	
	/**
   * @constructor
	 */
	function Sand(){ MyNode.apply(this, arguments); }
	Sand.prototype = new MyNode();
	Sand.prototype.resistance = 2.0; // Sand has double the "resistance" of regular path
	
	function generateGraph(){
		return crow.Graph.fromArray([
			"R---R-",  // R for Road, S for Sand, and - means not a tile
			"R-RRRR",
			"RSRS-R",
			"R-RRRS",
			"RRR--R",
			"--SRRR"
		], function(x, y, val){
			switch(val){
				case "R": return new Road([x, y]);
				case "S": return new Sand([x, y]);
			}
		});
	}
	
	test("Algorithm finds good path", function(){
		var graph = generateGraph();
		var path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(5, 4), algorithm: "a*"});
		ok(path.found, "found route");
		var expected = [[0,0],[0,1],[0,2],[1,2],[2,2],[2,3],[3,3],[4,3],[5,3],[5,4]];
		for(var i in expected){
			same([path.nodes[i].getX(), path.nodes[i].getY()], expected[i], "path node " + i + " is as expected");
		}
	});
};
