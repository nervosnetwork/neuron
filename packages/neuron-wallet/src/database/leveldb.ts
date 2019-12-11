import levelup, { LevelUp } from 'levelup'
import leveldown from 'leveldown'
import sub from 'subleveldown'
import path from 'path'
import env from 'env'

const leveldb = (dbname: string, prefix: string | null = null): LevelUp => {
  const db = levelup(leveldown(path.join(env.fileBasePath, dbname)))
  if (prefix) {
    return sub(db, prefix, { valueEncoding: 'json' })
  }
  return db
}

export default leveldb