goog.require('crow.Graph');
goog.require('crow.BaseNode');

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
	
	// Design a maze!
	var button = $("<button>Design!</button>");
	button.click(function(){
		var graphTable = $("<table class='graph'>");
		graphTable.click(function(e){
			var cell = $(e.target);
			var position = cell.data("position");
			cell.toggleClass("wall");
			if(cell.hasClass("wall")){
				mazeGraph.removeNode(position[0], position[1]);
			} else {
				mazeGraph.addNode(position[0], position[1]);
			}
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
		console.log($("table.graph tr:nth-child(" + (y+1) + ") td:nth-child(" + (x+1) + ") div"))
		return $("table.graph tr:nth-child(" + (y+1) + ") td:nth-child(" + (x+1) + ") div");
	}
	
	// Play
	var play = $("<button>Play!</button>");
	play.click(function(){
		$("table.graph td").addClass("foggy");
		canvas.show();
		canvas.appendTo(getCell(0, 7));
		var graph = mazeGraph.makeGraph();
		
		var player = function(x, y){
			var range = 3;
			this.start = function(){
				this.liftFog();
				this.step();
			};
			this.step = function(){
				var path = graph.findGoal({start: graph.getNode(x, y), goal: graph.getNode(7, 0), algorithm: "a*"})
				var nodes = path.nodes;
				if(nodes.length < 2){
					if(!path.found){
						alert(":( you suck");
					} else {
						return;
					}
				}
				var nextNode = nodes[1];
				var nextCell = getCell(nextNode.getX(), nextNode.getY());

				canvas.appendTo(nextCell);

				var me = this;
				x = nextNode.getX(), y = nextNode.getY();
				this.liftFog();
				setTimeout(function(){me.step.call(me)}, 500);
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
		(new player(0, 7)).start();
	});
	$("#controls").append(button).append(play);
};
