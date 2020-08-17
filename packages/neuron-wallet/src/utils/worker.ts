import type { ChildProcess } from 'child_process'

interface WorkerMessage {
  type?: 'caller' | 'kill',
  result?: {
    channel?: string,
    args?: any[]
  }
}

export type WorkerFunction = ((...args: any[]) => any) | (() => any);
export type WorkerModule<Keys extends string> = {
    [key in Keys]: WorkerFunction;
};

/**
 * expose must be called in a child process, and
 * make an object containing methods callable from the master process.
 * @param obj
 */
export function expose (obj: Record<string, Function>) {
  const channels = Object.keys(obj)
  // Sending a message in macrotasks ensures that
  // the message is sent before listening(in microtasks) for it.
  setImmediate(() => {
    process.send!({ channels })
  })

  // Since Jest modifies process.on to not respond to child process messages,
  // the following statement will never be executed in the test environment
  // istanbul ignore next
  process.on('message', async (msg: WorkerMessage) => {
    if (msg?.type === 'kill') {
      process.exit(0)
    }
    if (msg?.type !== 'caller') {
      return
    }

    const channel = msg?.result?.channel ?? ''
    const func = obj[channel]

    if (typeof func !== 'function') {
      return
    }

    const result = await func.apply(null, msg?.result?.args ?? [])
    process.send!({
      type: `result_${channel}`,
      result
    })
  })
}

export async function spawn<T>(worker: ChildProcess): Promise<T & WorkerInst> {
  const channels: string[] = await new Promise(resovle => {
    worker.once('message', msg => {
      if (msg?.channels) {
        resovle(msg?.channels)
      }
    })
  })

  const handlers = channels.reduce((handlers, channel) => {
    handlers[channel] = async (...args: any[]) => {
      return await new Promise(resovle => {
        worker.once('message', msg => {
          if (msg?.type === `result_${channel}`) {
            resovle(msg?.result)
          }
        })

        worker.send({
          type: 'caller',
          result: {
            channel,
            args
          }
        } as WorkerMessage)
      })
    }
    return handlers
  }, Object.create({}))

  handlers.$worker = worker
  return handlers
}

interface WorkerInst {
  $worker?: ChildProcess
  [key: string]: any
}

export async function terminate<T extends WorkerInst> (workerInst: T) {
  const worker = workerInst.$worker
  worker?.send({ type: 'kill' })
  worker?.disconnect()
  worker?.kill('SIGHUP')
}

export function subscribe<T extends WorkerInst>(workerInst: T, listener: (...args: any[]) => void) {
  const worker = workerInst.$worker
  worker?.on('message', listener)
}
