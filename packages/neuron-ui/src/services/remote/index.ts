import { ipcRenderer, remote, desktopCapturer, shell } from 'electron'

export * from './app'
export * from './wallets'
export * from './networks'
export * from './transactions'
export * from './specialAssets'
export * from './updater'
export * from './sudt'

const REMOTE_MODULE_NOT_FOUND =
  'The remote module is not found, please make sure the UI is running inside the Electron App'

const LIMITED_TO_ELECTRON = 'This function is limited to Electron'

export const getLocale = () => {
  // While render process modules must be accessible in Electron,
  // this validation cannot be removed, as other developers may be running this code in their browsers.
  if (ipcRenderer === undefined) {
    console.warn(REMOTE_MODULE_NOT_FOUND)
    return window.navigator.language
  }
  return ipcRenderer.sendSync('get-locale')
}

export const getVersion = () => {
  return remote?.app.getVersion() ?? ''
}

export const getPlatform = () => {
  return remote?.process.platform ?? 'Unknown'
}

export const getWinID = () => {
  if (remote === undefined) {
    console.warn(REMOTE_MODULE_NOT_FOUND)
    return -1
  }
  return remote?.getCurrentWindow().id
}

export const showErrorMessage = (title: string, content: string) => {
  if (remote === undefined) {
    console.warn(REMOTE_MODULE_NOT_FOUND)
    window.alert(`${title}: ${content}`)
  }
  remote.require('electron').dialog.showErrorBox(title, content)
}

export const showOpenDialog = (options: { title: string; message?: string }) => {
  if (remote === undefined) {
    window.alert(REMOTE_MODULE_NOT_FOUND)
    return Promise.reject()
  }
  return remote.require('electron').dialog.showOpenDialog(options)
}

export const showOpenDialogModal = (options: { title: string; message?: string }) => {
  if (remote === undefined) {
    window.alert(REMOTE_MODULE_NOT_FOUND)
    return Promise.reject()
  }
  return remote.require('electron').dialog.showOpenDialog(remote.getCurrentWindow(), options)
}

export const openExternal = (url: string) => {
  if (shell === undefined) {
    window.open(url)
  } else {
    shell.openExternal(url)
  }
}

export const openContextMenu = (
  template: ({ label: string; click: Function } | { role: string } | { type: string })[]
): void => {
  if (remote === undefined) {
    window.alert(REMOTE_MODULE_NOT_FOUND)
  } else {
    const { Menu } = remote.require('electron')
    const menu = Menu.buildFromTemplate(template)
    menu.popup()
  }
}

const isError = (obj: any): obj is Error => {
  return !!obj.message
}

export const captureScreenshot = async () => {
  if (remote === undefined) {
    return Promise.reject(LIMITED_TO_ELECTRON)
  }
  const sources = await desktopCapturer.getSources({ types: ['screen'], thumbnailSize: { width: 1920, height: 1440 } })
  const sizes = remote
    .require('electron')
    .screen.getAllDisplays()
    .map((display: any) => display.size)
  const streams: (MediaStream | Error)[] = await Promise.all(
    sources.map(async (source, idx) => {
      const constraints: any = {
        audio: false,
        video: {
          mandatory: {
            minHeight: sizes[idx].height,
            minWidth: sizes[idx].width,
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id,
          },
        },
      }
      try {
        return window.navigator.mediaDevices.getUserMedia(constraints)
      } catch (err) {
        return err
      }
    })
  )
  return Promise.all(
    streams.map(async (stream, idx) => {
      try {
        return new Promise<ImageData>(resolve => {
          if (!isError(stream)) {
            const video = document.createElement('video')
            video.style.height = `${sizes[idx].height}px`
            video.style.width = `${sizes[idx].width}px`
            video.onloadedmetadata = () => {
              video.play()
              const cvs = document.createElement('canvas')
              cvs.style.height = `${sizes[idx].height}px`
              cvs.style.width = `${sizes[idx].width}px`
              cvs.width = sizes[idx].width
              cvs.height = sizes[idx].height
              const ctx = cvs.getContext('2d')!
              ctx.drawImage(video, 0, 0, cvs.width, cvs.height)
              const imageData = ctx.getImageData(0, 0, cvs.width, cvs.height)
              resolve(imageData)
            }
            video.srcObject = stream
          } else {
            resolve(new ImageData(1, 1))
          }
        })
      } catch (err) {
        console.error(err)
        return new ImageData(1, 1)
      }
    })
  )
}

export default {
  getLocale,
  showErrorMessage,
  showOpenDialog,
  getWinID,
  openExternal,
  openContextMenu,
  captureScreenshot,
}
