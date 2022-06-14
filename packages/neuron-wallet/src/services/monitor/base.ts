import logger from 'utils/logger'

export default abstract class Monitor {
  interval: ReturnType<typeof setInterval> | null = null

  isReStarting: boolean = false

  name: string = ''

  abstract isLiving(): Promise<boolean>

  abstract restart(): Promise<void>

  startMonitor() {
    this.interval = setInterval(async () => {
      if (this.isReStarting) {
        return
      }
      let timeout: ReturnType<typeof setTimeout>
      const isLiving = await Promise.race([
        this.isLiving(),
        new Promise<boolean>(resolve => {
          timeout = setTimeout(() => {
            logger.info(`Monitor ${this.name}: isLiving function timeout`)
            resolve(true)
          }, 5000)
        })
      ])
      clearTimeout(timeout!)
      if (!isLiving) {
        logger.info(`Monitor: is restarting ${this.name} process`)
        this.isReStarting = true
        try {
          await this.restart()
          logger.info(`Monitor: Restarting ${this.name} process success`)
        } finally {
          this.isReStarting = false
        }
      }
    }, 10000)
  }

  clearMonitor() {
    if (this.interval) {
      clearInterval(this.interval)
    }
    this.interval = null
  }
}
