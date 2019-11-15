import NetworksService from '../../src/services/networks'
import { NetworkWithID } from '../../src/types/network'
import i18n from '../../src/utils/i18n'

const ERROR_MESSAGE = {
  MISSING_ARG: `Missing required argument`,
  NAME_USED: `Network name is used`,
  NETWORK_ID_NOT_FOUND: `messages.network-not-found`,
}

describe(`Unit tests of networks service`, () => {
  const newNetwork: NetworkWithID = {
    name: `new network`,
    remote: `http://localhost:8114`,
    type: 0,
    genesisHash: '0x',
    id: '',
    chain: 'ckb',
  }

  const newNetworkWithDefaultTypeOf1 = {
    name: `new network with the default type of 1`,
    remote: `http://localhost:8114`,
    id: '',
  }

  let service: NetworksService = new NetworksService()

  beforeEach(done => {
    service = new NetworksService()
    setTimeout(() => {
      done()
    }, 1000)
  })
  afterEach(done => {
    service.clear()
    setTimeout(() => {
      done()
    }, 1000)
  })

  describe(`success cases`, () => {
    it(`get all networks`, () => {
      const networks = service.getAll()
      expect(Array.isArray(networks)).toBe(true)
    })

    it(`has preset networks`, () => {
      const networks = service.getAll()
      expect(networks.length).toBe(1)
      expect(networks[0].id).toEqual('mainnet')
    })

    it(`get the default network`, () => {
      const network = service.defaultOne()
      expect(network && network.type).toBe(0)
    })

    it(`mainnet should be the current one by default`, () => {
      const currentNetworkID = service.getCurrentID()
      expect(currentNetworkID).toBe('mainnet')
    })

    it(`getting a non-exsiting network should return null`, () => {
      const id = `not-existing-id`
      const network = service.get(id)
      expect(network).toBeNull()
    })

    it(`create a new network with ${JSON.stringify(newNetwork)}`, async () => {
      const res = await service.create(newNetwork.name, newNetwork.remote, newNetwork.type)
      const { name, remote, type } = res
      expect(name).toEqual(newNetwork.name)
      expect(remote).toEqual(newNetwork.remote)
      expect(type).toEqual(newNetwork.type)
      const created = service.get(res.id)
      expect(created!.name).toEqual(res.name)
    })

    it(`create a new network with default type of 1`, async () => {
      const res = await service.create(newNetworkWithDefaultTypeOf1.name, newNetworkWithDefaultTypeOf1.remote)
      expect(res.type).toBe(1)
    })

    it(`update the networks's name`, async () => {
      const network = await service.create(newNetworkWithDefaultTypeOf1.name, newNetworkWithDefaultTypeOf1.remote)
      const name = `new network name`
      await service.update(network.id, { name })
      const updated = service.get(network.id)
      expect(updated && updated.name).toBe(name)
    })

    it(`update the network' address`, async () => {
      const network = await service.create(newNetworkWithDefaultTypeOf1.name, newNetworkWithDefaultTypeOf1.remote)
      const address = `http://localhost:8115`
      await service.update(network.id, { remote: address })
      const updated = service.get(network.id)
      expect(updated && updated.remote).toBe(address)
    })

    it(`set the network to be the current one`, async () => {
      const network = await service.create(newNetworkWithDefaultTypeOf1.name, newNetworkWithDefaultTypeOf1.remote)
      await service.activate(network.id)
      const currentNetworkID = service.getCurrentID()
      expect(currentNetworkID).toBe(network.id)
    })

    it(`delete an inactive network`, async () => {
      const inactiveNetwork = await service.create(newNetworkWithDefaultTypeOf1.name, newNetworkWithDefaultTypeOf1.remote)
      const prevCurrentID = service.getCurrentID() || ''
      const prevNetworks = service.getAll()
      await service.delete(inactiveNetwork.id)
      const currentID = service.getCurrentID()
      const currentNetworks = service.getAll()
      expect(currentNetworks.map(n => n.id)).toEqual(
        prevNetworks.filter(n => n.id !== inactiveNetwork.id).map(n => n.id),
      )
      expect(currentID).toBe(prevCurrentID)
    })

    it(`activate a network and delete it, the current networks should switch to the default network`, async () => {
      const network = await service.create(newNetworkWithDefaultTypeOf1.name, newNetworkWithDefaultTypeOf1.remote)
      await service.activate(network.id)
      const prevCurrentID = service.getCurrentID()
      const prevNetworks = service.getAll()
      expect(prevCurrentID).toBe(network.id)
      expect(prevNetworks.map(n => n.id)).toEqual(['mainnet', network.id])
      await service.delete(prevCurrentID || '')
      const currentNetworks = service.getAll()
      expect(currentNetworks.map(n => n.id)).toEqual(prevNetworks.filter(n => n.id !== prevCurrentID).map(n => n.id))
      const currentID = service.getCurrentID()
      expect(currentID).toBe('mainnet')
    })

    it(`reset the netowrks`, async () => {
      await service.create(newNetwork.name, newNetwork.remote)
      const newNetworkList = service.getAll()
      expect(newNetworkList.length).toBe(2)
      service.clear()
      const networks = service.getAll()
      expect(networks.length).toBe(1)
    })
  })

  describe(`validation on parameters`, () => {
    describe(`validation on parameters`, () => {
      it(`service.create requires name, and remote`, async () => {
        expect(service.create(undefined as any, undefined as any)).rejects.toThrowError(
          i18n.t(ERROR_MESSAGE.MISSING_ARG),
        )
        expect(service.create('network name', undefined as any)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.MISSING_ARG))
      })

      it(`service.update requires id, options`, () => {
        expect(service.update(undefined as any, undefined as any)).rejects.toThrowError(
          i18n.t(ERROR_MESSAGE.MISSING_ARG),
        )
        expect(service.update('', undefined as any)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.MISSING_ARG))
      })

      it(`service.delete requires id `, () => {
        expect(service.delete(undefined as any)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.MISSING_ARG))
      })

      it(`service.activate requires id `, () => {
        expect(service.activate(undefined as any)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.MISSING_ARG))
      })
    })
  })

  describe(`validation on network existence`, () => {
    it(`create network with existing name of Mainnet`, () => {
      expect(service.create('Mainnet', 'http://localhost:8114')).rejects.toThrowError(i18n.t(ERROR_MESSAGE.NAME_USED))
    })

    it(`update network which is not existing`, () => {
      const id = `not-existing-id`
      expect(service.update(id, {})).rejects.toThrowError(i18n.t(ERROR_MESSAGE.NETWORK_ID_NOT_FOUND, { id }))
    })

    it(`activate network which is not existing`, () => {
      const id = `not-existing-id`
      expect(service.activate(id)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.NETWORK_ID_NOT_FOUND, { id }))
    })
  })
})
