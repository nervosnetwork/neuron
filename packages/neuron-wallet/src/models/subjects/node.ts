import { BehaviorSubject } from 'rxjs'

export const ConnectionStatusSubject = new BehaviorSubject<{
  url: string,
  connected: boolean
}>({
  url: '',
  connected: false
})
