goog.provide('crow.ConnectedNode');
goog.require('crow.Node');

/**
 * ConnectedNodes are nodes that have to be explicitly "connected" to other nodes.
 * @class
 */

crow.ConnectedNode = function(id){
	crow.Node.apply(this, arguments);
	this.connections = [];
	this.connectionDistances = {};
};
crow.ConnectedNode.prototype = new crow.Node();
crow.ConnectedNode.prototype.connectTo = function(otherNode, distance, symmetric){
	if(typeof distance == "undefined") distance = 1;
	this.connections.push(otherNode);
	this.connectionDistances[otherNode.id] = distance;
	if(typeof symmetric !== "false" && otherNode instanceof crow.ConnectedNode){
		otherNode.connections.push(this);
		otherNode.connectionDistances[this.id] = distance;
	}
};
crow.ConnectedNode.prototype.getNeighbors = function(){
	return this.connections;
};
crow.ConnectedNode.prototype.distanceToNeighbor = function(otherNode){
	return this.connectionDistances[otherNode.id] || Infinity;
}
