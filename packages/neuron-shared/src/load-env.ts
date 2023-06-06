import fs from 'fs'
import dotenv from 'dotenv'

const dotenvPath = '.env'
const NODE_ENV = process.env.NODE_ENV || 'development'

const dotenvFiles = [
  `${dotenvPath}.${NODE_ENV}.local`,
  `${dotenvPath}.local`,
  `${dotenvPath}.${NODE_ENV}`,
  dotenvPath,
].filter(Boolean)


export const loadEnv = () => {
  for (let i = 0; i < dotenvFiles.length; i++) {
    const dotenvFile = dotenvFiles[i]
    if (fs.existsSync(dotenvFile)) {
      dotenv.config({ path: dotenvFile, override: true })
      break
    }
  }
}
