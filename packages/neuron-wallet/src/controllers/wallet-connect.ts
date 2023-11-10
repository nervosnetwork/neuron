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
} from '@ckb-connect/walletconnect-wallet-sdk'
import WalletConnectSubject from '../models/subjects/wallet-connect-subject'
import { CurrentWalletSubject } from '../models/subjects/wallets'
import { CurrentNetworkIDSubject } from '../models/subjects/networks'
import { AccountExtendedPublicKey } from '../models/keys/key'
import { Address as AddressInterface } from '../models/address'
import { AddressType } from '../models/keys/address'
import TxDbChangedSubject from '../models/subjects/tx-db-changed-subject'
import AddressDbChangedSubject from '../models/subjects/address-db-changed-subject'
import logger from '../utils/logger'
import { ResponseCode } from '../utils/const'
import WalletsService from '../services/wallets'
import NetworksService from '../services/networks'
import AddressService from '../services/addresses'

class Adapter implements CKBWalletAdapter {
  private walletID: string = ''
  private extendedKey: AccountExtendedPublicKey

  constructor(props: { walletID: string; extendedKey: string }) {
    this.walletID = props.walletID
    this.extendedKey = AccountExtendedPublicKey.parse(props.extendedKey)
  }

  public async ckb_getAddresses(params: GetAddressesParams): Promise<{
    [scriptBase: string]: Address[]
  }> {
    const scriptBaseList = Object.keys(params)
    if (scriptBaseList.length) {
      const { page, type } = params[scriptBaseList[0]]
      const { size = 10, before, after } = page
      let resList = [] as AddressInterface[]
      if (type === 'generate') {
        resList =
          (await AddressService.generateAndSaveForExtendedKey({
            walletId: this.walletID,
            extendedKey: this.extendedKey,
            receivingAddressCount: size,
          })) || []
      } else {
        const list = (await AddressService.getAddressesWithBalancesByWalletId(this.walletID)).filter(
          item => item.addressType === AddressType.Receiving
        )

        if (before) {
          const beforeItem = list.find(item => item.address === before)
          if (beforeItem) {
            resList = list.filter(item => item.addressIndex < beforeItem.addressIndex).slice(-size)
          }
        } else if (after) {
          const afterItem = list.find(item => item.address === after)
          if (afterItem) {
            resList = list.filter(item => item.addressIndex > afterItem.addressIndex).slice(size)
          }
        } else {
          resList = list.slice(0, size)
        }
      }

      const addresses = resList.map(
        ({ address, blake160: identifier, balance, description = '', addressIndex: index = '' }) => ({
          address,
          identifier,
          description,
          balance: balance!,
          index,
        })
      )
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

  private addresses: AddressInterface[] = []

  public getState(): {
    status: ResponseCode
    result: {
      proposals: Proposal[]
      sessions: Session[]
      requests: SessionRequest[]
      identity: string
    }
  } {
    return {
      status: ResponseCode.Success,
      result: {
        proposals: this.proposals,
        sessions: this.sessions,
        requests: this.requests,
        identity: this.getWallet().identity,
      },
    }
  }

  private getWallet() {
    const currentWallet = WalletsService.getInstance().getCurrent()
    if (currentWallet) {
      const { extendedKey, id, name } = currentWallet.toJSON()
      const identity = AccountExtendedPublicKey.parse(extendedKey).addressPublicKey(AddressType.Receiving, 0)

      return {
        identity,
        id,
        extendedKey,
        accountName: name,
      }
    }
    return {
      identity: '',
    }
  }

  private getNetwork() {
    const network = NetworksService.getInstance().getCurrent()
    switch (network?.chain) {
      case 'ckb':
        return 'mainnet'
      case 'ckb_testnet':
      case 'light_client_testnet':
        return 'testnet'
      case 'ckb_dev':
        return 'devnet'
      default:
        return 'devnet'
    }
  }

  private async init() {
    const wallet = this.getWallet()

    if (!wallet.id) {
      return
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
        walletID: wallet.id,
        extendedKey: wallet.extendedKey,
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

  private async updateAddresses(emitEvent: boolean = true) {
    const { id } = this.getWallet()
    if (id) {
      const list = await AddressService.getAddressesWithBalancesByWalletId(id)
      const receriveList = list.filter(item => item.addressType === AddressType.Receiving)

      if (!this.addresses.length) {
        this.addresses = receriveList
        return
      }

      if (receriveList.length > this.addresses.length) {
        const addresses = receriveList
          .slice(this.addresses.length)
          .map(({ address, blake160: identifier, balance, description = '', addressIndex: index = '' }) => ({
            address,
            identifier,
            description,
            balance: balance!,
            index,
          }))
        if (emitEvent) {
          WalletConnectController.client?.changeAddresses({
            addresses,
            changeType: 'add',
          })
        }
      } else if (receriveList.length === this.addresses.length) {
        const addresses = [] as Address[]
        receriveList.forEach((item, index) => {
          if (item.txCount && (this.addresses[index]?.txCount || 0) < item.txCount)
            addresses.push({
              address: item.address,
              identifier: item.blake160,
              description: item.description || '',
              balance: item.balance!,
              index,
            })
        })
        if (emitEvent) {
          WalletConnectController.client?.changeAddresses({
            addresses,
            changeType: 'consume',
          })
        }
      }
      this.addresses = receriveList
    }
  }

  constructor() {
    this.init()

    CurrentWalletSubject.pipe(debounceTime(50)).subscribe(async params => {
      if (params.currentWallet && WalletConnectController.client) {
        const { identity, id, extendedKey, accountName } = this.getWallet()
        if (id) {
          WalletConnectController.client.updateAdapter(new Adapter({ walletID: id, extendedKey }))
          WalletConnectController.client.changeAccount({
            identity,
            accountName,
          })
          this.updateAddresses(false)
          this.notify()
        }
      }
    })

    CurrentNetworkIDSubject.subscribe(() => {
      if (WalletConnectController.client) {
        WalletConnectController.client.disconnectAllSessions()
        this.init()
      }
    })

    TxDbChangedSubject.getSubject()
      .pipe(debounceTime(500))
      .subscribe(async () => {
        this.updateAddresses()
      })

    AddressDbChangedSubject.getSubject()
      .pipe(debounceTime(200))
      .subscribe(async () => {
        this.updateAddresses()
      })
  }

  public async connect(uri: string) {
    if (!WalletConnectController.client) {
      await this.init()
    }

    await WalletConnectController?.client?.connect(uri)
    return {
      status: ResponseCode.Success,
    }
  }

  public async disconnect(topic: string) {
    await WalletConnectController.client?.disconnect(topic)
    return {
      status: ResponseCode.Success,
    }
  }

  public async approveSession(params: { id: number; scriptBases: string[] }) {
    const { identity, accountName } = this.getWallet()
    await WalletConnectController.client?.approve({
      id: params.id,
      network: this.getNetwork(),
      identity,
      scriptBases: params.scriptBases,
      accountName,
    } as ApproveParams)
    this.updateAddresses(false)
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
      identity: this.getWallet().identity,
    })
  }
}
