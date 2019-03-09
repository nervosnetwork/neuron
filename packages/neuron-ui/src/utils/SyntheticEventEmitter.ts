class SyntheticEventEmitter {
  handlers: any[]

  constructor(...handlers: any[]) {
    this.handlers = handlers
  }

  send = (channel: string, args: any = '') => {
    this.handlers.forEach(handler => handler.send(channel, args))
  }

  on = (channel: string, cb: Function) => {
    this.removeAllListeners(channel)
    return this.handlers.map(handler => {
      return handler.on(channel, cb)
    })
  }

  removeAllListeners = (channel: string) => {
    this.handlers.forEach(handler => {
      if ('removeAllListeners' in handler) {
        handler.removeAllListeners(channel)
      }
    })
  }

  addEventListener = (event: string, cb: EventListenerOrEventListenerObject) => {
    window.removeEventListener(event, cb)
    window.addEventListener(event, cb)
  }
}

export default SyntheticEventEmitter
