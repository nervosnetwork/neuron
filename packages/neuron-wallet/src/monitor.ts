import { interval } from 'rxjs'
import { map, distinctUntilChanged, flatMap } from 'rxjs/operators'
import { Channel } from './utils/const'
import ckbCore from './core'
import asw from './wallets/asw'
import getUnspentCells from './cell'

const numbers = interval(1000)

const monitorNetwork = () => ({
  remote: ckbCore.node,
  connected: false,
})

const monitorBalance = async () => {
  return asw.getBalance()
}

const monitorUnspentCells = async () => {
  const cells = await getUnspentCells()
  cells.sort()
  return cells
}

const monitorChain = (webContents: Electron.WebContents) => {
  numbers
    .pipe(map(() => monitorNetwork()))
    .pipe(
      distinctUntilChanged((x, y) => {
        return x.connected === y.connected && x.remote.url === y.remote.url
      }),
    )
    .subscribe(result => {
      webContents.send(Channel.GetNetwork, {
        status: 1,
        result,
      })
    }, console.error)

  numbers
    .pipe(flatMap(monitorBalance))
    .pipe(distinctUntilChanged())
    .subscribe(result => {
      if (!webContents) return
      webContents.send(Channel.GetBalance, {
        status: 1,
        result,
      })
    }, console.error)

  numbers
    .pipe(flatMap(monitorUnspentCells))
    .pipe()
    .subscribe(result => {
      if (!webContents) return
      if (!asw.unlockTypeHash) return
      webContents.send(Channel.GetUnspentCells, {
        status: 1,
        result,
      })
    }, console.error)
}

export default monitorChain
