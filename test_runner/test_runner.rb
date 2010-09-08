begin
	require "bundler"
rescue LoadError
	require "rubygems"
	require "bundler"
end
Bundler.setup
require "sinatra"
require "sequel"
require "logger"
require "sinatra/sequel"
require "fileutils"
require "rake"
require "json"
require "open3"

ROOT = File.expand_path(File.dirname(__FILE__) + "/../");
load ROOT + "/Rakefile"
TEST_FILE = ROOT + "/build/js/crow-test.debug.js"
LINKED_TEST = "gen/crow-test.debug.js"

helpers do
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
		out, err = execute_with_output("rake test:debug")
		return {:out => out, :err => err}
	end

	def symlink_tests
		if(!File.exist? TEST_FILE)
			recompile_tests
		end
		mkdir_p "public/gen/test" unless File.exist? "public/gen/test"
		FileUtils.ln_sf(TEST_FILE, "public/" + LINKED_TEST) unless File.exist? "public/" + LINKED_TEST
	end
  def content_is(type)
    str = case type
      when :json
        "application/json"
      when :html
        "text/html"
      when :javascript
        "application/javascript"
      else
        raise "Invalid content type"
    end
    response["Content-Type"] = str
	end

end

get "/" do
	symlink_tests
	@test_js = LINKED_TEST
	@docs_exist = File.exist?("public/docs/index.html") && File.exist?("public/docs_private/index.html")
	erb :home
end

get "/test/:test" do |test|
	symlink_tests
	@test = test
	original_css = File.join(ROOT, "tst", test + ".css")
	@stylesheet = "/gen/test/" + test + ".css"
	new_css = File.join("public", @stylesheet)
	if(File.exist?(original_css) and !File.exist?(new_css))
		FileUtils.ln_sf(original_css, new_css)
	end
	if(!File.exist? new_css)
		@stylesheet = nil
	end
	erb :test
end

get "/recompile" do
	content_type "application/json", :charset => "utf-8"
	results = recompile_tests
	results[:error] = results[:err].include? "Command failed"
	JSON(results)
end

set :database, 'sqlite://testrunner.db'
database.loggers << Logger.new($stdout)

migration "initial schema" do
	database.create_table :user_agents do
		primary_key :id, :serial => true
		String :user_agent
		String :browser_version
		TrueClass :webkit
		TrueClass :opera
		TrueClass :msie
		TrueClass :mozilla
		TrueClass :chrome
	end
	database.create_table :tests do
		primary_key :id, :serial => true
		String :test_name
	end
	database.create_table :results do
		primary_key :id, :serial => true
		foreign_key :user_agent_id, :user_agents, :type => Bignum
		foreign_key :test_id, :tests, :type => Bignum
		String :name
		Float :result
		DateTime :date
		String :version
	end
end

git_sha1 = `git log --format=oneline -1`.chomp.split[0][0..5]
ALL_GIT = `git log --format=oneline -10`.split("\n")
puts "Starting with version #{git_sha1}"

get "/benchmark" do
	@results = database[:results].join(:user_agents, :id => :user_agent_id).join(:tests, :id => :results__test_id).all
	erb :benchmark
end
post "/benchmark" do
	puts params.inspect
	us = params["useragent"]["string"]
	ua = database[:user_agents].filter(:user_agent => us).first
	if ua.nil?
		version = params["useragent"]["version"]
		chrome = nil
		chrome_matcher = us.match(/Chrome\/([\d\.]+)/)
		if(chrome_matcher)
			chrome = true
			version = chrome_matcher[1]
		end
		opts = {:user_agent => us, :browser_version => version, :chrome => chrome}
		["webkit", "opera", "msie", "mozilla"].each do |browser|
			val = params["useragent"][browser] == "true" ? true : false
			opts[browser.to_sym] = val
		end
		ua_id = database[:user_agents].insert(opts)
	else
		ua_id = ua[:id]
	end
	
	params["results"].each do |test_name, result|
		test = database[:tests].filter(:test_name => test_name).first
		if(test.nil?)
			test_id = database[:tests].insert(:test_name => test_name)
		else
			test_id = test[:id]
		end
		
		name = params["name"]
		raise "Name required" if name.nil?
		database[:results].insert(:user_agent_id => ua_id, :test_id => test_id, :name => name, :result => result.to_f, :date => Time.now, :version => git_sha1)
	end
	content_is(:json)
	'{"status":"ok"}'
end

`rake test:debug`
