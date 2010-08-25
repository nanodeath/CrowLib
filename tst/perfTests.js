goog.require('crow.Graph');
goog.require('crow.BaseNode');

window["test"] = window["test"] || {};
window["test"]["perfTests"] = function(){
	/**
	 * @constructor
	 */
	function MyNode(arr){ this.x = arr[0]; this.y = arr[1]; };
	MyNode.prototype = new crow.BaseNode();
	MyNode.prototype.getX = function(){ return this.x; };
	MyNode.prototype.getY = function(){ return this.y; };
	MyNode.prototype.distanceAlgorithm = crow.GraphUtil.distance.manhattan;
	
	var tinyGraphArray = [
		"--",
		"--"
	];
	
	var dijkstraTests = [
		{
			size: 2,
			runs: 1000,
			expectedTime: 0.25,
			algo: "dijkstra"
		},
		{
			size: 4,
			expectedTime: 5,
			runs: 5
		},
		{
			size: 5,
			expectedTime: 50
		},
	];
	
	var astarTests = [
		{
			size: 2,
			runs: 1000,
			expectedTime: 0.25,
			algo: "a*"
		},
		{
			size: 10,
			runs: 10,
			expectedTime: 10
		},
		{
			size: 25,
			expectedTime: 50
		},
	];

	function benchmark(func){
		var date = new Date();
		func();
		return new Date() - date;
	}
	
	function makeTests(tests){
		var currentTest = {};
		for(var i = 0; i < tests.length; i++){
			currentTest = $.extend({}, currentTest, tests[i]);
			var testName = "Graph size " + currentTest.size + " with " + currentTest.algo;
			
			var generateTest = function(t){
				return function(){
					var runs = t.runs;
			
					var graph = new crow.Graph();
					for(var j = 0; j < t.size; j++){
						for(var k = 0; k < t.size; k++){
							graph.addNode(new MyNode([j, k]));
						}
					}
			
					var testCallback = function(){
						graph.findGoal({startNode: graph.getNode(0, 0), goal: graph.getNode(t.size - 1, t.size - 1), algorithm: t.algo});
					};
					var total = benchmark(function(){
						for(var j = 0; j < t.runs; j++){
							testCallback();
						}
					});
					var average = total / runs;
	
					ok(average <= t.expectedTime, "Graph takes <=" + t.expectedTime + "ms to evaluate (" + average + "ms) on modern browsers");
				}
			};
			test(testName, generateTest(currentTest));
		}
	};
	makeTests(dijkstraTests);
	makeTests(astarTests);
	/*
	module("findGoal: Dijkstra");
	test("base cost", function(){
		var runs = 1000;
		var graph = crow.Graph.fromArray(tinyGraphArray, function(x, y){
			return new MyNode([x, y]);
		});
		var testCallback = function(){
			graph.findGoal({startNode: graph.getNode(0, 0), goal: graph.getNode(1, 1)})
		};
		var total = benchmark(function(){
			for(var i = 0; i < runs; i++){
				testCallback();
			}
		});
		var average = total / runs;
		
		ok(average < 1, "Rudimentary graph takes <1ms to evaluate (" + average + "ms) on modern browsers");
	});
	*/
}
