task :default => [:build]

def download_file(url, destination)
	sh "wget #{url} -O #{destination}"
end

class GoogleCompiler
	ROOT = "build/google_closure"
	ARCHIVE = ROOT + "/compiler.zip"
	JAR = ROOT + "/compiler.jar"
	URL = "http://closure-compiler.googlecode.com/files/compiler-latest.zip"

	def self.compile(files, out)
		files = [files] unless files.is_a? Array
		files.map! {|f| "--js=#{f}"}
		sh "java -jar #{JAR} #{files.join(" ")} --js_output_file=#{out}"
	end
	
	def self.download
		unless File.exist?(JAR)
			mkdir_p ROOT
			download_file(URL, ARCHIVE) unless File.exist?(ARCHIVE)
			sh "unzip #{ARCHIVE} -d #{ROOT}"
		end
	end
end

task :get_google_closure do
	GoogleCompiler.download
end
task :get_dependencies => [:get_google_closure]

task :build => [:get_dependencies] do
	mkdir_p "build/js"
	GoogleCompiler.compile "GraphLib.js", "build/js/crow.js"
end

task :clean do
	directories_to_clean = ["build/js"]
	directories_to_clean.each {|d| rm_r d if File.exist? d}
end
task :deep_clean => [:clean] do
	rm_r "build" if File.exist? "build"
end
