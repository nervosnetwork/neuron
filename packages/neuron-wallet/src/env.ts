import { remote, app } from 'electron'
import * as path from 'path'

const myApp = app || remote.app
const isDevMode = !myApp.isPackaged
const env = {
  isDevMode,
  mainURL: isDevMode ? 'http://localhost:3000' : `file://${path.join(__dirname, '../ui/index.html')}`,
  remote: 'http://localhost:8114',
  storePath: isDevMode ? `${myApp.getPath('userData')}/dev` : myApp.getPath('userData'),
  storeWalletIDsName: 'WalletID',
}

export default env
