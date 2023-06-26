import { HexString } from '@ckb-lumos/base'
import CKBRPC from '@nervosnetwork/ckb-sdk-rpc'
import Method from '@nervosnetwork/ckb-sdk-rpc/lib/method'
import resultFormatter from '@nervosnetwork/ckb-sdk-rpc/lib/resultFormatter'
import paramsFormatter from '@nervosnetwork/ckb-sdk-rpc/lib/paramsFormatter'
import Base from '@nervosnetwork/ckb-sdk-rpc/lib/Base'
import {
  MethodInBatchNotFoundException,
  PayloadInBatchException,
  IdNotMatchedInBatchException,
} from '@nervosnetwork/ckb-sdk-rpc/lib/exceptions'
import https from 'https'
import http from 'http'
import { request } from 'undici'
import { BUNDLED_LIGHT_CKB_URL, LIGHT_CLIENT_TESTNET } from './const'
import CommonUtils from './common'

export interface LightScriptFilter {
  script: CKBComponents.Script
  blockNumber: CKBComponents.BlockNumber
  scriptType: CKBRPC.ScriptType
}

export type LightScriptSyncStatus = LightScriptFilter

const lightRPCProperties: Record<string, Omit<Parameters<CKBRPC['addMethod']>[0], 'name'>> = {
  setScripts: {
    method: 'set_scripts',
    paramsFormatters: [
      (params: LightScriptFilter[]) =>
        params.map(v => ({
          script: {
            args: v.script.args,
            code_hash: v.script.codeHash,
            hash_type: v.script.hashType,
          },
          block_number: v.blockNumber,
          script_type: v.scriptType,
        })),
    ],
  },
  getScripts: {
    method: 'get_scripts',
    paramsFormatters: [],
    resultFormatters: (
      result: {
        script: { args: string; code_hash: string; hash_type: string }
        block_number: CKBComponents.BlockNumber
        script_type: CKBRPC.ScriptType
      }[]
    ) =>
      result.map(v => ({
        script: {
          args: v.script.args,
          codeHash: v.script.code_hash,
          hashType: v.script.hash_type,
        },
        blockNumber: v.block_number,
        scriptType: v.script_type,
      })),
  },
  getTransactions: {
    method: 'get_transactions',
    paramsFormatters: [
      (searchKey: {
        script: CKBComponents.Script
        scriptType: CKBRPC.ScriptType
        blockRange: [HexString, HexString]
      }) => ({
        script: {
          args: searchKey.script.args,
          code_hash: searchKey.script.codeHash,
          hash_type: searchKey.script.hashType,
        },
        script_type: searchKey.scriptType,
        filter: { block_range: searchKey.blockRange },
        group_by_transaction: true,
      }),
    ],
    resultFormatters: (result: {
      last_cursor: HexString
      objects: {
        block_number: HexString
        tx_index: HexString
        transaction: { hash: HexString }
      }[]
    }) => ({
      lastCursor: result.last_cursor,
      txs: result.objects.map(v => ({
        txHash: v.transaction.hash,
        txIndex: v.tx_index,
        blockNumber: v.block_number,
      })),
    }),
  },
  getGenesisBlock: {
    method: 'get_genesis_block',
    paramsFormatters: [],
    resultFormatters: resultFormatter.toBlock,
  },
  sendTransaction: {
    method: 'send_transaction',
    paramsFormatters: [paramsFormatter.toRawTransaction],
    resultFormatters: resultFormatter.toHash,
  },
  fetchTransaction: {
    method: 'fetch_transaction',
    paramsFormatters: [paramsFormatter.toHash],
    resultFormatters: (result: {
      status: 'fetched' | 'fetching' | 'added' | 'not_found'
      data?: RPC.TransactionWithStatus
    }) => {
      return {
        status: result.status,
        txWithStatus:
          result.status === 'fetched' && result.data ? resultFormatter.toTransactionWithStatus(result.data) : undefined,
      }
    },
  },
}

export class FullCKBRPC extends CKBRPC {
  getGenesisBlockHash = async () => {
    return this.getBlockHash('0x0')
  }

  getGenesisBlock = async () => {
    return this.getBlockByNumber('0x0')
  }
}

export type FetchTransactionReturnType = {
  status: 'fetched' | 'fetching' | 'added' | 'not_found'
  txWithStatus?: CKBComponents.TransactionWithStatus
}

export class LightRPC extends Base {
  setScripts: (params: LightScriptFilter[]) => Promise<null>
  getScripts: () => Promise<LightScriptSyncStatus[]>
  getTransactions: (
    searchKey: { script: CKBComponents.Script; scriptType: CKBRPC.ScriptType; blockRange: [HexString, HexString] },
    order: 'asc' | 'desc',
    limit: HexString,
    afterCursor: HexString
  ) => Promise<{
    lastCursor: HexString
    txs: { txHash: HexString; txIndex: HexString; blockNumber: CKBComponents.BlockNumber }[]
  }>

  getTransactionInLight: Base['getTransaction']
  fetchTransaction: (hash: string) => Promise<FetchTransactionReturnType>

  getGenesisBlock: () => Promise<CKBComponents.Block>
  exceptionMethods = ['getCurrentEpoch', 'getEpochByNumber', 'getBlockHash', 'getLiveCell']
  coverMethods = ['getTipBlockNumber', 'syncState', 'getBlockchainInfo', 'sendTransaction', 'getTransaction']

  constructor(url: string) {
    super()
    this.setNode({ url })

    Object.defineProperties(this, {
      addMethod: { value: this.addMethod, enumerable: false, writable: false, configurable: false },
      setNode: { value: this.setNode, enumerable: false, writable: false, configurable: false },
    })

    Object.keys(this.rpcProperties).forEach(name => {
      this.addMethod({ name, ...this.rpcProperties[name] })
    })

    this.setScripts = new Method(this.node, { name: 'setScripts', ...lightRPCProperties['setScripts'] }).call
    this.getScripts = new Method(this.node, { name: 'getScripts', ...lightRPCProperties['getScripts'] }).call
    this.getTransactions = new Method(this.node, {
      name: 'getTransactions',
      ...lightRPCProperties['getTransactions'],
    }).call
    this.getGenesisBlock = new Method(this.node, {
      name: 'getGenesisBlock',
      ...lightRPCProperties['getGenesisBlock'],
    }).call
    const sendTransactionMethod = new Method(this.node, {
      name: 'sendTransaction',
      ...lightRPCProperties['sendTransaction'],
    })
    this.sendTransaction = (tx: CKBComponents.RawTransaction) => sendTransactionMethod.call(tx)
    this.getTransactionInLight = new Method(this.node, {
      name: 'getTransaction',
      ...this.rpcProperties['getTransaction'],
    }).call
    this.fetchTransaction = new Method(this.node, {
      name: 'fetchTransaction',
      ...lightRPCProperties['fetchTransaction'],
    }).call
  }

  getTransaction = async (hash: string): Promise<CKBComponents.TransactionWithStatus> => {
    let tx = await this.getTransactionInLight(hash)
    if (!tx?.transaction) {
      tx = await CommonUtils.retry(3, 100, async () => {
        const tmp = await this.fetchTransaction(hash)
        if (!tmp.txWithStatus) {
          throw new Error(`transaction ${hash} status: ${tmp.status}`)
        }
        return tmp.txWithStatus
      })
      if (!tx) {
        throw new Error(`Fetch transaction tx failed, please try it later: ${hash}`)
      }
    }
    return tx
  }

  getTipBlockNumber = async () => {
    const headerTip = await this.getTipHeader()
    return headerTip.number
  }

  getGenesisBlockHash = async () => {
    const genesisBlock = await this.getGenesisBlock()
    return genesisBlock.header.hash
  }

  syncState = async () => {
    const headerTip = await this.getTipHeader()
    return {
      bestKnownBlockNumber: headerTip.number,
      bestKnownBlockTimestamp: headerTip.timestamp,
    } as CKBComponents.SyncState
  }

  getBlockchainInfo = async () => {
    await this.localNodeInfo()
    return {
      chain: LIGHT_CLIENT_TESTNET,
    } as CKBComponents.BlockchainInfo
  }

  #node: CKBComponents.Node = {
    url: '',
  }

  get node() {
    return this.#node
  }

  #paramsFormatter = paramsFormatter

  get paramsFormatter() {
    return this.#paramsFormatter
  }

  #resultFormatter = resultFormatter

  get resultFormatter() {
    return this.#resultFormatter
  }

  public setNode(node: CKBComponents.Node): CKBComponents.Node {
    Object.assign(this.node, node)
    return this.node
  }

  public addMethod = (options: CKBComponents.Method) => {
    if (this.exceptionMethods.includes(options.name)) {
      Object.defineProperty(this, options.name, {
        value: () => {
          throw new Error(`Unrealized ${options.name} in light node`)
        },
        enumerable: true,
      })
    } else if (!this.coverMethods.includes(options.name)) {
      const method = new Method(this.node, options)

      Object.defineProperty(this, options.name, {
        value: method.call,
        enumerable: true,
      })
    }
  }

  public createBatchRequest = <N extends keyof Base, P extends (string | number | object)[], R = any[]>(
    params: [method: N, ...rest: P][] = []
  ) => {
    const methods = Object.keys(this)
    const { node, rpcProperties } = this

    const proxied: [method: N, ...rest: P][] = new Proxy([], {
      set(...p) {
        if (p[1] !== 'length') {
          const name = p?.[2]?.[0]
          if (methods.indexOf(name) === -1) {
            throw new MethodInBatchNotFoundException(name)
          }
        }
        return Reflect.set(...p)
      },
    })

    Object.defineProperties(proxied, {
      add: {
        value(...args: P) {
          this.push(args)
          return this
        },
      },
      remove: {
        value(i: number) {
          this.splice(i, 1)
          return this
        },
      },
      exec: {
        async value() {
          const payload = proxied.map(([f, ...p], i) => {
            try {
              const method = new Method(node, { ...{ ...rpcProperties, ...lightRPCProperties }[f], name: f })
              return method.getPayload(...p)
            } catch (err) {
              throw new PayloadInBatchException(i, err.message)
            }
          })

          const res = await request(node.url, {
            method: 'POST',
            body: JSON.stringify(payload),
            headers: { 'content-type': 'application/json' },
          })
          const batchRes = await res.body.json()

          return batchRes.map((res: any, i: number) => {
            if (res.id !== payload[i].id) {
              return new IdNotMatchedInBatchException(i, payload[i].id, res.id)
            }
            return (
              { ...rpcProperties, ...lightRPCProperties }[proxied[i][0]].resultFormatters?.(res.result) ?? res.result
            )
          })
        },
      },
    })
    params.forEach(p => proxied.push(p))

    return proxied as typeof proxied & {
      add: (n: N, ...p: P) => typeof proxied
      remove: (index: number) => typeof proxied
      exec: () => Promise<R>
    }
  }
}

let httpsAgent: https.Agent
let httpAgent: http.Agent

const getHttpsAgent = () => {
  if (!httpsAgent) {
    httpsAgent = new https.Agent({ keepAlive: true })
  }
  return httpsAgent
}

const getHttpAgent = () => {
  if (!httpAgent) {
    httpAgent = new http.Agent({ keepAlive: true })
  }
  return httpAgent
}

export const generateRPC = (url: string) => {
  let rpc: LightRPC | FullCKBRPC
  if (url === BUNDLED_LIGHT_CKB_URL) {
    rpc = new LightRPC(url)
  } else {
    rpc = new FullCKBRPC(url)
  }
  if (url?.startsWith('https')) {
    rpc.setNode({ url, httpsAgent: getHttpsAgent() })
  } else {
    rpc.setNode({ url, httpAgent: getHttpAgent() })
  }
  return rpc
}
