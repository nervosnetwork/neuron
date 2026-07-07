import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import logger from '../utils/logger'

const redistCheck = async () => {
  if (process.platform !== 'win32') {
    return true
  }
  const execPromise = promisify(exec)
  const arches = ['x64']
  const queries = arches.map(
    arch =>
      `REG QUERY ` +
      [`HKEY_LOCAL_MACHINE`, `SOFTWARE`, `Microsoft`, `VisualStudio`, `14.0`, `VC`, `Runtimes`, arch].join(path.sep)
  )
  const vcredists = await Promise.all(
    queries.map(query =>
      execPromise(query)
        .then(({ stdout, stderr }) => {
          if (stderr) {
            logger.error(`${query} stderr: ${stderr}`)
            return false
          }
          return isSupportedRedist(stdout)
        })
        .catch(err => {
          logger.error(err)
          return false
        })
    )
  )
  return vcredists.includes(true)
}

export const MINIMUM_REDIST_VERSION = '14.44.0.0'

export const getRedistVersion = (stdout?: string | null) => {
  return stdout
    ?.split(/\r?\n/)
    .find(line => /\bVersion\b/i.test(line))
    ?.match(/v?(\d+(?:\.\d+)+)/i)?.[1]
}

export const compareVersions = (version: string, minimumVersion: string) => {
  const versionParts = version.split('.').map(Number)
  const minimumVersionParts = minimumVersion.split('.').map(Number)
  const length = Math.max(versionParts.length, minimumVersionParts.length)
  for (let idx = 0; idx < length; idx++) {
    const current = versionParts[idx] ?? 0
    const minimum = minimumVersionParts[idx] ?? 0
    if (current > minimum) {
      return 1
    }
    if (current < minimum) {
      return -1
    }
  }
  return 0
}

export const isSupportedRedist = (stdout?: string | null) => {
  const installed = !/\bInstalled\s+REG_DWORD\s+0x0\b/i.test(stdout ?? '')
  const version = getRedistVersion(stdout)
  return installed && !!version && compareVersions(version, MINIMUM_REDIST_VERSION) >= 0
}

export default redistCheck
