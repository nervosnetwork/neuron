import os from 'os'
import path from 'path'
import { app as electronApp } from 'electron'
import { loadEnv } from '@nervosnetwork/neuron-shared'

const app = electronApp ?? {
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

const fileBase = (() => {
  if (isTestMode) {
    return 'test/'
  }
  if (!isDevMode) {
    return ''
  }
  return 'dev/'
})()

loadEnv()

const port = process.env.PORT || 3000
const env = {
  app,
  isDevMode,
  isTestMode,
  fileBasePath: path.resolve(app.getPath('userData'), fileBase),
  mainURL: isDevMode ? `http://localhost:${port}` : `file://${path.join(__dirname, '../dist/neuron-ui/index.html')}`,
}

export default env
