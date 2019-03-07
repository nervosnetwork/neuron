import { interval } from 'rxjs'
import { map, distinctUntilChanged, flatMap } from 'rxjs/operators'
import { Channel } from './utils/const'
import ckbCore from './core'
import asw from './wallets/asw'

import console = require('console')

const numbers = interval(1000)
const monitors = {
  network: () => ({
    name: 'TestNet',
    remote: ckbCore.node,
    connected: false,
  }),
  balance: asw.getBalance,
  tipBlockNumber: ckbCore.rpc.getTipBlockNumber,
}

const monitorChain = (webContents: Electron.WebContents) => {
  numbers
    .pipe(map(() => monitors.network()))
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
    .pipe(flatMap(monitors.tipBlockNumber))
    .pipe(distinctUntilChanged())
    .subscribe(result => {
      if (!webContents) return
      console.log(result)
      webContents.send(Channel.GetTipBlockNumber, {
        status: 1,
        result,
      })
    }, console.error)

  numbers
    .pipe(flatMap(monitors.balance))
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
