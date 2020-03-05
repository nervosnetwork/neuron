import SystemScriptInfo from "../../src/models/system-script-info"
import { DepType } from "../../src/models/chain/cell-dep"

// for regression tests
describe('SystemScriptInfo', () => {
  const SECP_CODE_HASH = "0x9bd7e06f3ecf4be0f2fcd2188b23f1b9fcc88e5d4b65a8637b17723bbda3cce8"
  const DAO_CODE_HASH = "0x82d76d1b75fe2fd9a27dfbaa65a039221a380d76c926f378d3f81cf3e7e13f2e"
  const MULTI_SIGN_CODE_HASH = "0x5c5069eb0857efc65e1bca0c07df34c31663b3622fd3876c876320fc9634e2a8"

  const mainnet_genesis_hash = "0x92b197aa1fba0f63633922c61c92375c9c074a93e85963554f5499fe1450d0e5"
  const testnet_genesis_hash = "0x184ac4658ed0c04a126551257990db132366cac22ab6270bbbc1f8c3220f302d"
  const devnet_genesis_hash = "0x823b2ff5785b12da8b1363cac9a5cbe566d8b715a4311441b119c39a0367488c"

  const secp_index = '0'
  const dao_index = '2'
  const multi_sign_index = '1'

  const secp_mainnet_tx_hash = "0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c"
  const secp_testnet_tx_hash = "0x84dcb061adebff4ef93d57c975ba9058a9be939d79ea12ee68003f6492448890"
  const secp_devnet_tx_hash = "0xace5ea83c478bb866edf122ff862085789158f5cbff155b7bb5f13058555b708"

  const dao_mainnet_tx_hash = "0xe2fb199810d49a4d8beec56718ba2593b665db9d52299a0f9e6e75416d73ff5c"
  const dao_testnet_tx_hash = "0x15fb8111fc78fa36da6af96c45ac4714cc9a33974fdae13cc524b29e1a488c7f"
  const dao_devnet_tx_hash = "0xa563884b3686078ec7e7677a5f86449b15cf2693f3c1241766c6996f206cc541"

  const multi_sign_mainnet_tx_hash = "0x71a7ba8fc96349fea0ed3a5c47992e3b4084b031a42264a018e0072e8172e46c"
  const multi_sign_testnet_tx_hash = "0x84dcb061adebff4ef93d57c975ba9058a9be939d79ea12ee68003f6492448890"
  const multi_sign_devnet_tx_hash = "0xace5ea83c478bb866edf122ff862085789158f5cbff155b7bb5f13058555b708"

  it("secp code hash", () => {
    expect(SystemScriptInfo.SECP_CODE_HASH).toEqual(SECP_CODE_HASH)
  })

  it("dao code hash", () => {
    expect(SystemScriptInfo.DAO_CODE_HASH).toEqual(DAO_CODE_HASH)
  })

  it("multi sign code hash", () => {
    expect(SystemScriptInfo.MULTI_SIGN_CODE_HASH).toEqual(MULTI_SIGN_CODE_HASH)
  })

  it('getInstance()', () => {
    const instance = SystemScriptInfo.getInstance()
    expect(instance).toBeInstanceOf(SystemScriptInfo)
  })

  it('getSecpCellDep, mainnet', async () => {
    const cellDep = await new SystemScriptInfo().getSecpCellDep({genesisHash: mainnet_genesis_hash, remote: ''})
    expect(cellDep.outPoint.txHash).toEqual(secp_mainnet_tx_hash)
    expect(cellDep.outPoint.index).toEqual(secp_index)
    expect(cellDep.depType).toEqual(DepType.DepGroup)
  })

  it('getSecpCellDep, testnet', async () => {
    const cellDep = await new SystemScriptInfo().getSecpCellDep({genesisHash: testnet_genesis_hash, remote: ''})
    expect(cellDep.outPoint.txHash).toEqual(secp_testnet_tx_hash)
    expect(cellDep.outPoint.index).toEqual(secp_index)
    expect(cellDep.depType).toEqual(DepType.DepGroup)
  })

  it('getSecpCellDep, devnet', async () => {
    const cellDep = await new SystemScriptInfo().getSecpCellDep({genesisHash: devnet_genesis_hash, remote: ''})
    expect(cellDep.outPoint.txHash).toEqual(secp_devnet_tx_hash)
    expect(cellDep.outPoint.index).toEqual(secp_index)
    expect(cellDep.depType).toEqual(DepType.DepGroup)
  })

  it('getDaoCellDep, mainnet', async () => {
    const cellDep = await new SystemScriptInfo().getDaoCellDep({genesisHash: mainnet_genesis_hash, remote: ''})
    expect(cellDep.outPoint.txHash).toEqual(dao_mainnet_tx_hash)
    expect(cellDep.outPoint.index).toEqual(dao_index)
    expect(cellDep.depType).toEqual(DepType.Code)
  })

  it('getDaoCellDep, testnet', async () => {
    const cellDep = await new SystemScriptInfo().getDaoCellDep({genesisHash: testnet_genesis_hash, remote: ''})
    expect(cellDep.outPoint.txHash).toEqual(dao_testnet_tx_hash)
    expect(cellDep.outPoint.index).toEqual(dao_index)
    expect(cellDep.depType).toEqual(DepType.Code)
  })

  it('getDaoCellDep, devnet', async () => {
    const cellDep = await new SystemScriptInfo().getDaoCellDep({genesisHash: devnet_genesis_hash, remote: ''})
    expect(cellDep.outPoint.txHash).toEqual(dao_devnet_tx_hash)
    expect(cellDep.outPoint.index).toEqual(dao_index)
    expect(cellDep.depType).toEqual(DepType.Code)
  })

  it('getMultiSignCellDep, mainnet', async () => {
    const cellDep = await new SystemScriptInfo().getMultiSignCellDep({genesisHash: mainnet_genesis_hash, remote: ''})
    expect(cellDep.outPoint.txHash).toEqual(multi_sign_mainnet_tx_hash)
    expect(cellDep.outPoint.index).toEqual(multi_sign_index)
    expect(cellDep.depType).toEqual(DepType.DepGroup)
  })

  it('getMultiSignCellDep, testnet', async () => {
    const cellDep = await new SystemScriptInfo().getMultiSignCellDep({genesisHash: testnet_genesis_hash, remote: ''})
    expect(cellDep.outPoint.txHash).toEqual(multi_sign_testnet_tx_hash)
    expect(cellDep.outPoint.index).toEqual(multi_sign_index)
    expect(cellDep.depType).toEqual(DepType.DepGroup)
  })

  it('getMultiSignCellDep, devnet', async () => {
    const cellDep = await new SystemScriptInfo().getMultiSignCellDep({genesisHash: devnet_genesis_hash, remote: ''})
    expect(cellDep.outPoint.txHash).toEqual(multi_sign_devnet_tx_hash)
    expect(cellDep.outPoint.index).toEqual(multi_sign_index)
    expect(cellDep.depType).toEqual(DepType.DepGroup)
  })
})
