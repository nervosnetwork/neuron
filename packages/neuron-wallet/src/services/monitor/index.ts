import Base from './base'
import CkbMonitor from './ckb-monitor'

const monitors: Base[] = []

export default async function startMonitor(name?: string, startNow?: boolean) {
  if (!monitors.length) {
    monitors.push(new CkbMonitor())
  }
  const filterMonitors = monitors.filter(v => !name || v.name === name)
  await Promise.all(filterMonitors.map((v: Base) => v.startMonitor(undefined, startNow)))
}

export async function stopMonitor(name?: string) {
  await Promise.all(monitors.filter(v => !name || v.name === name).map(v => v.stopMonitor()))
}
