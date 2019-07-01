declare module NodeJS {
  interface Global {
    mainWindow?: Electron.BrowserWindow | null
  }
}
