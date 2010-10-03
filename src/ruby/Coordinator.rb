require 'thread'

require 'Processor'
require 'MultiResult'
require 'ControlCode'

class Coordinator
	attr_reader :results
	
	def initialize
		@results = []
		@received = 0
		@processed = 0

		@queue = Queue.new
		
		@processors = []
		
		@master = Thread.new do
			while true
				task = @queue.pop
				proc_id, result = task
				next_processor = @processors[proc_id]
				if !next_processor.nil? && !result.nil?
					next_processor[:queue] << task
				else
					post_result(result)
				end
			end
		end
		@monitor = Monitor.new
		@cv = @monitor.new_cond
	end
	
	def register_processor(processor_or_opts=nil, opts={}, &block)
		if(processor_or_opts.is_a? Hash)
			opts = processor_or_opts
		end
		processor = processor_or_opts.is_a?(Processor) ? processor_or_opts : nil
		skip_control_codes = opts[:skip_control_codes]
		queue = Queue.new
		use_block = block_given?
		
		skip_control_codes = true if use_block && skip_control_codes.nil?
		
		t = Thread.new do
			while true
				task = queue.pop
				proc_id, payload = task
				result = payload
				if(!skip_control_codes || !payload.is_a?(ControlCode))
					if use_block
						result = yield payload
					elsif(!processor.nil?)
						if(payload.is_a? ControlCode)
							result = processor.code(payload)
						else
							result = processor.call(payload)
						end
					end
				end
				reprocess(proc_id, result)
			end
		end
		t[:queue] = queue
		@processors << t
	end
	
	def <<(str)
		@received += 1
		@queue << [0, str]
	end
	
	def done?
		@received == @processed
	end
	
	def wait_until_done
		@monitor.synchronize do
			@cv.wait_until { done? }
		end
	end
	
	def each(&block)
		raise "TODO"
	end

	private
	def reprocess(old_proc_id, result)
		if result.is_a? MultiResult
			result.value.each do |r|
				@queue << [old_proc_id + 1, r]
			end
			# Since we're increasing our working set size, we need to track by how much
			# so we'll know when we're done
			@received += result.value.length - 1
		else
			@queue << [old_proc_id + 1, result]
		end
	end
	
	def post_result(result)
		case result
		when ControlCode, NilClass
			# do nothing
		when MultiResult
			result.value.each {|r| @results << r}
		else
			@results << result
		end
		@monitor.synchronize do
			@processed += 1
			@cv.broadcast
		end
	end
end
