import Base from './base'
import CkbIndexerMonitor from './ckb-indexer-monitor'
import CkbMonitor from './ckb-monitor'

export default function startMonitor() {
  const monitors = [new CkbIndexerMonitor(), new CkbMonitor()]
  monitors.forEach((v: Base) => {
    v.startMonitor()
  })
}
