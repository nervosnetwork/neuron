import crypto from 'crypto'

import { ChildProcess, fork } from 'child_process'
import fs from 'fs'
import logger from '../../utils/logger'
import { IPCMessageRequest, IPCMessageResponse } from './server/wallet-backend'
import path from 'path'
import { WalletBackend } from '@ckb-connect/perun-wallet-wrapper/dist/services'
import PerunController from '../../controllers/perun'
import { bytes } from '@ckb-lumos/codec'
import Script from '../../models/chain/script'
import Transaction from '../../models/chain/transaction'
import Input from '../../models/chain/input'
import CellsService from '../../services/cells'
import OutPoint from '../../models/chain/out-point'
import RpcService from '../../services/rpc-service'
import { TransactionsService } from '../tx'
import NetworksService from '../networks'

// Architecture overview:
//
// [ChannelService] <-via RPC-> [PerunServiceServer] <-via IPC-> [Neuron]
export class PerunServiceRunner {
  private static instance: PerunServiceRunner

  protected runnerProcess?: ChildProcess

  private logStream?: fs.WriteStream

  static getInstance(): PerunServiceRunner {
    if (!PerunServiceRunner.instance) {
      logger.info('Creating new PerunServiceRunner instance')
      PerunServiceRunner.instance = new PerunServiceRunner()
    }
    return PerunServiceRunner.instance
  }

  async start() {
    if (this.runnerProcess) {
      logger.info('PerunServiceRunner already started, shutting down first...')
      await this.stop()
    }

    this.runnerProcess = this.spawnProcess()

    if (!this.logStream) {
      this.logStream = fs.createWriteStream('perun-service.log')
    }

    this.runnerProcess.stderr &&
      this.runnerProcess.stderr.on('data', data => {
        logger.error(`PerunServiceRunner stderr: ${data}`)
        this.logStream?.write(data)
      })

    this.runnerProcess.stdout &&
      this.runnerProcess.stdout.on('data', data => {
        logger.info(`PerunServiceRunner stdout: ${data}`)
        this.logStream?.write(data)
      })

    this.runnerProcess.on('error', error => {
      logger.error('PerunServiceRunner error:', error)
      this.runnerProcess?.kill()
      this.runnerProcess = undefined
    })

    this.runnerProcess.on('close', code => {
      logger.info(`PerunServiceRunner exited with code ${code}`)
      this.runnerProcess = undefined
    })

    // 监听ipc 消息
    this.runnerProcess.on('message', this.ipcMessageHandler)
  }

  // 通过 ipc收到 backend 发来的 message
  private ipcMessageHandler = (message: { type: IPCMessageRequest; req: unknown }) => {
    // TODO: Properly type the req paramter. E.g. use an indexed type derived from the WalletBackend interface.
    switch (message.type) {
      case 'openChannelRequest':
        return this.handleOpenChannelRequest(message.req as any)
      case 'updateNotificationRequest':
        return this.handleUpdateNotificationRequest(message.req as any)
      case 'signMessageRequest':
        return this.handleSignMessageRequest(message.req as any)
      case 'signTransactionRequest':
        return this.handleSignTransactionRequest(message.req as any)
      default: {
        logger.info('Unknown IPC message type', message.type)
      }
    }
    logger.info('PerunServiceRunner received unexpected IPC message', message)
  }

  private ipcReturn(type: IPCMessageResponse, req: unknown) {
    logger.info('runner: ipcReturn-----------', type, req)
    return new Promise<void>((resolve, reject) => {
      this.runnerProcess?.send({ type, req }, error => {
        if (error) {
          logger.error('PerunServiceRunner failed to send IPC message', error)
          reject(error)
        } else {
          logger.info('PerunServiceRunner successfully sent IPC message')
          resolve()
        }
      })
    })
  }

  private handleOpenChannelRequest(_req: Parameters<WalletBackend<{}>['openChannelRequest']>[0]) {
    // Validate the request.
    // this.validateOpenChannelRequest(req)
    logger.info('runner: handleOpenChannelRequest-----------PerunServiceRunner received openChannelRequest')
    const nonceShare = new Uint8Array(32)

    // 处理这个，比如让用户通过请求？？
    crypto.getRandomValues(nonceShare)
    this.ipcReturn('openChannelResponse', {
      nonceShare,
    })
  }

  private handleUpdateNotificationRequest(req: Parameters<WalletBackend<{}>['updateNotificationRequest']>[0]) {
    logger.info('PerunServiceRunner received updateNotificationRequest', req)
    return new Promise<void>((resolve, reject) => {
      if (
        !PerunController.emiter.emit('perun-request', {
          type: 'UpdateNotification',
          request: req,
        })
      ) {
        return reject(new Error('Failed to send perun request, no listener registered'))
      }

      PerunController.emiter.once('perun-response', (res: Controller.Params.RespondPerunRequestParams) => {
        console.log('PerunServiceRunner received updateNotificationResponse', res)
        if (res.response.rejected) {
          this.ipcReturn('updateNotificationResponse', {
            rejected: {
              reason: res.response.rejected.reason,
            },
          })
          return resolve()
        }

        this.ipcReturn('updateNotificationResponse', {
          accepted: res.response.data,
        })
        resolve()
      })
    })
  }

  private handleSignMessageRequest(req: Parameters<WalletBackend<{}>['signMessageRequest']>[0]) {
    logger.info('runner: handleSignMessageRequest-----------', req)
    return new Promise<void>((resolve, reject) => {
      if (
        !PerunController.emiter.emit('perun-request', {
          type: 'SignMessage',
          request: req,
        })
      ) {
        return reject(new Error('Failed to send perun request, no listener registered'))
      }

      PerunController.emiter.once('perun-response', (res: Controller.Params.RespondPerunRequestParams) => {
        if (res.response.rejected) {
          this.ipcReturn('signMessageResponse', {
            rejected: {
              reason: res.response.rejected.reason,
            },
          })
          return resolve()
        }

        // walletSig is a recoverable signature
        //
        // 0x + <32-byte-r> + <32-byte-s> + <8-byte-recover>
        //
        // has to be transformed into a DER encoded signature.
        const walletSig: string = res.response.data
        // Strip `0x` prefix if present.
        const sig = walletSig.startsWith('0x') ? walletSig.slice(2) : walletSig
        // r and s values are padded with 0 prefix if they are less than 32 bytes.
        // We need to remove the padding.
        const tmp_r = bytes.bytify('0x' + sig.slice(0, 64).replace(/^(00)+/, ''))
        const first_byte = tmp_r[0]
        let r: Uint8Array = new Uint8Array()
        if ((first_byte & 0x80) >= 0x80) {
          logger.info("Padding R with '00'")
          r = new Uint8Array([0x00])
        }
        r = bytes.concat(r, tmp_r)

        const s = bytes.bytify('0x' + sig.slice(64, 128).replace(/^(00)+/, ''))
        logger.info(`full signature: ${sig}`)
        logger.info(`r before stripping padding: ${sig.slice(0, 64)}`)
        logger.info(`s before stripping padding: ${sig.slice(64, 128)}`)
        logger.info(`r after stripping padding: ${bytes.hexify(r)}`)
        logger.info(`s after stripping padding: ${bytes.hexify(s)}`)
        const numberToHexString = (num: number) => {
          const hex = num.toString(16)
          return hex.length === 1 ? '0' + hex : hex
        }
        const derSig = `0x30${numberToHexString(0x04 + r.length + s.length)}02${numberToHexString(r.length)}${bytes
          .hexify(r)
          .slice(2)}02${numberToHexString(s.length)}${bytes.hexify(s).slice(2)}`

        // Pad the signature to 73 bytes if it is shorter than that.
        // MarkerByte = 0xff
        // Examples:
        // Input: <DER encoded signature of length 70 bytes>
        // Output: <DER encoded signature of length 70 byte> | MarkerByte | ZeroByte | ZeroByte
        //
        // Input: <DER encoded signature of length 72 bytes>
        // Output: <DER encoded signature of length 72 byte> | MarkerByte
        //
        // We always append the marker byte and only pad with zero bytes if the signature is shorter than 72 bytes.
        const paddedSig = `${derSig}${'ff'}${'00'.repeat(72 - derSig.slice(2).length / 2)}`
        this.ipcReturn('signMessageResponse', {
          signature: paddedSig,
        })
        resolve()
      })
    })
  }

  private handleSignTransactionRequest(req: Parameters<WalletBackend<{}>['signTransactionRequest']>[0]) {
    return new Promise<void>(async (resolve, reject) => {
      // 这里看出来是谁的请求
      // 是 开？ 是关？ 是更新？
      logger.info('PerunServiceRunner received signTransactionRequest', req)
      // Transform IPC malformed request into a valid request.
      const snakeCaseToCamelCase = (_: string, value: any): any => {
        if (Array.isArray(value)) {
          return value.map(item => snakeCaseToCamelCase(_, item))
        }

        const toCamelCase = (str: string) => {
          return str.replace(/_([a-z])/g, function (_, group1) {
            return group1.toUpperCase()
          })
        }

        if (typeof value === 'object' && value !== null) {
          const camelCasedObject: any = {}
          for (const originalKey in value) {
            if (value.hasOwnProperty(originalKey)) {
              const camelCasedKey = toCamelCase(originalKey)
              const originalValue = value[originalKey]
              const newValue = camelCasedKey === 'depType' ? toCamelCase(originalValue) : originalValue
              camelCasedObject[camelCasedKey] = newValue
            }
          }
          return camelCasedObject
        }
        return value
      }
      const sdkScript = JSON.parse(req.identifier as any, snakeCaseToCamelCase)
      // TODO: The transaction here has unresolved inputs, which are only referenced by their outpoints.
      // - Transaction.inputs have to be resolved.
      // - Transaction.computeHash() has to work.
      // -> Rest seems fine. src/models/chain/transaction.ts
      logger.info('PerunServiceRunner received signTransactionRequest:sdkScript', sdkScript)
      let sdkTx = JSON.parse(req.transaction as any, snakeCaseToCamelCase)
      logger.info('PerunServiceRunner received signTransactionRequest:sdkTx', sdkTx)
      // Fetch live cells from txs input-outpoints.
      let resolvedInputs = []
      const network = NetworksService.getInstance().getCurrent()
      const rpcService = new RpcService(network.remote, network.type)
      for (const [idx, input] of sdkTx.txView.inputs.entries()) {
        let typedInput = input as { previousOutput: { txHash: string; index: string }; since: string }
        logger.info('Fetching live cell', input.previousOutput)
        // Try to fetch the live cell from the database multiple times before giving up.
        let retries = 0
        const delay = 5_000 // 5 seconds
        let liveCell = undefined
        while (retries < 25) {
          const fetchedCell = await CellsService.getLiveCell(OutPoint.fromObject(input.previousOutput))
          const outputs = await CellsService.getOutputsByTransactionHash(input.previousOutput.txHash)
          logger.info('fetched outputs:', outputs)
          const tx = await TransactionsService.get(input.previousOutput.txHash)
          logger.info('fetched tx:', tx)
          if (fetchedCell) {
            liveCell = fetchedCell
            break
          }
          logger.info('USING RPC-SERVICE')
          const rpcTip = await rpcService.getTipHeader()
          logger.info('TIP:', rpcTip)
          const rpcTx = await rpcService.getTransaction(input.previousOutput.txHash)
          logger.info('RPC-TX:', rpcTx)
          if (rpcTx && rpcTx.transaction) {
            logger.info("rpc output's index:", input.previousOutput.index)
            logger.info('rpc outputs', rpcTx.transaction.outputs)
            liveCell = rpcTx.transaction.outputs[Number(input.previousOutput.index)]
            logger.info("live cell found in rpc-tx's outputs:", liveCell)
            break
          }
          logger.info(`Failed to fetch live cell, retrying in ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
          retries++
        }

        if (!liveCell) {
          return reject(new Error('Failed to fetch live cell'))
        }

        const resolvedInput = Input.fromObject({
          previousOutput: OutPoint.fromObject(typedInput.previousOutput),
          since: typedInput.since,
          capacity: liveCell.capacity,
          lock: liveCell.lock,
          lockHash: liveCell.lockHash,
          multiSignBlake160: liveCell.multiSignBlake160,
          type: liveCell.type,
          typeHash: liveCell.typeHash,
          data: liveCell.data,
        })
        resolvedInput.setInputIndex(idx.toString())
        resolvedInputs.push(resolvedInput)
      }
      logger.info('Resolved inputs', resolvedInputs)
      logger.info('Transformed request', { sdkScript, sdkTx })
      const identifier = Script.fromSDK(sdkScript)
      const transaction = Transaction.fromSDK(sdkTx.txView)
      // Update the transaction with the resolved inputs.
      // Has to happen after `fromSDK` call, because `fromSDK` expects less
      // data than available and ignores the resolved inputs completely.
      transaction.inputs = resolvedInputs
      logger.info(`tx hash: ${transaction.computeHash()}`)
      let validReq = { identifier, transaction }
      logger.info('FINAL INPUTS', validReq.transaction.inputs)
      if (
        !PerunController.emiter.emit('perun-request', {
          type: 'SignTransaction',
          request: validReq,
        })
      ) {
        return reject(new Error('Failed to send perun request, no listener registered'))
      }

      PerunController.emiter.once('perun-response', (res: Controller.Params.RespondPerunRequestParams) => {
        if (res.response.rejected) {
          this.ipcReturn('signTransactionResponse', {
            rejected: {
              reason: res.response.rejected.reason,
            },
          })
          return resolve()
        }
        const signedTx = res.response.data
        this.ipcReturn('signTransactionResponse', { transaction: signedTx })
        resolve()
      })
    })
  }

  private spawnProcess(): ChildProcess {
    const grpcModulePath = path.join(__dirname, 'server/index.js')
    return fork(grpcModulePath, [], {
      stdio: ['ipc', process.stdout, 'pipe'],
    })
  }

  async stop() {
    this.runnerProcess?.kill()
  }

  // TODO: CKBNode probably executes its starting twice.
}
