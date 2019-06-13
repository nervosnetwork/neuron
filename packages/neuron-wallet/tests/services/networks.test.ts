import NetworksService from '../../src/services/networks'
import env from '../../src/env'
import i18n from '../../src/utils/i18n'

const ERROR_MESSAGE = {
  MISSING_ARG: 'Missing required argument',
  NAME_USED: 'Network name is used',
  NETWORK_ID_NOT_FOUND: 'messages.network-not-found',
}

const {
  presetNetworks: { active, list },
} = env

describe(`networks service`, () => {
  // TODO:
  const service = new NetworksService()
  afterEach(() => service.clear())

  it(`get all networks`, async () => {
    const networks = await service.getAll()
    expect(Array.isArray(networks)).toBe(true)
  })

  it(`has preset networks`, async () => {
    const networks = await service.getAll()
    expect(networks).toEqual(list)
  })

  it(`has a default active network`, async () => {
    const activeNetwork = await service.activeId()
    expect(activeNetwork).toBe(active)
  })

  it(`has testnet as the default active network`, async () => {
    const defaultNetwork = await service.defaultOne()
    expect(defaultNetwork).toEqual(list[0])
  })

  it(`get network by id ${active}`, async () => {
    const activeNetwork = await service.get(active)
    expect(activeNetwork).toEqual(list.find(network => network.id === active))
  })

  it(`get network by id which not exists`, async () => {
    const network = await service.get('1')
    expect(network).toBeNull()
  })

  it(`create new network with { name: 'newNetwork', remote: 'http://test.localhost.com', type: 0 }`, async () => {
    const newOne = { name: 'newNetwork', remote: 'http://test.localhost.com', type: 0 }
    const res = await service.create(newOne.name, newOne.remote, newOne.type)
    expect(res).toMatchObject(newOne)
    const created = await service.get(res.id)
    expect(created).toEqual(res)
  })

  it(`create new network with default type of 1`, async () => {
    const newOne = { name: 'newNetworkWithDefaultType', remote: 'http://test.localhost.com' }
    const res = await service.create(newOne.name, newOne.remote)
    expect(res.type).toBe(1)
  })

  it(`update network name`, async () => {
    const name = 'updated name'
    await service.update(active, { name })
    const network = await service.get(active)
    expect(network && network.name).toBe(name)
  })

  it(`update network remote address`, async () => {
    const addr = 'http://updated-address.com'
    await service.update(active, { remote: addr })
    const network = await service.get(active)
    expect(network && network.remote).toBe(addr)
  })

  it(`update network type`, async () => {
    const type = 1
    await service.update(active, { type })
    const network = await service.get(active)
    expect(network && network.type).toBe(type)
  })

  it(`activate the second network`, async () => {
    const { id } = list[1]
    await service.activate(id)
    const activeNetworkId = await service.activeId()
    expect(activeNetworkId).toBe(id)
  })

  it(`delete inactive network`, async () => {
    await service.delete(list[1].id)
    const networks = await service.getAll()
    const activeId = await service.activeId()
    expect(networks).toEqual(list.filter(n => n.id !== list[1].id))
    expect(activeId).toBe(active)
  })

  it(`delete active network and switch to the default one`, async () => {
    const { id } = list[1]
    await service.activate(id)
    await service.delete(id)
    const networks = await service.getAll()
    expect(networks).toEqual(list.filter(n => n.id !== id))
    // TODO: add test on event listener
  })

  it(`get the default network`, async () => {
    const network = await service.defaultOne()
    expect(network && network.type).toBe(0)
  })

  it(`reset netowrks`, async () => {
    await service.clear()
    const networks = await service.getAll()
    expect(networks.length).toBe(list.length)
  })
})

describe(`networks service errors`, () => {
  const service = new NetworksService()
  afterEach(() => service.clear())

  describe('validation on parameters', () => {
    it(`service.get requires id`, () => {
      expect(service.get(undefined as any)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.MISSING_ARG))
    })

    it(`service.create requires name, and remote`, async () => {
      expect(service.create(undefined as any, undefined as any)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.MISSING_ARG))
      expect(service.create('network name', undefined as any)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.MISSING_ARG))
    })

    it(`service.update requires id, options`, () => {
      expect(service.update(undefined as any, undefined as any)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.MISSING_ARG))
      expect(service.update('', undefined as any)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.MISSING_ARG))
    })

    it(`service.delete requires id `, () => {
      expect(service.delete(undefined as any)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.MISSING_ARG))
    })

    it(`service.activate requires id `, () => {
      expect(service.activate(undefined as any)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.MISSING_ARG))
    })
  })

  describe('validation on network existence', () => {
    it(`create network with existing name`, () => {
      expect(service.create('Testnet', 'http://localhost')).rejects.toThrowError(i18n.t(ERROR_MESSAGE.NAME_USED))
    })

    it(`update network which is not existing`, () => {
      const id = '1'
      expect(service.update(id, {})).rejects.toThrowError(i18n.t(ERROR_MESSAGE.NETWORK_ID_NOT_FOUND, { id }))
    })

    it(`activate network which is not existing`, () => {
      const id = '1'
      expect(service.activate(id)).rejects.toThrowError(i18n.t(ERROR_MESSAGE.NETWORK_ID_NOT_FOUND, { id }))
    })
  })
})
