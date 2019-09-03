import * as path from 'path'
import app from 'app'
import { NetworkWithID } from 'types/network'

const { NODE_ENV } = process.env

const isTestMode = NODE_ENV === 'test'
const isDevMode = !app.isPackaged && !isTestMode

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
    current: 'testnet'
    list: NetworkWithID[]
  }
  explorer: string
  testnet: boolean
  isTestMode: boolean
}
const env: ENV = {
  isDevMode,
  fileBasePath: path.resolve(app.getPath('userData'), fileBase),
  mainURL: isDevMode ? 'http://localhost:3000' : `file://${path.join(__dirname, '../dist/neuron-ui/index.html')}`,
  remote: 'http://localhost:8114',
  presetNetworks: {
    current: 'testnet',
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
