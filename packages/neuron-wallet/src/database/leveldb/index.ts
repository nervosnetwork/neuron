import fs from 'fs'
import path from 'path'
import levelup, { LevelUp } from 'levelup'
import leveldown from 'leveldown'
import sub from 'subleveldown'
import env from 'env'

// Create a database. If prefix is provided the result will be a sublevel db
//   with its own keyspace. If valueEncoding is provided it's applied to the
//   sublevel db.
const leveldb = (prefix?: string, valueEncoding?: string): LevelUp => {
  const dbname = "datastore" // Keep as a single database
  const dbpath = path.join(env.fileBasePath, dbname)
  if (!fs.existsSync(dbpath)) {
    fs.mkdirSync(dbpath, { recursive: true })
  }

  const db = levelup(leveldown(dbpath))
  if (prefix) {
    return sub(db, prefix, { valueEncoding })
  }
  return db
}

export const txdb = leveldb('transactions')

export default leveldb
