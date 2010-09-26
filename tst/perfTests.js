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
			expectedTime: 0.25,
			algo: "dijkstra",
			runFor: 5
		},
		{
			size: 4,
			expectedTime: 5
		},
		{
			size: 5,
			expectedTime: 15
		},
		{
			size: 8,
			expectedTime: 1000
		}
	];
	
	var astarTests = [
		{
			size: 2,
			expectedTime: 0.30,
			algo: "a*",
			runFor: 5
		},
		{
			size: 10,
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
			expectedTime: 0.30,
			algo: "lpa*",
			runFor: 5
		},
		{
			size: 10,
			expectedTime: 10
		},
		{
			size: 25,
			expectedTime: 60
		}
	];
	
	var frastarTests = [
		{
			size: 2,
			expectedTime: 0.30,
			algo: "fra*",
			runFor: 5
		},
		{
			size: 10,
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
					var results = benchTime({callback:testCallback, runFor: t.runFor, checkEvery: 20});
					var average = (results.time - setupTime) / results.iterations;
					var displayAverage = Math.round(average * 1000) / 1000;
					//console.log(testName + ": %o (setupTime: %o)", results, setupTime);
	
					ok(average <= t.expectedTime, "Graph takes <=" + t.expectedTime + "ms to evaluate (" + displayAverage + "ms; " + results.iterations + " runs in " + results.time + "ms) on modern browsers");
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
					var results = benchTime({callback:testCallback, runFor: t.runFor});
					var average = (results.time - setupTime) / results.iterations;
					var displayAverage = Math.round(average * 1000) / 1000;
					ok(average <= t.expectedTime, "Graph takes <=" + t.expectedTime + "ms to evaluate (" + displayAverage + "ms; " + results.iterations + " runs) on modern browsers");
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
	
	function benchTime(opts){
		var checkEvery = opts.checkEvery || 1;
		var runFor = opts.runFor || 1;
		var callback = opts.callback;
		var setup = opts.setup;
		runFor = runFor * 1000;
		
		var done = false;
		var actualEnd;
		var start = new Date(), end = new Date();
		end = end.setTime(end.getTime() + runFor);

		var i = 0;
		while(true){
			var context = {};
			
			callback();
			//if(i++ >= 2) break;
			///*
			if(++i % checkEvery === 0 && (actualEnd = new Date()) >= end){
				break;
			}
			//*/
		}
		/*
		var subtractionStart = new Date(), blah;
		var j = 0;
		for(var k = 0; k < i; k++){
			if(++j % checkEvery === 0 && (blah = new Date()) >= end){}
		}
		var subtraction = subtractionStart - new Date();
		*/
		
		return {
			start: start,
			end: actualEnd,
			iterations: i,
			iterationsPerSecond: i / ((actualEnd - start) / 1000.0),
			time: (actualEnd - start)/*,
			timeCheckingConditions: subtraction*/
		};
	}
	
	test("time-based tests", function(){
		var done = false;
		var actualEnd;
		var start = new Date(), end = new Date();
		end = end.setTime(end.getTime() + 2000);
		ok("done");
	});
	
	var testAndSaveButton = $("<button>Save</button>");
	testAndSaveButton.click(function(){
		var n = prompt("Name or id for this unit (i.e. Max, or Max-Laptop, or Max-Laptop-BatteryPower)");
		if(n){
			$.post("/benchmark", {name: n, useragent: {string: navigator.userAgent, version: $.browser.version, webkit: $.browser.webkit, opera: $.browser.opera, msie: $.browser.msie, mozilla: $.browser.mozilla}, results: testResults});
		}
	});
	var runButton = $("<button>Run Tests</button>");
	runButton.appendTo("#controls");
	runButton.click(function(){
		$(this).attr("disabled", "disabled");
		makeTests(dijkstraTests);
		makeTests(astarTests);
		makeTests(lpastarTests);
		makeTests(frastarTests);
		testAndSaveButton.appendTo("#controls");	
	});
}
