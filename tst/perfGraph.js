goog.require('crow.Graph');
goog.require('crow.BaseNode');
goog.require('crow.util.Test');

window["test"] = window["test"] || {};
window["test"]["perfGraph"] = function(){
	function TestSuite(name, target){
		this.name = name;
		this.target = target;
	}
	TestSuite.prototype.render = function(){
		var table = $("<table class='testSuite'>");
		
		var titleRow = $("<tr>");
		titleRow.append("<th>"); // empty corner
		for(var i = 0; i < this.columns.length; i++){
			titleRow.append("<th>" + this.columns[i] + "</th>");
		}
		table.append(titleRow);
		for(var i = 0; i < this.rows.length; i++){
			var tr = $("<tr>");
			tr.append("<th>" + this.rows[i] + "</th>");
			for(var j = 0; j < this.columns.length; j++){
				tr.append("<td>&nbsp;</td>");
			}
			table.append(tr);
		}
		table.appendTo(this.target);
		this.table = table;
	};
	TestSuite.prototype.renderExample = function(heading, graph, path){
		var div = $("div.example", this.target);
		if(!div.length){
			div = $("<div class='example'>").append("<h2>").append("<div class='graph'>");
			div.appendTo(this.target);
		}
		$("h2:eq(0)", div).text(heading);
		var table = $("<table class='graph'>");
		for(var y = 0; y < graph.height; y++){
			var row = $("<tr>");
			for(var x = 0; x < graph.width; x++){
				var cell = $("<td>");
				var node = graph.getNode(x, y);
				if(node.wall){
					cell.addClass("wall");
				} else {
					if(node == path.start){
						cell.addClass("start");
					}
					if(node == path.end){
						cell.addClass("end");
					}
					if(path.nodes.indexOf(node) >= 0){
						cell.addClass("onPath");
					}
				}
				cell.appendTo(row);
			}
			row.appendTo(table);
		}
		$("div.graph", this.target).empty().append(table);
	};
	TestSuite.prototype.setRows = function(arr){
		this.rows = arr;
	};
	TestSuite.prototype.setColumns = function(arr){
		this.columns = arr;
	};
	TestSuite.prototype.initialize = function(row, column){};
	TestSuite.prototype.runAll = function(){
		// initialize contexts
		var rowContexts = [];
		for(var i = 0; i < this.rows.length; i++){
			var ctx = {};
			ctx.index = i;
			ctx.value = this.rows[i];
			rowContexts.push(ctx);
		}
		var columnContexts = [];
		for(var i = 0; i < this.columns.length; i++){
			var ctx = {};
			ctx.index = i;
			ctx.value = this.columns[i];
			columnContexts.push(ctx);
		}
		
		// run tests
		var jobs = [];
		for(var i = 0; i < this.rows.length; i++){
			var row = this.rows[i];
			for(var j = 0; j < this.columns.length; j++){
				var column = this.columns[i];
				var cell = $("tr:nth-child(" + (i+2) + ") *:nth-child(" + (j+2) + ")", this.table);
				/*
				var me = this;
				var run = function(td, row, column){
					return function(){
						me.run.call(td, row, column);
					}
				};
				*/
				//run();
				var job = [cell, rowContexts[i], columnContexts[j]];
				jobs.push(job);
				//(run(cell, rowContexts[i], columnContexts[i]))();
				//setTimeout(, 50);
				//setTimeout(function(){ me.run.call(cell, rowContexts[i], columnContexts[i]) }, 1);
			}
		}
		// initialize
		var i = 0
		var me = this;
		var slowRows = [];
		function initialize(){
			var test = jobs[i++];
			if(test){
				var cell = test[0];
				try {
					cell.addClass("initializing");
					me.initialize.apply(me, test);
					cell.addClass("initialized");
				} catch(e){
					console.log(e);
					console.error(e);
					cell.addClass("error");
				} finally {
					cell.removeClass("initializing");
				}
				setTimeout(initialize, 10);
			} else {
				runNextTest();
				//console.log("done init?");
			}
		}
		
		var j = 0;
		function runNextTest(){
			var test = jobs[j++];
			if(test){
				var cell = test[0];
				if(!cell.hasClass("error")){
					cell.removeClass("initialized");
					if(slowRows[test[0].index] != 1){
						try {
							me.run.apply(me, test);
						} catch(e){
							if(e.message == "slow"){
								console.log("slow! %d", test[0].index);
								slowRows[test[0].index] = 1;
							} else {
								console.log(e);
								console.error(e);
								cell.addClass("error");
							}
						}
					} else {
						cell.addClass("didNotFinish");
					}
				}
				setTimeout(runNextTest, 10);
			}
		}
		initialize();
	};
	TestSuite.prototype.run = function(row, column){}
	
	function MyNode(arr){ this.x = arr[0]; this.y = arr[1]; this.wall = false; };
	MyNode.prototype = new crow.BaseNode();
	MyNode.prototype.getX = function(){ return this.x; };
	MyNode.prototype.getY = function(){ return this.y; };
	MyNode.prototype.distanceAlgorithm = crow.GraphUtil.distance.manhattan;
	MyNode.prototype.distanceToNeighbor = function(other){
		if(other.wall) return Infinity;
		return this.distanceToGoal(other);
	};
	
	function randomGridworld(size, wallRatio, nodeKlass){
		var graph = new crow.Graph();
	
		for(var j = 0; j < size; j++){
			for(var k = 0; k < size; k++){
				var node = new nodeKlass([j, k]);
				graph.addNode(node);
			}
		}
	
		var walls = Math.ceil(Math.pow(size, 2) * wallRatio);
		for(var j = 0; j < walls; j++){
			var x = Math.floor(Math.random()*size),
				  y = Math.floor(Math.random()*size);
			var node = graph.getNode(x, y);
			if(!node.wall){
				node.wall = true;
			} else {
				j--;
			}
		}
		return graph;
	}
	
	function OnePassTestSuite(div){
		TestSuite.call(this, "One-Pass Suite", div);
		this.timePerTest = 3;
	};
	OnePassTestSuite.prototype = new TestSuite();
	OnePassTestSuite.prototype.initialize = function(div, row, column){
		var size = parseInt(column.value);
		if(!column.graphs){
			var graphs = [];
			for(var i = 0; i < 25; i++){
				var graph = randomGridworld(size, 0.25, MyNode);
			
				var start = null, goal = null;
				while(!start || start.wall){
					var x = Math.floor(Math.random()*size),
							y = Math.floor(Math.random()*size);
					start = graph.getNode(x, y);
				}
				while(!goal || goal.wall){
					var x = Math.floor(Math.random()*size),
							y = Math.floor(Math.random()*size);
					goal = graph.getNode(x, y);
				}
			
				graph.start = start;
				graph.goal = goal;
				var path = graph.findGoal({start: graph.start, goal: graph.goal, algorithm: "a*"});
				if(path.found){
					graph.expectedPathLength = path.length;
					graphs.push(graph);				
				} else {
					i--;
				}
			}
			column.graphs = graphs;
		}
	};
	OnePassTestSuite.prototype.run = function(div, row, column){
		var graphIndex = 0;
		var me = this;
		function test(algo){
			var exampleGraph, examplePath, longestPath = 0;
			var results = crow.util.Test.benchTime({
				callback: function(){
					var graph = column.graphs[graphIndex % column.graphs.length];
					var path = graph.findGoal({start: graph.start, goal: graph.goal, algorithm: algo});
					if(!path.found){
						window.badGraph = graph;
						console.error("%o, %o", graph, path);
						throw new Error(algo + ": " + graphIndex + ": should be found");
					}
					if(path.length != graph.expectedPathLength){
						console.info("%s (%d): expected path to be %d but was %d", algo, graphIndex % column.graphs.length, graph.expectedPathLength, path.length);
					}
					graphIndex++;
					// pick the graph with the longest path
					if(path.length > longestPath){
						exampleGraph = graph;
						examplePath = path;
						longestPath = path.length;					
					}
					// pick a random graph/path as we go along
					if(Math.random() < 1 / graphIndex){

					}
				},
				runFor: 2/*,
				runFor: this.timePerTest*/
			});
			var s = results.secondsPerIteration;
			var ms = Math.round(s * 100000.0) / 100.0;
			$(div).html("<span title='" + results.iterations + " in " + results.time + "ms'>" + ms + "ms</span>");
			me.renderExample("heading!" + Math.random(), exampleGraph, examplePath);
			if(results.iterations <= 1){
				throw new Error("slow");
			}
		}
		var map = {
			"Dijkstra": "dijkstra",
			"A*": "a*",
			"LPA*": "lpa*",
			"FRA*": "fra*"
		};
		var val = map[row.value];
		if(val){
			test(val);
		}
	};
	
	var runButton = $("<button>Run One-Pass</button>");
	runButton.appendTo("#controls");
	runButton.click(function(){
		$(this).attr("disabled", "disabled");
		var div = $("<div class='onePass'>").appendTo("#prelude");
		var suite = new OnePassTestSuite(div);
		var rows = ["A*", "LPA*", "FRA*"];
		// rows.unshift("Dijkstra"); // too slow!
		suite.setRows(rows);
		suite.setColumns([9, 16, 25, 36, 49, 64, 81, 100]);
		suite.render();
		suite.runAll();
	});
};
