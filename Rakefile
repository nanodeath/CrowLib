require 'yaml'

CONFIG = YAML.load_file("Config.yaml")

task :default => [:build]

def download_file(url, destination)
	sh "wget #{url} -O #{destination}"
end

class GoogleClosure
	ROOT = "build/google_closure"

	LIBRARY_URL = "http://closure-library.googlecode.com/svn/trunk/"
	LIBRARY_ROOT = ROOT + "/library"
	CALC_DEPS_BIN = LIBRARY_ROOT + "/closure/bin/calcdeps.py"

	COMPILER_URL = "http://closure-compiler.googlecode.com/files/compiler-latest.zip"
	COMPILER_ARCHIVE = ROOT + "/compiler.zip"
	COMPILER_ROOT = ROOT + "/compiler"
	COMPILER_JAR = COMPILER_ROOT + "/compiler.jar"
	
	def self.checkout_library
		sh "svn checkout #{LIBRARY_URL} #{LIBRARY_ROOT}" unless File.exist?(LIBRARY_ROOT)
	end

	def self.download_compiler
		unless File.exist?(COMPILER_JAR)
			mkdir_p COMPILER_ROOT
			download_file(COMPILER_URL, COMPILER_ARCHIVE) unless File.exist?(COMPILER_ARCHIVE)
			sh "unzip #{COMPILER_ARCHIVE} -d #{COMPILER_ROOT}"
		end
	end

	def self.compile(files, out, flags=nil)
		files = [files] unless files.is_a? Array
		files = files.map {|f| "--input=#{f}"}
		path = [LIBRARY_ROOT]
		if(CONFIG[:path]) then path += CONFIG[:path] end
		path.map! {|d| "--path=#{d}" }
		sh "#{CALC_DEPS_BIN} #{files.join(' ')} #{path.join(' ')} --output_mode=compiled --compiler_jar=#{COMPILER_JAR} #{flags.nil? ? '' : '-f "' + flags.join(' ') + '"'} > #{out}"
	end
end

task :get_google_closure_library do
	GoogleClosure.checkout_library
end
task :get_google_closure_compiler do
	GoogleClosure.download_compiler
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
	if(opts[args.target].is_a? String)
		GoogleClosure.compile CONFIG[:files], "build/js/#{opts[args.target]}.js", OPTIMIZATIONS[args.target]
	elsif(opts[args.target])
		GoogleClosure.compile CONFIG[:files], "build/js/#{filename}.#{args.suffix}.js", OPTIMIZATIONS[args.target]
	end
end

task :js_build_dir do
	mkdir_p "build/js"
end

task :build => [:get_dependencies, :js_build_dir] do
	Rake::Task[:compile].execute(OpenStruct.new({:target => :mini, :suffix => "min"}))
	Rake::Task[:compile].execute(OpenStruct.new({:target => :micro, :suffix => "micro"}))
	Rake::Task[:compile].execute(OpenStruct.new({:target => :pico, :suffix => "pico"}))
end

task :test => :js_build_dir do
	GoogleClosure.compile CONFIG[:files] + CONFIG[:test_files], "build/js/#{filename}-test.js", OPTIMIZATIONS[:pico]
end

task :clean do
	directories_to_clean = ["build/js"]
	directories_to_clean.each {|d| rm_r d if File.exist? d}
end
task :deep_clean => [:clean] do
	rm_r "build" if File.exist? "build"
end
