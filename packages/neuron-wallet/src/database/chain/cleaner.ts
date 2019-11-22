import fs from 'fs'
import path from 'path'
import env from 'env'

// Clean local sqlite storage
export default class ChainCleaner {
  // Delete all sqlite files under cells folder.
  // It doesn't handle error or throw exception when deleting fails.
  public static clean() {
    const folder = path.join(env.fileBasePath, 'cells')
    fs.readdir(folder, (err, files) => {
      if (err) {
        return
      }

      for (const file of files.filter(f => { return path.extname(f) === '.sqlite' })) {
        fs.unlink(path.join(folder, file), () => {})
      }
    })
  }
}
