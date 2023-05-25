import logger from '../../utils/logger'
import { interval, timer, Subscription, race, from, Observable } from 'rxjs'
import { map } from 'rxjs/operators'

export default abstract class Monitor {
  private interval: Observable<number> | null = null

  private subcription: Subscription | null = null

  private isReStarting: boolean = false

  name: string = ''

  abstract isLiving(): Promise<boolean>

  abstract restart(): Promise<void>

  abstract stop(): Promise<void>

  monitor = async (intervalTime: number) => {
    if (this.isReStarting) {
      return
    }
    const timeout = timer(intervalTime / 2).pipe(map(() => false))
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
  }

  async startMonitor(intervalTime: number = 30000, startNow: boolean = false) {
    this.interval = interval(intervalTime)
    if (!this.subcription?.closed) {
      this.subcription?.unsubscribe()
    }
    this.subcription = this.interval.subscribe(async () => this.monitor(intervalTime))
    if (startNow) {
      await this.monitor(intervalTime)
    }
  }

  async stopMonitor() {
    this.subcription?.unsubscribe()
    await this.stop()
  }
}
