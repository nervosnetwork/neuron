import { dialog } from 'electron'
import { t } from 'i18next'
import env from 'env'
import { distinctUntilChanged } from 'rxjs/operators'
import { NetworkType, Network } from 'models/network'
import NetworksService from 'services/networks'
import NodeService from 'services/node'
import { ResponseCode } from 'utils/const'
import { IsRequired, InvalidName, NetworkNotFound, CurrentNetworkNotSet } from 'exceptions'
import { switchToNetwork } from 'block-sync-renderer'
import { CurrentNetworkIDSubject, NetworkListSubject } from 'models/subjects/networks'
import ChainInfo from './chain-info'
import logger from 'utils/logger'

const networksService = NetworksService.getInstance()

export default class NetworksController {
  public async start() {
    NodeService
      .getInstance()
      .connectionStatusSubject
      .pipe(distinctUntilChanged())
      .subscribe(async (connected: boolean) => {
        if (connected) {
          logger.debug('Network:\treconnected')
          await networksService.update(networksService.getCurrentID(), {})
          this.notifyListChange()
          await this.connectToNetwork(true)
        } else {
          logger.debug('Network:\tconnection dropped')
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

    const messageValue = await dialog.showMessageBox(
      {
        type: 'warning',
        title: t(`messageBox.remove-network.title`),
        message: t(`messageBox.remove-network.message`, {
          name: network.name,
          address: network.remote,
        }),
        detail: currentID === id ? t('messageBox.remove-network.alert') : '',
        buttons: [t('messageBox.button.confirm'), t('messageBox.button.discard')],
        defaultId: 0,
        cancelId: 1,
      }
    )

    if (messageValue.response === 0) {
      try {
        networksService.delete(id)

        this.notifyListChange()

        if (id === currentID) {
          this.notifyCurrentNetworkChange()
          await this.connectToNetwork()
        }

        return {
          status: ResponseCode.Success,
          result: true,
        }
      } catch (err) {
        logger.warn(`connect network error: ${err}`)
        dialog.showMessageBox({
          type: 'error',
          message: err.message,
        })
      }
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
    const network = networksService.getCurrent()
    const genesisHashMatched = await new ChainInfo(network).load()

    await switchToNetwork(network, reconnected, genesisHashMatched)
  }
}
