import NetworksService from '../../src/services/networks'
import { NetworkWithID } from '../../src/types/network'
import env from '../../src/env'
import i18n from '../../src/utils/i18n'

const ERROR_MESSAGE = {
  MISSING_ARG: `Missing required argument`,
  NAME_USED: `Network name is used`,
  NETWORK_ID_NOT_FOUND: `messages.network-not-found`,
}

const {
  presetNetworks: { current, list },
} = env
const [testnetNetwork, localNetwork] = list

describe(`Unit tests of networks service`, () => {
  const newNetwork: NetworkWithID = {
    name: `new network`,
    remote: `http://new-network.localhost.com`,
    type: 0,
    id: '',
  }

  const newNetworkWithDefaultTypeOf1 = {
    name: `new network with the default type of 1`,
    remote: `http://test.localhost.com`,
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
    it(`get all networks`, async () => {
      const networks = await service.getAll()
      expect(Array.isArray(networks)).toBe(true)
    })

    it(`has preset networks`, async () => {
      const networks = await service.getAll()
      expect(networks).toEqual(list)
    })

    it(`get the default network`, async () => {
      const network = await service.defaultOne()
      expect(network && network.type).toBe(0)
    })

    it(`testnet should be type of default network`, async () => {
      const defaultNetwork = await service.defaultOne()
      expect(defaultNetwork).toEqual(testnetNetwork)
    })

    it(`testnet should be the current one by default`, async () => {
      const currentNetworkID = await service.getCurrentID()
      expect(currentNetworkID).toBe(current)
      expect(currentNetworkID).toBe(testnetNetwork.id)
    })

    it(`get network by id ${current}`, async () => {
      const currentNetwork = await service.get(current)
      expect(currentNetwork).toEqual(list.find(network => network.id === current))
    })

    it(`getting a non-exsiting network should return null`, async () => {
      const id = `not-existing-id`
      const network = await service.get(id)
      expect(network).toBeNull()
    })

    it(`create a new network with ${JSON.stringify(newNetwork)}`, async () => {
      const res = await service.create(newNetwork.name, newNetwork.remote, newNetwork.type)
      expect(res).toMatchObject({ ...newNetwork, id: res.id })
      const created = await service.get(res.id)
      expect(created).toEqual(res)
    })

    it(`create a new network with default type of 1`, async () => {
      const res = await service.create(newNetworkWithDefaultTypeOf1.name, newNetworkWithDefaultTypeOf1.remote)
      expect(res.type).toBe(1)
    })

    it(`update the local networks's name`, async () => {
      const name = `new local network name`
      await service.update(localNetwork.id, { name })
      const network = await service.get(localNetwork.id)
      expect(network && network.name).toBe(name)
    })

    it(`update the local network address`, async () => {
      const addr = `http://updated-address.com`
      await service.update(localNetwork.id, { remote: addr })
      const network = await service.get(localNetwork.id)
      expect(network && network.remote).toBe(addr)
    })

    it(`update the local network type to 1`, async () => {
      const type = 1
      await service.update(localNetwork.id, { type })
      const network = await service.get(localNetwork.id)
      expect(network && network.type).toBe(type)
    })

    it(`set the local network to be the current one`, async () => {
      await service.activate(localNetwork.id)
      const currentNetworkID = await service.getCurrentID()
      expect(currentNetworkID).toBe(localNetwork.id)
    })

    it(`delete an inactive network`, async () => {
      const inactiveNetwork = localNetwork
      const prevCurrentID = (await service.getCurrentID()) || ''
      const prevNetworks = await service.getAll()
      await service.delete(inactiveNetwork.id)
      const currentID = await service.getCurrentID()
      const currentNetworks = await service.getAll()
      expect(currentNetworks).toEqual(prevNetworks.filter(n => n.id !== inactiveNetwork.id))
      expect(currentID).toBe(prevCurrentID)
    })

    it(`activate the local network and delete it, the current networks should switch to the testnet network`, async () => {
      await service.activate(localNetwork.id)
      const prevCurrentID = await service.getCurrentID()
      const prevNetworks = await service.getAll()
      expect(prevCurrentID).toBe(localNetwork.id)
      expect(prevNetworks).toEqual(list)
      await service.delete(prevCurrentID || '')
      const currentNetworks = await service.getAll()
      expect(currentNetworks).toEqual(prevNetworks.filter(n => n.id !== prevCurrentID))
      const currentID = await new Promise(resolve => {
        setTimeout(() => {
          service.getCurrentID().then(cID => resolve(cID))
        }, 500)
      })
      expect(currentID).toBe(testnetNetwork.id)
    })

    it(`reset the netowrks`, async () => {
      await service.create(newNetwork.name, newNetwork.remote)
      const newNetworkList = await service.getAll()
      expect(newNetworkList.length).toBe(list.length + 1)
      service.clear()
      const networks = await service.getAll()
      expect(networks.length).toBe(list.length)
    })
  })

  describe(`validation on parameters`, () => {
    describe(`validation on parameters`, () => {
      it(`service.get requires id`, () => {
        expect(service.get(undefined as any)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.MISSING_ARG))
      })

      it(`service.create requires name, and remote`, async () => {
        expect(service.create(undefined as any, undefined as any)).rejects.toThrowError(
          i18n.t(ERROR_MESSAGE.MISSING_ARG)
        )
        expect(service.create('network name', undefined as any)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.MISSING_ARG))
      })

      it(`service.update requires id, options`, () => {
        expect(service.update(undefined as any, undefined as any)).rejects.toThrowError(
          i18n.t(ERROR_MESSAGE.MISSING_ARG)
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
    it(`create network with existing name of ${list[0].name}`, () => {
      expect(service.create(list[0].name, list[0].remote)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.NAME_USED))
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
