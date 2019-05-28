import path from 'path'
import os from 'os'
import { app as electronApp, remote } from 'electron'

const fakeApp = {
  getPath(aPath: string): string {
    return path.join(os.tmpdir(), aPath)
  },
}
const app = electronApp || (remote && remote.app) || fakeApp

export default app
