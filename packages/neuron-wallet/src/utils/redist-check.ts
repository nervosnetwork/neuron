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
          return !!stdout
        })
        .catch(err => {
          logger.error(err)
          return false
        })
    )
  )
  return vcredists.includes(true)
}

export default redistCheck
