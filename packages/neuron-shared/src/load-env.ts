import fs from 'fs'
const dotenvPath = '.env'
const NODE_ENV = process.env.NODE_NEV || 'development'

const dotenvFiles = [
  `${dotenvPath}.${NODE_ENV}.local`,
  `${dotenvPath}.local`,
  `${dotenvPath}.${NODE_ENV}`,
  dotenvPath,
].filter(Boolean)

export const loadEnv = () => {
  dotenvFiles.forEach(dotenvFile => {
    if (fs.existsSync(dotenvFile)) {
      require('dotenv').config({ path: dotenvFile })
    }
  })
}
