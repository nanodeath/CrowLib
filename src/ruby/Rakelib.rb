class DisableClosureDeps < Processor
	def initialize
		@start = true
	end
	def call(input)
		result = input
		if(@start)
			result = MultiResult.new("// Crow DEBUG", "var CLOSURE_NO_DEPS = true;", "// Crow End DEBUG", "", input)
		end
		@start = false
		result
	end
end

class LineCounter < Processor
	def initialize
		@file = nil
		@count = 0
	end
	
	def call(input)
		@count += 1
		if(@count % 25 == 0)
			input.chomp + "\t\t// LINE #{@count} in #{@file}: DEBUG"
		else
			input
		end
	end
	def code(cc)
		if(cc.value == :new_file)
			@file = cc.opts[:filename]
			@count = 0;
			"// FILE: #{@file}: DeBUG //"
		elsif(cc.value == :end_file)
			MultiResult.new("// FINAL LINE #{@count+1} in #{@file}: DEBUG //", "")
		else
			nil
		end
	end
end

class RemoveDebugHash < Processor
	def call(input)
		input.include?("#debug") ? nil : input
	end
end

class RemoveLogStatements < Processor
	def initialize
		@matcher = /var logger|logger\./
	end
	def call(input)
		if @matcher.match input
			nil
		else
			input
		end
	end
end

=begin
	JSDoc (which Crow uses) requires arrays in the format crow.someType[],
	whereas Google Closure requires arrays in the format Array.<crow.someType>.
	So...I have to convert from one to the other.  Cool, huh?
=end
class FixJSDocArraysForGoogleClosure < Processor
	def initialize
		@matcher = /(\s*\*.*)\{([^\[]*)\[\]\}/
		@replacement = '\1{Array.<\2>}'
	end
	
	def call(input)
		input.sub @matcher, @replacement
	end
end

