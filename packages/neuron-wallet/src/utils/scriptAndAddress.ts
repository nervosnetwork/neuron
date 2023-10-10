import { Script } from '@ckb-lumos/base'
import { predefined } from '@ckb-lumos/config-manager'
import { encodeToAddress, parseAddress } from '@ckb-lumos/helpers'

export const scriptToAddress = (script: CKBComponents.Script, isMainnet = true): string => {
  const lumosConfig = !isMainnet ? predefined.AGGRON4 : predefined.LINA
  return encodeToAddress(
    // omit keys other than codeHash, args and hashType
    {
      codeHash: script.codeHash,
      args: script.args,
      hashType: script.hashType,
    },
    { config: lumosConfig }
  )
}

export const addressToScript = (address: string): Script => {
  const prefix = address.slice(0, 3)
  if (prefix !== 'ckt' && prefix !== 'ckb') {
    throw new Error('Invalid address prefix')
  }
  const lumosConfig = prefix === 'ckt' ? predefined.AGGRON4 : predefined.LINA
  return parseAddress(address, { config: lumosConfig })
}
