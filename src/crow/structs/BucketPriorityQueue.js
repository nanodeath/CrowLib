goog.provide('crow.structs.BucketPriorityQueue');

crow.structs.BucketPriorityQueue = function(/*key_comparator, value_comparator*/){
	this.arr = [];
	this.length = 0;
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
				return true;
			}
		}
	}
	return false;
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
				return true;
			}
		}
	}
	return false;
};
crow.structs.BucketPriorityQueue.prototype.findBucket = function(key, createIfNotFound){
	// implemented linearly for now -- can be improved with binary search
	var bucket;
	for(var i = 0; i < this.arr.length; i++){
		var currentBucket = this.arr[i];
		if(currentBucket.key == key){
			bucket = currentBucket;
			break;
		}
	}
	if(!bucket && createIfNotFound){
		bucket = [];
		bucket.key = key;

		var inserted = false;
		for(var i = 0; i < this.arr.length && !inserted; i++){
			if(this.arr[i].key > key){
				this.arr.splice(i, 0, bucket);
				inserted = true;
			}
		}
		if(!inserted){
			this.arr.push(bucket);
		}
	}
	return bucket;
};
