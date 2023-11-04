import net from 'net'

async function isPortReachable(port: number) {
  const timeout = 1e3
  const host = '127.0.0.1'
  const promise = new Promise<void>((resolve, reject) => {
    const socket = new net.Socket()

    const onError = () => {
      socket.destroy()
      reject()
    }

    socket.setTimeout(timeout)
    socket.once('error', onError)
    socket.once('timeout', onError)

    socket.connect(port, host, () => {
      socket.end()
      resolve()
    })
  })

  try {
    await promise
    return true
  } catch (_) {
    return false
  }
}

export async function getUsablePort(port: number, maxRetryTimes: number = 3) {
  let currentPort = port
  while (currentPort < port + maxRetryTimes) {
    if (!(await isPortReachable(currentPort))) {
      return currentPort
    }
    currentPort += 1
  }
  throw new Error(`Can not find usable port by from ${port} to ${currentPort - 1}`)
}
