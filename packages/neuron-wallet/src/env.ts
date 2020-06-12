import os from 'os'
import path from 'path'
import { app as electronApp, remote } from 'electron'
import dotenv from 'dotenv'

const app = electronApp ?? (remote?.app) ?? {
  getPath(aPath: string): string {
    return path.join(os.tmpdir(), aPath)
  },
  getApppath: () => os.tmpdir(),
  name: 'Fake App',
  getLocale(): string {
    return 'en'
  },
}

const isTestMode = process.env.NODE_ENV === 'test'
const isDevMode = !app.isPackaged && !isTestMode

if (isDevMode) {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env.development.local') })
}
dotenv.config()

const fileBase = (() => {
  if (isTestMode) {
    return 'test/'
  }
  if (!isDevMode) {
    return ''
  }
  return 'dev/'
})()

const env = {
  app,
  isDevMode,
  isTestMode,
  fileBasePath: path.resolve(app.getPath('userData'), fileBase),
  mainURL: isDevMode ? 'http://localhost:3000' : `file://${path.join(__dirname, '../dist/neuron-ui/index.html')}`
}

export default env
