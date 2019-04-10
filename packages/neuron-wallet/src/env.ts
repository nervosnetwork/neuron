import * as path from 'path'
import app from './app'

const isDevMode = !app.isPackaged
const env = {
  isDevMode,
  mainURL: isDevMode ? 'http://localhost:3000' : `file://${path.join(__dirname, '../ui/index.html')}`,
  remote: 'http://localhost:8114',
  defaultNetworks: [
    {
      name: 'Testnet',
      remote: 'http://localhost:8114',
      type: 0,
    },
    {
      name: 'Local',
      remote: 'http://localhost:8114',
      type: 1,
    },
  ],
}

export default env
