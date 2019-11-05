#!/usr/bin/env ruby

tag = ARGV[0]
puts "generate release checksums for #{tag}"

windows_exe = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-win-installer.exe"
macos_zip = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-mac.zip"
macos_dmg = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-mac.dmg"
linux_appimage = "https://github.com/nervosnetwork/neuron/releases/download/#{tag}/Neuron-#{tag}-linux-x86_64.AppImage"

# TODO: Download binaries and calculate checksums

windows_exe_sha256 = "{WINDOWS_EXE_SHA256}"
macos_zip_sha256 =  "{MACOS_ZIP_SHA256}"
macos_dmg_sha256 = "{MACOS_DMG_SHA256}"
linux_appimage_sha256 = "{LINUX_APPIMAGE_SHA256}"

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