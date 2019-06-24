import path from 'path'
import { app as electronApp, remote } from 'electron'

const fakeApp = {
  getPath(aPath: string): string {
    return path.join(__dirname, '../tests', aPath)
  },
  getName(): string {
    return 'Fake App'
  },
  getLocale(): string {
    return 'zh-CN'
  },
}
const app = electronApp || (remote && remote.app) || fakeApp

export default app
