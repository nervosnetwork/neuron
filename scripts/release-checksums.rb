#!/usr/bin/env ruby

require "open-uri"
require "digest"

tag = ARGV[0]

windows_exe = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-setup.exe"

macos_x64_zip = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-mac-x64.zip"
macos_arm64_zip = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-mac-arm64.zip"

macos_x64_dmg = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-x64.dmg"
macos_arm64_dmg = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-arm64.dmg"

linux_appimage = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-x86_64.AppImage"

def get_sha256_checksum(url)
  content = URI.open(url).read
  Digest::SHA256.hexdigest(content)
end

windows_exe_sha256, macos_x64_zip_sha256, macos_arm64_zip_sha256, macos_x64_dmg_sha256, macos_arm64_dmg_sha256, linux_appimage_sha256 = [windows_exe, macos_x64_zip, macos_arm64_zip, macos_x64_dmg, macos_arm64_dmg, linux_appimage].map do |url|
  Thread.new { get_sha256_checksum(url) }
end.map(&:value)

checksums = %(
### Downloads

OS | Arch | Package | SHA256 Checksum
-- | -- | -- | --
Windows | x64 | [exe](#{windows_exe}) | <code>#{windows_exe_sha256}</code>
macOS | x64 | [zip](#{macos_x64_zip}) | <code>#{macos_x64_zip_sha256}</code>
macOS | arm64 | [zip](#{macos_arm64_zip}) | <code>#{macos_arm64_zip_sha256}</code>
macOS | x64 | [DMG](#{macos_x64_dmg}) | <code>#{macos_x64_dmg_sha256}</code>
macOS | arm64 | [DMG](#{macos_arm64_dmg}) | <code>#{macos_arm64_dmg_sha256}</code>
Linux | x64 | [AppImage](#{linux_appimage}) | <code>#{linux_appimage_sha256}</code>
)

puts checksums
