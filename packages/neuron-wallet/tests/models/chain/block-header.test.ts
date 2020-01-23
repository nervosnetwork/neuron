import BlockHeader from "../../../src/models/chain/block-header"
import HexUtils from "../../../src/utils/hex"

describe('BlockHeader', () => {
  const sdkHeader: CKBComponents.BlockHeader = {
    "compactTarget": "0x1e083126",
    "dao": "0xb5a3e047474401001bc476b9ee573000c0c387962a38000000febffacf030000",
    "epoch": "0x7080018000001",
    "hash": "0xa5f5c85987a15de25661e5a214f2c1449cd803f071acc7999820f25246471f40",
    "nonce": "0x0",
    "number": "0x400",
    "parentHash": "0xae003585fa15309b30b31aed3dcf385e9472c3c3e93746a6c4540629a6a1ed2d",
    "proposalsHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "timestamp": "0x5cd2b117",
    "transactionsRoot": "0xc47d5b78b3c4c4c853e2a32810818940d0ee403423bea9ec7b8e566d9595206c",
    "unclesHash": "0x0000000000000000000000000000000000000000000000000000000000000000",
    "version": "0x0"
  }

  it('fromSDK', () => {
    const result: BlockHeader = BlockHeader.fromSDK(sdkHeader)
    expect(result.version).toEqual(HexUtils.toDecimal(sdkHeader.version))
    expect(result.timestamp).toEqual(HexUtils.toDecimal(sdkHeader.timestamp))
    expect(result.hash).toEqual(sdkHeader.hash)
    expect(result.parentHash).toEqual(sdkHeader.parentHash)
    expect(result.number).toEqual(HexUtils.toDecimal(sdkHeader.number))
    expect(result.epoch).toEqual(HexUtils.toDecimal(sdkHeader.epoch))
  })

})
