goog.provide('crow.Logger');

/**
 * Logging facilities for Crow.  Removed from production builds.
 */
(function(){

var globalScope = goog.global;

var LOG_LEVEL = {
	"error": 1,
	"warn": 2,
	"info": 3,
	"debug": 4,
	"off": -Infinity
};

var appender = globalScope.console ? console : {};

var GLOBAL_LOG_LEVEL = LOG_LEVEL["warn"];

crow.Logger = function(klass){
	this.klass = klass;
};

crow.Logger.prototype.getLogLevel = function(){
	if(typeof this.klass.LOG_LEVEL !== "undefined"){
		return this.klass.LOG_LEVEL;
	} else {
		return GLOBAL_LOG_LEVEL;
	}
};

crow.Logger.prototype.error = function(){
	var args = Array.prototype.slice.call(arguments, 0);
	args[0] = "Crow Error: " + args[0];
	if(appender && appender.error && this.getLogLevel() >= 1){
		appender.error.apply(appender, args);
	}
};

crow.Logger.prototype.warn = function(){
	var args = Array.prototype.slice.call(arguments, 0);
	args[0] = "Crow Warning: " + args[0];
	if(appender && appender.warn && this.getLogLevel() >= 2){
		appender.warn.apply(appender, args);
	}
};

crow.Logger.prototype.info = function(){
	var args = Array.prototype.slice.call(arguments, 0);
	args[0] = "Crow Info: " + args[0];
	if(appender && appender.info && this.getLogLevel() >= 3){
		appender.info.apply(appender, args);
	}
};

crow.Logger.prototype.debug = function(){
	var args = Array.prototype.slice.call(arguments, 0);
	args[0] = "Crow Debug: " + args[0];
	if(appender && appender.debug && this.getLogLevel() >= 4){
		appender.debug.apply(appender, args);
	}
};
crow.Logger.prototype.setLevel = function(level){
	return crow.Logger.setLevel(level, this.klass);
};

crow.Logger.setLevel = function(level, klass){
	var newLevel = LOG_LEVEL[level.toLowerCase()];
	if(typeof newLevel !== "number"){
		throw new Error("Invalid log level: " + level);
	}
	if(klass){
		klass.LOG_LEVEL = newLevel;
	} else {
		GLOBAL_LOG_LEVEL = newLevel;
	}
};

crow.Logger.setAppender = function(newAppender){
	appender = newAppender;
};

})();
