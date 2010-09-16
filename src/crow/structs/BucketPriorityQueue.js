goog.provide('crow.structs.BucketPriorityQueue');

/**
 * Creates a priority queue based on an array of arrays (or, buckets).
 * @constructor
 * @param {function(*, *): number} [key_comparator] Comparator that is used to order keys.  Should take two keys.  If k1 < k2, return -1.  If k1 > k2, return 1.  Else return 0.  If not provided, will use the default <, > and == comparators.
 */
crow.structs.BucketPriorityQueue = function(key_comparator/*, value_comparator*/){
	this.arr = [];
	/** The total number of values in this queue */
	this.length = 0;
	if(key_comparator){
		this.key_comparator = key_comparator
	} else {
		this.key_comparator = crow.structs.BucketPriorityQueue.DEFAULT_KEY_COMPARATOR;
	}
};

/**
 * @private
 */
crow.structs.BucketPriorityQueue.DEFAULT_KEY_COMPARATOR = function(k1, k2){
	if(k1 < k2) return -1;
	if(k1 > k2) return 1;
	return 0;
};

crow.structs.BucketPriorityQueue.REVERSE_KEY_COMPARATOR = function(k2, k1){
	if(k1 < k2) return -1;
	if(k1 > k2) return 1;
	return 0;
};

/**
 * Enqueue a value into the queue with the provided priority.
 * @param {*} key key (priority) associated with this value.  The key should be compatible with the key_comparator passed in the constructor.  If no key_comparator was passed in, this key will be compared using standard "<", ">", and "==" operators.
 * @param {*} value value to store in the queue.
 */
crow.structs.BucketPriorityQueue.prototype.enqueue = function(key, value){
	this.findBucket(key, true).push(value);
	this.length++;
};
/**
 * Remove and return the element with the lowest priority from the queue.
 * If the queue is empty, returns undefined.
 * @returns {*} element with lowest priority
 */
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
/**
 * Checks whether the queue contains the given value.
 * @param {*} value Value to check for in the queue
 * @param {*} [keyHint] Key that the value has.  Will speed lookup considerably if known and provided.
 * @return {Boolean} true if value found, false otherwise
 */
crow.structs.BucketPriorityQueue.prototype.contains = function(value, key_hint){
	if(key_hint){
		// TODO
		throw new Error("not implemented yet");
	} else {
		for(var i = 0; i < this.arr.length; i++){
			var bucket = this.arr[i];
			for(var j = 0; j < bucket.length; j++){
				var bucketValue = bucket[j];
				if(bucketValue == value){
					return true;
				}
			}
		}
	}
	return false;
};
/**
 * Removes the given value from the queue.
 * @param {*} value Value to remove from the queue
 * @param {*} [keyHint] Key that the value has.  Will speed lookup considerably if known and provided.
 * @return {*} The value that was in the queue, or undefined if the value wasn't found.
 */
crow.structs.BucketPriorityQueue.prototype.remove = function(value, key_hint){
	if(key_hint){
		// TODO
		throw new Error("not implemented yet");
	} else {
		for(var i = 0; i < this.arr.length; i++){
			var bucket = this.arr[i];
			for(var j = 0; j < bucket.length; j++){
				var bucketValue = bucket[j];
				if(bucketValue == value){
					
					bucket.splice(j, 1);
				
					// get rid of the bucket if it's empty
					if(!bucket.length){
						this.arr.splice(i, 1);
					}
					this.length--;
					return bucketValue;
				}
			}
		}
		return undefined;
	}
};
/**
 * Return the top element from the queue without removing it.
 * @returns {*} The top element, or if the queue is empty, undefined.
 */
crow.structs.BucketPriorityQueue.prototype.peek = function(){
	if(this.length) return this.arr[0][0];
};
/**
 * Returns the key of the top element in the queue without removing anything.
 * @returns {*} The top element's key, or if the queue is empty, undefined.
 */
crow.structs.BucketPriorityQueue.prototype.peekKey = function(){
	if(this.length) return this.arr[0].key;
};

/**
 * Find the bucket given a particular key using binary search.
 * @private
 * @param {*} key The key we're looking for
 * @param {Boolean} [createIfNotFound] Whether to create a bucket if none is found for the key.
 * @returns {Array} Bucket for the desired key.  If no bucket was found for the given key and createIfNotFound was false, undefined will be returned.
 */
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
		var inserted = false;
		for(var i = mid; i < this.arr.length && !inserted; i++){
			// "mid" is a good starting point, and will usually be within 2
			// indexes of the correct bucket.  As you might have guessed, it's
			// also always lower (or as low as) the key that needs to get inserted.
			if(kc(this.arr[i].key, key) > 0){
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
