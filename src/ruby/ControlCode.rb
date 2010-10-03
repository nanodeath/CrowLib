class ControlCode
	attr_reader :value
	attr_reader :opts
	class << self
		def [](val, opts={})
			ControlCode.new(val, opts)
		end
	end
	
	private
	def initialize(val, opts={})
		@value = val
		@opts = opts
	end
end

class ControlCode
	DIE = ControlCode[:die]
	RESET = ControlCode[:reset]
	INPUT_DONE = ControlCode[:input_done]
end

