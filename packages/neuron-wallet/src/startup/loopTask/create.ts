import { BrowserWindow } from 'electron'
import windowStateKeeper from 'electron-window-state'
import { Subject } from 'rxjs'
import path from 'path'
import { networkSwitchSubject, NetworkWithID } from '../../services/networks'
import app from '../../app'
import nodeService from '../nodeService'
import env from '../../env'
import initConnection from '../../typeorm'

networkSwitchSubject.subscribe(async (network: NetworkWithID | undefined) => {
  if (network) {
    await initConnection(network.name)
  }
})

// TODO: mock as an address subject
export const addressChangeSubject = new Subject()

const loadURL = `file://${path.join(__dirname, 'index.html')}`

// pass data in main process to renderer process
const syncTaskAttrs = {
  networkSwitchSubject,
  nodeService,
  addressChangeSubject,
}

Object.defineProperty(app, 'syncTask', {
  get: () => {
    return syncTaskAttrs
  },
})

/* eslint global-require: "off" */
// create a background task to sync transactions
// this task is a renderer process
const createLoopTask = () => {
  const windowState = windowStateKeeper({
    defaultWidth: 1366,
    defaultHeight: 768,
  })
  let loopWindow: BrowserWindow | null = new BrowserWindow({
    x: windowState.x,
    y: windowState.y,
    width: windowState.width,
    height: windowState.height,
    minWidth: 800,
    minHeight: 600,
    show: false,
    backgroundColor: '#e9ecef',
    webPreferences: {
      nodeIntegration: true,
    },
  })

  loopWindow.loadURL(loadURL)

  loopWindow.on('ready-to-show', async () => {
    if (env.isDevMode && process.env.DEV_SYNC_TASK) {
      loopWindow!.show()
    } else {
      loopWindow!.hide()
    }
  })

  loopWindow.on('closed', () => {
    loopWindow = null
  })

  return loopWindow
}

export default createLoopTask
