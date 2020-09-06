import type { ChildProcess as ChildProcessInst } from 'child_process'
import logger from './logger';

interface WorkerMessage {
  type?: 'caller' | 'kill',
  id: number,
  result?: {
    channel?: string,
    args?: any[]
  }
}

export type WorkerFunction = ((...args: any[]) => any) | (() => any);
export type WorkerModule<Keys extends string> = {
    [key in Keys]: WorkerFunction;
};

let requestId = 0
const requests: any = {}

const executeRequestCallback = async (requestId: string, result: any = undefined) => {
  const requestCallback = requests[requestId]
  if (requestCallback) {
    await requestCallback(result)
    delete requests[requestId]
  }
}

const drain = async () => {
  for (const id of Object.keys(requests)) {
    await executeRequestCallback(id)
  }
}

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
    ChildProcess.send({ channels })
  })

  // Since Jest modifies process.on to not respond to child process messages,
  // the following statement will never be executed in the test environment
  // istanbul ignore next
  ChildProcess.onMessage(async (msg: WorkerMessage) => {
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
    ChildProcess.send({
      id: msg.id,
      type: `result_${channel}`,
      result
    })
  })
}

export async function spawn<T>(worker: ChildProcessInst): Promise<T & WorkerInst> {

  const channels: string[] = await new Promise(resolve => {
    worker.once('message', msg => {
      if (msg.channels) {
        resolve(msg.channels)
      }
    })
  })

  worker.on('message', msg => {
    executeRequestCallback(msg.id, msg.result)
  })

  const handlers = channels.reduce((handlers, channel) => {
    handlers[channel] = async (...args: any[]) => {
      return await new Promise((resolve, reject) => {
        const request = {
          type: 'caller',
          id: requestId++,
          result: {
            channel,
            args
          },
        } as WorkerMessage

        requests[request.id] = resolve
        worker.send(request, err => {
          if (err) {
            logger.error(`Error sending message to child process ${err}`)
            reject(err)
          }
        })
      })
    }
    return handlers
  }, Object.create({}))

  handlers.$worker = worker
  return handlers
}

interface WorkerInst {
  $worker?: ChildProcessInst
  [key: string]: any
}

export async function terminate<T extends WorkerInst> (workerInst: T) {
  const worker = workerInst.$worker
  const waitForClosing = new Promise(resolve => {
    worker!.once('close', () => {
      resolve()
    })
  })
  await drain()
  worker!.kill()
  return waitForClosing
}

export function subscribe<T extends WorkerInst>(workerInst: T, listener: (...args: any[]) => void) {
  const worker = workerInst.$worker
  worker!.on('message', listener)
}

export class ChildProcess {
  static isChildProcess () {
    return !!process.send
  }

  static send(message: any) {
    if (ChildProcess.isChildProcess()) {
      process.send!(message)
    }
  }

  static onMessage(listener: (message: any, sendHandle: any) => void) {
    process.on('message', listener)
  }
}
