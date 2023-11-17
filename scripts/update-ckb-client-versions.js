const fs = require('node:fs')
const path = require('node:path')

const BUILTIN_VERSION_PATH = {
  node: path.resolve(__dirname, '..', '.ckb-version'),
  lightClient: path.resolve(__dirname, '..', '.ckb-light-version'),
}

const fetchLatestVersion = (url) =>
  fetch(url)
    .then((res) => res.json())
    .then((res) => (!res.prerelease ? res.tag_name : null))
    .catch(() => null)

const fetchBuiltinVersion = (path) => fs.readFileSync(path, 'utf8').split('\n')[0]

const fetchCkbLatestVersion = async () => {
  const NODE_ENDPOINT = 'https://api.github.com/repos/nervosnetwork/ckb/releases/latest'
  const LIGHT_CLIENT_ENDPOINT = 'https://api.github.com/repos/nervosnetwork/ckb-light-client/releases/latest'

  return {
    node: await fetchLatestVersion(NODE_ENDPOINT),
    lightClient: await fetchLatestVersion(LIGHT_CLIENT_ENDPOINT),
  }
}

const fetchBuiltinCkbVersion = async () => {
  return {
    node: fetchBuiltinVersion(BUILTIN_VERSION_PATH.node),
    lightClient: fetchBuiltinVersion(BUILTIN_VERSION_PATH.lightClient),
  }
}

const getMajorAndMinorVersion = (full) => {
  // v0.3.0 -> 0.3
  return full.slice(1, full.lastIndexOf('.'))
}

const updateCompatible = ({
  node,
  lightClient,
}) => {
  const compatiblePath = path.resolve(__dirname, '../compatible.json')
  const info = require(compatiblePath)
  const lastFullVersion = info.fullVersions[0]
  if (node && lastFullVersion !== node) {
    info.fullVersions.unshift(node)
    Object.values(info.compatible).forEach(v => {
      if (v.full.includes(lastFullVersion)) {
        v.full.unshift(node)
      }
    })
  }
  const lastLightVersion = info.lightVersions[0]
  if (lightClient && lastLightVersion !== lightClient) {
    info.lightVersions.unshift(lightClient)
    Object.values(info.compatible).forEach(v => {
      if (v.light.includes(lastLightVersion)) {
        v.light.unshift(lightClient)
      }
    })
  }
  fs.writeFileSync(compatiblePath, `${JSON.stringify(info, null, 2)}\r\n`)
}

const exec = async () => {
  const latestVersions = await fetchCkbLatestVersion()
  const builtinVersions = await fetchBuiltinCkbVersion()

  const compatibleUpdaterParams = {
    node: undefined,
    lightClient: undefined,
  }
  if (latestVersions.node !== builtinVersions.node) {
    fs.writeFileSync(BUILTIN_VERSION_PATH.node, `${latestVersions.node}\n`)
    compatibleUpdaterParams.node = getMajorAndMinorVersion(latestVersions.node)
  }

  if (latestVersions.lightClient !== builtinVersions.lightClient) {
    fs.writeFileSync(BUILTIN_VERSION_PATH.lightClient, `${latestVersions.lightClient}\n`)
    compatibleUpdaterParams.lightClient = getMajorAndMinorVersion(latestVersions.lightClient)
  }

  updateCompatible(compatibleUpdaterParams)
}

exec()
