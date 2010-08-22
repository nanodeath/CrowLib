require 'rake/clean'
require 'yaml'

CONFIG = YAML.load_file(File.join(File.dirname(__FILE__), "Config.yaml"))

task :default => [:build]

CLEAN.include("build/js", "dist", "test_runner/public/gen")
CLOBBER.include("build", "test_runner/gems")

# HELPERS
def download_file(url, destination)
	sh "wget #{url} -O #{destination}"
end

class String
	def starts_with?(prefix)
	  prefix = prefix.to_s
	  self[0, prefix.length] == prefix
	end
end

class GoogleClosure
	include Singleton
	
	ROOT = "build/google_closure"

	LIBRARY_URL = "http://closure-library.googlecode.com/svn/trunk/"
	LIBRARY_ROOT = ROOT + "/library"
	CALC_DEPS_BIN = LIBRARY_ROOT + "/closure/bin/calcdeps.py"

	COMPILER_URL = "http://closure-compiler.googlecode.com/files/compiler-latest.zip"
	COMPILER_ARCHIVE = ROOT + "/compiler.zip"
	COMPILER_ROOT = ROOT + "/compiler"
	COMPILER_JAR = COMPILER_ROOT + "/compiler.jar"
	
	def checkout_library
		sh "svn checkout #{LIBRARY_URL} #{LIBRARY_ROOT}" unless File.exist?(LIBRARY_ROOT)
	end

	def download_compiler
		unless File.exist?(COMPILER_JAR)
			mkdir_p COMPILER_ROOT
			download_file(COMPILER_URL, COMPILER_ARCHIVE) unless File.exist?(COMPILER_ARCHIVE)
			sh "unzip #{COMPILER_ARCHIVE} -d #{COMPILER_ROOT}"
		end
	end
	
	def compile(files, out, flags=nil)
		files = [files] unless files.is_a? Array
		files = files.map {|f| "--input=#{f}"}
		path = [LIBRARY_ROOT]
		if(CONFIG[:path]) then path += CONFIG[:path] end
		path.map! {|d| "--path=#{d}" }
		flags = flags.map {|f| '-f "' + f + '"'}.join(" ") unless flags.nil?
		sh "#{CALC_DEPS_BIN} #{files.join(' ')} #{path.join(' ')} --output_mode=compiled --compiler_jar=#{COMPILER_JAR} #{flags} > #{out}"
	end
	def calculate_dependencies(files)
		files = [files] unless files.is_a? Array
		files = files.map {|f| "--input=#{f}"}
		path = [LIBRARY_ROOT]
		if(CONFIG[:path]) then path += CONFIG[:path] end
		path.map! {|d| "--path=#{d}" }
		puts "Checking dependencies..."
		%x[#{CALC_DEPS_BIN} #{files.join(' ')} #{path.join(' ')}].split
	end
end

# TASKS
task :get_google_closure_library do
	GoogleClosure.instance.checkout_library
end
task :get_google_closure_compiler do
	GoogleClosure.instance.download_compiler
end
task :get_jsdoc_toolkit do
	URL = "http://jsdoc-toolkit.googlecode.com/svn/trunk/"
	FOLDER = "build/jsdoc_toolkit"
	sh "svn checkout #{URL} #{FOLDER}" unless File.exist?(FOLDER)
end
task :generate_javascript_docs => [:get_google_closure_library, :get_jsdoc_toolkit] do
	files = GoogleClosure.instance.calculate_dependencies(CONFIG[:files])
	files.reject! {|f| f.starts_with? "build/"}
	ROOT = "build/jsdoc_toolkit/jsdoc-toolkit"
	JAR = ROOT + "/jsrun.jar"
	RUN_JS = ROOT + "/app/run.js"
	TEMPLATES = ROOT + "/templates/jsdoc"
	FILES = files.join(' ') # CONFIG[:files].join(' ')
	mkdir_p "dist/docs"
	sh "java -jar #{JAR} #{RUN_JS} -a -t=#{TEMPLATES} #{FILES} -d=dist/docs"
end

task :get_dependencies => [:get_google_closure_library, :get_google_closure_compiler]

filename = CONFIG[:base_filename]

OPTIMIZATIONS = {
	:mini => ["--compilation_level=WHITESPACE_ONLY"],
	:micro => ["--compilation_level=SIMPLE_OPTIMIZATIONS"],
	:pico => ["--compilation_level=ADVANCED_OPTIMIZATIONS"],
}

task :compile, [:target, :type] do |t, args|
	opts = CONFIG[:advanced_compilation]
	# opts[args.target] is either a string representing a target filename
	# or a boolean, saying whether to render it or not
	if(opts[args.target].is_a? String)
		GoogleClosure.instance.compile CONFIG[:files], "dist/js/#{opts[args.target]}.js", OPTIMIZATIONS[args.target]
	elsif(opts[args.target])
		GoogleClosure.instance.compile CONFIG[:files], "dist/js/#{filename}.#{args.suffix}.js", OPTIMIZATIONS[args.target]
	end
end

task :js_build_dir do
	mkdir_p "build/js"
end
directory "dist/js"

task :build => [:get_dependencies, :"dist/js"] do
	Rake::Task[:compile].execute(OpenStruct.new({:target => :mini, :suffix => "min"}))
	Rake::Task[:compile].execute(OpenStruct.new({:target => :micro, :suffix => "micro"}))
	Rake::Task[:compile].execute(OpenStruct.new({:target => :pico, :suffix => "pico"}))
end

def generate_debug(files, filename, markers=true)
	deps = GoogleClosure.instance.calculate_dependencies(files)
	output = StringIO.new
	deps.each do |d|
		output.puts("// FILE: #{d}: DeBUG //") if markers
		count = 0
		File.open(d) do |f|
			while(line = f.gets)
				count += 1
				if(markers && count % 25 == 0)
					output.puts(line.chomp + "\t\t// LINE #{count} in #{d}: DeBUG")
				else
					output.puts line
				end
			end
			output.puts("// FINAL LINE #{count} in #{d}: DeBUG //") if markers
			output.puts
		end
	end
	File.open(filename, "w") {|f| f.write output.string }
end

task :debug => [:get_dependencies, :"build/js"] do
	generate_debug(CONFIG[:files], "build/js/#{CONFIG[:base_filename]}.debug.js")
end

namespace "test" do
	task :debug => [:get_dependencies, :"build/js"] do
		generate_debug(CONFIG[:files] + CONFIG[:test_files], "build/js/#{CONFIG[:base_filename]}-test.debug.js")
	end
end

task :docs => [:generate_javascript_docs]

task :test => [:get_dependencies] do
	GoogleClosure.instance.compile CONFIG[:files] + CONFIG[:test_files], "build/js/#{filename}-test.js", (["--create_source_map=./build/test-map"] + OPTIMIZATIONS[:mini])
end

task :check_bundler do
	if `which bundle` == ""
		raise "Bundler must be installed...http://gembundler.com/"
	end
end

task :prepare_test_runner => [:check_bundler] do
	if(!File.exist? "test_runner/gems")
		cd "test_runner" do
			sh "bundle install gems --disable-shared-gems"
		end
	end
end

task :test_runner => [:prepare_test_runner] do
	cd "test_runner" do
		ruby "test_runner.rb"
	end
end

