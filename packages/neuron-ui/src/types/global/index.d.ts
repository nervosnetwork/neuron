declare module global {
  interface Window {
    clipboard: any
    remote: any
  }
}

declare module '*.json' {
  const value: any
  export default value
}
