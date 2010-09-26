goog.require('crow.BaseNode');
goog.provide('crow.util.Test');

if(typeof same !== "undefined"){
	
	// Wrap the regular same function, because otherwise _cachedHash trips up some of the tests.
	var oldSame = same;
	var newSame = function(){
		var newArgs = [];
		for(var i = 0; i < arguments.length; i++){
			var arg = arguments[i];
			if(arg instanceof crow.BaseNode){
				arg._initialize();
			}
			newArgs.push(arg);
		}
		return oldSame.apply(this, newArgs);
	}
	same = newSame;
}

if(typeof console !== "undefined"){
	console.logNodes = function(nodes, msg){
		msg = msg ? msg + ": " : "";
		var output = [];
		for(var i = 0; i < nodes.length; i++){
			output.push("[" + nodes[i].getX() + "," + nodes[i].getY() + "]");
		}
		console.log(msg + output.join(",") + " (length " + nodes.length + ")");
	};
}

crow.util.Test.benchTime = function(opts){
	var checkEvery = opts.checkEvery || 1;
	var runFor = opts.runFor || 1;
	var deadline = opts.deadline || runFor;
	var callback = opts.callback;
	var setup = opts.setup;
	runFor = runFor * 1000;
	deadline = deadline * 1000;
	
	var done = false;
	var actualEnd;
	var start = new Date(), end = new Date();
	end = end.setTime(end.getTime() + runFor);

	var i = 0;
	while(true){
		var context = {};
		
		callback();
		if(++i % checkEvery === 0 && (actualEnd = new Date()) >= end){
			break;
		}
	};
	var ms = actualEnd - start;
	var iterationsPerSecond = i / (ms / 1000.0);
	return {
		start: start,
		end: actualEnd,
		iterations: i,
		iterationsPerSecond: iterationsPerSecond,
		secondsPerIteration: 1.0 / iterationsPerSecond,
		time: ms/*,
		timeCheckingConditions: subtraction*/
	};
};
