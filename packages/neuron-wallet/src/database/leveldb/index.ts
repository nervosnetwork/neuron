import fs from 'fs'
import path from 'path'
import levelup, { LevelUp } from 'levelup'
import leveldown from 'leveldown'
import env from 'env'

const leveldb = (dbname: string): LevelUp => {
  const dir = env.fileBasePath
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const dbpath = path.join(dir, dbname)
  const db = levelup(leveldown(dbpath))
  return db
}

export const maindb = leveldb("datastore")

export default leveldb
