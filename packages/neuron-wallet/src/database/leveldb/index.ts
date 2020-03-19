import fs from 'fs'
import path from 'path'
import levelup, { LevelUp } from 'levelup'
import leveldown from 'leveldown'
import env from 'env'
import logger from 'utils/logger'

const leveldb = (dbname: string): LevelUp => {
  const dir = env.fileBasePath
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }

  const dbpath = path.join(dir, dbname)
  return levelup(leveldown(dbpath), (err: Error | undefined) => {
    logger.error(`Database:\tfail to open leveldb ${dbname}:`, err?.toString())

  })
}

export const maindb = leveldb("datastore")

export default leveldb
