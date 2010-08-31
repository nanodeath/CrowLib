What is Crow
============
Crow is a collection of graph-traversal and pathfinding libraries.  It includes algorithms such as breadth-first search, Dijkstra's algorithm, and A*.  It can be used anywhere JavaScript is available; on the server or in the browser (though it's only been tested on the browser).

Usage
=====

Generally speaking, you follow three steps to use Crow in your application:

1. Extend crow.BaseNode with your own class.  See that source file for what methods you must override.
2. Add a collection of instances of your node class to an instance of crow.Graph.
3. Perform what operations you will, whether that's getNode() or getNodes() or findGoal(), upon the crow.Graph.

See the test.html in test/ for more examples.  There's even a helper that converts a 2d array of 1s and 0s into a graph.

Example
=======
See these examples in action by running the interactive test suite!  Head down to the Testing section below for more details.

Simple Maze
-----------
This example features questionable maze generation using the A* algorithm to generate a simple 16x16 maze.

Dunes and Demise
----------------
This example features multiple tile types (sand and grass; sand is twice as slow as grass) and both Dijkstra's Algorithm and A*.

Fog Of War
----------
This example demonstrates two things -- how to implement fog of war in your game (by giving nodes an attribute `known` or `visible` or `foggy` and making it appear walkable, even if it's a wall), 
and how to make a drawable maze using click events and tables.

Including in your app
=====================
There's two ways you can include Crow into your app -- either as a simple script tag or include with one of the automatically compiled scripts, or as a library in Google Closure.

Automatically-compiled script
-----------------------------
If you run `rake` (assuming you have the build-time requirements given lower down), three files will be generated for you at dist/js:

1. crow.mini.js: this compiled with `whitespace_only`.  Safest, but least compression.
2. crow.micro.js: this compiled with `simple_optimizations`.  Renames local variables and the like, but public API is untouched.  Little better compression.
3. crow.pico.js: this compiled with `advanced_optimizations`.  Pretty much everything gets renamed here, and because I haven't exported the public API yet, it's useless except as a demonstration of the compression unless you are also using the Google Closure compiler.  Once I export the public API it should become an actual usable artifact.

Google Closure library
----------------------
You can either import just the pieces you need, like goog.require('crow.Graph') and goog.require('crow.AStarAlgorithm'), or you can simply include the whole library, with goog.require('crow.All') and let the compiler figure it out.

Requirements
============
This section outlines what you must have installed and/or present in order to use this library.

Build-time
----------

There are numerous build-time requirements, but any Linux user should already have most of them:

* wget
* unzip
* svn
* python
* java
* ruby
* rake

Runtime
-------
None! This library has no external dependencies.

Testing
-------
In addition to the build-time dependencies, there are a couple other dependencies required to run tests (since there are server-side components):

* gem (Rubygems)
* "bundler" gem for Ruby

Testing
=======
Run `rake test:runner` and then head over to [localhost:4567](http://localhost:4567/).  All will be explained when you get there.

To just generate the tests, run `rake test:build`.

The tests are written using QUnit (and jQuery).  Some of the tests have "circles" which are generated using Canvas.  As such, to get the full experience you'll need to be using a browser with Canvas.

Versioning
==========
See http://semver.org/ (and Graph.version)

Not in effect until it hits alpha...

Todo
====
* Provide an example of different types of actors traversing a graph (i.e. aerial vehicles can traverse any terrain, while land vehicles cannot).  Alternatively, explore layers.
* Should automatically detect the "best" algorithm for the job, i.e. Dijkstra's for findGoal with a condition, or A* for findGoal with an explicit node
