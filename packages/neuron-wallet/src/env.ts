import os from 'os'
import path from 'path'
import dotenv from 'dotenv'
import { app as electronApp } from 'electron'

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

if (isDevMode) {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env.development.local') })
}
dotenv.config({ path: path.join(__dirname, '..', '.env') })

const fileBase = (() => {
  if (isTestMode) {
    return 'test/'
  }
  if (!isDevMode) {
    return ''
  }
  return 'dev/'
})()

const port = process.env.PORT || 3000
const env = {
  app,
  isDevMode,
  isTestMode,
  fileBasePath: path.resolve(app.getPath('userData'), fileBase),
  mainURL: isDevMode ? `http://localhost:${port}` : `file://${path.join(__dirname, '../dist/neuron-ui/index.html')}`,
}

export default env
