import * as path from 'path'
import app from './app'
import { NetworkWithID } from './services/networks'

const { NODE_ENV } = process.env

const isDevMode = !app.isPackaged

const isTestMode = NODE_ENV === 'test'

const fileBase = (() => {
  if (isTestMode) {
    return 'test/'
  }
  if (!isDevMode) {
    return ''
  }
  return 'dev/'
})()

interface ENV {
  isDevMode: boolean
  fileBasePath: string
  mainURL: string
  remote: string
  presetNetworks: {
    active: 'testnet'
    list: NetworkWithID[]
  }
  explorer: string
  testnet: boolean
  isTestMode: boolean
}
const env: ENV = {
  isDevMode,
  fileBasePath: path.resolve(app.getPath('userData'), fileBase),
  mainURL: isDevMode ? 'http://localhost:3000' : `file://${path.join(__dirname, '../ui/index.html')}`,
  remote: 'http://localhost:8114',
  presetNetworks: {
    active: 'testnet',
    list: [
      {
        id: 'testnet',
        name: 'Testnet',
        remote: 'http://localhost:8114',
        type: 0,
      },
      {
        id: 'local',
        name: 'Local',
        remote: 'http://localhost:8114',
        type: 1,
      },
    ],
  },
  explorer: 'https://explorer.nervos.org',
  testnet: true,
  isTestMode,
}

export default env
