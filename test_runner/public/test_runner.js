$("#controls .recompile").click(function(e){
	var button = $(this);
	button.attr("disabled", "disabled");
	$("#feedback").text("Recompiling...page will be refreshed if successful.");
	$.get("/recompile", function(data){
		if(data.error){
			var err = data.err;
			err = err.replace(/\n/g, "<br>");
			$("#feedback").html(err);
			button.attr("disabled", "");
		} else {
			$("#feedback .success").show().text("Successfully recompiled!");
			location.reload(true);
		}
	});
	e.preventDefault();
});
$(function(){
	var options = $("#controls select.test_selection");
	if(options.length > 0){
		for(var i in test){
			if(i != currentTest){
				options.append("<option>" + i);
			}
		}
	
		options.bind('change', function(e){
			var val = $("option[selected]", this).val();
			if(val){
				location = "/test/" + val;
			}
		});
	}

	if(window["QUnit"]){
		var oldDone = window["QUnit"]["done"];
		window["QUnit"]["done"] = function(failures, total){
			oldDone(failures, total);
		
			var testPathsControl = $("#controls select.test_paths");
			if(testPathsControl.length > 0){
				for(var i in window["testPaths"]){
					var p = window["testPaths"][i];
					var opt = $("<option>" + p[0] + "</option>");
					opt.data("path", p[1]);
					testPathsControl.append(opt);
				}
		
				function getCell(x, y){
					return $("table.graph tr:nth-child(" + (y+1) + ") td:nth-child(" + (x+1) + ") div");
				}
		
				var currentPath = null, currentIndex = 0, mainCanvas = $("canvas#main");
				var moveFunction = function(){
					if(currentPath != null){
						var node = currentPath.nodes[currentIndex++];
						mainCanvas.appendTo(getCell(node.getX(), node.getY()));
						mainCanvas.show();
					}
					if(currentPath != null && currentIndex >= currentPath.nodes.length) currentIndex = 0;
				};
				var interval;
				testPathsControl.bind("change", function(){
					var opt = $("option[selected]", this);
					var val = opt.val();
					if(val){
						currentPath = opt.data("path");
						var end = currentPath.end;
						var X = $("canvas.goal").eq(0).appendTo(getCell(end.getX(), end.getY())).show();
						interval = setInterval(moveFunction, 500);
					} else {
						clearInterval(interval);
					}
				});
			}
		}
	}
});
