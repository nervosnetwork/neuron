declare interface Window {
  electron: {
    clipboard: any
    shell: any
    require: any
    nativeImage: any
    ipcRenderer: import('electron').IpcRenderer
  }
}

declare module '*.json' {
  const value: string
  export default value
}

declare module '*.svg' {
  const value: string
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
  export default value
}

declare module '*.png' {
  const value: string
  export default value
}

declare module '*.mp4' {
  const value: string
  export default value
}

declare module '*.scss'

declare namespace Fixture {
  export type Validator<V, E = number | null> = [string, Parameters<V>, E]
}
