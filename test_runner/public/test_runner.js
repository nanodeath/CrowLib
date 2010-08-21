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
});
