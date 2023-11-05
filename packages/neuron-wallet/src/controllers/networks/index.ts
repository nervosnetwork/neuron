import env from '../../env'
import { distinctUntilChanged, skip } from 'rxjs/operators'
import { NetworkType, Network } from '../../models/network'
import NetworksService from '../../services/networks'
import NodeService from '../../services/node'
import { ResponseCode } from '../../utils/const'
import { IsRequired, InvalidName, NetworkNotFound, CurrentNetworkNotSet } from '../../exceptions'
import { resetSyncTaskQueue, switchToNetwork } from '../../block-sync-renderer'
import { CurrentNetworkIDSubject, NetworkListSubject } from '../../models/subjects/networks'
import ChainInfo from './chain-info'
import logger from '../../utils/logger'

const networksService = NetworksService.getInstance()

export default class NetworksController {
  public async start() {
    NodeService.getInstance()
      .connectionStatusSubject // TODO: find out the redundant message and remove skip
      .pipe(distinctUntilChanged(), skip(1))
      .subscribe(async (connected: boolean) => {
        if (connected) {
          logger.debug('Network:\tconnection success')
          await networksService.update(networksService.getCurrentID(), {})
          this.notifyListChange()
          await this.connectToNetwork(true)
        } else {
          logger.debug('Network:\tconnection dropped')
          resetSyncTaskQueue.asyncPush(false)
        }
      })

    await this.activate(networksService.getCurrentID())
  }

  public getAll() {
    const networks = networksService.getAll()
    return {
      status: ResponseCode.Success,
      result: networks,
    }
  }

  public get(id: string) {
    if (typeof id === 'undefined') {
      throw new IsRequired('ID')
    }

    const network = networksService.get(id)
    if (!network) {
      throw new NetworkNotFound(id)
    }

    return {
      status: ResponseCode.Success,
      result: network,
    }
  }

  public async create({ name, remote, type = NetworkType.Normal }: Network) {
    if (!name || !remote) {
      throw new IsRequired('Name and address')
    }

    if (name === 'error') {
      throw new InvalidName('Network')
    }

    const created = await networksService.create(name, remote, type)
    this.notifyListChange()

    return {
      status: ResponseCode.Success,
      result: created,
    }
  }

  public async update(id: string, options: Partial<Network>) {
    if (options.name && options.name === 'error') {
      throw new InvalidName('Network')
    }

    await networksService.update(id, options)

    this.notifyListChange()

    if (networksService.getCurrentID() === id) {
      this.notifyCurrentNetworkChange()
      await this.connectToNetwork()
    }

    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  public async delete(id: string) {
    const network = networksService.get(id)
    if (!network) {
      throw new NetworkNotFound(id)
    }
    const currentID = networksService.getCurrentID()
    networksService.delete(id)

    this.notifyListChange()

    if (id === currentID) {
      this.notifyCurrentNetworkChange()
      await this.connectToNetwork()
    }
  }

  public async switchCurrentNetworkType() {
    networksService.switchCurrentNetworkType()
    this.notifyCurrentNetworkChange()
    this.notifyListChange()
    if (!env.isTestMode) {
      await NodeService.getInstance().startNodeIgnoreExternal()
    }
  }

  public async startNodeIgnoreExternal() {
    this.notifyCurrentNetworkChange()
    if (!env.isTestMode) {
      await NodeService.getInstance().startNodeIgnoreExternal()
      await NetworksService.getInstance().updateInternalRemote()
    }
  }

  public currentID() {
    const currentID = networksService.getCurrentID()
    if (currentID) {
      return {
        status: ResponseCode.Success,
        result: currentID,
      }
    }
    throw new CurrentNetworkNotSet()
  }

  public async activate(id: string) {
    await networksService.activate(id)
    this.notifyListChange()
    this.notifyCurrentNetworkChange()
    await this.connectToNetwork()

    if (!env.isTestMode) {
      NodeService.getInstance().tryStartNodeOnDefaultURI()
    }

    return {
      status: ResponseCode.Success,
      result: true,
    }
  }

  private notifyListChange() {
    NetworkListSubject.next({ currentNetworkList: networksService.getAll() })
  }

  private notifyCurrentNetworkChange() {
    CurrentNetworkIDSubject.next({ currentNetworkID: networksService.getCurrentID() })
  }

  // Connect to current network
  private async connectToNetwork(reconnected: boolean = false) {
    const id = networksService.getCurrentID()
    const network = await networksService.update(id, {})
    const genesisHashMatched = await new ChainInfo(network).load()
    const isNodeMatched = !network.readonly || (reconnected && NodeService.getInstance().startedBundledNode)

    await switchToNetwork(network, reconnected, genesisHashMatched && isNodeMatched)
  }
}
