import { v4 } from 'uuid'

export interface Network {
  id: string
  name: string
  remote: string
}

// this should come from config or db
export const defaultNetowrks: Network[] = [
  {
    id: '0',
    name: 'Testnet',
    remote: 'http://localhost:8114',
  },
  {
    id: '1',
    name: 'Local',
    remote: 'http://localhost:8114',
  },
]

export default class NetworkService {
  public networks: Network[] = []

  public active: Network | undefined = undefined

  constructor() {
    defaultNetowrks.forEach(network => this.create(network.name, network.remote))
    this.setActive(this.networks[0].id)
  }

  public index = (): Network[] => {
    return this.networks
  }

  public show = (id: string): Network | undefined => {
    return this.networks.find(network => network.id === id)
  }

  public update = ({ id, name, remote }: Network): boolean => {
    const network = this.show(id)
    if (network) {
      if (name) {
        network.name = name
      }
      if (remote) {
        network.remote = remote
      }
      return true
    }
    return false
  }

  public create = (name: string, remote: string): Network => {
    // TODO: verification
    const network = {
      id: v4(),
      name,
      remote,
    }
    this.networks.push(network)
    return network
  }

  public delete = (id: string): boolean => {
    const network = this.show(id)
    if (network) {
      this.networks = this.networks.filter(n => n.id !== id)
      return true
    }
    return false
  }

  public setActive = (id: string): boolean => {
    const network = this.show(id)
    if (network) {
      this.active = network
      return true
    }
    return false
  }
}
