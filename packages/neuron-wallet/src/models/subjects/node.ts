import { BehaviorSubject } from 'rxjs'

export const ConnectionStatusSubject = new BehaviorSubject<{
  url: string,
  connected: boolean,
  isBundledNode: boolean,
  startedBundledNode: boolean,
}>({
  url: '',
  connected: false,
  isBundledNode: true,
  startedBundledNode: false,
})
