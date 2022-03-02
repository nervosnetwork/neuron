declare interface Window {
  electron: {
    clipboard: any
    shell: any
    require: any
    nativeImage: any
    desktopCapturer: any
    ipcRenderer: {
      invoke(channel: string, ...args: any[]): Promise<any>
      on(channel: string, listener: Function)
      removeListener(channel: string, listener: Function)
      removeAllListeners(channel: string)
      sendSync(channel: string, ...args: any[]): any
    }
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
  export const ReactComponent: React.FC<React.SVGProps<SVGSVGElement>>
  export default value
}

declare module '*.png' {
  const value: string
  export default value
}

declare module '*.scss'

declare namespace Fixture {
  export type Validator<V, E = number | null> = [string, Parameters<V>, E]
}
