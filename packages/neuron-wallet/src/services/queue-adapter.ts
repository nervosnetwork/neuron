import async from 'async'

export default class QueueAdapter {
  private q: any

  constructor(worker: async.AsyncWorker<any, Error>, concurrency?: number | undefined) {
    this.q = async.queue(worker, concurrency)
  }

  public push = (value: any) => {
    this.innerPush(value)
  }

  private innerPush = (value: any) => {
    this.q.push(value)
  }

  public kill = () => {
    this.push = () => {}
    this.pause()
    this.remove(() => true)
    this.q.kill()
  }

  public remove = (callback: any) => {
    this.q.remove(callback)
  }

  public pause = () => {
    this.q.pause()
  }

  public resume = () => {
    this.q.resume()
  }

  public length = (): number => {
    return this.q.length()
  }

  public drain = (callback: any) => {
    this.q.drain(callback)
  }
}
