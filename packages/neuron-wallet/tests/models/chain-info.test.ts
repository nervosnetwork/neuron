import ChainInfo from '../../src/models/chain-info'

describe('ChainInfo Test', () => {
  it('set and get', () => {
    const chain = 'ckb'
    ChainInfo.getInstance().setChain(chain)

    const getResult = ChainInfo.getInstance().getChain()
    expect(getResult).toEqual(chain)
  })

  describe('isMainnet', () => {
    it('empty string', () => {
      const chain = ''
      const instance = ChainInfo.getInstance()
      instance.setChain(chain)

      expect(instance.isMainnet()).toEqual(false)
    })

    it('ckb', () => {
      const chain = 'ckb'
      const instance = ChainInfo.getInstance()
      instance.setChain(chain)

      expect(instance.isMainnet()).toEqual(true)
    })

    it('ckb_testnet', () => {
      const chain = 'ckb_testnet'
      const instance = ChainInfo.getInstance()
      instance.setChain(chain)

      expect(instance.isMainnet()).toEqual(false)
    })

    it('ckb_dev', () => {
      const chain = 'ckb_dev'
      const instance = ChainInfo.getInstance()
      instance.setChain(chain)

      expect(instance.isMainnet()).toEqual(false)
    })
  })
})
