#!/usr/bin/env ruby

# curl and sha256sum are required to run this.

tag = ARGV[0]
puts "Generate release checksums for #{tag}, this could take a while..."

windows_exe = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-win-installer.exe"
macos_zip = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-mac.zip"
macos_dmg = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-mac.dmg"
linux_appimage = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-linux-x86_64.AppImage"

def get_sha256_checksum(url)
  %x(curl -L #{url} | sha256sum).split(" ").first
end

windows_exe_sha256 = get_sha256_checksum(windows_exe)
macos_zip_sha256 = get_sha256_checksum(macos_zip)
macos_dmg_sha256 = get_sha256_checksum(macos_dmg)
linux_appimage_sha256 = get_sha256_checksum(linux_appimage)

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