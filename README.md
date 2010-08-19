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

Including in your app
=====================
There's two ways you can include Crow into your app -- either as a simple script tag or include with one of the automatically compiled scripts, or as a library in Google Closure.

Automatically-compiled script
-----------------------------
If you run `rake` (assuming you have the build-time requirements given lower down), three files will be generated for you at build/js:
1. crow.min.js: this compiled with `whitespace_only`.  Safest, but least compression.
2. crow.micro.js: this compiled with `simple_optimizations`.  Renames local variables and the like, but public API is untouched.  Little better compression.
3. crow.pico.js: this compiled with `advanced_optimizations`.  Pretty much everything gets renamed here, and because I haven't exported the public API yet, it's useless except as a demonstration of the compression unless you are also using the Google Closure compiler.  Once I export the public API it should become an actual usable artifact.

Google Closure library
----------------------
You can either import just the pieces you need, like goog.require('crow.Graph') and goog.require('crow.AStarAlgorithm'), or you can simply include the whole library, with goog.require('crow.All') and let the compiler's dead code remover strip out what you don't use.

Requirements
============
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
=======
Run `rake test` to generate the necessary test javascripts, then head over to one of the html files under test/.
The tests are written using QUnit (and jQuery).

Versioning
==========
See http://semver.org/ (and Graph.version)

Todo
====
* Should be possible to pass in neighbors-detecting algorithm and
  distance-calculating algorithm, either to the Graph methods directly or on the node class.
* Should automatically detect the "best" algorithm for the job, i.e. Dijkstra's for findGoal with a condition, or A* for findGoal with an explicit node
