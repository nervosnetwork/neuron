import logger from 'utils/logger'
import { interval, timer, Subscription, race, from } from 'rxjs'
import { map } from 'rxjs/operators'

export default abstract class Monitor {
  interval: Subscription | null = null

  isReStarting: boolean = false

  name: string = ''

  abstract isLiving(): Promise<boolean>

  abstract restart(): Promise<void>

  startMonitor(intervalTime: number = 10000) {
    this.interval = interval(intervalTime).subscribe(async () => {
      if (this.isReStarting) {
        return
      }
      const timeout = timer(intervalTime / 2).pipe(map(() => true))
      const isLiving = await race(timeout, from(this.isLiving())).toPromise()
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
    })
  }

  clearMonitor() {
    this.interval?.unsubscribe()
  }
}
