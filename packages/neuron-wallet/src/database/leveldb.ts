import levelup from 'levelup'
import leveldown from 'leveldown'
import path from 'path'
import env from 'env'

const leveldb = (dbname: string) => {
  return levelup(leveldown(path.join(env.fileBasePath, dbname)))
}

export default leveldb