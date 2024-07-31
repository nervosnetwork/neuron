import * as process from 'process'
import { rmSync } from 'node:fs'
import fs from 'fs'
import * as tar from 'tar'
import { scheduler } from 'timers/promises'

export const platform = (): string => {
  switch (process.platform) {
    case 'win32':
      return 'win'
    case 'linux':
      return 'linux'
    case 'darwin':
      return 'mac'
    default:
      return ''
  }
}
function createTimeoutError(message?: string): Error {
  const err = new Error(message)
  err.name = 'TimeoutError'
  return err
}

/**
 * Delay for `milliseconds`
 * @param milliseconds
 */
export function delay(milliseconds: number): Promise<void> {
  return scheduler.wait(milliseconds)
}

export interface TimeoutOptions {
  milliseconds?: number
  message?: string | Error
}

/**
 * Timeout a promise after `milliseconds`
 * @param promise
 * @param options
 */
export function timeout<T>(promise: Promise<T>, options: TimeoutOptions | number = {}): Promise<T> {
  const milliseconds: number = typeof options === 'number' ? options : options.milliseconds ?? 1000
  const message = typeof options === 'number' ? undefined : options.message

  const timeoutPromise = delay(milliseconds).then(() =>
    Promise.reject(message instanceof Error ? message : createTimeoutError(message))
  )

  return Promise.race<T>([promise, timeoutPromise])
}

export interface RetryOptions {
  retries?: number
  timeout?: number
  delay?: number
}

/**
 * Retry a promise
 * @param run
 * @param options
 */
export function retry<T>(run: () => T | Promise<T>, options: RetryOptions = {}): Promise<T> {
  const { retries = 10, timeout: timeoutMs = 1000, delay: delayMs = 0 } = options

  let lastErr: unknown
  let times = 0

  const retryPromise = new Promise<T>((resolve, reject) => {
    function retryRun() {
      times++
      if (times > retries) {
        reject(lastErr)
        return
      }
      Promise.resolve(run()).then(resolve, e => {
        lastErr = e
        delay(delayMs).then(retryRun)
      })
    }

    retryRun()
  })

  return timeout(retryPromise, { milliseconds: timeoutMs })
}
export function rm(path: string) {
  try {
    rmSync(path, { force: true, recursive: true, maxRetries: 10 })
  } catch (e) {
    console.log(e)
  }
}

export async function extractTarGz(tarFilePath: string, outputFolderPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const readStream = fs.createReadStream(tarFilePath)

    readStream
      .pipe(
        tar.x({
          cwd: outputFolderPath,
        })
      )
      .on('error', err => {
        reject(err)
      })
      .on('end', () => {
        resolve()
      })
  })
}
