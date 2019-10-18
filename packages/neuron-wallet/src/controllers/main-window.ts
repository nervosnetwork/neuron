import { BrowserWindow } from 'electron'

export default class MainWindowController {
  public static mainWindow: BrowserWindow | null

  public static sendMessage = (channel: string, obj: any) => {
    if (MainWindowController.mainWindow) {
      MainWindowController.mainWindow.webContents.send(channel, obj)
    }
  }
}
