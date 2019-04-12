import { app as electronApp } from 'electron'

const fakeApp = {
  getPath(path: string): string {
    return path
  },
}
const app = electronApp || fakeApp

export default app
