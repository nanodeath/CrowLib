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
