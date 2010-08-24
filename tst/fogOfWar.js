goog.require('crow.Graph');
goog.require('crow.BaseNode');
goog.require('crow.Algorithm');

window["test"] = window["test"] || {};
window["test"]["fogOfWar"] = function(){
	/**
	 * @constructor
	 */
	function MyNode(arr){ this.arr = arr; };
	MyNode.prototype = new crow.BaseNode();
	MyNode.prototype.getX = function(){ return this.arr[0]; };
	MyNode.prototype.getY = function(){ return this.arr[1]; };
	MyNode.prototype.foggy = true;
	MyNode.prototype.isWalkable = true;
	MyNode.prototype.distanceAlgorithm = crow.GraphUtil.distance.manhattan;
	MyNode.prototype.distanceTo = function(other){
		if(!this.foggy && !this.isWalkable){
			return Infinity;
		} else {
			return crow.BaseNode.prototype.distanceTo.apply(this, arguments);
		}
	};
	
	var mazeGraph = new function(){
		this.array = [];
		this.addNode = function(x, y){
			if(!this.array[y]) this.array[y] = [];
			this.array[y][x] = true;
		};
		this.removeNode = function(x, y){
			this.array[y][x] = false;
		};
		this.makeGraph = function(){
			var graph = new crow.Graph();
			for(var i = 0; i < this.array.length; i++){
				for(var j = 0; j < this.array[i].length; j++){
					var n = new MyNode([j, i]);
					n.isWalkable = this.array[i][j];
					graph.addNode(n);
				}
			}
			return graph;
		};
	};
	
	// Circle thing
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
	var mode = null
	
	// Design a maze!
	var button = $("<button>Design!</button>");
	button.click(function(){
		mode = "design";
		var graphTable = $("<table class='graph'>");
		graphTable.click(function(e){
			if(mode == "design"){
				var cell = $(e.target);
				var position = cell.data("position");
				cell.toggleClass("wall");
				if(cell.hasClass("wall")){
					mazeGraph.removeNode(position[0], position[1]);
				} else {
					mazeGraph.addNode(position[0], position[1]);
				}
			}
			e.preventDefault();
		});
		for(var i = 0; i < 8; i++){
			var row = $("<tr>");
			for(var j = 0; j < 8; j++){
				var cell = $("<td><div></div></td>");
				if(i == 7 && j == 0){
					cell.find("div").text("S");
				} else if(i == 0 && j == 7){
					cell.find("div").text("E");
				}
				cell.data("position", [j, i]);
				row.append(cell);
				mazeGraph.addNode(j, i);
			}
			graphTable.append(row);
		}
		$("#prelude").empty().append(graphTable);
	});
	// Helpers
	function getCell(x, y){
		return $("table.graph tr:nth-child(" + (y+1) + ") td:nth-child(" + (x+1) + ") div");
	}
	
	var ScoreBox = function(player){
		var self = this;
		this.dom = $("<div class='scorebox'>");
		this.dom.append("<h2>Score</h2>");
		var scoreTable = $("<table>");
		scoreTable.append("<tr><th/><th>Count</th><th>Score</th></tr>");

		var row = $("<tr><td>Moves:</td></tr>");
		var moveCountEl = $("<td>").appendTo(row);
		var moveScoreEl = $("<td>").appendTo(row);
		var moveScoreMultiplier = 1;
		row.appendTo(scoreTable);
		
		row = $("<tr><td>Backtracks:</td></tr>");
		var backtracksCountEl = $("<td>").appendTo(row);
		var backtracksScoreEl = $("<td>").appendTo(row);
		var backtracksScoreMultiplier = 2;
		row.appendTo(scoreTable);

		row = $("<tr><td>Total:</td><td></td></tr>");
		var totalScoreEl = $("<td>").appendTo(row);
		row.appendTo(scoreTable);

		scoreTable.appendTo(this.dom);
		
		var moves, repeatMoves, movesScore, repeatMovesScore;
		
		this.reset = function(){
			moves = repeatMoves = movesScore = repeatMovesScore = 0;
		}
		this.updateTable = function(){
			moveCountEl.text(moves);
			moveScoreEl.text(movesScore);
			
			backtracksCountEl.text(repeatMoves);
			backtracksScoreEl.text(repeatMovesScore);
			
			totalScoreEl.text(movesScore + repeatMovesScore);
		};
		this.updateScores = function(){
			movesScore = moves*moveScoreMultiplier;
			repeatMovesScore = repeatMoves*backtracksScoreMultiplier;
		}
		canvas.bind("win", this.reset);
		canvas.bind("lose", this.reset);
		canvas.bind("move", function(e, data){
			moves++;
			if(data.alreadyVisited) repeatMoves++;
			self.updateScores();
			self.updateTable();
		});
		this.reset();
		this.updateTable();
	};
	
	// Play
	var play = $("<button>Play!</button>");
	play.click(function(){
		mode = "play";
		$("table.graph td").addClass("foggy");
		
		canvas.show();
		canvas.appendTo(getCell(0, 7));
		var graph = mazeGraph.makeGraph();
		
		var player = function(x, y){
			var visitedNodes;
			var range = 3;
			this.start = function(){
				visitedNodes = new crow.Algorithm.NodeMap(false);
				visitedNodes.set(graph.getNode(x, y), true);
				this.liftFog();
				this.step();
			};
			this.step = function(){
				var path = graph.findGoal({start: graph.getNode(x, y), goal: graph.getNode(7, 0), algorithm: "a*"})
				var nodes = path.nodes;
				if(nodes.length < 2){
					if(!path.found){
						alert(":( you suck");
						canvas.trigger("lose");
					} else {
						canvas.trigger("win");
						return;
					}
				}
				var nextNode = nodes[1];
				var nextCell = getCell(nextNode.getX(), nextNode.getY());
				canvas.trigger("move", [{alreadyVisited: visitedNodes.get(nextNode)}]);
				visitedNodes.set(nextNode, true);

				canvas.appendTo(nextCell);

				var me = this;
				x = nextNode.getX(), y = nextNode.getY();
				this.liftFog();
				setTimeout(function(){me.step.call(me)}, 333);
			};
			this.liftFog = function(){
				var currentNode = graph.getNode(x, y);
				var nodes = graph.getNodes();
				for(var i in nodes){
					var n = nodes[i];
					if(n.distanceTo(currentNode) <= range && n.foggy){
						n.foggy = false;
						getCell(n.getX(), n.getY()).closest("td").removeClass("foggy");
					}
				}
			};
		};
		var p = new player(0, 7);
		var score_box = new ScoreBox(p);
		$("#prelude").append(score_box.dom);
		p.start();
	});
	$("#prelude").html("<p>Hit design to build a maze starting at the S and leading to the E.  The longer the path, the better, and bonus points for forcing the AI to backtrack.  When you're done, hit Play.</p>");
	$("#controls").append(button).append(play);
};
