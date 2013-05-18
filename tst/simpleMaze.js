goog.require('crow.Graph');
goog.require('crow.BaseNode');

window["test"] = window["test"] || {};
window["test"]["simpleMaze"] = function(){
	/**
	 * @constructor
	 */
	function MyNode(arr){ this.arr = arr; };
	MyNode.prototype = new crow.BaseNode();
	MyNode.prototype.getX = function(){ return this.arr[0]; };
	MyNode.prototype.getY = function(){ return this.arr[1]; };
	MyNode.prototype.distanceAlgorithm = crow.GraphUtil.distance.manhattan;


	function generateMaze(x_size, y_size, difficulty){
		var failed_attempt_limit = difficulty, failed_attempts = 0;

		var graph = new crow.Graph();
		var width = x_size, height = y_size;
		for(var i = 0; i < width; i++){
			for(var j = 0; j < height; j++){
				graph.addNode(new MyNode([i, j]));
			}
		}

		var solution;
		while(failed_attempts < failed_attempt_limit){
			var x = Math.floor(Math.random() * width);
			var y = Math.floor(Math.random() * height);
			if((x == 0 && y == 0) || (x == width - 1 && y == height - 1)) continue;
			graph.removeNode(x, y)
			var shortestPath = graph.findGoal({start:graph.getNode(0, 0), goal: graph.getNode(width-1, height-1), algorithm: "a*"});
			if(!shortestPath.found){
				failed_attempts++;
				graph.addNode(new MyNode([x, y]));
			} else {
				solution = shortestPath;
			}
		}
		return {solution: solution, graph: graph, width: width, height: height};
	}

	var width = $("<span>Width: <input value='16' type='text'/></span>"), height = $("<span>Height: <input value='16' type='text'/></span>");
	var difficulty = $("<span><abbr title='Number of node removal failures to tolerate'>\"Difficulty\"</abbr><input value='5' type='text'/></span>");
	var newMazeButton = $("<button>New Maze</button>");
	var text = "So here you can generate mazes.  Yes, they're not very good mazes, but " +
		"they're the best you can do using pathfinding algorithms this way (I think).  Anyway, " +
		"just an example...enjoy.";
	newMazeButton.click(function(e){
		$("#prelude").empty();
		var graphTable = $("<table class='graph'>");
		var w = parseInt(width.val()), h = parseInt(height.val()), d = parseInt(difficulty.val());
		if(w < 1 || h < 1 || d < 1 || isNaN(w) || isNaN(h) || isNaN(d)) {
			alert("Form values must be > 0");
			return;
		}
		var maze = generateMaze(w, h, d);
		var nodes = maze.graph.nodes;
		var graphArray = [];
		for(var i = 0; i < nodes.length; i++){
			var n = nodes[i];
			var x = n.getX(), y = n.getY();
			if(!graphArray[y]) graphArray[y] = [];
				graphArray[y][x] = 1;
			}
		for(var i = 0; i < maze.height; i++){
			var row = $("<tr>");
			for(var j = 0; j < maze.width; j++){
				var n = graphArray[i] && graphArray[i][j];
				var klass = n ? "floor" : "wall";
				row.append("<td class='" + klass + "'><div></div></td>");
			}
			graphTable.append(row);
		}

		$("#prelude").append("<p>" + text + "</p>").append(graphTable);

		e.preventDefault();
	});
	$("#controls").append(width).append(height).append(difficulty).append(newMazeButton);
	$("#prelude").append(text);
	width = width.find("input"), height = height.find("input"), difficulty = difficulty.find("input");

};
