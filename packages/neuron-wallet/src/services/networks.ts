import path from 'path'
import { createConnection, Repository } from 'typeorm'
import NetworkEntity from '../entity/Network'
import env from '../env'

const { defaultNetworks, dbName } = env

const REPOSITTORY_NOT_READY = 'Repository is not ready'
const NETWORK_NOT_FOUND = 'Network is not found'

export interface Network {
  id: number
  name: string
  remote: string
}

export default class NetworksService {
  public networks: Network[] = []

  public repository?: Repository<NetworkEntity>

  public active: Network | undefined = undefined

  constructor() {
    this.connect(dbName)
      .then(this.loadDefaultNetworks)
      .then(() => this.setActive(1))
  }

  public connect = async (name: string) => {
    const connection = await createConnection({
      type: 'sqlite',
      database: path.join(__dirname, name),
      entities: [NetworkEntity],
      synchronize: true,
      logging: env.isDevMode,
    })
    const repository = connection.getRepository(NetworkEntity)
    this.repository = repository
    return repository
  }

  public loadDefaultNetworks = async () => {
    if (!this.repository) throw new Error(REPOSITTORY_NOT_READY)
    const count = await this.repository.count()
    if (!count) {
      defaultNetworks.forEach(network => this.create(network.name, network.remote))
    }
    return true
  }

  public index = () => {
    if (!this.repository) throw new Error(REPOSITTORY_NOT_READY)
    return this.repository.find()
  }

  public show = (id: number) => {
    if (!this.repository) throw new Error(REPOSITTORY_NOT_READY)
    return this.repository.findOne(id)
  }

  public update = async ({ id, name, remote }: Partial<Network>) => {
    if (!this.repository) throw new Error(REPOSITTORY_NOT_READY)
    const network = await this.repository.findOne(id)
    if (!network) throw new Error(NETWORK_NOT_FOUND)
    const updatedNetwork = { ...network, name, remote }
    await this.repository.save(updatedNetwork)
    return true
  }

  public create = (name: string, remote: string) => {
    if (!this.repository) throw new Error(REPOSITTORY_NOT_READY)
    // TODO: verification
    const network = new NetworkEntity()
    network.name = name
    network.remote = remote
    return this.repository.save(network)
  }

  public delete = async (id: number) => {
    if (!this.repository) throw new Error(REPOSITTORY_NOT_READY)
    const network = await this.repository.findOne(id)
    if (!network) throw new Error(NETWORK_NOT_FOUND)
    await this.repository.remove(network)
    return true
  }

  public setActive = async (id: number) => {
    const network = await this.show(id)
    if (network) {
      this.active = network
      return true
    }
    return false
  }
}
