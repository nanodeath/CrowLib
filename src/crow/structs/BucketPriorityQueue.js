goog.provide('crow.structs.BucketPriorityQueue');

crow.structs.BucketPriorityQueue = function(key_comparator/*, value_comparator*/){
	this.arr = [];
	this.length = 0;
	if(key_comparator){
		this.key_comparator = key_comparator
	} else {
		this.key_comparator = this.DEFAULT_KEY_COMPARATOR;;
	}
};

crow.structs.BucketPriorityQueue.prototype.DEFAULT_KEY_COMPARATOR = function(k1, k2){
	if(k1 < k2) return -1;
	if(k1 > k2) return 1;
	return 0;
};

crow.structs.BucketPriorityQueue.prototype.enqueue = function(key, value){
	this.findBucket(key, true).push(value);
	this.length++;
};
crow.structs.BucketPriorityQueue.prototype.dequeue = function(){
	var element;
	if(this.length){
		var bucket = this.arr[0];
		element = bucket.shift();
		
		// Delete the bucket if it's empty
		if(!bucket.length){
			this.arr.shift();
		}
		this.length--;
	}
	return element;
};
crow.structs.BucketPriorityQueue.prototype.contains = function(value, key_hint){
	for(var i = 0; i < this.arr.length; i++){
		var bucket = this.arr[i];
		for(var j = 0; j < bucket.length; j++){
			var bucketValue = bucket[j];
			if(bucketValue == value){
				return bucket.key;
			}
		}
	}
	return null;
};
crow.structs.BucketPriorityQueue.prototype.remove = function(value, key_hint){
	for(var i = 0; i < this.arr.length; i++){
		var bucket = this.arr[i];
		for(var j = 0; j < bucket.length; j++){
			var bucketValue = bucket[j];
			if(bucketValue == value){
				bucket.splice(j, 1);
				
				if(!bucket.length){
					this.arr.splice(i, 1);
				}
				return bucket.key;
			}
		}
	}
	return null;
};
crow.structs.BucketPriorityQueue.prototype.peek = function(){
	if(this.length) return this.arr[0][0];
};
crow.structs.BucketPriorityQueue.prototype.peekKey = function(){
	if(this.length) return this.arr[0].key;
};

crow.structs.BucketPriorityQueue.prototype.findBucket = function(key, createIfNotFound){
	var bucket;
	var kc = this.key_comparator;
	var lowerBound = 0, upperBound = this.arr.length-1;
	var min = 0, max = this.arr.length - 1, mid, comp;
	while(min <= max){
		mid = min + Math.floor((max - min) / 2);
		var currentBucket = this.arr[mid];
		comp = kc(currentBucket.key, key);
		if(comp < 0){
			min = mid + 1;
		} else if(comp > 0){
			max = mid - 1;
		} else {
			bucket = currentBucket;
			break;
		}
	}

	if(!bucket && createIfNotFound){
		bucket = [];
		bucket.key = key;
		//this.arr.splice(min, 0, bucket);
		///*
		var inserted = false;
		for(var i = mid; i < this.arr.length && !inserted; i++){
			// "mid" is a good starting point, and will usually be within 2
			// indexes of the correct bucket.
			if(kc(this.arr[i].key, key) > 0){
				this.arr.splice(i, 0, bucket);
				inserted = true;
			}
		}
		//console.log("min,mid,max was %d,%d,%d, i was %d (guessed %d)", min, mid, max, i, guess);
		if(!inserted){
			this.arr.push(bucket);
		}
		//*/
	}
	return bucket;
};
