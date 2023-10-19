// use this script as 'node ./generate-checksum-table.js ./binaries' where Neuron binaries sit in ./binaries
const fs = require('node:fs')
const path = require('node:path')
const crypto = require('node:crypto')

class Package {
  _name
  _directory

  get arch() {
    const name = this._name
    if (name.endsWith('.exe') || name.includes('-x64') || name.includes('x86_64')) {
      return 'x64'
    }

    if (name.includes('-arm64')) {
      return 'arm64'
    }

    throw new Error(`Unknown arch: ${name}`)
  }

  get os() {
    const name = this._name
    if (name.endsWith('.exe')) {
      return 'Windows'
    }

    if (name.includes('-mac-') || name.endsWith('.dmg')) {
      return 'macOS'
    }

    if (name.endsWith('.AppImage')) {
      return 'Linux'
    }

    throw new Error(`Unknown OS: ${name}`)
  }

  get package() {
    const ext = path.extname(this._name).slice(1)
    if (ext === 'dmg') return 'DMG'
    return ext
  }

  get url() {
    const version = this._name.split('-')[1]
    return `https://github.com/nervosnetwork/neuron/releases/download/${version}/${this._name}`
  }

  get checksum() {
    const binary = fs.readFileSync(path.join(this._directory, this._name))
    const hash = crypto.createHash('sha256')
    hash.update(binary)
    return hash.digest('hex')
  }

  constructor(directory, name) {
    this._directory = directory
    this._name = name
  }

  toEntry() {
    return `${this.os} | ${this.arch} | [${this.package}](${this.url}) | <code>${this.checksum}</code>\n`
  }
}

const getChecksumTable = (directory) => {
  let table = `OS | Arch | Package | SHA256 Checksum\n-- | -- | -- | --\n`

  const files = fs.readdirSync(directory).filter((f) => ['.dmg', '.zip', '.exe', '.AppImage'].includes(path.extname(f)))
  files
    .map((f) => {
      return new Package(directory, f)
    })
    .sort((a, b) => {
      if (a.os !== b.os) {
        if (a.os === 'Windows') return -1
        if (a.os === 'Linux') return 1
      }

      if (a.package !== b.package) {
        return a.package === 'zip' ? -1 : 1
      }

      if (a.arch !== b.arch) {
        return a.arch === 'x64' ? -1 : 1
      }
    })
    .forEach((p) => {
      table += p.toEntry()
    })

  return table
}

if (process.argv.length < 3) {
  throw new Error(`Directory of binaries is required, use command as 'node ./generate-checksum-table.js ./binaries`)
}

const directory = process.argv[2]

const checksumTable = getChecksumTable(directory)

console.info(checksumTable)

const output = path.join(directory, './checksums.txt')
fs.writeFileSync(output, checksumTable, { flag: 'wx' })

console.info(`Checksum table has been generated at ${output}`)
