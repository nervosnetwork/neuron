import path from 'path'
import os from 'os'
import { app as electronApp } from 'electron'

const fakeApp = {
  getPath(aPath: string): string {
    return path.join(os.tmpdir(), aPath)
  },
}
const app = electronApp || fakeApp

export default app
