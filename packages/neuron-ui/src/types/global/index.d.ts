declare interface Window {
  clipboard: any
  remote: any
  require: any
  bridge: any
}

declare module '*.json' {
  const value: any
  export default value
}
