begin
	require "bundler"
rescue LoadError
	require "rubygems"
	require "bundler"
end
Bundler.setup
require "sinatra"
require "fileutils"
require "rake"
require "json"
require "open3"

ROOT = File.expand_path(File.dirname(__FILE__) + "/../");
load ROOT + "/Rakefile"
TEST_FILE = ROOT + "/build/js/crow-test.js"
LINKED_TEST = "crow-test.js"

def execute_with_output(command)
	stdout_buffer = []
	stderr_buffer = []
	Open3.popen3(command) do |stdin, stdout, stderr|
		begin
			while oline = stdout.readline
				stdout_buffer << oline
			end
		rescue EOFError
		end
		begin
			while eline = stderr.readline
				stderr_buffer << eline
			end
		rescue EOFError
		end
	end
	return stdout_buffer.join, stderr_buffer.join
end

def recompile_tests
	out = nil
	err = nil
	cd "../" do
		out, err = execute_with_output("rake test")
	end
	return {:out => out, :err => err}
end

def symlink_tests
	if(!File.exist? TEST_FILE)
		recompile_tests
	end
	FileUtils.ln_sf(TEST_FILE, "public/" + LINKED_TEST)
end

get "/" do
	symlink_tests
	@test_js = LINKED_TEST
	erb :home
end

get "/test/:test" do |test|
	@test = test
	puts "Test is #{@test}, rendering!"
	erb :test
end

get "/test_script/:test_name" do
	content_type 'text/javascript', :charset => 'utf-8'
	if(!File.exist? TEST_FILE)
		recompile_tests	
	end
	File.new(TEST_FILE)
end

get "/recompile" do
	content_type "application/json", :charset => "utf-8"
	results = recompile_tests
	results[:error] = results[:err].include? "Command failed"
	JSON(results)
end
