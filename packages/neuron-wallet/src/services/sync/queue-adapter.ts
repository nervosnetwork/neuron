import async from 'async'

export default class QueueAdapter {
  private q: any

  constructor(worker: async.AsyncWorker<any, Error>, concurrency: number) {
    this.q = async.queue(worker, concurrency)
  }

  public push = (value: any) => {
    this.innerPush(value)
  }

  private innerPush = (value: any) => {
    this.q.push(value)
  }

  public kill = () => {
    this.push = (value: any) => value
    this.clear()
    this.q.kill()
  }

  public clear = () => {
    this.q.remove(() => true)
  }

  public length = (): number => {
    return this.q.length()
  }

  public drain = async () => {
    return this.q.drain()
  }
}
