import * as path from 'path'
import app from './app'
import { NetworkWithID } from './services/networks'

const isDevMode = !app.isPackaged
interface ENV {
  isDevMode: boolean
  fileBasePath: string
  mainURL: string
  remote: string
  presetNetwors: {
    active: 'testnet'
    list: NetworkWithID[]
  }
}
const env: ENV = {
  isDevMode,
  fileBasePath: path.resolve(app.getPath('userData'), isDevMode ? 'dev/' : ''),
  mainURL: isDevMode ? 'http://localhost:3000' : `file://${path.join(__dirname, '../ui/index.html')}`,
  remote: 'http://localhost:8114',
  presetNetwors: {
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
}

export default env
