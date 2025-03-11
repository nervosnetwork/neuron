import { describe, it, expect } from 'vitest'
import { sporeFormatter, truncateMiddle } from 'utils/formatters'

describe('sporeFormatter', () => {
  // https://pudge.explorer.nervos.org/nft-info/0xd3b1f0634da710628a6f9faa73db028708dc79eb75de936bf39f0960cb882652/45251453428383742336079001511900429529583900220860399226448158779453103373468

  const sporeArgs = '0x640b6a3dd74ff4c87f44fc459bfb1bfa3bae60d8ba593f43796383860b1b7c9c'
  const sporeData =
    '0xde010000100000001e000000ba0100000a000000696d6167652f6a70656798010000ffd8ffe000104a46494600010101004800480000ffdb0043000a07070807060a0808080b0a0a0b0e18100e0d0d0e1d15161118231f2524221f2221262b372f26293429212230413134393b3e3e3e252e4449433c48373d3e3bffdb0043010a0b0b0e0d0e1c10101c3b2822283b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3b3bffc0001108000a000a03012200021101031101ffc4001500010100000000000000000000000000000407ffc4001f1000030002020301010000000000000000010203040500110621314114ffc40014010100000000000000000000000000000000ffc40014110100000000000000000000000000000000ffda000c03010002110311003f0064773b5c2d6f9b6c2db3cc7c76ced8e1499eec7f8dd10b40a127a9a92ce9ebd9631007de50fc4ed5c9f0ed2def57ad6baf83d28ec599d8cd49249fa49fde29f4daaa62e462beb30db1f2aa6d91230529672412cc3ae99bb00f67dfa1c4c632c684e10924a5250939a28554503a0001f001f9c0ffd9200000000c800b63cb44a925e1fbce395e76ceb6f115518130ff210be32b922a93bc5d64'
  const clusterId = '0x0c800b63cb44a925e1fbce395e76ceb6f115518130ff210be32b922a93bc5d64'

  const truncatedSporeId = truncateMiddle(sporeArgs)
  const truncatedClusterId = truncateMiddle(clusterId)

  it('should truncate args', () => {
    expect(truncatedSporeId).toBe('0x640b6a...0b1b7c9c')
    expect(truncatedClusterId).toBe('0x0c800b...93bc5d64')
  })

  it('should work as expected without cluster', () => {
    const formatted = sporeFormatter({ args: sporeArgs })
    expect(formatted).toBe(`[${truncatedSporeId}] Spore`)
  })

  it('should work as expected with cluster', () => {
    const withoutName = sporeFormatter({ args: sporeArgs, data: sporeData })
    expect(withoutName).toBe(`[${truncatedSporeId}] [${truncatedClusterId}] Spore`)

    const clusterName = 'a very long cluster name'
    const withName = sporeFormatter({ args: sporeArgs, data: sporeData, clusterName })
    expect(withName).toBe(`[${truncatedSporeId}] [${truncateMiddle(clusterName)}] Spore`)
  })
})
