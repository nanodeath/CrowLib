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

	def self.compile(files, out)
		files = [files] unless files.is_a? Array
		files.map! {|f| "--input=#{f}"}
		optimization = "" # -f \"--compilation_level=ADVANCED_OPTIMIZATIONS\"
		sh "#{CALC_DEPS_BIN} #{files} --path=#{LIBRARY_ROOT} --output_mode=compiled --compiler_jar=#{COMPILER_JAR} #{optimization} > #{out}"
	end
end

task :get_google_closure_library do
	GoogleClosure.checkout_library
end
task :get_google_closure_compiler do
	GoogleClosure.download_compiler
end

task :get_dependencies => [:get_google_closure_library, :get_google_closure_compiler]

task :build => [:get_dependencies] do
	mkdir_p "build/js"
	GoogleClosure.compile "GraphLib.js", "build/js/crow.js"
end

task :clean do
	directories_to_clean = ["build/js"]
	directories_to_clean.each {|d| rm_r d if File.exist? d}
end
task :deep_clean => [:clean] do
	rm_r "build" if File.exist? "build"
end
