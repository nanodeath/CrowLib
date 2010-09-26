goog.provide('crow.structs.NDArray');
goog.require('crow.util.Assert');

/**
 * @constructor
 */
crow.structs.NDArray = function(dimensions){
	this.arr = [];
	/** How deep this array is.  2 represents a 2-dimensional array. */
	this.dimensions = dimensions;
};

crow.structs.NDArray.prototype.add = function(value){
	if(arguments.length - 1 != this.dimensions){
		throw new Error(crow.assert.IncorrectArgumentCount(arguments.length, this.dimensions + 1));
	}
	var parentArray = this.arr, array = parentArray, l = arguments.length;
	for(var i = 1; i < l - 1; i++){
		array = parentArray[arguments[i]];
		if(typeof array === "undefined"){
			array = parentArray[arguments[i]] = [];
		}
		parentArray = array;
	}
	array[arguments[l-1]] = value;
}

crow.structs.NDArray.prototype.get = function(){
	if(arguments.length != this.dimensions){
		throw new crow.assert.IncorrectArgumentCount(arguments.length, this.dimensions);
	}
	var arr = this.arr;
	for(var i = 0; i < arguments.length && typeof arr !== "undefined"; i++){
		arr = arr[arguments[i]];
	}
	return arr;
};

crow.structs.NDArray.prototype.each = function(callback){
	for(var i = 0; i < this.arr.length; i++){
		var el = this.arr[i];
		if(typeof el !== "undefined"){
			this._each(callback, el, [i]);
		}
	}
};
crow.structs.NDArray.prototype._each = function(callback, arr, path){
	// assuming typeof arr !== "undefined"
	if(arr instanceof Array && path.length <= this.dimensions){
		for(var i = 0; i < arr.length; i++){
			var newPath = path.slice(0).concat(i);
			var el = arr[i];
			if(typeof el !== "undefined"){
				this._each(callback, el, newPath);
			}
		}
	} else {
		var args = path;
		args.unshift(arr);
		callback.apply(this, args);
	}
};
