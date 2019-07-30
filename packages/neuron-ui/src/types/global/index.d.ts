declare interface Window {
  clipboard: any
  remote: {
    getCurrentWebContents: Function
    getCurrentWindow: Function
    getGlobal: (name: string) => any
    require: (module: string) => any
    process?: any
  }
  require: any
  nativeImage: any
  ipcRenderer: {
    on(channel: string, listener: Function)
    removeListener(channel: string, listener: Function)
  }
}

declare module '*.json' {
  const value: any
  export default value
}

declare module '*.scss'
