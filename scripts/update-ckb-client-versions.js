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

const exec = async () => {
  const latestVersions = await fetchCkbLatestVersion()
  const builtinVersions = await fetchBuiltinCkbVersion()

  if (latestVersions.node !== builtinVersions.node) {
    fs.writeFileSync(BUILTIN_VERSION_PATH.node, latestVersions.node)
  }

  if (latestVersions.lightClient !== builtinVersions.lightClient) {
    fs.writeFileSync(BUILTIN_VERSION_PATH.lightClient, latestVersions.lightClient)
  }
}

exec()
