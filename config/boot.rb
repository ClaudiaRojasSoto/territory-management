ENV["BUNDLE_GEMFILE"] ||= File.expand_path("../Gemfile", __dir__)

require "bundler/setup" # Set up gems listed in the Gemfile.
require "bootsnap/setup" # Speed up boot time by caching expensive operations.

# Cargar variables de entorno desde archivo .env
if File.exist?(File.expand_path('../.env', __dir__))
  File.readlines(File.expand_path('../.env', __dir__)).each do |line|
    next if line.start_with?('#') || line.strip.empty?
    
    key, value = line.strip.split('=', 2)
    ENV[key] = value if key && value
  end
end
