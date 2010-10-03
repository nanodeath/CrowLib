class ControlCode
	attr_reader :value
	attr_reader :opts

	private
	def initialize(val, opts={})
		@value = val
		@opts = opts
	end
end

def ControlCode(val, opts={})
	ControlCode.send :new, val, opts
end

class ControlCode
	DIE = ControlCode(:die)
	RESET = ControlCode(:reset)
	INPUT_DONE = ControlCode(:input_done)
end

