const fs = require('node:fs')
const path = require('node:path')

const exec = () => {
  const compatiblePath = path.resolve(__dirname, '../compatible.json')
  const info = require(compatiblePath)
  const packagePath = path.resolve(__dirname, '../package.json')
  const neuronReleaseVersion = require(packagePath).version
  const newNeuronVersion = neuronReleaseVersion.slice(0, neuronReleaseVersion.lastIndexOf('.'))

  const lastNeuronVersion = Object.keys(info.compatible).sort((a, b) => {
    const [aMajor, aMinor] = a.split('.')?.map(v => +v) ?? []
    const [bMajor, bMinor] = b.split('.')?.map(v => +v) ?? []
    if (aMajor !== bMajor) return bMajor - aMajor
    return bMinor - aMinor
  })[0]

  if (newNeuronVersion && lastNeuronVersion !== newNeuronVersion) {
    info.compatible[newNeuronVersion] = info.compatible[lastNeuronVersion]
    fs.writeFileSync(compatiblePath, `${JSON.stringify(info, null, 2)}\r\n`)
  } else {
    process.exit(1)
  }
}

exec()

