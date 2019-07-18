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
  bridge: any
  nativeImage: any
}

declare module '*.json' {
  const value: any
  export default value
}
