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
	
	var testResults = {};
	
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
			runs: 10
		},
		{
			size: 5,
			expectedTime: 15,
			runs: 5
		},
		{
			size: 8,
			expectedTime: 1000,
			runs: 10
		}
	];
	
	var astarTests = [
		{
			size: 2,
			runs: 1000,
			expectedTime: 0.30,
			algo: "a*"
		},
		{
			size: 10,
			runs: 10,
			expectedTime: 10
		},
		{
			size: 25,
			expectedTime: 60
		}
	];

	var lpastarTests = [
		{
			size: 2,
			runs: 1000,
			expectedTime: 0.30,
			algo: "lpa*"
		},
		{
			size: 10,
			runs: 25,
			expectedTime: 10
		},
		{
			size: 25,
			expectedTime: 60
		}
	];

	function benchmark(func){
		var start = new Date();
		var subtract = func();
		var end = new Date();
		if(typeof subtract !== "number") subtract = 0;
		return end - start - subtract;
	}
	
	function makeTests(tests){
		var currentTest = {};
		for(var i = 0; i < tests.length; i++){
			currentTest = $.extend({}, currentTest, tests[i]);
			
			var generateTest = function(t, testName){
				return function(){
					var runs = t.runs;
					
					var setupTime = 0;
					var testCallback = function(){
						var graph;
						setupTime += benchmark(function(){
							graph = new crow.Graph();
							for(var j = 0; j < t.size; j++){
								for(var k = 0; k < t.size; k++){
									graph.addNode(new MyNode([j, k]));
								}
							}
						});
						
						var start = graph.getNode(0, 0), goal = graph.getNode(t.size - 1, t.size - 1);
						var path = graph.findGoal({start: start, goal: goal, algorithm: t.algo});
						if(!path.found) throw new Error("should be found");		
					};
					var total = benchmark(function(){
						for(var j = 0; j < t.runs; j++){
							testCallback();
						}
					});
					var average = (total - setupTime) / runs;
	
					ok(average <= t.expectedTime, "Graph takes <=" + t.expectedTime + "ms to evaluate (" + average + "ms) on modern browsers");
					testResults[testName] = average;
				}
			};
			
			var generateRegenTest = function(t, testName){
				if(t.size <= 7) return;
				return function(){

					var runs = t.runs;
					
					var setupTime = 0;
					var testCallback = function(){
						var graph;
						setupTime += benchmark(function(){
							graph = new crow.Graph();
							for(var j = 0; j < t.size; j++){
								for(var k = 0; k < t.size; k++){
									graph.addNode(new MyNode([j, k]));
								}
							}
						});
					
						var start = graph.getNode(0, 0), goal = graph.getNode(t.size - 1, t.size - 1);
					
						var path = graph.findGoal({start: start, goal: goal, algorithm: t.algo, baked: false});

						if(!path.found) throw new Error("should be found");		
						
						for(var i = 0; i < 5; i++){
							setupTime += benchmark(function(){
								var nodeIndex = Math.floor(path.nodes.length / 2);
								var n = path.nodes[nodeIndex];
								graph.removeNode(n.x, n.y);
								graph.invalidate(n.x, n.y);
							});
							
							if(path.found) throw new Error("should not be found after graph modification: " + i)
							path.continueCalculating();
							if(!path.found) throw new Error("should be found after continuing: " + i);
						}
					};
					var total = benchmark(function(){
						for(var j = 0; j < t.runs; j++){
							testCallback();
						}
					});
					var average = (total - setupTime) / runs;
					
					ok(average <= t.expectedTime, "Graph takes <=" + t.expectedTime + "ms to evaluate (" + average + "ms)");
					testResults[testName] = average;
				};
			};
			var testName = "Graph size " + currentTest.size + " with " + currentTest.algo;
			test(testName, generateTest(currentTest, testName));
			testName = "Graph size " + currentTest.size + " with " + currentTest.algo + " and 5 graph permutations";
			var testToRun = generateRegenTest(currentTest, testName);
			if(testToRun) test(testName, testToRun);
		}
	};
	makeTests(dijkstraTests);
	makeTests(astarTests);
	makeTests(lpastarTests);
	
	var testAndSaveButton = $("<button>Save</button>");
	testAndSaveButton.appendTo("#controls");
	testAndSaveButton.click(function(){
		var n = prompt("Name or id for this unit (i.e. Max, or Max-Laptop, or Max-Laptop-BatteryPower)");
		if(n){
			$.post("/benchmark", {name: n, useragent: {string: navigator.userAgent, version: $.browser.version, webkit: $.browser.webkit, opera: $.browser.opera, msie: $.browser.msie, mozilla: $.browser.mozilla}, results: testResults});
		}
	});
}
