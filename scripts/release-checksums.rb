#!/usr/bin/env ruby

require "open-uri"
require "digest"

tag = ARGV[0]
puts "Generating release checksums for #{tag}, this could take a while..."

windows_exe = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-win-installer.exe"
macos_zip = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-mac.zip"
macos_dmg = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-mac.dmg"
linux_appimage = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-linux-x86_64.AppImage"

def get_sha256_checksum(url)
  content = open(url).read
  Digest::SHA256.hexdigest(content)
end

windows_exe_sha256, macos_zip_sha256, macos_dmg_sha256, linux_appimage_sha256 = [windows_exe, macos_zip, macos_dmg, linux_appimage].map do |url|
  Thread.new { get_sha256_checksum(url) }
end.map(&:value)

checksums = %(
### Downloads

OS | Arch | Package | SHA256 Checksum
-- | -- | -- | --
Windows | x64 | [exe](#{windows_exe}) | <code>#{windows_exe_sha256}</code>
macOS | x64 | [zip](#{macos_zip}) | <code>#{macos_zip_sha256}</code>
macOS | x64 | [DMG](#{macos_dmg}) | <code>#{macos_dmg_sha256}</code>
Linux | x64 |  [AppImage](#{linux_appimage}) | <code>#{linux_appimage_sha256}</code>
)

puts checksums