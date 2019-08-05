import Utils from './utils'

export default class SimpleQueue {
  private q: any[] = []
  private worker: any
  private stopped = false
  private inProcess = false

  constructor(worker: any, start: boolean = true) {
    this.worker = worker
    if (start) {
      this.start()
    }
  }

  /* eslint no-await-in-loop: "off" */
  public start = async () => {
    while (!this.stopped) {
      try {
        this.inProcess = true
        const nextValue = this.shift()
        if (nextValue) {
          await this.worker(nextValue)
          await this.yield()
        } else {
          await this.yield(50)
        }
      } catch (err) {
        throw err
      } finally {
        this.inProcess = false
      }
    }
  }

  private shift = () => {
    return this.q.shift()
  }

  public yield = async (millisecond: number = 1) => {
    return Utils.sleep(millisecond)
  }

  public push = (value: any) => {
    this.q.push(value)
  }

  public stop = () => {
    this.stopped = true

    this.push = (value: any) => value
    this.clear()
  }

  public kill = () => {
    this.stop()
  }

  public clear = () => {
    while (this.q.length) {
      this.q.pop()
    }
  }

  public length = (): number => {
    return this.q.length
  }

  public waitForDrained = async (timeout: number = 5000) => {
    const startAt = +new Date()
    while (!(this.length() === 0 && !this.inProcess)) {
      const now = +new Date()
      if (now - startAt > timeout) {
        return
      }
      await this.yield(50)
    }
  }
}
