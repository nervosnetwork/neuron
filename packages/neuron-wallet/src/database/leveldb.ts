import fs from 'fs'
import path from 'path'
import levelup, { LevelUp } from 'levelup'
import leveldown from 'leveldown'
import sub from 'subleveldown'
import env from 'env'

// Create a database. If prefix is provided the result will be a sublevel db
// with its own keyspace.
const leveldb = (dbname: string, prefix: string | null = null): LevelUp => {
  const dbpath = path.join(env.fileBasePath, dbname)
  if (!fs.existsSync(dbpath)) {
    fs.mkdirSync(dbpath, { recursive: true })
  }

  const db = levelup(leveldown(dbpath))
  if (prefix) {
    return sub(db, prefix, { valueEncoding: 'json' })
  }
  return db
}

export default leveldb
