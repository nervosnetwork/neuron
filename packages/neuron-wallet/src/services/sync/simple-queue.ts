import Utils from './utils'

export default class SimpleQueue {
  private q: any[] = []
  private worker: any
  private stopped = false

  constructor(worker: any, start: boolean = true) {
    this.worker = worker
    if (start) {
      this.start()
    }
  }

  /* eslint no-await-in-loop: "off" */
  public start = async () => {
    while (!this.stopped) {
      const nextValue = this.shift()
      if (nextValue) {
        await this.worker(nextValue)
        await this.yield()
      } else {
        await this.yield(50)
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
}
