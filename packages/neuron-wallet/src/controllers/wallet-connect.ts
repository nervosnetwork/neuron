import { Core } from '@walletconnect/core'
import { debounceTime } from 'rxjs/operators'
import {
  CkbWallet,
  CKBWalletAdapter,
  GetAddressesParams,
  SignTransactionParams,
  SignMessageParams,
  Address,
  ApproveParams,
  ErrorResponse,
  Proposal,
  Session,
  SessionRequest,
  SignedTransaction,
  Chain,
} from 'ckb-walletconnect-wallet-sdk'
import WalletConnectSubject from '../models/subjects/wallet-connect-subject'
import { CurrentWalletSubject } from '../models/subjects/wallets'
import { CurrentNetworkIDSubject } from '../models/subjects/networks'
import { AccountExtendedPublicKey } from '../models/keys/key'
import { AddressType } from '../models/keys/address'
import logger from '../utils/logger'
import { ResponseCode } from '../utils/const'
import WalletsService from '../services/wallets'
import NetworksService from '../services/networks'
import AddressService from '../services/addresses'

class Adapter implements CKBWalletAdapter {
  private walletID: string = ''

  constructor(props: { walletID: string }) {
    this.walletID = props.walletID
  }

  public async ckb_getAddresses(params: GetAddressesParams): Promise<{
    [scriptBase: string]: Address[]
  }> {
    const scriptBaseList = Object.keys(params)
    if (scriptBaseList.length) {
      const addresses = (await AddressService.getAddressesByWalletId(this.walletID))
        .filter(item => item.addressType === AddressType.Receiving)
        .map(({ address, blake160: identifier, balance, description = '', addressIndex: index = '' }) => ({
          address,
          identifier,
          description,
          balance: balance!,
          index,
        }))
      return Promise.resolve({
        [scriptBaseList[0]]: addresses,
      })
    }
    return Promise.resolve({})
  }

  public async ckb_signTransaction(
    params: SignTransactionParams,
    options?: any
  ): Promise<{ transaction?: SignedTransaction; hash?: string }> {
    logger.info('ckb_signTransaction-----', params, options)
    return Promise.resolve(options)
  }

  public async ckb_signMessage(
    params: SignMessageParams,
    options?: any
  ): Promise<{
    signature: string
  }> {
    logger.info('ckb_signMessage-----', params, options)

    return Promise.resolve({ signature: options })
  }
}

export default class WalletConnectController {
  static client?: CkbWallet

  private proposals: Proposal[] = []
  private sessions: Session[] = []
  private requests: SessionRequest[] = []

  private identity: string = ''
  private chain: Chain = 'devnet'

  private async init() {
    const currentWallet = WalletsService.getInstance().getCurrent()
    const network = NetworksService.getInstance().getCurrent()

    if (!currentWallet) {
      return
    }

    const { extendedKey, id } = currentWallet.toJSON()
    this.identity = AccountExtendedPublicKey.parse(extendedKey).addressPublicKey(AddressType.Receiving, 0)

    switch (network?.chain) {
      case 'ckb':
        this.chain = 'mainnet'
        break
      case 'ckb_testnet':
        this.chain = 'testnet'
        break
      case 'ckb_dev':
        this.chain = 'devnet'
        break
      default:
        this.chain = 'devnet'
        break
    }

    const core = new Core({
      projectId: process.env.WALLET_CONNECT_PROJECT_ID,
    })

    WalletConnectController.client = await CkbWallet.init({
      // @ts-ignore
      core,
      metadata: {
        name: 'Neuron',
        url: 'https://github.com/nervosnetwork/neuron/releases',
        icons: [],
        description: 'Neuron Wallet is a CKB wallet produced by Nervos Foundation. ',
      },
      adapter: new Adapter({
        walletID: id,
      }),
    })

    WalletConnectController.client.emitter.on('proposals', (proposals: Proposal[]) => {
      this.proposals = proposals
      this.notify()
    })
    WalletConnectController.client.emitter.on('sessions', (sessions: Session[]) => {
      this.sessions = sessions
      this.notify()
    })

    WalletConnectController.client.emitter.on('requests', (requests: SessionRequest[]) => {
      this.requests = requests
      this.notify()
    })
  }

  constructor() {
    this.init()

    CurrentWalletSubject.pipe(debounceTime(50)).subscribe(async params => {
      if (params.currentWallet && WalletConnectController.client) {
        WalletConnectController.client.disconnectAllSessions()
        this.init()
      }
    })

    CurrentNetworkIDSubject.subscribe(async ({ currentNetworkID }) => {
      const currentNetwork = NetworksService.getInstance().get(currentNetworkID)
      if (currentNetwork && WalletConnectController.client) {
        WalletConnectController.client.disconnectAllSessions()
        this.init()
      }
    })
  }

  public async connect({ type, uri }: { type: 'camera' | 'scanQrcode' | 'uri'; uri?: string }) {
    if (!WalletConnectController.client) {
      await this.init()
    }

    switch (type) {
      case 'uri':
        if (uri) {
          await WalletConnectController?.client?.connect(uri)
          return {
            status: ResponseCode.Success,
          }
        }
        break
      case 'camera':
        // TODO:
        break
      case 'scanQrcode':
        // TODO:
        break
      default:
        break
    }
  }

  public async disconnect(topic: string) {
    await WalletConnectController.client?.disconnect(topic)
    return {
      status: ResponseCode.Success,
    }
  }

  public async approveSession(params: { id: number; scriptBases: string[] }) {
    await WalletConnectController.client?.approve({
      id: params.id,
      chain: this.chain,
      identity: this.identity,
      scriptBases: params.scriptBases,
    } as ApproveParams)
    return {
      status: ResponseCode.Success,
    }
  }

  public async rejectSession({ id, reason }: { id: number; reason?: ErrorResponse }) {
    await WalletConnectController.client?.reject(id, reason)
    return {
      status: ResponseCode.Success,
    }
  }

  public async approveRequest({ event, options }: { event: SessionRequest; options?: any }) {
    await WalletConnectController.client?.approveRequest(event, options)
    return {
      status: ResponseCode.Success,
    }
  }

  public async rejectRequest({ event, error }: { event: SessionRequest; error?: ErrorResponse }) {
    await WalletConnectController.client?.rejectRequest(event, error)
    return {
      status: ResponseCode.Success,
    }
  }

  private notify() {
    WalletConnectSubject.next({
      proposals: this.proposals,
      sessions: this.sessions,
      requests: this.requests,
      identity: this.identity,
    })
  }
}
