import NetworksService, { NetworkWithID } from '../../src/services/networks'

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

describe(`networks service`, () => {
  const service = new NetworksService()
  afterAll(() => {
    service.clear()
  })
  describe(`operations on networks succeed`, () => {
    it(`get all networks`, async () => {
      const networks = await service.getAll()
      expect(Array.isArray(networks)).toBe(true)
    })

    it(`has preset networks`, async () => {
      const networks = await service.getAll()
      expect(networks).toEqual(list)
    })

    it(`has a default current network`, async () => {
      const currentNetworkID = await service.getCurrentID()
      expect(currentNetworkID).toBe(current)
    })

    it(`has testnet as the default current network`, async () => {
      const defaultNetwork = await service.defaultOne()
      expect(defaultNetwork).toEqual(list[0])
    })

    it(`get network by id ${current}`, async () => {
      const currentNetwork = await service.get(current)
      expect(currentNetwork).toEqual(list.find(network => network.id === current))
    })

    it(`get network by id which not exists`, async () => {
      const id = `not-existing-id`
      const network = await service.get(id)
      expect(network).toBeNull()
    })

    it(`create new network with ${JSON.stringify(newNetwork)}`, async () => {
      const res = await service.create(newNetwork.name, newNetwork.remote, newNetwork.type)
      newNetwork.id = res.id
      expect(res).toMatchObject(newNetwork)
      const created = await service.get(res.id)
      expect(created).toEqual(res)
    })

    it(`create new network with default type of 1`, async () => {
      const res = await service.create(newNetworkWithDefaultTypeOf1.name, newNetworkWithDefaultTypeOf1.remote)
      newNetworkWithDefaultTypeOf1.id = res.id
      expect(res.type).toBe(1)
    })

    it(`update new network's name`, async () => {
      const name = `updated network name`
      await service.update(newNetwork.id, { name })
      const network = await service.get(newNetwork.id)
      expect(network && network.name).toBe(name)
    })

    it(`update network address`, async () => {
      const addr = `http://updated-address.com`
      await service.update(newNetwork.id, { remote: addr })
      const network = await service.get(newNetwork.id)
      expect(network && network.remote).toBe(addr)
    })

    it(`update network type`, async () => {
      const type = 1
      await service.update(newNetwork.id, { type })
      const network = await service.get(newNetwork.id)
      expect(network && network.type).toBe(type)
    })

    it(`activate the second network`, async () => {
      const { id } = list[1]
      await service.activate(id)
      const currentNetworkID = await service.getCurrentID()
      expect(currentNetworkID).toBe(id)
    })

    it(`delete inactive network`, async () => {
      const prevCurrentID = await service.getCurrentID()
      const prevNetworks = await service.getAll()
      await service.delete(newNetwork.id)
      const currentID = await service.getCurrentID()
      const currentNetworks = await service.getAll()
      expect(currentNetworks).toEqual(prevNetworks.filter(n => n.id !== newNetwork.id))
      expect(currentID).toBe(prevCurrentID)
    })

    it(`delete current network and switch to the default one`, async () => {
      const { id } = list[1]
      const defaultNetwork = list[0]
      await service.activate(id)
      const prevCurrentID = await service.getCurrentID()
      const prevNetworks = await service.getAll()
      await service.delete(id)
      const currentNetworks = await service.getAll()
      expect(currentNetworks).toEqual(prevNetworks.filter(n => n.id !== id))
      expect(prevCurrentID).not.toBe(defaultNetwork.id)
      const currentID = await new Promise(resolve => {
        setTimeout(() => {
          service.getCurrentID().then(cID => resolve(cID))
        }, 500)
      })
      expect(currentID).toBe(defaultNetwork.id)
    })

    it(`get the default network`, async () => {
      const network = await service.defaultOne()
      expect(network && network.type).toBe(0)
    })

    it(`reset netowrks`, async () => {
      service.clear()
      const networks = await service.getAll()
      expect(networks.length).toBe(list.length)
    })
  })
  describe(`operations on networks throw errors`, () => {
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
