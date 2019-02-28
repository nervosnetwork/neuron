import { interval } from 'rxjs'
import { map, distinctUntilChanged, flatMap } from 'rxjs/operators'
import { Channel } from './utils/const'
import { ckbCore } from './channel'

const numbers = interval(1000)
const asw = ckbCore.wallet.newASW()

const monitorNetwork = () => ({
  remote: ckbCore.node,
  connected: false,
})

const monitorBalance = async () => {
  return asw.getBalance()
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
}

export default monitorChain
