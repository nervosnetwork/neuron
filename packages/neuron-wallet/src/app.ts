import path from 'path'
import os from 'os'
import { app as electronApp, remote } from 'electron'

const fakeApp = {
  getPath(aPath: string): string {
    return path.join(os.tmpdir(), aPath)
  },
  getName(): string {
    return 'Fake App'
  },
  getLocale(): string {
    return 'en'
  },
}
const app = electronApp || (remote && remote.app) || fakeApp

export default app
