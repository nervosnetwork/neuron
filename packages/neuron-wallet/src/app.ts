import { remote, app as electronApp } from 'electron'

const app = electronApp || remote.app

export default app
