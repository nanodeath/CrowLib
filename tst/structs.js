goog.require('crow.structs.BucketPriorityQueue');

window["test"] = window["test"] || {};
window["test"]["structures"] = function(){
	module("BucketsPriorityQueue", {
		setup: function(){
			this.q = new crow.structs.BucketPriorityQueue();
			this.populatedQ = new crow.structs.BucketPriorityQueue();
			
			for(var i = 0; i < 10; i++){
				var count = i % 4;
				for(var j = 0; j <= count; j++){
					this.populatedQ.enqueue(i, "element_" + i + "_" + j);
				}
			}
			// should have: 0: [element_0_0], 1: [element_1_0, element_1_1], 2: [element_2_0, element_2_1, element_2_2], 3: [element_3_0, element_3_1, element_3_2, element_3_3]
			// then 4: [element_4_0], 5: [element_5_0, element_5_1], 6: [element_6_0, element_6_1, element_6_2], 7: [element_7_0, element_7_1, element_7_2, element_7_3]
			// finally 8: [element_8_0], 9: [element_9_0, element_9_1]
			
			// Key is two-element array
			this.keyQ = new crow.structs.BucketPriorityQueue(function(k1, k2){
				if(k1[0] < k2[0] || (k1[0] == k2[0] && k1[1] < k2[1])) return -1;
				if(k1[0] == k2[0] && k1[1] == k2[1]) return 0;
				return 1;
			});
		}
	});
	test("enqueue", function(){
		this.q.enqueue(1, "foo");
		this.q.enqueue(2, "bar");
		equals(this.q.length, 2, "length correct with safe keys");
		this.q.enqueue(2, "baz");
		equals(this.q.length, 3, "length correct with duplicate keys");
		this.q.enqueue(2, "a");
		this.q.enqueue(1, "b");
		this.q.enqueue(3, "c");
		equals(this.q.length, 6, "length correct with a few more random keys");
	});
	test("dequeue", function(){
		this.q.enqueue(2, "bar");
		this.q.enqueue(1, "foo");
		equals(this.q.length, 2, "length correct before dequeue");
		equals(this.q.dequeue(), "foo", "basic dequeue");
		equals(this.q.length, 1, "length correct after dequeue");
		this.q.enqueue(2, "baz");
		equals(this.q.dequeue(), "bar", "dequeueing element with duplicate key");
		equals(this.q.dequeue(), "baz", "dequeueing last element");
		equals(this.q.length, 0, "length correct after dequeueing everything");
	});
	test("contains", function(){
		window.q = this.populatedQ;
		ok(this.populatedQ.contains("element_0_0") != null);
		ok(this.populatedQ.contains("element_1_0") != null);
		ok(this.populatedQ.contains("element_3_2") != null);
		ok(this.populatedQ.contains("element_8_0") != null);
		this.populatedQ.dequeue();
		ok(!this.populatedQ.contains("element_0_0") != null);
		this.populatedQ.dequeue();
		ok(!this.populatedQ.contains("element_1_0") != null);
	});
	test("remove", function(){
		var arr = ["element_0_0", "element_1_0", "element_3_2", "element_8_0"];
		for(var i = 0; i < arr.length; i++){
			ok(this.populatedQ.contains(arr[i]) != null);
		}
		for(var i = 0; i < arr.length; i++){
			ok(this.populatedQ.remove(arr[i]) != null);
		}
	});
	test("enqueue with custom key comparator", function(){
		this.keyQ.enqueue([1, 1], "a");
		this.keyQ.enqueue([1, 0], "b");
		this.keyQ.enqueue([2, 0], "c");
		this.keyQ.enqueue([3, 1], "d");
		this.keyQ.enqueue([1, 0], "bb");
		this.keyQ.enqueue([3, 1], "dd");
		
		var expected = ["b", "bb", "a", "c", "d", "dd"];
		for(var i = 0; i < expected.length; i++){
			equals(this.keyQ.dequeue(), expected[i], "Element " + i + " is as expected");
		}
	});
};
