import { interval } from 'rxjs'
import {
  // map,
  distinctUntilChanged,
  flatMap,
} from 'rxjs/operators'
import { Channel } from './utils/const'
import ckbCore from './core'
import asw from './wallets/asw'
import logger from './utils/logger'

const numbers = interval(1000)
const monitors = {
  network: () => ({
    name: (ckbCore as any).node.name,
    remote: ckbCore.node.url,
    connected: false,
  }),
  balance: asw.getBalance,
  tipBlockNumber: ckbCore.rpc.getTipBlockNumber,
}

const monitorChain = (webContents: Electron.WebContents) => {
  // numbers
  //   .pipe(map(() => monitors.network()))
  //   .pipe(
  //     distinctUntilChanged((x, y) => {
  //       return x.connected === y.connected && x.remote === y.remote
  //     }),
  //   )
  //   .subscribe(
  //     result => {
  //       if (!webContents) return
  //       webContents.send(Channel.Networks, {
  //         status: 1,
  //         result,
  //       })
  //     },
  //     (err: Error) => {
  //       logger.log({
  //         level: 'error',
  //         message: err.message,
  //       })
  //     },
  //   )

  numbers
    .pipe(flatMap(monitors.tipBlockNumber))
    .pipe(distinctUntilChanged())
    .subscribe(
      result => {
        if (!webContents) return
        webContents.send(Channel.GetTipBlockNumber, {
          status: 1,
          result,
        })
      },
      (err: Error) =>
        logger.log({
          level: 'error',
          message: err.message,
        }),
    )

  numbers
    .pipe(flatMap(monitors.balance))
    .pipe(distinctUntilChanged())
    .subscribe(
      result => {
        if (!webContents) return
        webContents.send(Channel.GetBalance, {
          status: 1,
          result,
        })
      },
      (err: Error) =>
        logger.log({
          level: 'error',
          message: err.message,
        }),
    )
}

export default monitorChain
