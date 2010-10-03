goog.require('crow.Graph');
goog.require('crow.BaseNode');

window["test"] = window["test"] || {};
window["test"]["dunesAndDemise"] = function(){
	/**
	 * @constructor
	 */
	function MyNode(arr){ this.arr = arr; };
	MyNode.prototype = new crow.BaseNode();
	MyNode.prototype.getX = function(){ return this.arr[0]; };
	MyNode.prototype.getY = function(){ return this.arr[1]; };
	MyNode.prototype.distanceAlgorithm = crow.GraphUtil.distance.manhattan;
	MyNode.prototype.distanceToNeighbor = function(neighbor, actor){
		var baseDistance = crow.BaseNode.prototype.distanceToGoal.apply(this, arguments);
		var realDistance = baseDistance * (this.resistance + neighbor.resistance) / 2;
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
	
	var graphArray = [
			"R---R-",  // R for Road, S for Sand, and - means not a tile
			"R-RRRR",
			"RSRS-R",
			"R-RRRS",
			"RRR--R",
			"--SRRR"
		];
	function generateGraph(){
		return crow.Graph.fromArray(graphArray, function(x, y, val){
			switch(val){
				case "R": return new Road([x, y]);
				case "S": return new Sand([x, y]);
			}
		});
	}
	window.testPaths = [];
	test("A* Algorithm finds good path", function(){
		var graph = generateGraph();
		var path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(5, 4), algorithm: "a*"});
		ok(path.found, "found route");
		var expected = [[0,0],[0,1],[0,2],[1,2],[2,2],[2,3],[3,3],[4,3],[5,3],[5,4]];
		for(var i = 0; i < expected.length; i++){
			same([path.nodes[i].getX(), path.nodes[i].getY()], expected[i], "path node " + i + " is as expected");
		}
		window["testPaths"].push(["A* path", path]);
	});
	test("Dijkstra's Algorithm finds good path", function(){
		var graph = generateGraph();
		var path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(5, 4), algorithm: "dijkstra"});
		ok(path.found, "found route");
		var expected = [[0,0],[0,1],[0,2],[1,2],[2,2],[2,3],[3,3],[4,3],[5,3],[5,4]];
		for(var i = 0; i < expected.length; i++){
			same([path.nodes[i].getX(), path.nodes[i].getY()], expected[i], "path node " + i + " is as expected");
		}
		window["testPaths"].push(["Dijkstra's path", path]);
	});
	test("FRA* Algorithm finds good path", function(){
		var graph = generateGraph();
		var path = graph.findGoal({start: graph.getNode(0, 0), goal: graph.getNode(5, 4), algorithm: "fra*"});
		ok(path.found, "found route");
		var expected = [[0,0],[0,1],[0,2],[1,2],[2,2],[2,3],[3,3],[4,3],[5,3],[5,4]];
		for(var i = 0; i < expected.length; i++){
			same([path.nodes[i].getX(), path.nodes[i].getY()], expected[i], "path node " + i + " is as expected");
		}
		window["testPaths"].push(["FRA* path", path]);
	});
	var canvas = $("<canvas id='main' width='40' height='40'>").appendTo(document.body).hide();
	var canvasDom = canvas[0];
	if (canvasDom.getContext){
		var ctx = canvasDom.getContext("2d");
		ctx.beginPath();
		ctx.arc(20, 20, 20, 0, Math.PI*2, false);
		ctx.strokeStyle = "black";
		ctx.fillStyle = "red";
		ctx.fill();
		ctx.stroke();
	}
	
	canvas = $("<canvas class='goal' width='40' height='40'>").appendTo(document.body).hide();
	canvasDom = canvas[0];
	if (canvasDom.getContext){
		var ctx = canvasDom.getContext("2d");
		ctx.lineWidth = 3;
		ctx.lineCap = "round";
		ctx.beginPath();
		ctx.moveTo(0, 0);
		ctx.lineTo(40, 40);
		ctx.moveTo(40, 0);
		ctx.lineTo(0, 40);
		ctx.strokeStyle = "gold";
		ctx.stroke();
	}

	var prelude = $("<p>This traverses the following graph:");
	var graphTable = $("<table class='graph'>");

	for(var i = 0; i < graphArray.length; i++){
		var row = $("<tr>");
		for(var j = 0; j < graphArray[i].length; j++){
			row.append("<td class='" + graphArray[i].charAt(j) + "'><div></div></td>");
		}
		graphTable.append(row);
	}
	prelude.append(graphTable);
	
	$("#prelude").append(prelude);
};
