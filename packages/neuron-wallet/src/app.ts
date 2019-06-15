import path from 'path'
import { app as electronApp, remote } from 'electron'

const fakeApp = {
  getPath(aPath: string): string {
    return path.join(__dirname, '../tests', aPath)
  },
}
const app = electronApp || (remote && remote.app) || fakeApp

export default app
