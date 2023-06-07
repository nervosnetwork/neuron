import fs from 'fs'
import dotenv from 'dotenv'
import dotenvExpand from 'dotenv-expand'

const dotenvPath = '.env'


export const loadEnv = () => {
  const NODE_ENV = process.env.NODE_ENV || 'development'

  const dotenvFiles = [
    `${dotenvPath}.${NODE_ENV}.local`,
    NODE_ENV !== 'test' ? `${dotenvPath}.local` : '',
    `${dotenvPath}.${NODE_ENV}`,
    dotenvPath,
  ].filter(Boolean)

  for (let i = 0; i < dotenvFiles.length; i++) {
    const dotenvFile = dotenvFiles[i]
    if (fs.existsSync(dotenvFile)) {
      dotenvExpand.expand(dotenv.config({ path: dotenvFile, override: false }))
    }
  }
}
