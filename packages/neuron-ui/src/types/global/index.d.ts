declare interface Window {
  clipboard: any
  remote: {
    getCurrentWebContents: Function
    getCurrentWindow: Function
    getGlobal: (name: string) => any
    require: (module: string) => any
    process: any
    app: any
  }
  require: any
  nativeImage: any
  ipcRenderer: {
    invoke(channel: string, ...args: any[]): Promise<any>
    on(channel: string, listener: Function)
    removeListener(channel: string, listener: Function)
    removeAllListeners(channel: string)
    sendSync(channel: string, ...args: any[]): any
  }
  neuron: {
    role: 'main' | 'settings'
  }
}

declare module '*.json' {
  const value: string
  export default value
}

declare module '*.svg' {
  const value: string
  export const ReactComponent = value
  export default value
}

declare module '*.png' {
  const value: string
  export default value
}

declare module '*.scss'
