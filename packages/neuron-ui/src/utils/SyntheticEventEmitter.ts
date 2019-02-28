class SyntheticEventEmitter {
  handlers: any[]

  constructor(...handlers: any[]) {
    this.handlers = handlers
  }

  send = (channel: string, args: any = '') => {
    this.handlers.forEach(handler => handler.send(channel, args))
  }

  on = (channel: string, cb: Function) => {
    return this.handlers.map(handler => {
      if ('removeAllListeners' in handler) {
        handler.removeAllListeners(channel)
      }
      return handler.on(channel, cb)
    })
  }
}

export default SyntheticEventEmitter
