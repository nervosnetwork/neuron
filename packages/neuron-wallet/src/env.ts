import { app as electronApp, remote } from 'electron'
import os from 'os'
import * as path from 'path'

const app = electronApp || (remote && remote.app) || {
  getPath(aPath: string): string {
    return path.join(os.tmpdir(), aPath)
  },
  name: 'Fake App',
  getLocale(): string {
    return 'en'
  }
}

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
  isTestMode: boolean
}
const env: ENV = {
  isDevMode,
  fileBasePath: path.resolve(app.getPath('userData'), fileBase),
  mainURL: isDevMode ? 'http://localhost:3000' : `file://${path.join(__dirname, '../dist/neuron-ui/index.html')}`,
  remote: 'http://localhost:8114',
  isTestMode,
}

export default env
