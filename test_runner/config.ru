# This file is only needed if you want more control over the test server

begin
    require "bundler"
rescue LoadError
    require "rubygems"
    require "bundler"
end
Bundler.setup(:default, :server)
require 'sinatra'

set :env,       :production
set :port,      6000
disable :run, :reload

require 'test_runner'

run Sinatra::Application